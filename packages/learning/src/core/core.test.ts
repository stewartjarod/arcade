import { afterEach, describe, expect, test, vi } from 'vitest'
import { findSkill } from '../subjects'
import { Learner, MAX_MOMENT_DROP } from './learner'
import { Question, startPractice } from './practice'
import { pickItem } from './scheduler'
import { skillSummary, subjectGrowth, subjectSummary } from './summary'
import type { Item } from './types'

// A learner not tied to storage or saved players.
const fresh = (profile: { grade?: number; focus?: string } = {}) => new Learner('test', null, profile)

/** A learner at a chosen addition level with warm-up done (ratings settle). */
function learnerAt(add: number, seen = 50) {
  const l = fresh()
  const state = (l as unknown as { state: { ratings: Record<string, number>; seen: Record<string, number> } }).state
  state.ratings['math.add'] = add
  state.ratings['math.sub'] = add
  state.seen['math.add'] = seen
  vi.spyOn(l, 'save').mockImplementation(() => {})
  return l
}

const itemAt = (id: string, level: number): Item => {
  const skill = findSkill(id)!
  const spec = skill.generate(level)
  return { ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: id, level }
}
const addQuestion = (level: number) => new Question(itemAt('math.add', level))
const moment = (l: Learner) => startPractice({ learner: l, audio: true }).moment()

function answerAfter(ms: number) {
  const now = performance.now()
  vi.spyOn(performance, 'now').mockReturnValue(now + ms)
}

afterEach(() => vi.restoreAllMocks())

describe('fair scoring', () => {
  test('check says whether the answer was right and saves the profile', () => {
    const l = learnerAt(3)
    const m = moment(l)
    const q = addQuestion(3)
    expect(m.check(q, q.answer)).toBe(true)
    expect(l.save).toHaveBeenCalledOnce()
    expect(m.check(addQuestion(3), -1)).toBe(false)
  })

  test('only the first answer to a question counts', () => {
    const l = learnerAt(3)
    const m = moment(l)
    const q = addQuestion(3)
    m.check(q, -1)
    const afterFirst = l.rating('math.add')
    expect(m.check(q, q.answer)).toBe(true) // still tells you it's right...
    expect(l.rating('math.add')).toBe(afterFirst) // ...but doesn't count it
  })

  test('a quick right answer counts more than a slow one; slow is never a penalty', () => {
    const fast = learnerAt(3)
    const slow = learnerAt(3)
    const qf = addQuestion(3)
    const qs = addQuestion(3)
    answerAfter(500)
    moment(fast).check(qf, qf.answer)
    vi.mocked(performance.now).mockRestore()
    answerAfter(60_000)
    moment(slow).check(qs, qs.answer)
    expect(fast.rating('math.add')).toBeGreaterThan(slow.rating('math.add'))
    expect(slow.rating('math.add')).toBeGreaterThanOrEqual(3)
  })

  test('only the first question of a moment gets the speed bonus', () => {
    const a = learnerAt(3)
    const b = learnerAt(3)
    const [qa, miss, qb] = [addQuestion(3), addQuestion(3), addQuestion(3)]
    answerAfter(500)
    moment(a).check(qa, qa.answer)
    const mb = moment(b)
    mb.check(miss, -1)
    const before = b.rating('math.add')
    mb.check(qb, qb.answer)
    expect(b.rating('math.add') - before).toBeLessThan(a.rating('math.add') - 3)
  })

  test('picking from choices counts for less than typing the answer', () => {
    const typed = learnerAt(3)
    const picked = learnerAt(3)
    const [qt, qp] = [addQuestion(3), addQuestion(3)]
    answerAfter(60_000) // no speed bonus, to compare fairly
    moment(typed).record(qt, true)
    moment(picked).record(qp, true, { choices: 3 })
    expect(typed.rating('math.add')).toBeGreaterThan(picked.rating('math.add'))
  })

  test('a wrong pick among few choices costs more than among many', () => {
    const few = learnerAt(3)
    const many = learnerAt(3)
    moment(few).record(addQuestion(3), false, { choices: 2 })
    moment(many).record(addQuestion(3), false, { choices: 5 })
    expect(few.rating('math.add')).toBeLessThan(many.rating('math.add'))
  })

  test('the last remaining choice is a free pick and changes nothing', () => {
    const l = learnerAt(3)
    moment(l).record(addQuestion(3), true, { choices: 1 })
    expect(l.rating('math.add')).toBe(3)
  })

  test('partial credit moves a rating less than full credit', () => {
    const full = fresh()
    const half = fresh()
    const it = itemAt('writing.spell', 3)
    full.score(it, 1)
    half.score(it, 0.5)
    expect(full.rating('writing.spell')).toBeGreaterThan(half.rating('writing.spell'))
  })
})

