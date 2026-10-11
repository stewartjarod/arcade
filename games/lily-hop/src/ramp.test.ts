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

import { migrateRealmIndex, REALMS, realmForDepth } from '../../mouse-maze-math/src/realms'

describe('Mouse Maze realms', () => {
  test('realms are in order of when they unlock, and every depth maps to one', () => {
    for (let i = 1; i < REALMS.length; i++) expect(REALMS[i]!.from).toBeGreaterThan(REALMS[i - 1]!.from)
    expect(REALMS[realmForDepth(0)]!.id).toBe('cupboard')
    expect(REALMS[realmForDepth(1.5)]!.id).toBe('candy') // a first early reward for young players
    expect(REALMS[realmForDepth(4)]!.id).toBe('frozen')
  })
  test('saves from before the new realms keep pointing at the same realm', () => {
    // old list: cupboard, garden, cellar, crystal, clockwork, star
    expect(['cupboard', 'garden', 'cellar', 'crystal', 'clockwork', 'star'].map((id, old) => REALMS[migrateRealmIndex(old)]!.id)).toEqual(['cupboard', 'garden', 'cellar', 'crystal', 'clockwork', 'star'])
    expect(migrateRealmIndex(-1)).toBe(-1)
  })
})

import { heartsMatter, quickPopSeconds } from '../../bubble-pop/src/difficulty'
import { gatorHunts, superHopSeconds } from './difficulty'
import { playStyleFor } from '@arcade/learning'

describe('Bubble Pop and Lily Hop play differently by grade', () => {
  test('cozy K–1: nothing can be lost; explorer 2–3: real stakes; speedy 4–5: a bonus for answering fast', () => {
    const styles = [0, 1, 2, 3, 4, 5].map(playStyleFor)
    expect(styles).toEqual(['cozy', 'cozy', 'explorer', 'explorer', 'speedy', 'speedy'])
    expect([heartsMatter('cozy'), heartsMatter('explorer'), heartsMatter('speedy')]).toEqual([false, true, true])
    expect([gatorHunts('cozy'), gatorHunts('explorer'), gatorHunts('speedy')]).toEqual([false, true, true])
    expect([quickPopSeconds('cozy'), quickPopSeconds('explorer')]).toEqual([0, 0])
    expect(quickPopSeconds('speedy')).toBeGreaterThan(0)
    expect([superHopSeconds('cozy'), superHopSeconds('explorer')]).toEqual([0, 0])
    expect(superHopSeconds('speedy')).toBeGreaterThan(0)
  })
})

import { quickSeconds, startingChoices } from '../../rocket-tour/src/difficulty'

describe('Rocket Tour plays differently by grade', () => {
  test('cozy: two choices; explorer: three; speedy: three plus quick-answer stardust', () => {
    expect([startingChoices('cozy'), startingChoices('explorer'), startingChoices('speedy')]).toEqual([2, 3, 3])
    expect([quickSeconds('cozy'), quickSeconds('explorer')]).toEqual([0, 0])
    expect(quickSeconds('speedy')).toBeGreaterThan(0)
  })
})
