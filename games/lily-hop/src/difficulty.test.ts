import { ixlGradeFor, Learner } from '@arcade/learning'
import { describe, expect, test } from 'vitest'
import { pondFor } from './difficulty'

// A learner who has practiced math enough to be placed, with these skill levels.
function learnerWith(levels: Record<string, number>) {
  const l = new Learner('test', null, {})
  const state = (l as unknown as { state: { ratings: Record<string, number>; seen: Record<string, number>; calibrated: Record<string, boolean> } }).state
  for (const [skill, level] of Object.entries(levels)) {
    state.ratings[`math.${skill}`] = level
    state.seen[`math.${skill}`] = 20
    state.calibrated[`math.${skill}`] = true
  }
  return l
}

describe('Lily Hop gets harder as the learner is placed higher', () => {
  test('the pond gets longer and the gator starts swimming on its own', () => {
    const ponds = [0, 1, 2, 3, 4, 5].map(pondFor)
    for (let g = 1; g < ponds.length; g++) expect(ponds[g]!.pads).toBeGreaterThanOrEqual(ponds[g - 1]!.pads)
    expect(pondFor(0).gatorEvery).toBe(0) // gentle: the gator only moves when you miss
    expect(pondFor(2).gatorEvery).toBeGreaterThan(0)
    expect(pondFor(4).gatorEvery).toBeLessThan(pondFor(2).gatorEvery)
  })

  test('from placed skill levels to IXL grade to a harder pond', () => {
    const kinder = learnerWith({ add: 1, sub: 1, count: 3 }) // counting and adding to 10
    const second = learnerWith({ add: 4, sub: 4, place: 3 }) // two-digit and three-digit math
    const fourth = learnerWith({ mul: 11, div: 11, add: 9 }) // big multiplication and division
    const grades = [kinder, second, fourth].map((l) => Math.round(ixlGradeFor(l, 'math')!))
    expect(grades[0]!).toBeLessThan(grades[1]!)
    expect(grades[1]!).toBeLessThan(grades[2]!)
    const pads = grades.map((g) => pondFor(g).pads)
    expect(pads[0]!).toBeLessThan(pads[2]!)
  })

  test('someone who has not been placed yet gets the gentlest pond', () => {
    expect(ixlGradeFor(new Learner('new', null, {}), 'math')).toBeUndefined()
  })
})
