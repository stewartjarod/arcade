import { findSkill, SUBJECTS } from '../subjects'
import { itemGrade, startLevel } from '../ixl/placement'
import { canSpeak } from '../ui/speak'
import type { Learner } from './learner'
import type { Format, Item, Skill } from './types'

/**
 * Choosing what to ask next — the "i+1" part.
 *
 * 1. Subject: the grown-up's focus subject half the time; otherwise rotate, favoring
 *    whatever hasn't been practiced for longest.
 * 2. Skill: once placed, skills whose current question sits near the player's aim on the grade scale
 *    come up most (grades, not raw level numbers), so questions stay at their level. A round sticks to
 *    a few of them (see RoundFocus), so progress shows. While they're still finding their spot, skills
 *    whose level is near that spot come up most, so every answer teaches us the most.
 * 3. Question: sometimes a fact they missed earlier that's due for another go; sometimes, once placed,
 *    a brand-new topic a step past them (marked `frontier`, so games show a teach card first);
 *    otherwise a fresh one — mostly at their level, sometimes one harder (the i+1 zone), sometimes one
 *    easier as review. That mix lands around 75–90% right.
 */
export interface PickOptions {
  /** Only these subjects (ids). Default: all. */
  subjects?: string[]
  /** Only these skills (full ids like "math.add"). Default: all. */
  skills?: string[]
  /** Only questions answerable this way. Default: any. */
  formats?: Format[]
  /** Can we play sound? Default: yes if we have voice clips or the browser can speak. */
  audio?: boolean
}

/** The few skills a round is sticking to in one subject, and how many fresh questions they've had. */
export interface Focus {
  skills: string[]
  asked: number
}
/** Per subject, the current focus. A Practice keeps one of these, so a round doesn't jump across every skill. */
export type RoundFocus = Record<string, Focus>

/** How many skills a round sticks to, and how many fresh questions before it chooses again. */
export const FOCUS_SIZE = 4
export const FOCUS_QUESTIONS = 10
/** Chance a question is a missed fact that's due. */
const DUE_RATE = 0.35
/** Chance, once placed, that a question is a brand-new topic a step past them (about 1 in 8). */
const FRONTIER_RATE = 1 / 8
/** A brand-new topic starts this far (in grades) above their spot, and no further than this. */
const FRONTIER_NEAR = 0.3
const FRONTIER_FAR = 1.0
/** Mastered skills (at their top level) still come up now and then, but rarely. */
const MASTERED_WEIGHT = 0.05
/** How much closer than this (in grades) a question has to be to their aim to get the full weight. */
const AIM_SLOPE = 2.5

interface Candidate {
  id: string
  subject: string
  skill: Skill
}

function candidates(l: Learner, o: PickOptions): Candidate[] {
  const audio = o.audio ?? canSpeak()
  return SUBJECTS.filter((s) => !o.subjects || o.subjects.includes(s.id)).flatMap((s) =>
    s.skills
      .filter((k) => !o.formats || k.formats.some((f) => o.formats!.includes(f)))
      .filter((k) => audio || !k.listen)
      .map((k) => ({ id: `${s.id}.${k.id}`, subject: s.id, skill: k }))
      .filter((c) => !o.skills || o.skills.includes(c.id))
      .filter((c) => l.isUnlocked(c.id)),
  )
}

const weighted = <T,>(items: T[], weight: (t: T) => number): T => {
  const ws = items.map(weight)
  let roll = Math.random() * ws.reduce((a, b) => a + b, 0)
  return items.find((_, i) => (roll -= ws[i]!) < 0) ?? items[0]!
}

/** Can anything be asked with these options? */
export function canPick(l: Learner, o: PickOptions = {}) {
  return candidates(l, o).length > 0
}

/**
 * The next question. `avoid`: keys asked lately, which shouldn't repeat right away. `focus`: the Practice's
 * RoundFocus (omit it to pick without a round's focus).
 */
export function pickItem(l: Learner, o: PickOptions = {}, avoid?: string | readonly string[], focus: RoundFocus = {}): Item {
  const avoidKeys = typeof avoid === 'string' ? [avoid] : avoid ?? []
  const audio = o.audio ?? canSpeak()
  // Try another skill or level when this one repeats a question, or a level is all listen-only and we have no sound.
  const tryAgain = (it: Item) => avoidKeys.includes(it.key) || (!audio && !!it.listen)
  let pick = pickOnce(l, o, avoidKeys, focus)
  for (let i = 0; i < 12 && tryAgain(pick.item); i++) pick = pickOnce(l, o, avoidKeys, focus)
  // Only the question that's actually asked counts toward the round's focus (retries don't).
  if (pick.fresh) countFresh(focus, pick.subject)
  return pick.item
}

/** One pick: the question, its subject, and whether it's a fresh one that counts toward the round's focus. */
interface Pick {
  item: Item
  subject: string
  fresh: boolean
}

