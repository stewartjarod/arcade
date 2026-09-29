import { currentPlayer, getPlayer, playerKey } from '@arcade/players'
import { findSkill, SUBJECTS } from '../subjects'
import type { Item, Skill } from './types'

/**
 * Everything one player knows, across every subject, saved on their profile.
 * Every game shares it, so practice anywhere counts everywhere.
 *
 * Ratings: "comfortable at level r" for each skill ("math.add": 3.4).
 * Facts:   questions they missed, which come back sooner until they stick.
 *
 * Everyone starts every skill at level 1 — no guessing from age or grade. A new skill
 * calibrates fast: each right answer at their level jumps a whole level, and the first
 * miss settles them just below it. From then on it's gentle i+1. The baseline is saved on
 * the player, so a skill calibrated in one game is already calibrated in every other game.
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

const fresh = (): State => ({ v: 2, ratings: {}, seen: {}, fast: {}, facts: {}, last: {}, calibrated: {} })

/** A new skill stops calibrating after its first miss, or after this many answers. */
export const CALIBRATION_ANSWERS = 8

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

  /** Current level for a skill ("math.add"). 0 means not unlocked yet. */
  rating(skillId: string): number {
    const r = this.state.ratings[skillId]
    if (r !== undefined && r > 0) return r
    const skill = findSkill(skillId)
    if (!skill || !this.prereqsMet(skillId, skill)) return 0
    return 1 // everyone starts at the beginning, then calibrates quickly
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
    const r = this.rating(id) || 1
    const seen = this.seen(id)
    let next: number
    let fast = 0
    if (this.isCalibrating(id)) {
      if (outcome < 1) {
        next = Math.max(1, r - 0.5)
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

  /** Put ratings back up to `before - MAX_MOMENT_DROP` so one bad stretch can't undo a level. */
  limitDrop(before: Record<string, number>) {
    for (const [id, r] of Object.entries(before)) {
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
