import { mathLearner, type MathLearner } from './learner'
import {
  chooseProblem, describe, distractors, limitDrop, similarTo, speedOutcome, unlocked, updateSkill,
  type Problem, type Skills,
} from './math'

/**
 * i+1 practice for any game. It picks questions at the player's level (sometimes
 * one step harder), scores answers fairly, and saves progress to their profile.
 *
 *   const practice = startPractice()        // once per level/round
 *   const moment = practice.moment()        // one challenge: a door, a boss, a gate
 *   const q = moment.ask()                  // q.text = "7 + 5", q.answer = 12
 *   moment.check(q, 12, { choices: 3 })     // → true, and the player's skills move
 *
 * The rules it takes care of, so every game plays fair:
 * - Only the first answer to a question counts. Retries after feedback teach, not test.
 * - A quick, right, first-try answer counts extra (fluency). Slow-but-right is never marked down.
 * - Picking from choices can be a lucky guess, so it counts for less. Pass how many
 *   choices were really open (e.g. 3 doors, minus ones already tried).
 * - One moment can cost at most a little, so one bad stretch can't undo a level.
 */
export function startPractice(learner: MathLearner = mathLearner()) {
  return new Practice(learner)
}

export class Question {
  readonly problem: Problem
  /** When it was asked (for the speed bonus). Call restartTimer() if you show it later. */
  askedAt = performance.now()
  /** Set once the first answer is scored. */
  scored = false

  constructor(problem: Problem) {
    this.problem = problem
  }

  get text() {
    return this.problem.text
  }
  get answer() {
    return this.problem.answer
  }

  /** Believable wrong answers (common slips), for multiple choice. */
  wrongAnswers(count = 2): number[] {
    return distractors(this.problem).slice(0, count)
  }

  /** All the options, shuffled, with the right answer somewhere random. Or put it at `answerAt`. */
  options(count = 3, answerAt = Math.floor(Math.random() * count)): number[] {
    const wrong = this.wrongAnswers(count - 1)
    return Array.from({ length: count }, (_, i) => (i === answerAt ? this.answer : wrong.shift()!))
  }

  restartTimer() {
    this.askedAt = performance.now()
  }
}

export class Practice {
  readonly learner: MathLearner
  /** Skills when this practice started, to see what grew. */
  private readonly start: Skills
  private lastText?: string

  constructor(learner: MathLearner) {
    this.learner = learner
    this.start = { ...learner.skills }
  }

  get skills(): Readonly<Skills> {
    return this.learner.skills
  }

  /** Start one challenge (a door choice, a boss fight...). Its questions share a safety net. */
  moment() {
    return new Moment(this)
  }

  /** Friendly names of skills that levelled up since this practice started. */
  grew(): string[] {
    const s = this.learner.skills
    return unlocked(s)
      .filter((k) => Math.round(s[k]) > Math.round(this.start[k]) || this.start[k] < 1)
      .map((k) => describe(k, Math.round(s[k])))
  }

  /** @internal */
  pick(): Problem {
    const p = chooseProblem(this.learner.skills, this.lastText)
    this.lastText = p.text
    return p
  }

  /** @internal */
  pickSimilar(to: Problem): Problem {
    const p = similarTo(to, this.lastText)
    this.lastText = p.text
    return p
  }
}

export class Moment {
  private readonly practice: Practice
  private readonly before: Skills
  private answered = 0

  constructor(practice: Practice) {
    this.practice = practice
    this.before = { ...practice.learner.skills }
  }

  /** A new question at the player's level. */
  ask(): Question {
    return new Question(this.practice.pick())
  }

  /** Another question like `q` (same kind and difficulty) — for "try one like it" after a miss. */
  similar(q: Question): Question {
    return new Question(this.practice.pickSimilar(q.problem))
  }

  /**
   * Score a typed or picked number and save. Returns whether it was right.
   * `choices`: how many options the player could pick from (0 = they typed it).
   */
  check(q: Question, value: number, { choices = 0 } = {}): boolean {
    const correct = value === q.answer
    this.record(q, correct, { choices })
    return correct
  }

  /**
   * Score an answer you've already judged (e.g. they walked through the right door) and save.
   * Only the first answer to each question counts; later calls are ignored.
   */
  record(q: Question, correct: boolean, { choices = 0 } = {}) {
    if (q.scored) return // retries don't count as evidence
    q.scored = true

    const { learner } = this.practice
    const first = this.answered++ === 0
    const outcome = !correct ? 0 : first ? speedOutcome(q.problem, performance.now() - q.askedAt) : 1
    updateSkill(learner.skills, learner.stats, q.problem, outcome, { guess: choices > 0 ? 1 / choices : 0 })
    limitDrop(learner.skills, this.before)
    learner.save()
  }
}
