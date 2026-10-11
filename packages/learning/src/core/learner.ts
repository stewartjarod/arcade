import { currentPlayer, getPlayer, playerKey } from '@arcade/players'
import { findSkill, SUBJECTS } from '../subjects'
import { itemGrade, ixlScore, POINTS_PER_GRADE, startLevel } from '../ixl/placement'
import type { Item, Skill } from './types'

/**
 * Everything one player knows, across every subject, saved on their profile.
 * Every game shares it, so practice anywhere counts everywhere.
 *
 * Ratings: "comfortable at level r" for each skill ("math.add": 3.4).
 * Facts:   questions they missed, which come back sooner until they stick.
 *
 * Where they start: the grade on their profile (none = Kindergarten), on IXL's scale where each grade
 * is 100 points (see ixl/placement.ts). That's only a first guess. Every answer moves the player's
 * "placement" in that subject (big steps at first, then smaller), and any skill they haven't tried
 * yet starts at the level their placement says. So a couple of rounds find roughly where they are in
 * every skill of the subject: down at once, but up only about a grade a round (questions never go more
 * than a grade above where the round started). Then each skill calibrates on its own: each right
 * answer at their level jumps a whole level, and the first miss settles them just below it. From
 * then on it's gentle i+1. All of it is saved on the player, so it carries across games.
 *
 * Games shouldn't change ratings directly — use startPractice() (practice.ts),
 * which applies the fairness rules.
 */

export interface Fact {
  skill: string
  level: number
  key: string
  /** 0 = just missed. Each right answer moves it up a box and waits longer. */
  box: number
  /** Time (ms) when it's ready to ask again. */
  due: number
}

interface State {
  v: 2
  ratings: Record<string, number>
  seen: Record<string, number>
  fast: Record<string, number>
  facts: Record<string, Fact>
  /** When each subject was last practiced (ms), to rotate subjects fairly. */
  last: Record<string, number>
  /** Skills whose starting level has been found (see score()). */
  calibrated: Record<string, boolean>
  /** Where they are on IXL's grade scale in each subject (1.4 = 140), and how many answers have shaped it. */
  placement: Record<string, { g: number; n: number; s?: number }>
  /** The grade games last played a subject at, so the play style can only rise about a grade per round. */
  played?: Record<string, number>
}

/** The old math-only save: { skills: { add: 3.2, ... }, stats: { seen, fast } }. */
export interface LegacyMath {
  skills?: Record<string, number>
  stats?: { seen?: Record<string, number>; fast?: Record<string, number> }
}

function adoptMath(state: State, old: LegacyMath) {
  for (const [k, r] of Object.entries(old.skills ?? {})) {
    if (r > 0) state.ratings[`math.${k}`] = r
    if (r > 0 && (old.stats?.seen?.[k] ?? 0) > 0) state.calibrated[`math.${k}`] = true // already knew their level
  }
  for (const [k, n] of Object.entries(old.stats?.seen ?? {})) state.seen[`math.${k}`] = n
  for (const [k, n] of Object.entries(old.stats?.fast ?? {})) state.fast[`math.${k}`] = n
}

const fresh = (): State => ({ v: 2, ratings: {}, seen: {}, fast: {}, facts: {}, last: {}, calibrated: {}, placement: {} })

/** A new skill stops calibrating after its first miss, or after this many answers. */
export const CALIBRATION_ANSWERS = 8
/** A subject is still "placing" (finding the player's spot on the grade scale) for this many answers: about two rounds. */
export const PLACING_ANSWERS = 24
/** While placing, ask this far (in grades) above their spot: a question they get right about 6 times in 10 teaches us the most. */
export const PLACING_REACH = 0.35
/** Kindergarten and 1st grade: closer to their spot, so fewer wrong answers. */
const PLACING_REACH_YOUNG = 0.15
/** How far one answer moves the placement, in grades: big at first, then it settles. */
const placeStep = (answers: number) => Math.max(0.3, 2.5 * 0.82 ** answers)
/** How sharply a question's chance of being right falls as it gets a grade harder than the player's spot. */
const GRADE_SLOPE = 3

// How long to wait before re-asking a fact, by box. Box 5 = learned: forgotten about.
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const WAIT = [1 * MINUTE, 10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY]
/** One challenge can lower a rating by at most this much (see practice.ts). */
export const MAX_MOMENT_DROP = 0.4

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
/** Chance a player rated `r` gets a level-`level` question right: ~83% at their own level. */
export const solves = (r: number, level: number) => sigmoid(1.4 * (r - level) + 1.6)

export class Learner {
  readonly playerId: string
  private state: State
  private stored: boolean
  private profile?: { grade?: number; focus?: string }

