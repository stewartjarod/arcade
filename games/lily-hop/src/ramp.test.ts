import { describe, expect, test } from 'vitest'
import { settingsFor } from '../../bubble-pop/src/difficulty'
import { junctionsFor } from '../../mouse-maze-math/src/difficulty'
import { pondFor } from './difficulty'

// How every game gets harder with the IXL grade (the table is in docs/difficulty-ramp.md); this keeps it from silently breaking.
const GRADES = [0, 1, 2, 3, 4, 5]

describe('every game ramps up with the IXL grade', () => {
  test('Mouse Maze: more door questions; Lily Hop: longer pond, sneakier gator; Bubble Pop: more bubbles, faster fall', () => {
    const maze = GRADES.map((g) => junctionsFor(g, 0))
    const pond = GRADES.map(pondFor)
    const bubbles = GRADES.map(settingsFor)
    for (let i = 1; i < GRADES.length; i++) {
      expect(maze[i]!).toBeGreaterThanOrEqual(maze[i - 1]!)
      expect(pond[i]!.pads).toBeGreaterThanOrEqual(pond[i - 1]!.pads)
      expect(bubbles[i]!.bubbles).toBeGreaterThanOrEqual(bubbles[i - 1]!.bubbles)
      expect(bubbles[i]!.fallSeconds).toBeLessThanOrEqual(bubbles[i - 1]!.fallSeconds)
    }
    // ...and the top grade is clearly harder than kindergarten in every game.
    expect(maze[5]!).toBeGreaterThan(maze[0]!)
    expect(pond[5]!.pads).toBeGreaterThan(pond[0]!.pads)
    expect(bubbles[5]!.bubbles).toBeGreaterThan(bubbles[0]!.bubbles)
    expect(bubbles[5]!.fallSeconds).toBeLessThan(bubbles[0]!.fallSeconds)
  })
})

import { quickSecondsFor, styleFor, trapChanceFor } from '../../mouse-maze-math/src/difficulty'

describe('Mouse Maze plays differently by grade, not just longer', () => {
  test('cozy for K–1 (no traps), explorer for 2–3 (traps), speedy for 4–5 (traps and a quick bonus)', () => {
    expect([0, 1, 2, 3, 4, 5].map(styleFor)).toEqual(['cozy', 'cozy', 'explorer', 'explorer', 'speedy', 'speedy'])
    for (const g of [0, 1]) expect(trapChanceFor(g, 20)).toBe(0)
    for (const g of [2, 3, 4, 5]) expect(trapChanceFor(g, 0)).toBeGreaterThan(0)
    expect(quickSecondsFor(3)).toBe(0)
    expect(quickSecondsFor(4)).toBeGreaterThan(0)
  })
})