function pickOnce(l: Learner, o: PickOptions, avoidKeys: readonly string[], focus: RoundFocus): Pick {
  const all = candidates(l, o)
  if (!all.length) throw new Error('Nothing to practice with these options')
  const subject = chooseSubject(l, all)
  const inSubject = all.filter((c) => c.subject === subject)
  const placing = l.isPlacing(subject)
  const audio = o.audio ?? canSpeak()
  // A skill that isn't listen-only can still have a listen-only question at some level, so check each question too.
  const usable = (it: Item) => (!o.formats || it.formats.some((f) => o.formats!.includes(f))) && (audio || !it.listen) && !avoidKeys.includes(it.key)
  const done = (item: Item, fresh: boolean): Pick => ({ item, subject, fresh })

  // Skill: placing aims at the spot found so far; placed skills stick to the round's focus.
  const aim = l.aimGrade(subject)
  const target = l.placingTarget(subject)
  const spot = l.placement(subject).grade
  const pool = placing ? placingPool(inSubject, target) : focusPool(subject, inSubject, focus, (c) => nearAim(l, c, aim, spot))
  const c = placing ? weighted(pool, (k) => 0.05 + nearTarget(k.id, target)) : weighted(pool, (k) => nearAim(l, k, aim, spot))

  // A missed fact that's due, some of the time. While placing it comes from this skill; once placed, from anywhere
  // in the subject (focus or not), so a round's focus never hides a fact that's ready to come back.
  const due = placing ? dueForSkill(l, c, usable) : dueInSubject(l, inSubject, usable)
  if (due) return done(due, false)
  // Once placed, now and then a brand-new topic a step past where they are.
  if (!placing && Math.random() < FRONTIER_RATE) {
    const it = frontierQuestion(l, subject, inSubject, usable)
    if (it) return done(it, false)
  }

  // ...and a fresh question around their level.
  const base = Math.max(1, Math.round(l.rating(c.id)))
  const r = Math.random()
  // Placing: the level at the target above. A new skill finding its level: lean toward harder, never easier.
  const level = clampLevel(
    c.skill,
    placing ? startLevel(c.id, target) : l.isCalibrating(c.id) ? (r < 0.55 ? base : harderLevel(c.id, c.skill, base)) : r < 0.7 ? base : r < 0.9 ? harderLevel(c.id, c.skill, base) : base - 1,
  )
  return done(generate(c.id, level, usable), !placing)
}

/** Subject: the focus subject half the time, otherwise rotate, favoring whatever hasn't been practiced for longest. */
function chooseSubject(l: Learner, all: Candidate[]): string {
  const subjects = [...new Set(all.map((c) => c.subject))]
  if (l.focus && subjects.includes(l.focus) && Math.random() < 0.5) return l.focus
  const stalest = subjects.reduce((a, b) => (l.lastPracticed(a) <= l.lastPracticed(b) ? a : b))
  return weighted(subjects, (s) => (s === stalest && subjects.length > 1 ? 2 : 1))
}

/** While placing: skills whose easiest question is already above the target are left out (three-digit sums for a kindergartner). */
function placingPool(inSubject: Candidate[], target: number): Candidate[] {
  const reachable = inSubject.filter((c) => (itemGrade(c.id, 1) ?? 0) <= target + 1e-9)
  return reachable.length ? reachable : inSubject
}

/**
 * How close a skill's current question is to the aim, as a weight: the grade is what matters, not the level number.
 * A brand-new topic a step past their spot is kept for frontier picks, so it's still new when it comes up.
 */
function nearAim(l: Learner, c: Candidate, aim: number, spot: number): number {
  if (l.seen(c.id) === 0 && frontierLevel(c, spot) !== undefined) return 0.02
  const g = itemGrade(c.id, Math.max(1, Math.round(l.rating(c.id))))
  const w = g === undefined ? 0.3 : Math.exp(-AIM_SLOPE * Math.abs(g - aim))
  // A skill they've mastered rests unless a missed fact in it is due.
  const mastered = l.rating(c.id) >= c.skill.maxLevel + 0.5
  return mastered && l.dueFacts(c.id).length === 0 ? w * MASTERED_WEIGHT : w
}

/** While placing: skills whose level at the target is close to it come up most, so each answer teaches the most. */
function nearTarget(id: string, target: number): number {
  const g = itemGrade(id, startLevel(id, target))
  return g === undefined ? 0.3 : Math.exp(-1.2 * Math.abs(g - target))
}

/**
 * The skills a round is sticking to in this subject. Chosen the first time the subject comes up in a round, and
 * again after every FOCUS_QUESTIONS fresh questions in it. Falls back to every skill if the focus has none left.
 */
