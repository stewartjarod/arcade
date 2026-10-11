import { afterEach, describe, expect, test, vi } from 'vitest'
import { IXL_LEVELS } from '../ixl/map'
import { itemGrade, ixlScore, levelStarts, scoreLabel, startLevel } from '../ixl/placement'
import { findSkill } from '../subjects'
import { Learner, solves } from './learner'
import { startPractice } from './practice'
import { ixlGradeFor, ixlReport, practiceGrade, subjectGrowth } from './summary'

afterEach(() => vi.restoreAllMocks())

/** A repeatable stream of "random" numbers, so these tests don't flake. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('the IXL-style scale (100 points per grade)', () => {
  test('every mapped skill climbs the scale, grade by grade', () => {
    for (const id of Object.keys(IXL_LEVELS)) {
      const starts = levelStarts(id)!
      expect(starts, id).toHaveLength(IXL_LEVELS[id]!.length + 1)
      for (let i = 1; i < starts.length; i++) expect(starts[i]!, `${id} level ${i}`).toBeGreaterThan(starts[i - 1]!)
      IXL_LEVELS[id]!.forEach((ref, i) => {
        expect(starts[i]!, `${id} level ${i + 1} sits inside grade ${ref.grade}`).toBeGreaterThanOrEqual(ref.grade * 100)
        expect(starts[i]!, `${id} level ${i + 1} sits inside grade ${ref.grade}`).toBeLessThan((ref.grade + 1) * 100)
      })
    }
  })

  test('levels share their grade evenly: 1 → 100, then 150 for the next one in that grade', () => {
    // clocks.time is K, 1, 2, 2, 3 → 0, 100, 200, 250, 300 (and 400 where the top level ends)
    expect(levelStarts('clocks.time')).toEqual([0, 100, 200, 250, 300, 400])
  })

  test('a score slides smoothly across a level and reads as a grade', () => {
    expect(ixlScore('clocks.time', 1)).toBe(50) // middle of the K level (0–100)
    expect(ixlScore('clocks.time', 1.5)).toBe(100) // level 2 starts
    expect(ixlScore('clocks.time', 4)).toBe(275) // middle of the second 2nd-grade level
    expect(ixlScore('space.planets', 1)).toBeGreaterThanOrEqual(300) // astronomy is 3rd grade and up
    expect(scoreLabel(134)).toBe('Grade 1 · 34%')
    expect(scoreLabel(40)).toBe('Kindergarten · 40%')
  })

  test('unmapped skills have no score and start at level 1', () => {
    expect(ixlScore('nonsense.skill', 3)).toBeUndefined()
    expect(startLevel('nonsense.skill', 4)).toBe(1)
    expect(itemGrade('nonsense.skill', 2)).toBeUndefined()
  })
})

describe('starting at the grade on the profile', () => {
  test('a skill begins at the last level that starts at or below the grade', () => {
    for (const id of Object.keys(IXL_LEVELS)) {
      const maxLevel = findSkill(id)!.maxLevel
      for (let grade = 0; grade <= 5; grade++) {
        const level = startLevel(id, grade)
        expect(level, id).toBeGreaterThanOrEqual(1)
        expect(level, id).toBeLessThanOrEqual(maxLevel)
        if (level > 1) expect(itemGrade(id, level)!, `${id} @ grade ${grade}`).toBeLessThanOrEqual(grade)
        if (level < maxLevel) expect(itemGrade(id, level + 1)!, `${id} @ grade ${grade}`).toBeGreaterThan(grade)
      }
    }
  })

  test('Kindergarten and no grade still begin at level 1 everywhere they can', () => {
    const l = new Learner('t', null, {})
    expect(l.rating('math.add')).toBe(1)
    expect(new Learner('t', null, { grade: 0 }).rating('math.add')).toBe(1)
  })

  test('a 1st grader starts around 100, a 3rd grader around 300', () => {
    const first = new Learner('t', null, { grade: 1 })
    const third = new Learner('t', null, { grade: 3 })
    expect(first.rating('math.add')).toBeGreaterThan(1)
    expect(third.rating('math.add')).toBeGreaterThan(first.rating('math.add'))
    expect(ixlGradeFor(first, 'math')).toBe(1)
    expect(ixlGradeFor(third, 'math')).toBe(3)
    const report = ixlReport(first).find((s) => s.id === 'math')!
    expect(report.score).toBe(100)
    expect(report.placing).toBe(true)
    // each skill's own score is near the grade too (not the whole 100 either side of it)
    for (const k of report.skills.filter((s) => s.score !== undefined && s.level > 1)) expect(k.score!, k.id).toBeLessThan(300)
  })

  test('the first maze already plays at their grade, and growth counts from where they started', () => {
    const l = new Learner('t', null, { grade: 2 })
    expect(practiceGrade(l, 'math')).toEqual({ grade: 2, known: true })
    expect(subjectGrowth(l, 'math')).toBe(0)
  })

  test('skills unlock by growing, and a grade can open them', () => {
    expect(new Learner('t', null, { grade: 0 }).isUnlocked('math.mul')).toBe(false)
    expect(new Learner('t', null, { grade: 3 }).isUnlocked('math.mul')).toBe(true)
  })

  test('changing the grade before they play moves where they start', () => {
    const profile = { grade: 1 }
    const l = new Learner('t', null, profile)
    const before = l.rating('math.add')
    profile.grade = 3
    expect(l.rating('math.add')).toBeGreaterThan(before)
  })
})

// Each test simulates dozens of kids answering a dozen questions, so give a busy machine room.
describe('finding their real level fast', { timeout: 30_000 }, () => {
  /** A kid who really works at `truth` and was entered as `profile`, asked `answers` choice questions in math. */
  function trial(profile: number | undefined, truth: number, answers: number, rand: () => number, guessOnly = false) {
    const l = new Learner('sim', null, { grade: profile })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    vi.spyOn(Math, 'random').mockImplementation(rand)
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    for (let i = 0; i < answers; i++) {
      const m = practice.moment()
      const q = m.ask()
      const sure = guessOnly ? 0 : solves(startLevel(q.item.skill, truth), q.item.level)
      m.record(q, rand() < sure + (1 - sure) / 3, { choices: 3 })
    }
    return l.placement('math').grade
  }
  const mean = (profile: number | undefined, truth: number, answers: number, guessOnly = false) => {
    const rand = seeded(7)
    const runs = Array.from({ length: 40 }, () => trial(profile, truth, answers, rand, guessOnly))
    return runs.reduce((a, b) => a + b, 0) / runs.length
  }

  test('a 1st grader who is really at 3rd-grade math moves most of the way up in one maze-and-a-bit', () => {
    expect(mean(1, 3, 12)).toBeGreaterThan(2.3)
  })

  test('a kid entered too high comes down', () => {
    expect(mean(3, 1, 12)).toBeLessThan(2.1)
    expect(mean(2, 0, 12)).toBeLessThan(1.4)
  })

  test('a kid entered at the right grade stays about there', () => {
    expect(Math.abs(mean(1, 1, 12) - 1)).toBeLessThan(0.6)
    expect(Math.abs(mean(2, 2, 12) - 2)).toBeLessThan(0.6)
  })

  test('with no grade on the profile, a 2nd grader is found from scratch', () => {
    expect(mean(undefined, 2, 12)).toBeGreaterThan(1.4)
  })

  test('someone who is only guessing does not climb', () => {
    expect(mean(1, 0, 20, true)).toBeLessThan(0.5)
  })

  test('a new subject skill starts where the placement says, not at the beginning', () => {
    const l = new Learner('t', null, { grade: 0 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const before = l.rating('math.sub')
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    for (let i = 0; i < 8; i++) {
      const m = practice.moment()
      const q = m.ask()
      m.record(q, true, { choices: 3 })
    }
    expect(l.placement('math').grade).toBeGreaterThan(1)
    expect(l.rating('math.sub')).toBeGreaterThan(before) // never asked about subtraction, but it starts higher now
    expect(l.isPlacing('math')).toBe(true)
  })

  test('re-placing a subject starts it over from a grade', () => {
    const l = new Learner('t', null, { grade: 1 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    for (let i = 0; i < 6; i++) {
      const m = practice.moment()
      m.record(m.ask(), false, { choices: 3 })
    }
    expect(l.placement('math').answers).toBe(6)
    l.replace('math', 2)
    expect(l.placement('math')).toEqual({ grade: 2, answers: 0 })
    expect(l.seen('math.add')).toBe(0)
  })
})

describe('saves from before placement existed', () => {
  test('their spot comes from the skills they have practiced', () => {
    const l = new Learner('t', null, {})
    const state = (l as unknown as { state: { ratings: Record<string, number>; seen: Record<string, number>; calibrated: Record<string, boolean> } }).state
    for (const [id, level] of [['math.add', 9], ['math.sub', 9]] as const) {
      state.ratings[id] = level
      state.seen[id] = 30
      state.calibrated[id] = true
    }
    expect(ixlGradeFor(l, 'math')!).toBeGreaterThan(1)
    expect(l.isPlacing('math')).toBe(false) // plenty of answers behind it already
  })
})

describe('gentler for the youngest, and no sudden jumps in play style', () => {
  test('while placing, K–1 are asked closer to their spot than older kids', () => {
    const young = new Learner('t', null, { grade: 1 })
    const older = new Learner('t', null, { grade: 3 })
    expect(young.placingTarget('math') - 1).toBeLessThan(older.placingTarget('math') - 3)
  })

  test('a hot streak lifts the estimate fast, but games only play one grade higher per round', () => {
    const l = new Learner('t', null, { grade: 1 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    let practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    expect(practiceGrade(l, 'math').grade).toBe(1)
    for (let i = 0; i < 12; i++) {
      const m = practice.moment()
      m.record(m.ask(), true, { choices: 3 })
    }
    expect(ixlGradeFor(l, 'math')!).toBeGreaterThan(2.5) // the grown-up page sees the full estimate
    expect(practiceGrade(l, 'math').grade).toBe(2) // but the next maze is only one grade up
    practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    expect(practiceGrade(l, 'math').grade).toBe(3) // and the one after that, one more
  })

  test('play style comes down at once', () => {
    const l = new Learner('t', null, { grade: 3 })
    startPractice({ learner: l, subjects: ['math'], audio: true })
    expect(l.playGrade('math', 1)).toBe(1)
  })
})
