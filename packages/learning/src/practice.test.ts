import { afterEach, describe, expect, test, vi } from 'vitest'
import type { MathLearner } from './learner'
import { MAX_JUNCTION_DROP, START_SKILLS, START_STATS, makeProblem } from './math'
import { Question, startPractice } from './practice'

// A learner that isn't tied to storage, at a chosen level, with warm-up already done.
function learnerAt(add: number, seen = 50): MathLearner {
  const stats = START_STATS()
  stats.seen.add = seen
  return { playerId: 'test', skills: { ...START_SKILLS, add, sub: add }, stats, isNew: false, save: vi.fn() }
}

// Ask an addition question at a fixed tier, answered after `ms` milliseconds.
function addQuestion(tier: number) {
  return new Question(makeProblem('add', tier))
}
function answerAfter(ms: number) {
  const now = performance.now()
  vi.spyOn(performance, 'now').mockReturnValue(now + ms)
}

afterEach(() => vi.restoreAllMocks())

describe('scoring', () => {
  test('check says whether the answer was right and saves the profile', () => {
    const learner = learnerAt(3)
    const moment = startPractice(learner).moment()
    const q = addQuestion(3)
    expect(moment.check(q, q.answer)).toBe(true)
    expect(learner.save).toHaveBeenCalledOnce()
    expect(moment.check(addQuestion(3), -1)).toBe(false)
  })

  test('only the first answer to a question counts', () => {
    const learner = learnerAt(3)
    const moment = startPractice(learner).moment()
    const q = addQuestion(3)
    moment.check(q, -1)
    const afterFirst = learner.skills.add
    expect(moment.check(q, q.answer)).toBe(true) // still tells you it's right...
    expect(learner.skills.add).toBe(afterFirst) // ...but doesn't count it
    expect(learner.save).toHaveBeenCalledOnce()
  })

  test('a quick right answer counts more than a slow one; slow is never a penalty', () => {
    const fast = learnerAt(3)
    const slow = learnerAt(3)
    const qf = addQuestion(3)
    const qs = addQuestion(3)
    answerAfter(500)
    startPractice(fast).moment().check(qf, qf.answer)
    vi.restoreAllMocks()
    answerAfter(60_000)
    startPractice(slow).moment().check(qs, qs.answer)
    expect(fast.skills.add).toBeGreaterThan(slow.skills.add)
    expect(slow.skills.add).toBeGreaterThanOrEqual(3)
  })

  test('only the first question of a moment gets the speed bonus', () => {
    const a = learnerAt(3)
    const b = learnerAt(3)
    answerAfter(500)
    // a: quick first answer
    const qa = addQuestion(3)
    startPractice(a).moment().check(qa, qa.answer)
    // b: same quick answer, but it's the second question in the moment
    const mb = startPractice(b).moment()
    const miss = addQuestion(3)
    mb.check(miss, -1)
    const before = b.skills.add
    const qb = addQuestion(3)
    mb.check(qb, qb.answer)
    expect(b.skills.add - before).toBeLessThan(a.skills.add - 3)
  })

  test('picking from choices counts for less than typing the answer', () => {
    const typed = learnerAt(3)
    const picked = learnerAt(3)
    answerAfter(60_000) // no speed bonus, to compare fairly
    const qt = addQuestion(3)
    const qp = addQuestion(3)
    startPractice(typed).moment().record(qt, true)
    startPractice(picked).moment().record(qp, true, { choices: 3 })
    expect(typed.skills.add).toBeGreaterThan(picked.skills.add)
  })

  test('a wrong pick among few choices costs more than among many', () => {
    const few = learnerAt(3)
    const many = learnerAt(3)
    startPractice(few).moment().record(addQuestion(3), false, { choices: 2 })
    startPractice(many).moment().record(addQuestion(3), false, { choices: 5 })
    expect(few.skills.add).toBeLessThan(many.skills.add)
  })

  test('the last remaining choice is a free pick and changes nothing', () => {
    const learner = learnerAt(3)
    startPractice(learner).moment().record(addQuestion(3), true, { choices: 1 })
    expect(learner.skills.add).toBe(3)
  })
})

describe('safety net', () => {
  test('one bad moment can only cost a little', () => {
    const learner = learnerAt(5, 0) // brand new: ratings move fastest
    const moment = startPractice(learner).moment()
    for (let i = 0; i < 20; i++) moment.check(addQuestion(6), -1)
    expect(learner.skills.add).toBeGreaterThanOrEqual(5 - MAX_JUNCTION_DROP - 1e-9)
  })

  test('each new moment gets its own safety net', () => {
    const learner = learnerAt(5, 0)
    const practice = startPractice(learner)
    for (let m = 0; m < 3; m++) {
      const moment = practice.moment()
      for (let i = 0; i < 10; i++) moment.check(addQuestion(6), -1)
    }
    expect(learner.skills.add).toBeLessThan(5 - MAX_JUNCTION_DROP)
  })
})

describe('questions', () => {
  test('ask() gives an unlocked skill near the player level, never the same twice in a row', () => {
    const practice = startPractice(learnerAt(4))
    const moment = practice.moment()
    let last = ''
    for (let i = 0; i < 50; i++) {
      const q = moment.ask()
      expect(['add', 'sub', 'mul']).toContain(q.problem.kind)
      if (q.problem.kind !== 'mul') expect(Math.abs(q.problem.tier - 4)).toBeLessThanOrEqual(1)
      expect(q.text).not.toBe(last)
      last = q.text
    }
  })

  test('similar() keeps the kind and difficulty but changes the numbers', () => {
    const moment = startPractice(learnerAt(4)).moment()
    const q = addQuestion(4)
    const s = moment.similar(q)
    expect(s.problem.kind).toBe('add')
    expect(s.problem.tier).toBe(4)
    expect(s.text).not.toBe(q.text)
  })

  test('options() puts the answer where asked, among distinct wrong answers', () => {
    for (let i = 0; i < 30; i++) {
      const q = addQuestion(3)
      const opts = q.options(3, 1)
      expect(opts[1]).toBe(q.answer)
      expect(new Set(opts).size).toBe(3)
      expect(opts.filter((v) => v === q.answer)).toHaveLength(1)
    }
  })
})

test('grew() names skills that levelled up during the practice', () => {
  const learner = learnerAt(2.9)
  const practice = startPractice(learner)
  expect(practice.grew()).toEqual([])
  learner.skills.add = 3.6
  expect(practice.grew()).toEqual(['Adding up to 100']) // level 4
})