describe('safety net', () => {
  test('one bad moment can only cost a little', () => {
    const l = learnerAt(5, 0) // brand new: ratings move fastest
    const m = moment(l)
    for (let i = 0; i < 20; i++) m.check(addQuestion(6), -1)
    expect(l.rating('math.add')).toBeGreaterThanOrEqual(5 - MAX_MOMENT_DROP - 1e-9)
  })

  test('each new moment gets its own safety net', () => {
    const l = learnerAt(5, 0)
    const p = startPractice({ learner: l })
    for (let k = 0; k < 3; k++) {
      const m = p.moment()
      for (let i = 0; i < 10; i++) m.check(addQuestion(6), -1)
    }
    expect(l.rating('math.add')).toBeLessThan(5 - MAX_MOMENT_DROP)
  })

  test('ratings never pass one above the top level', () => {
    const l = fresh()
    for (let i = 0; i < 200; i++) l.score(itemAt('space.planets', 4), 1.2)
    expect(l.rating('space.planets')).toBeLessThanOrEqual(findSkill('space.planets')!.maxLevel + 1)
  })
})

describe('starting from zero, then finding their level', () => {
  test('everyone starts every skill at level 1, whatever their grade', () => {
    expect(fresh().rating('math.add')).toBe(1)
    expect(fresh({ grade: 2 }).rating('math.add')).toBe(1)
    expect(fresh({ grade: 2 }).rating('reading.words')).toBe(1)
    expect(fresh({ grade: 2 }).isUnlocked('math.mul')).toBe(false) // unlocks by growing, not by grade
  })

  test('a strong kid climbs a level per right answer while calibrating', () => {
    const l = fresh()
    // Millie knows adding to 100: right, right, right at each new level...
    for (let i = 0; i < 3; i++) l.score(itemAt('math.add', Math.round(l.rating('math.add'))), 1)
    expect(l.rating('math.add')).toBe(4)
    expect(l.isCalibrating('math.add')).toBe(true)
    // ...then misses at level 4 (adding to 100 → 200 is new): she settles just below and calibration ends.
    l.score(itemAt('math.add', 4), 0)
    expect(l.rating('math.add')).toBe(3.5)
    expect(l.isCalibrating('math.add')).toBe(false)
  })

  test('a lucky pick among choices jumps less than a typed answer', () => {
    const typed = fresh()
    const picked = fresh()
    typed.score(itemAt('space.planets', 1), 1)
    picked.score(itemAt('space.planets', 1), 1, 1 / 3)
    expect(typed.rating('space.planets')).toBe(2)
    expect(picked.rating('space.planets')).toBeCloseTo(1 + 2 / 3)
  })

  test('easy review questions during calibration do not push them up', () => {
    const l = fresh()
    l.score(itemAt('math.add', 1), 1) // → 2
    l.score(itemAt('math.add', 1), 1) // below their level: tells us nothing new
    expect(l.rating('math.add')).toBe(2)
  })

  test('calibration ends after a handful of answers even without a miss', () => {
    const l = fresh()
    for (let i = 0; i < 8; i++) l.score(itemAt('space.planets', 4), 1)
    expect(l.isCalibrating('space.planets')).toBe(false)
  })

  test('the baseline found in one game carries to every other game', () => {
    // Two different games = two different practices on the same player's learner.
    const l = fresh()
    const rocketTour = startPractice({ learner: l, subjects: ['space'], formats: ['choice'], audio: true })
    const m = rocketTour.moment()
    const q = new Question(itemAt('space.planets', 1))
    m.check(q, q.answer, { choices: 3 })
    const afterRocket = l.rating('space.planets')
    const coinHunt = startPractice({ learner: l, audio: true })
    expect(afterRocket).toBeGreaterThan(1)
    expect(coinHunt.learner.rating('space.planets')).toBe(afterRocket)
    // New questions in the other game are asked around the new level.
    for (let i = 0; i < 50; i++) {
      const it = pickItem(l, { subjects: ['space'] })
      if (it.skill === 'space.planets') expect(it.level).toBeGreaterThanOrEqual(1)
    }
  })

  test('skills unlock by growing into them', () => {
    const l = fresh()
    for (const id of ['math.add', 'math.sub']) for (let i = 0; i < 2; i++) l.score(itemAt(id, Math.round(l.rating(id))), 1)
    expect(l.rating('math.add')).toBe(3)
    expect(l.isUnlocked('math.mul')).toBe(true) // + and − reached level 3
    expect(l.rating('math.mul')).toBe(1) // and × starts from the beginning too
  })

  test('the old math-only save carries over, already calibrated', () => {
    const l = fresh()
    l.adoptLegacyMath({ skills: { add: 4.2, sub: 3.1, mul: 0, div: 0 }, stats: { seen: { add: 30, sub: 20 } } })
    expect(l.rating('math.add')).toBe(4.2)
    expect(l.seen('math.add')).toBe(30)
    expect(l.isCalibrating('math.add')).toBe(false)
    expect(l.isUnlocked('math.mul')).toBe(true)
  })
})

