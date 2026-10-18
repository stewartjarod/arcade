import { describe, expect, test } from 'vitest'
import { startLevel } from '../ixl/placement'
import type { Item } from './types'
import { Learner, PLACING_ANSWERS } from './learner'

/**
 * The placement floor and the damped placement, from the learner's side. The whole-round behaviour is in
 * ipush.test.ts; these are the small rules one answer at a time.
 */

/** A simple addition question at a level. `frontier` marks a brand-new topic. */
const item = (level: number, extra: Partial<Item> = {}): Item => ({
  skill: 'math.add',
  level,
  key: `add-${level}`,
  prompt: { text: '2 + 2' },
  answer: '4',
  formats: ['choice'],
  wrong: () => ['3', '5'],
  ...extra,
})

/** A learner whose saved state is set by hand (like a save from an older version of the app). */
function withState(grade: number | undefined, state: Record<string, unknown>) {
  const base = {
    v: 2,
    ratings: {},
    seen: {},
    fast: {},
    facts: {},
    last: {},
    calibrated: {},
    placement: {},
  }
  return new Learner('test', { ...base, ...state } as never, { grade })
}

/** Internal state, for setting up a placement the way a round of answers would. */
const stateOf = (l: Learner) => (l as unknown as { state: { ratings: Record<string, number>; placement: Record<string, { g: number; n: number; s?: number }> } }).state

describe('placement floor', () => {
  test('a saved level above the floor is kept as it is', () => {
    const l = withState(2, { ratings: { 'math.add': 4.2 }, seen: { 'math.add': 30 }, calibrated: { 'math.add': true } })
    expect(startLevel('math.add', 2) - 0.5).toBeLessThan(4.2)
    expect(l.rating('math.add')).toBe(4.2)
  })

  test('a skill tried early rises when the placement rises', () => {
    const l = withState(1, { ratings: { 'math.add': 1.2 }, seen: { 'math.add': 5 }, calibrated: { 'math.add': true } })
    const before = l.rating('math.add')
    stateOf(l).placement.math = { g: 3, n: 30 }
    expect(l.rating('math.add')).toBeGreaterThan(before)
    expect(l.rating('math.add')).toBe(Math.max(1.2, startLevel('math.add', 3) - 0.5))
  })

  test('the floor never drags a saved level down, and never goes below level 1', () => {
    const l = withState(4, { ratings: { 'math.add': 2 }, seen: { 'math.add': 5 }, calibrated: { 'math.add': true } })
    stateOf(l).placement.math = { g: 0, n: 30 }
    expect(l.rating('math.add')).toBe(2)
  })

  test('a right answer on a floored skill starts from the floor', () => {
    const l = withState(3, { ratings: { 'math.add': 1.2 }, seen: { 'math.add': 30 }, calibrated: { 'math.add': true } })
    const floor = l.rating('math.add')
    expect(floor).toBeGreaterThan(1.2)
    l.score(item(Math.round(floor)), 1, 0)
    expect(stateOf(l).ratings['math.add']).toBeGreaterThanOrEqual(floor)
  })

  test('an old save loads with the same rating for skills above the floor', () => {
    const old = withState(2, {
      ratings: { 'math.add': 4.2, 'math.sub': 3.1 },
      seen: { 'math.add': 30, 'math.sub': 12 },
      calibrated: { 'math.add': true, 'math.sub': true },
    })
    expect(old.rating('math.add')).toBe(4.2)
    expect(old.rating('math.sub')).toBe(Math.max(3.1, startLevel('math.sub', 2) - 0.5))
  })
})

describe('placement after placing', () => {
  test('one surprising answer moves a settled placement only a little', () => {
    const l = withState(2, { placement: { math: { g: 2, n: PLACING_ANSWERS + 10 } } })
    l.score(item(8), 0, 0)
    const moved = Math.abs(stateOf(l).placement.math!.g - 2)
    expect(moved).toBeGreaterThan(0)
    expect(moved).toBeLessThanOrEqual(0.1 + 1e-9)
  })

  test('while still placing, a surprising answer can move it more', () => {
    const l = withState(2, { placement: { math: { g: 2, n: 0 } } })
    l.score(item(8), 0, 0)
    expect(Math.abs(stateOf(l).placement.math!.g - 2)).toBeGreaterThan(0.1)
  })
})

describe('new topics (frontier)', () => {
  test('a miss on a new topic leaves the placement alone', () => {
    const l = withState(2, {})
    l.score(item(4, { frontier: true }), 0, 1 / 3)
    expect(l.placement('math').grade).toBe(2)
    expect(l.placement('math').answers).toBe(0)
  })

  test('a miss on a new topic still settles that skill below where it was asked', () => {
    const l = withState(2, {})
    l.score(item(4, { frontier: true }), 0, 1 / 3)
    expect(stateOf(l).ratings['math.add']).toBeLessThan(l.rating('math.add') + 1)
    expect(l.isCalibrating('math.add')).toBe(false)
  })

  test('a miss on an ordinary question still moves the placement', () => {
    const l = withState(2, {})
    l.score(item(4), 0, 1 / 3)
    expect(l.placement('math').grade).not.toBe(2)
  })

  test('a right answer on a new topic counts normally', () => {
    const l = withState(2, {})
    l.score(item(4, { frontier: true }), 1, 1 / 3)
    expect(l.placement('math').grade).toBeGreaterThan(2)
  })
})
