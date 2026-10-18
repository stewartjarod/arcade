import { afterEach, describe, expect, test, vi } from 'vitest'
import { itemGrade } from '../ixl/placement'
import { Learner, PLACING_ANSWERS } from './learner'
import { startPractice } from './practice'

/**
 * The i+1 evaluator: simulated kids play many rounds of math, and we check that the questions keep
 * up with them. This file is the fixed yardstick for the learning changes in .scratch/learning-ipush/ —
 * don't loosen a number here to make a change pass.
 *
 * A simulated kid at grade `truth` gets a question of grade g right with chance sigmoid(3(truth − g) + 1.6),
 * plus a lucky guess among 3 choices. A "learning" kid's truth grows a little with each right stretch answer.
 */

afterEach(() => vi.restoreAllMocks())

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

export interface Answer {
  round: number
  grade: number
  truth: number
  placed: number
  right: boolean
  skill: string
  frontier: boolean
  review: boolean
  placing: boolean
}

/** Play `rounds` rounds of `per` choice questions in math. Returns every answer, in order. */
export function simulate(o: { profile?: number; truth: number; rounds: number; per?: number; learns?: number; seed: number }) {
  const per = o.per ?? 10
  const rand = seeded(o.seed)
  const l = new Learner('sim', null, { grade: o.profile })
  vi.spyOn(l, 'save').mockImplementation(() => {})
  vi.spyOn(Math, 'random').mockImplementation(rand)
  let truth = o.truth
  const out: Answer[] = []
  const grew: string[][] = []
  const answered: Set<string>[] = []
  for (let r = 0; r < o.rounds; r++) {
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    const mine = new Set<string>()
    for (let i = 0; i < per; i++) {
      const placing = l.isPlacing('math')
      const m = practice.moment()
      const q = m.ask()
      const g = itemGrade(q.item.skill, q.item.level) ?? 0
      const p = sigmoid(3 * (truth - g) + 1.6)
      const right = rand() < p + (1 - p) / 3
      const review = l.dueFacts(q.item.skill).some((f) => f.key === q.item.key)
      mine.add(q.item.skill)
      m.record(q, right, { choices: 3 })
      out.push({ round: r, grade: g, truth, placed: l.placement('math').grade, right, skill: q.item.skill, frontier: !!q.item.frontier, review, placing })
      if (o.learns && right && g >= truth - 0.2) truth += o.learns
    }
    grew.push(practice.grew())
    answered.push(mine)
  }
  return { answers: out, grew, answered, learner: l }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
const SEEDS = [11, 23, 37, 41, 59, 73]

/** Metrics for one kind of kid, averaged over SEEDS. `from`: first round counted (0-based). */
export function metrics(o: { profile?: number; truth: number; rounds: number; learns?: number }, from: number) {
  const runs = SEEDS.map((seed) => simulate({ ...o, seed }))
  const late = runs.map((r) => r.answers.filter((a) => a.round >= from))
  const flat = late.flat()
  const settled = flat.filter((a) => !a.placing)
  const roundsOf = (as: Answer[]) => [...new Set(as.map((a) => a.round))].map((n) => as.filter((a) => a.round === n))
  const placedSd = mean(
    late.map((as) => {
      const ps = roundsOf(as).map((rs) => rs[rs.length - 1]!.placed)
      const m = mean(ps)
      return Math.sqrt(mean(ps.map((p) => (p - m) ** 2)))
    }),
  )
  const focusSizes = late.flatMap((as) => roundsOf(as).map((rs) => new Set(rs.filter((a) => !a.placing && !a.frontier && !a.review).map((a) => a.skill)).size))
  return {
    /** Asked grade minus where the kid really is (positive = a little above them, the i+1 zone). */
    lead: mean(flat.map((a) => a.grade - a.truth)),
    /** Asked grade minus the placement estimate. */
    vsPlaced: mean(flat.map((a) => a.grade - a.placed)),
    right: mean(flat.map((a) => (a.right ? 1 : 0))),
    /** Share of questions within 0.6 grade of the kid's real level. */
    onTarget: mean(flat.map((a) => (Math.abs(a.grade - a.truth) <= 0.6 ? 1 : 0))),
    frontierShare: mean(settled.map((a) => (a.frontier ? 1 : 0))),
    frontierWhilePlacing: runs.flatMap((r) => r.answers).filter((a) => a.placing && a.frontier).length,
    placedSd,
    maxFocus: Math.max(0, ...focusSizes),
    meanFocus: mean(focusSizes),
    /** Most skills listed as "grew" in one round, and whether any listed skill wasn't answered that round. */
    maxGrew: Math.max(...runs.flatMap((r) => r.grew.map((g) => g.length))),
    endTruth: mean(runs.map((r) => r.answers[r.answers.length - 1]!.truth)),
    endPlaced: mean(runs.map((r) => r.answers[r.answers.length - 1]!.placed)),
  }
}

const LEARNER = { profile: 1, truth: 1, rounds: 30, learns: 0.03 }
const STATIC_1 = { profile: 1, truth: 1, rounds: 30 }
const STATIC_3 = { profile: 3, truth: 3, rounds: 30 }
const UNDER = { profile: 2, truth: 3.5, rounds: 30 }

describe('i+1 keeps up with the kid', { timeout: 120_000 }, () => {
  test('baseline report (prints the numbers)', () => {
    const rows = Object.entries({ LEARNER, STATIC_1, STATIC_3, UNDER }).map(([name, k]) => {
      const m = metrics(k, 20)
      return `${name.padEnd(9)} ${Object.entries(m).map(([key, v]) => `${key}=${typeof v === 'number' ? Math.round(v * 100) / 100 : v}`).join(' ')}`
    })
    console.info(`\n${rows.join('\n')}`)
    expect(rows.length).toBe(4)
  })

  test('a kid who is learning keeps getting harder questions (late rounds stay near their level)', () => {
    const m = metrics(LEARNER, 20)
    expect(m.lead).toBeGreaterThan(-0.4)
    expect(m.vsPlaced).toBeGreaterThan(-0.4)
    expect(m.right).toBeLessThan(0.93)
    expect(m.onTarget).toBeGreaterThan(0.6)
  })

  test('kids who stay put are asked around their level, mostly right but not always', () => {
    for (const k of [STATIC_1, STATIC_3, UNDER]) {
      const m = metrics(k, 10)
      expect(Math.abs(m.lead), JSON.stringify(k)).toBeLessThan(0.5)
      expect(m.right, JSON.stringify(k)).toBeGreaterThan(0.65)
      expect(m.right, JSON.stringify(k)).toBeLessThan(0.93)
      expect(m.onTarget, JSON.stringify(k)).toBeGreaterThan(0.6)
    }
  })

  test('placement keeps up with a kid who is learning (it settles, but not so much it lags)', () => {
    const m = metrics(LEARNER, 20)
    expect(Math.abs(m.endPlaced - m.endTruth)).toBeLessThan(0.35)
  })

  test('placement settles once placing is over', () => {
    expect(metrics(STATIC_1, 10).placedSd).toBeLessThan(0.15)
    expect(metrics(STATIC_3, 10).placedSd).toBeLessThan(0.15)
  })

  test('new topics (frontier) come up now and then, never while placing', () => {
    const m = metrics(STATIC_1, 10)
    expect(m.frontierWhilePlacing).toBe(0)
    expect(m.frontierShare).toBeGreaterThan(0.05)
    expect(m.frontierShare).toBeLessThan(0.25)
  })

  test('a round sticks to a few skills, so progress shows', () => {
    const m = metrics(STATIC_1, 10)
    expect(m.maxFocus).toBeLessThanOrEqual(5)
  })

  test('"you grew" lists only skills answered that round, and not a flood', () => {
    for (const k of [LEARNER, UNDER]) {
      const runs = SEEDS.slice(0, 3).map((seed) => simulate({ ...k, seed }))
      for (const r of runs)
        r.grew.forEach((g, i) => {
          expect(g.length, `round ${i}`).toBeLessThanOrEqual(r.answered[i]!.size)
        })
    }
  })

  test('a miss on a brand-new topic does not pull placement down', () => {
    const l = new Learner('t', null, { grade: 2 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    for (let i = 0; i < PLACING_ANSWERS + 30; i++) {
      const m = practice.moment()
      const q = m.ask()
      const before = l.placement('math').grade
      const right = !q.item.frontier && (itemGrade(q.item.skill, q.item.level) ?? 0) <= 2.2
      m.record(q, right, { choices: 3 })
      if (q.item.frontier && !right) expect(l.placement('math').grade).toBeGreaterThanOrEqual(before - 1e-9)
    }
  })
})
