import { afterEach, describe, expect, test, vi } from 'vitest'
import { findSkill } from '../subjects'
import { Learner } from './learner'
import { Question, startPractice } from './practice'
import { LOOK_FIRST, SLOW_DOWN_WAITS, SmashGuard } from './smash'

afterEach(() => vi.restoreAllMocks())

// Times in ms. The question is shown at `asked`; each pick says how long after.
const s = (seconds: number) => seconds * 1000

describe('spotting answer-mashing', () => {
  test('a fast RIGHT answer never has to wait', () => {
    const g = new SmashGuard()
    expect(g.pick(true, 0, s(0.2))).toBe(0)
  })

  test('a wrong answer after reading is fine', () => {
    const g = new SmashGuard()
    expect(g.pick(false, 0, s(LOOK_FIRST + 1))).toBe(0)
  })

  test('a wrong tap faster than reading has to wait, and the wait grows', () => {
    const g = new SmashGuard()
    let asked = 0
    const waits = []
    for (let i = 0; i < 4; i++) {
      waits.push(g.pick(false, asked, asked + s(0.3)))
      asked += s(10) // the next question
    }
    expect(waits).toEqual([SLOW_DOWN_WAITS[0], SLOW_DOWN_WAITS[1], SLOW_DOWN_WAITS[2], SLOW_DOWN_WAITS[2]])
  })

  test('quick wrong re-picks on the same question count as mashing', () => {
    const g = new SmashGuard()
    expect(g.pick(false, 0, s(3))).toBe(0) // read it, guessed wrong: fine
    expect(g.pick(false, 0, s(3.3))).toBe(SLOW_DOWN_WAITS[0]) // then tapped the next one right away
  })

  test('a careful first-try right answer resets the wait', () => {
    const g = new SmashGuard()
    g.pick(false, 0, s(0.3))
    g.pick(false, s(10), s(10.3))
    expect(g.pick(true, s(20), s(23))).toBe(0)
    expect(g.pick(false, s(30), s(30.3))).toBe(SLOW_DOWN_WAITS[0])
  })

  test('getting it right after a mash, or a lucky fast tap, does not reset it', () => {
    const g = new SmashGuard()
    g.pick(false, 0, s(0.3))
    g.pick(true, 0, s(5)) // right after the wait: not a fresh, careful try
    g.pick(true, s(10), s(10.2)) // too fast to have read it
    expect(g.pick(false, s(20), s(20.3))).toBe(SLOW_DOWN_WAITS[1])
  })
})

describe('practice.slowDown()', () => {
  test('moment.check feeds the guard, retries included', () => {
    const l = new Learner('test', null, {})
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const practice = startPractice({ learner: l, audio: true })
    const moment = practice.moment()
    const skill = findSkill('math.add')!
    const spec = skill.generate(1)
    const q = new Question({ ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: 'math.add', level: 1 })
    const [wrong] = q.item.wrong(1)
    const now = performance.now()
    q.askedAt = now
    vi.spyOn(performance, 'now').mockReturnValue(now + 200)
    expect(moment.check(q, wrong!, { choices: 3 })).toBe(false)
    expect(practice.slowDown()).toBe(SLOW_DOWN_WAITS[0])
    expect(moment.slowDown()).toBe(SLOW_DOWN_WAITS[0])
    expect(moment.check(q, q.answer, { choices: 2 })).toBe(true)
    expect(practice.slowDown()).toBe(0)
  })
})
