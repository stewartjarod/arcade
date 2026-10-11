import { describe, expect, test } from 'vitest'
import { cageQuestionsFor, corridorFor, hintSecondsFor, junctionsFor, nudgeSecondsFor, styleFor, trapChanceFor } from './difficulty'

// Kindergarten through grade 5, and a spread of mazes won (the maze grows and the traps creep up with wins).
const GRADES = [0, 1, 2, 3, 4, 5]
const WINS = [0, 3, 6, 9, 12, 30, 100]

describe('how many door questions a maze has', () => {
  test('caps by grade, from 8 at kindergarten up to 12', () => {
    expect(GRADES.map((g) => junctionsFor(g, 100))).toEqual([8, 9, 10, 11, 12, 12])
  })

  test('the first maze is already a proper adventure: 5 questions at kindergarten, one more for each grade', () => {
    expect(GRADES.map((g) => junctionsFor(g, 0))).toEqual([5, 6, 7, 8, 9, 10])
  })

  test('never gets shorter as the grade goes up', () => {
    for (const w of WINS) {
      for (let i = 1; i < GRADES.length; i++) expect(junctionsFor(GRADES[i]!, w)).toBeGreaterThanOrEqual(junctionsFor(GRADES[i - 1]!, w))
    }
  })

  test('grows with mazes won, until the cap', () => {
    for (const g of GRADES) expect(junctionsFor(g, 3)).toBeGreaterThan(junctionsFor(g, 0))
    for (const g of GRADES) for (const w of WINS) expect(junctionsFor(g, w)).toBeGreaterThanOrEqual(junctionsFor(g, 0))
  })
})

describe('how often a wrong door is a trap', () => {
  test('cozy players (K and 1) never get traps', () => {
    for (const g of [0, 1]) for (const w of WINS) expect(trapChanceFor(g, w)).toBe(0)
  })

  test('explorers start gentler than speedy players, and stay under their caps', () => {
    expect(trapChanceFor(2, 0)).toBeCloseTo(0.2)
    expect(trapChanceFor(3, 0)).toBeCloseTo(0.3)
    expect(trapChanceFor(2, 100)).toBeCloseTo(0.35)
    expect(trapChanceFor(3, 100)).toBeCloseTo(0.4)
    expect(trapChanceFor(4, 0)).toBeCloseTo(0.3)
    expect(trapChanceFor(4, 100)).toBeCloseTo(0.5)
    expect(trapChanceFor(5, 100)).toBeCloseTo(0.5)
  })

  test('grows a little with mazes won, and never gets lower as the grade goes up', () => {
    for (const g of [2, 3, 4, 5]) expect(trapChanceFor(g, 6)).toBeGreaterThan(trapChanceFor(g, 0))
    for (const w of WINS) {
      for (let i = 1; i < GRADES.length; i++) expect(trapChanceFor(GRADES[i]!, w)).toBeGreaterThanOrEqual(trapChanceFor(GRADES[i - 1]!, w))
    }
  })

  test('every chance is a probability between 0 and 1', () => {
    for (const g of GRADES) for (const w of WINS) expect(trapChanceFor(g, w)).toBeLessThanOrEqual(1)
    for (const g of GRADES) for (const w of WINS) expect(trapChanceFor(g, w)).toBeGreaterThanOrEqual(0)
  })
})

describe('trap cages', () => {
  test('cozy: no cage; grade 2: one question to escape; grade 3 and up: two', () => {
    expect(GRADES.map(cageQuestionsFor)).toEqual([0, 0, 1, 2, 2, 2])
  })
})

describe('idle help while a door question waits', () => {
  test('the doors wiggle (and the question is read once more) after 12 seconds for cozy players and 20 for everyone else', () => {
    expect([0, 1].map(nudgeSecondsFor)).toEqual([12, 12])
    expect([2, 3, 4, 5].map(nudgeSecondsFor)).toEqual([20, 20, 20, 20])
  })

  test('only cozy players get a hint, after 16 seconds, which comes after the first nudge', () => {
    expect([0, 1].map(hintSecondsFor)).toEqual([16, 16])
    expect([2, 3, 4, 5].map(hintSecondsFor)).toEqual([0, 0, 0, 0])
    expect(hintSecondsFor(0)).toBeGreaterThan(nudgeSecondsFor(0))
  })
})

describe('corridors', () => {
  const realm = { runs: [1, 2] as [number, number], len: [2, 3] as [number, number] }

  test('everyone gets long, winding corridors, grander than the realm settings', () => {
    for (const g of GRADES) {
      const c = corridorFor(g, realm)
      expect(c.runs[0]).toBeGreaterThanOrEqual(1)
      expect(c.runs[1]).toBeGreaterThanOrEqual(3)
      expect(c.len[0]).toBeGreaterThanOrEqual(3)
      expect(c.len[1]).toBeGreaterThan(realm.len[1])
    }
  })

  test('a realm that already has long corridors is never made shorter', () => {
    const long = { runs: [2, 3] as [number, number], len: [3, 4] as [number, number] }
    const c = corridorFor(0, long)
    expect(c.runs[1]).toBeGreaterThanOrEqual(3)
    expect(c.len[0]).toBeGreaterThanOrEqual(3)
    expect(c.len[1]).toBeGreaterThanOrEqual(4)
  })

  test('the styles match the grades in the ramp doc', () => {
    expect(GRADES.map(styleFor)).toEqual(['cozy', 'cozy', 'explorer', 'explorer', 'speedy', 'speedy'])
  })
})