function focusPool(subject: string, inSubject: Candidate[], focus: RoundFocus, weight: (c: Candidate) => number): Candidate[] {
  let f = focus[subject]
  if (!f || f.asked >= FOCUS_QUESTIONS) {
    f = { skills: chooseFocus(inSubject, weight), asked: 0 }
    focus[subject] = f
  }
  const mine = inSubject.filter((c) => f.skills.includes(c.id))
  return mine.length ? mine : inSubject
}

/** Up to FOCUS_SIZE different skills, drawn by weight without repeats. */
function chooseFocus(inSubject: Candidate[], weight: (c: Candidate) => number): string[] {
  const left = [...inSubject]
  const picked: string[] = []
  while (picked.length < FOCUS_SIZE && left.length) {
    const c = weighted(left, weight)
    picked.push(c.id)
    left.splice(left.indexOf(c), 1)
  }
  return picked
}

/** Count a fresh question toward the round's focus. (Due facts and frontier topics don't count.) */
function countFresh(focus: RoundFocus, subject: string) {
  if (focus[subject]) focus[subject]!.asked++
}

/** While placing: a missed fact from this skill that's ready to ask again, some of the time. */
function dueForSkill(l: Learner, c: Candidate, usable: (it: Item) => boolean): Item | undefined {
  const due = l.dueFacts(c.id)
  if (!due.length || !c.skill.fromKey || Math.random() >= DUE_RATE) return undefined
  const f = due[0]!
  const spec = c.skill.fromKey(f.key, f.level)
  if (!spec) return undefined
  const it = finish(c, spec, f.level)
  return usable(it) ? it : undefined
}

/** Once placed: a missed fact from anywhere in the subject that's ready to ask again, some of the time (oldest first). */
function dueInSubject(l: Learner, inSubject: Candidate[], usable: (it: Item) => boolean): Item | undefined {
  const facts = l.dueFacts().filter((f) => inSubject.some((c) => c.id === f.skill))
  if (!facts.length || Math.random() >= DUE_RATE) return undefined
  for (const f of facts) {
    const c = inSubject.find((k) => k.id === f.skill)!
    const spec = c.skill.fromKey?.(f.key, f.level)
    if (!spec) continue
    const it = finish(c, spec, f.level)
    if (usable(it)) return it
  }
  return undefined
}

/** The level whose grade is in the frontier band (a step past their spot), first one wins. Undefined if none. */
function frontierLevel(c: Candidate, spot: number): number | undefined {
  for (let L = 1; L <= c.skill.maxLevel; L++) {
    const g = itemGrade(c.id, L)
    if (g !== undefined && g >= spot + FRONTIER_NEAR - 1e-9 && g <= spot + FRONTIER_FAR + 1e-9) return L
  }
  return undefined
}

/** A brand-new topic (never seen, unlocked) one step past their spot, marked `frontier` so games show a teach card. */
function frontierQuestion(l: Learner, subject: string, inSubject: Candidate[], usable: (it: Item) => boolean): Item | undefined {
  const spot = l.placement(subject).grade
  const options = inSubject.flatMap((c) => {
    const level = l.seen(c.id) === 0 ? frontierLevel(c, spot) : undefined
    return level === undefined ? [] : [{ c, level }]
  })
  if (!options.length) return undefined
  const { c, level } = options[Math.floor(Math.random() * options.length)]!
  const it = generate(c.id, level, usable)
  return usable(it) ? { ...it, frontier: true } : undefined
}

/** How much harder (in grades) a stretch question is than the base level. */
const STRETCH = 0.15
/** A little harder than `base`: the first level whose grade is at least STRETCH grades above it (or just the next level). Exported for tests. */
export function harderLevel(skillId: string, skill: Skill, base: number) {
  const g = itemGrade(skillId, base)
  if (g === undefined) return base + 1
  for (let L = base + 1; L <= skill.maxLevel; L++) if ((itemGrade(skillId, L) ?? 0) >= g + STRETCH) return L
  return base + 1
}

/** Another question from the same skill and level (e.g. "try one like it"). */
export function pickSimilar(to: Item, avoid: string | readonly string[] = to.key): Item {
  const avoidKeys = typeof avoid === 'string' ? [avoid] : avoid
  return generate(to.skill, to.level, (it) => !avoidKeys.includes(it.key))
}

function generate(skillId: string, level: number, ok: (it: Item) => boolean): Item {
  const skill = findSkill(skillId)!
  const c = { id: skillId, subject: skillId.split('.')[0]!, skill }
  let it = finish(c, skill.generate(level), level)
  for (let i = 0; i < 20 && !ok(it); i++) it = finish(c, skill.generate(level), level)
  return it
}

const clampLevel = (skill: Skill, level: number) => Math.min(skill.maxLevel, Math.max(1, level))

function finish(c: Candidate, spec: ReturnType<Skill['generate']>, level: number): Item {
  return { ...spec, formats: spec.formats ?? c.skill.formats, listen: spec.listen ?? c.skill.listen, skill: c.id, level }
}