  /** `profile` overrides the saved player's grade/focus (handy for tests and previews). Grade is just for show. */
  constructor(playerId: string, state: State | null, profile?: { grade?: number; focus?: string }) {
    this.playerId = playerId
    this.stored = !!state
    this.state = state ?? fresh()
    this.profile = profile
  }

  /** True if this player has never practiced anything yet. */
  get isNew() {
    return !this.stored
  }

  get grade(): number | undefined {
    return this.profile ? this.profile.grade : getPlayer(this.playerId)?.grade
  }

  get focus(): string | undefined {
    return this.profile ? this.profile.focus : getPlayer(this.playerId)?.focus
  }

  /**
   * Where they are in a subject on IXL's grade scale (1.4 = 140), and how many answers that rests on.
   * Before the first answer it's the grade on their profile (Kindergarten if none).
   */
  placement(subjectId: string): { grade: number; answers: number } {
    const p = this.state.placement[subjectId]
    if (p) return { grade: p.g, answers: p.n }
    if (this.grade !== undefined) return { grade: this.grade, answers: 0 }
    let guess = this.fromSkills.get(subjectId)
    if (guess === undefined) this.fromSkills.set(subjectId, (guess = this.placementFromSkills(subjectId) ?? null))
    return guess ?? { grade: 0, answers: 0 }
  }

  /** placementFromSkills() answers, kept until the next answer changes the ratings (rating() asks a lot). */
  private fromSkills = new Map<string, { grade: number; answers: number } | null>()

  /**
   * Saves from before placement existed (and no grade on the profile): their spot is the average of the IXL
   * grades of the skills they've practiced. Reads saved ratings only, so it can't loop through rating().
   */
  private placementFromSkills(subjectId: string): { grade: number; answers: number } | undefined {
    let sum = 0
    let count = 0
    let answers = 0
    for (const k of SUBJECTS.find((s) => s.id === subjectId)?.skills ?? []) {
      const id = `${subjectId}.${k.id}`
      const r = this.state.ratings[id]
      const n = this.seen(id)
      if (!r || n === 0 || (n < CALIBRATION_ANSWERS && !this.state.calibrated[id])) continue
      const score = ixlScore(id, r)
      if (score === undefined) continue
      sum += score / POINTS_PER_GRADE
      count++
      answers += n
    }
    return count ? { grade: sum / count, answers } : undefined
  }

  /**
   * The grade to aim questions at while placing: a bit above their spot, and further above after each answer in
   * a row they get right (they're clearly past it), snapping back after a miss.
   *
   * Never more than a grade above where this round started, though: a few right answers in a row can lift the
   * estimate fast, and without this a brand-new Kindergarten profile was asked five-digit sums by its fourth question.
   */
  placingTarget(subjectId: string) {
    const streak = this.state.placement[subjectId]?.s ?? 0
    const spot = this.placement(subjectId).grade
    const roundStart = this.state.played?.[subjectId] ?? this.grade ?? 0
    // Gentler for the youngest (by where they started, so a lucky streak doesn't switch it off).
    const young = roundStart < 2
    const target = spot + (young ? PLACING_REACH_YOUNG : PLACING_REACH) + (young ? 0.25 : 0.5) * Math.min(streak, 3)
    return Math.min(target, roundStart + 1)
  }

  /**
   * The grade games should play a subject at, given the grade the placement says: moves down at once, but
   * rises at most one grade past where the games last played it, so a hot streak can't flip a 1st grader to
   * a much harder style in one maze. (The grown-up page still shows the full estimate.)
   */
  playGrade(subjectId: string, placed: number) {
    const last = this.state.played?.[subjectId]
    return last === undefined ? placed : Math.min(placed, last + 1)
  }

  /** Remember the grade a round is being played at (called when a practice starts). */
  notePlayed(subjectId: string, grade: number) {
    this.state.played = { ...this.state.played, [subjectId]: grade }
  }

  /** Still finding their spot in this subject? (Their first couple dozen answers move it the most.) */
  isPlacing(subjectId: string) {
    return this.placement(subjectId).answers < PLACING_ANSWERS
  }

  /**
   * Start a subject over from a grade (a grown-up's "re-place" button): forget its skill levels so every
   * skill begins again at that grade and calibrates. Missed facts are kept.
   */
  replace(subjectId: string, grade = this.grade ?? 0) {
    this.fromSkills.clear()
    this.state.placement[subjectId] = { g: grade, n: 0 }
    // ...and play from that grade again, not from wherever the old placement had pushed it.
    this.state.played = { ...this.state.played, [subjectId]: grade }
    for (const k of SUBJECTS.find((s) => s.id === subjectId)?.skills ?? []) {
      const id = `${subjectId}.${k.id}`
      delete this.state.ratings[id]
      delete this.state.seen[id]
      delete this.state.fast[id]
      delete this.state.calibrated[id]
    }
  }

