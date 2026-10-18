import { afterEach, describe, expect, test, vi } from 'vitest'
import { itemGrade } from '../ixl/placement'
import { SUBJECTS } from '../subjects'
import { Learner, PLACING_ANSWERS } from './learner'
import { startPractice } from './practice'
import { FOCUS_QUESTIONS, FOCUS_SIZE, harderLevel, pickItem } from './scheduler'

/**
 * The scheduler's own rules, one at a time: frontier topics, round focus, stretch, mastered skills.
 * The whole-round behaviour (does the difficulty keep up with the kid?) is in ipush.test.ts.
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

/** A learner who has already finished placing in math at `grade`, with optional saved ratings for skills. */
function placedAt(grade: number, ratings: Record<string, number> = {}, seen: Record<string, number> = {}) {
  const state = {
    v: 2,
    ratings,
    seen,
    fast: {},
    facts: {},
    last: {},
    calibrated: Object.fromEntries(Object.keys(ratings).map((id) => [id, true])),
    placement: { math: { g: grade, n: PLACING_ANSWERS } },
  }
  const l = new Learner('s', state as never, { grade })
  vi.spyOn(l, 'save').mockImplementation(() => {})
  return l
}

describe('frontier topics', () => {
  test('a brand-new topic is one step past the spot, never seen before, and never comes up while placing', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(7))
    const l = new Learner('s', null, { grade: 1 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    let frontier = 0
    for (let round = 0; round < 25; round++) {
      for (let i = 0; i < 10; i++) {
        const placing = l.isPlacing('math')
        const spot = l.placement('math').grade
        const m = practice.moment()
        const q = m.ask()
        if (q.item.frontier) {
          frontier++
          const id = q.item.skill
          expect(placing, id).toBe(false)
          expect(l.seen(id), id).toBe(0)
          expect(l.isUnlocked(id), id).toBe(true)
          const g = itemGrade(id, q.item.level)!
          expect(g, id).toBeGreaterThanOrEqual(spot + 0.3 - 1e-9)
          expect(g, id).toBeLessThanOrEqual(spot + 1 + 1e-9)
        }
        m.record(q, Math.random() < 0.7, { choices: 3 })
      }
    }
    expect(frontier).toBeGreaterThan(0)
  })
})

describe('round focus', () => {
  test('after placing, each block of fresh questions in a subject uses at most a few skills', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(23))
    const l = placedAt(3)
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    let block: string[] = []
    let blocks = 0
    for (let i = 0; i < 200; i++) {
      const m = practice.moment()
      const q = m.ask()
      const review = l.dueFacts(q.item.skill).some((f) => f.key === q.item.key)
      if (!q.item.frontier && !review) {
        block.push(q.item.skill)
        if (block.length === FOCUS_QUESTIONS) {
          expect(new Set(block).size).toBeLessThanOrEqual(FOCUS_SIZE)
          blocks++
          block = []
        }
      }
      m.record(q, Math.random() < 0.8, { choices: 3 })
    }
    expect(blocks).toBeGreaterThan(5)
  })

  test('a fresh focus is chosen again after the subject has had its questions', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(5))
    const l = placedAt(3)
    const focus = {}
    const seenSkills = new Set<string>()
    for (let i = 0; i < 80; i++) {
      const it = pickItem(l, { subjects: ['math'], formats: ['choice'], audio: true }, [], focus)
      seenSkills.add(it.skill)
      l.score(it, 1)
    }
    // Over 80 questions the round has moved on to several different sets of skills, not one forever.
    expect(seenSkills.size).toBeGreaterThan(FOCUS_SIZE)
  })
})

describe('stretch', () => {
  test('a harder question is at least a grade-step above the base level when the skill has one', () => {
    for (const s of SUBJECTS) {
      for (const k of s.skills) {
        const id = `${s.id}.${k.id}`
        for (let base = 1; base < k.maxLevel; base++) {
          const up = harderLevel(id, k, base)
          expect(up, `${id} base ${base}`).toBeGreaterThan(base)
          const g0 = itemGrade(id, base)
          if (g0 === undefined) continue
          const someLevelIsHarder = Array.from({ length: k.maxLevel - base }, (_, i) => itemGrade(id, base + 1 + i)! >= g0 + 0.15 - 1e-9).some(Boolean)
          if (someLevelIsHarder) expect(itemGrade(id, up)!, `${id} base ${base}`).toBeGreaterThanOrEqual(g0 + 0.15 - 1e-9)
          else expect(up, `${id} base ${base}`).toBe(base + 1)
        }
      }
    }
  })
})

describe('mastered skills', () => {
  test('a skill at its top level is picked only rarely, unless a missed fact in it is due', () => {
    const count = (ratings: Record<string, number>) => {
      vi.spyOn(Math, 'random').mockImplementation(seeded(31))
      const l = placedAt(3, ratings, { 'math.add': 50, 'math.sub': 50 })
      let add = 0
      const N = 400
      for (let i = 0; i < N; i++) {
        const it = pickItem(l, { subjects: ['math'], skills: ['math.add', 'math.sub'], formats: ['choice'], audio: true }, [])
        if (it.skill === 'math.add') add++
      }
      return add / N
    }
    const mastered = count({ 'math.add': 13, 'math.sub': 4 })
    const learning = count({ 'math.add': 4, 'math.sub': 4 })
    expect(mastered).toBeLessThan(0.15)
    expect(learning).toBeGreaterThan(0.3)
  })
})

describe('another go at a new topic', () => {
  test('similar() to a frontier question is still frontier, and missing it leaves placement alone', () => {
    const l = new Learner('t', null, { grade: 2 })
    vi.spyOn(l, 'save').mockImplementation(() => {})
    const practice = startPractice({ learner: l, subjects: ['math'], formats: ['choice'], audio: true })
    // Get past placing with answers at their level, then wait for a new topic.
    let checked = false
    for (let i = 0; i < PLACING_ANSWERS + 200 && !checked; i++) {
      const m = practice.moment()
      const q = m.ask()
      if (!q.item.frontier) {
        m.record(q, (itemGrade(q.item.skill, q.item.level) ?? 0) <= 2.2, { choices: 3 })
        continue
      }
      m.record(q, false, { choices: 3 }) // missed the new topic...
      const again = m.similar(q) // ...so the game asks one like it (Mouse Maze's trap, Bubble Pop's retry)
      expect(again.item.frontier).toBe(true)
      expect(again.item.skill).toBe(q.item.skill)
      const before = l.placement('math').grade
      m.record(again, false, { choices: 3 })
      expect(l.placement('math').grade).toBeGreaterThanOrEqual(before - 1e-9)
      checked = true
    }
    expect(checked, 'a new topic came up').toBe(true)
  })
})