describe('choosing questions', () => {
  test('only unlocked skills, in the formats a game can show', () => {
    const l = fresh()
    for (let i = 0; i < 300; i++) {
      const it = pickItem(l, { formats: ['number'], audio: true })
      expect(it.formats).toContain('number')
      expect(l.isUnlocked(it.skill)).toBe(true)
    }
  })

  test('without sound, listen-only questions are skipped', () => {
    const l = fresh({ grade: 2 })
    for (let i = 0; i < 300; i++) expect(pickItem(l, { audio: false }).listen).toBeFalsy()
  })

  test('subjects can be limited', () => {
    const l = fresh({ grade: 2 })
    for (let i = 0; i < 100; i++) expect(pickItem(l, { subjects: ['space'] }).skill).toMatch(/^space\./)
  })

  test('the focus subject comes up at least half the time', () => {
    const l = fresh({ grade: 2, focus: 'reading' })
    const n = 600
    let reading = 0
    for (let i = 0; i < n; i++) if (pickItem(l, { audio: true }).skill.startsWith('reading.')) reading++
    expect(reading / n).toBeGreaterThan(0.5)
  })

  test('mostly at their level, sometimes one harder, sometimes one easier', () => {
    const l = learnerAt(4)
    const levels: Record<number, number> = {}
    for (let i = 0; i < 2000; i++) {
      const it = pickItem(l, { subjects: ['math'], formats: ['number'] })
      if (it.skill === 'math.add') levels[it.level] = (levels[it.level] ?? 0) + 1
    }
    const total = Object.values(levels).reduce((a, b) => a + b, 0)
    expect(levels[4]! / total).toBeGreaterThan(0.6)
    expect(levels[5]! / total).toBeGreaterThan(0.12)
    expect(levels[3]! / total).toBeGreaterThan(0.04)
    expect(Object.keys(levels).map(Number).every((k) => k >= 3 && k <= 5)).toBe(true)
  })

  test('never the same question twice in a row', () => {
    const m = moment(learnerAt(4))
    let last = ''
    for (let i = 0; i < 100; i++) {
      const q = m.ask()
      expect(q.item.key).not.toBe(last)
      last = q.item.key
    }
  })

  test('similar() keeps the skill and level but changes the question', () => {
    const m = moment(learnerAt(4))
    const q = addQuestion(4)
    const s = m.similar(q)
    expect(s.item.skill).toBe('math.add')
    expect(s.item.level).toBe(4)
    expect(s.item.key).not.toBe(q.item.key)
  })
})

describe('missed facts come back', () => {
  test('a miss is remembered, then fades after enough right answers', () => {
    const l = fresh()
    const it = itemAt('space.planets', 1)
    l.score(it, 0)
    expect(l.reviewCount('space')).toBe(1)
    expect(l.dueFacts('space.planets', Date.now() + 61_000)).toHaveLength(1)
    for (let i = 0; i < 5; i++) l.score(it, 1)
    expect(l.reviewCount('space')).toBe(0)
  })

  test('a due fact is asked again', () => {
    const l = fresh()
    const it = itemAt('space.planets', 1)
    l.score(it, 0)
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    let again = 0
    for (let i = 0; i < 200; i++) if (pickItem(l, { subjects: ['space'] }).key === it.key) again++
    expect(again).toBeGreaterThan(30) // ~35% of the time, plus chance
  })
})

describe('summaries', () => {
  test('grew() names skills that levelled up during the practice', () => {
    const l = learnerAt(2.9)
    const p = startPractice({ learner: l })
    expect(p.grew()).toEqual([])
    ;(l as unknown as { state: { ratings: Record<string, number> } }).state.ratings['math.add'] = 3.6
    expect(p.grew()).toContain('Adding up to 100') // level 4
  })

  test('growth counts from the very start', () => {
    const l = fresh({ grade: 2 })
    expect(subjectGrowth(l, 'math')).toBe(0)
    ;(l as unknown as { state: { ratings: Record<string, number> } }).state.ratings['math.add'] = 5
    expect(subjectGrowth(l, 'math')).toBe(4)
  })

  test('skill and subject summaries describe where a player is', () => {
    const l = fresh({ grade: 2 })
    const math = skillSummary(l, 'math')
    expect(math.find((s) => s.id === 'math.add')!.label).toBe('Adding up to 10')
    expect(math.find((s) => s.id === 'math.div')!.unlocked).toBe(false)
    const subjects = subjectSummary(l)
    expect(subjects.map((s) => s.id)).toEqual(['math', 'reading', 'writing', 'space', 'geography', 'clocks'])
    expect(subjects.every((s) => !s.started)).toBe(true)
  })
})