  /** Current level for a skill ("math.add"). 0 means not unlocked yet. */
  rating(skillId: string): number {
    const r = this.state.ratings[skillId]
    if (r !== undefined && r > 0) return r
    const skill = findSkill(skillId)
    if (!skill || !this.prereqsMet(skillId, skill)) return 0
    // Not tried yet: begin where their placement in this subject says (level 1 if they're a beginner).
    return startLevel(skillId, this.placement(skillId.split('.')[0]!).grade)
  }

  /** Still finding their starting level in this skill? */
  isCalibrating(skillId: string) {
    return !this.state.calibrated[skillId] && this.seen(skillId) < CALIBRATION_ANSWERS
  }

  isUnlocked(skillId: string) {
    return this.rating(skillId) > 0
  }

  private prereqsMet(skillId: string, skill: Skill) {
    const subject = skillId.split('.')[0]
    return (skill.unlocksAfter ?? []).every((p) => {
      const id = p.skill.includes('.') ? p.skill : `${subject}.${p.skill}`
      return this.rating(id) >= p.level
    })
  }

  /** Every unlocked skill id, optionally in one subject. */
  unlockedSkills(subjectId?: string): string[] {
    return SUBJECTS.filter((s) => !subjectId || s.id === subjectId)
      .flatMap((s) => s.skills.map((k) => `${s.id}.${k.id}`))
      .filter((id) => this.isUnlocked(id))
  }

  seen(skillId: string) {
    return this.state.seen[skillId] ?? 0
  }

  lastPracticed(subjectId: string) {
    return this.state.last[subjectId] ?? 0
  }

  /** All current ratings, for "did anything grow?" and the safety net. */
  snapshot(): Record<string, number> {
    this.settled.clear()
    const out: Record<string, number> = {}
    for (const s of SUBJECTS) for (const k of s.skills) out[`${s.id}.${k.id}`] = this.rating(`${s.id}.${k.id}`)
    return out
  }

  /**
   * Update a skill after an answer. `outcome`: 0 wrong … 1 right (1.1–1.2 = right and quick).
   * `guess`: chance of being right by luck (1/3 with three choices, 0 when typed).
   *
   * Calibrating (a new skill): right at their level → jump up a level (less for a possible lucky
   * guess); the first miss → settle half a level lower and stop calibrating.
   * After that, Elo-style: surprise (result vs. expected) moves the rating, fast at first, then
   * settling. Three quick first-try answers in a row at or above their level skip them ahead a little.
   */
  score(item: Item, outcome: number, guess = 0) {
    if (guess >= 1) return // the only option left: tells us nothing
    const id = item.skill
    const skill = findSkill(id)
    const subject = id.split('.')[0]!
    this.fromSkills.clear()
    const r = this.rating(id) || 1
    const seen = this.seen(id)
    // The subject's placement learns from every answer first, so a skill's first miss can settle to it below.
    this.updatePlacement(subject, item, outcome, guess)
    let next: number
    let fast = 0
    if (this.isCalibrating(id)) {
      if (outcome < 1) {
        next = Math.max(1, r - 0.5)
        if (this.state.ratings[id] === undefined) {
          // A first miss on a skill we started from their placement (it has no saved level yet): settle where the placement now says,
          // which can be well below the starting guess. (This is a correction, not a bad stretch, so it
          // isn't held back by limitDrop.)
          next = Math.max(1, Math.min(next, startLevel(id, this.placement(subject).grade)))
          this.settled.add(id)
        }
        this.state.calibrated[id] = true
      } else {
        // Only a question at (or above) their level tells us they're ready for more.
        next = item.level >= Math.round(r) ? r + (1 - guess) : r
      }
      if (seen + 1 >= CALIBRATION_ANSWERS) this.state.calibrated[id] = true
    } else {
      const expected = guess + (1 - guess) * solves(r, item.level)
      const warmup = 1 + 1.5 * Math.max(0, 1 - seen / 15)
      next = Math.max(1, r + 0.4 * warmup * (outcome - expected))
      fast = outcome > 1 && item.level >= Math.round(next) ? (this.state.fast[id] ?? 0) + 1 : 0
      if (fast >= 3) {
        next += 0.25
        fast = 0
      }
    }
    if (skill) next = Math.min(next, skill.maxLevel + 1)
    this.state.ratings[id] = next
    this.state.seen[id] = seen + 1
    this.state.fast[id] = fast
    this.state.last[subject] = Date.now()
    this.rememberFact(item, outcome >= 1)
  }

