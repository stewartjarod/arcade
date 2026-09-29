import { findSkill } from '../subjects'
import { learner as currentLearner, type Learner } from './learner'
import { pickItem, pickSimilar, type PickOptions } from './scheduler'
import type { Item } from './types'

/**
 * i+1 practice for any game and any subject. It picks questions at the player's
 * level (sometimes one step harder), scores answers fairly, and saves progress to
 * their profile.
 *
 *   const practice = startPractice({ formats: ['choice'] })   // once per level/round
 *   const moment = practice.moment()     // one challenge: a door, a boss, a gate
 *   const q = moment.ask()               // q.prompt.text = "7 + 5", q.answer = "12"
 *   const options = q.options(3)         // ["11", "12", "14"]
 *   moment.check(q, picked, { choices: 3 })   // → true/false, and their skills move
 *
 * The fairness rules it takes care of:
 * - Only the first answer to a question counts. Retries after feedback teach, not test.
 * - A quick, right, first-try answer counts extra (for skills that time answers).
 *   Slow-but-right is never marked down.
 * - Picking from choices can be a lucky guess, so it counts for less. Pass how many
 *   choices were really open (e.g. 3 doors, minus ones already tried).
 * - One moment can cost at most a little, so one bad stretch can't undo a level.
 * - Missed facts are remembered and come back later until they stick.
 */
export interface PracticeOptions extends PickOptions {
  learner?: Learner
}

export function startPractice(o: PracticeOptions = {}) {
  return new Practice(o.learner ?? currentLearner(), o)
}

/** Normalize for comparing answers: case, spaces and curly quotes don't matter. */
export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’‘]/g, "'")

export class Question {
  readonly item: Item
  /** When it was asked (for the speed bonus). Call restartTimer() when you actually show it. */
  askedAt = performance.now()
  /** Set once the first answer is scored. */
  scored = false

  constructor(item: Item) {
    this.item = item
  }

  get prompt() {
    return this.item.prompt
  }
  /** The question as plain text ("7 + 5", "Which planet is closest to the Sun?"). */
  get text() {
    return this.item.prompt.text
  }
  get answer() {
    return this.item.answer
  }
  get subject() {
    return this.item.skill.split('.')[0]!
  }

  /** How right is this response? 0..1. */
  score(response: string | number): number {
    const r = String(response)
    return this.item.check ? this.item.check(r) : normalize(r) === normalize(this.item.answer) ? 1 : 0
  }

  /** All the options for multiple choice, with the right answer at `answerAt` (random by default). */
  options(count = 3, answerAt = Math.floor(Math.random() * count)): string[] {
    const wrong = this.item.wrong(count - 1)
    return Array.from({ length: count }, (_, i) => (i === answerAt ? this.answer : wrong.shift()!))
  }

  restartTimer() {
    this.askedAt = performance.now()
  }
}

export class Practice {
  readonly learner: Learner
  readonly options: PickOptions
  /** Ratings when this practice started, to see what grew. */
  private readonly start: Record<string, number>
  private lastKey?: string

  constructor(learner: Learner, options: PickOptions = {}) {
    this.learner = learner
    this.options = options
    this.start = learner.snapshot()
  }

  /** Start one challenge (a door choice, a boss fight...). Its questions share a safety net. */
  moment() {
    return new Moment(this)
  }

  /** Friendly names of skills that levelled up (or unlocked) since this practice started. */
  grew(): string[] {
    const now = this.learner.snapshot()
    return Object.entries(now)
      .filter(([id, r]) => r > 0 && (Math.round(r) > Math.round(this.start[id] ?? 0) || !this.start[id]))
      .map(([id, r]) => findSkill(id)!.label(Math.min(Math.round(r), findSkill(id)!.maxLevel)))
  }

  /** @internal */
  next(): Item {
    const it = pickItem(this.learner, this.options, this.lastKey)
    this.lastKey = it.key
    return it
  }

  /** @internal */
  nextLike(to: Item): Item {
    const it = pickSimilar(to, this.lastKey)
    this.lastKey = it.key
    return it
  }
}

export class Moment {
  private readonly practice: Practice
  private readonly before: Record<string, number>
  private answered = 0

  constructor(practice: Practice) {
    this.practice = practice
    this.before = practice.learner.snapshot()
  }

  /** A new question at the player's level. */
  ask(): Question {
    return new Question(this.practice.next())
  }

  /** Another question like `q` (same skill and level) — for "try one like it" after a miss. */
  similar(q: Question): Question {
    return new Question(this.practice.nextLike(q.item))
  }

  /**
   * Score a response (typed or picked) and save. Returns whether it was right.
   * `choices`: how many options the player could pick from (0 = they typed it).
   */
  check(q: Question, response: string | number, { choices = 0 } = {}): boolean {
    const s = q.score(response)
    this.record(q, s, { choices })
    return s >= 1
  }

  /**
   * Score an answer you've already judged (true/false, or 0..1 partial credit) and save.
   * Only the first answer to each question counts; later calls are ignored.
   */
  record(q: Question, result: boolean | number, { choices = 0 } = {}) {
    if (q.scored) return // retries don't count as evidence
    q.scored = true
    const score = typeof result === 'boolean' ? (result ? 1 : 0) : result
    const first = this.answered++ === 0
    const { learner } = this.practice
    learner.score(q.item, score >= 1 && first ? speedOutcome(q) : score, choices > 0 ? 1 / choices : 0)
    learner.limitDrop(this.before)
    learner.save()
  }
}

// Speed only ever helps: quick = fluent (>1). Slow but right is still right.
function speedOutcome(q: Question) {
  if (!q.item.seconds) return 1
  const ratio = (performance.now() - q.askedAt) / 1000 / q.item.seconds
  return ratio < 0.4 ? 1.2 : ratio < 0.65 ? 1.1 : 1
}