  /**
   * Move their spot on the grade scale after an answer, by how surprising it was (like the skill ratings, but
   * on IXL's grades and with much bigger steps while we're still finding them). A right answer on a question
   * above their spot lifts it a lot; a miss on one below it pulls it down a lot; and a lucky guess among
   * choices counts for less, because it was always likely.
   */
  private updatePlacement(subject: string, item: Item, outcome: number, guess: number) {
    const gi = itemGrade(item.skill, item.level)
    if (gi === undefined) return
    const { grade, answers } = this.placement(subject)
    const expected = guess + (1 - guess) * sigmoid(GRADE_SLOPE * (grade - gi) + 1.6)
    const streak = this.state.placement[subject]?.s ?? 0
    const delta = placeStep(answers) * (Math.min(outcome, 1) - expected)
    this.state.placement[subject] = { g: Math.min(6, Math.max(0, grade + Math.max(-1, Math.min(1, delta)))), n: answers + 1, s: outcome >= 1 ? streak + 1 : 0 }
  }

  /** Skills whose rating just made a correction (not a bad stretch), so limitDrop leaves them be. */
  private settled = new Set<string>()

  /** Put ratings back up to `before - MAX_MOMENT_DROP` so one bad stretch can't undo a level. */
  limitDrop(before: Record<string, number>) {
    for (const [id, r] of Object.entries(before)) {
      if (this.settled.has(id)) continue
      const now = this.state.ratings[id]
      if (now !== undefined && now < r - MAX_MOMENT_DROP) this.state.ratings[id] = r - MAX_MOMENT_DROP
    }
  }

  // --- Facts they missed come back: spaced repetition ---

  private rememberFact(item: Item, right: boolean) {
    const k = `${item.skill}|${item.key}`
    const fact = this.state.facts[k]
    if (!right) {
      // Missed: ask again soon.
      this.state.facts[k] = { skill: item.skill, level: item.level, key: item.key, box: 0, due: Date.now() + WAIT[0]! }
    } else if (fact) {
      // Got a missed one right: wait longer each time, then forget about it.
      fact.box++
      if (fact.box >= WAIT.length) delete this.state.facts[k]
      else fact.due = Date.now() + WAIT[fact.box]!
    }
  }

  /** Missed facts that are ready to ask again, oldest first. */
  dueFacts(skillId?: string, now = Date.now()): Fact[] {
    return Object.values(this.state.facts)
      .filter((f) => f.due <= now && (!skillId || f.skill === skillId))
      .sort((a, b) => a.due - b.due)
  }

  /** How many missed facts are still being practiced (for the profile card). */
  reviewCount(subjectId?: string) {
    return Object.values(this.state.facts).filter((f) => !subjectId || f.skill.startsWith(`${subjectId}.`)).length
  }

  /** Bring in math progress from before subjects existed (Mouse Maze Math's old save). */
  adoptLegacyMath(old: LegacyMath) {
    this.fromSkills.clear()
    adoptMath(this.state, old)
  }

  save() {
    this.stored = true
    try {
      localStorage.setItem(key(this.playerId), JSON.stringify(this.state))
    } catch {
      /* storage unavailable: progress just won't be remembered */
    }
  }
}

// Stored under a pseudo-game called "learning", so it's deleted with the player
// and handed from Guest to the first real player like any other save.
const key = (playerId: string) => playerKey('learning', 'v2', playerId)
const OLD_MATH_KEY = (playerId: string) => playerKey('learning', 'math', playerId)

function read(playerId: string): State | null {
  try {
    const raw = localStorage.getItem(key(playerId))
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>
      const state: State = { ...fresh(), ...saved }
      // Saved before calibration existed: skills with a few answers already have a real level.
      if (!saved.calibrated) for (const [id, n] of Object.entries(state.seen)) if (n >= 3) state.calibrated[id] = true
      return state
    }
    // Before subjects existed, only math was saved, under another key.
    const old: LegacyMath | null = JSON.parse(localStorage.getItem(OLD_MATH_KEY(playerId)) ?? 'null')
    if (!old) return null
    const state = fresh()
    adoptMath(state, old)
    return state
  } catch {
    return null
  }
}

// One learner per player per page, so every part of a game shares the same numbers.
const cache = new Map<string, Learner>()

/** The current (or given) player's learner. Shared by everything on the page. */
export function learner(playerId = currentPlayer().id): Learner {
  let l = cache.get(playerId)
  if (!l) cache.set(playerId, (l = new Learner(playerId, read(playerId))))
  return l
}

/** A fresh read from storage, for display only (e.g. the homepage), so it's never stale. */
export function peekLearner(playerId = currentPlayer().id): Learner {
  return new Learner(playerId, read(playerId))
}
