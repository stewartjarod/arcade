import { describe, expect, it } from 'vitest'
import { LANDS } from './lands'
import { MAX_EXTRA_GATES, afterGate, landFor, mapDone, newMap, unlockedLands, wardrobe } from './quest'

describe('candy quest rules', () => {
  it('gives older kids a longer map, never more pieces than a land has landmarks', () => {
    expect(landFor(0).pieces).toBeLessThan(landFor(5).pieces)
    for (let g = 0; g <= 5; g++) for (const land of LANDS) expect(land.landmarks.length).toBeGreaterThanOrEqual(landFor(g).pieces)
  })

  it('a spelled word wins a piece; a missed one adds a gate, but only a couple of times', () => {
    const map = newMap(3)
    expect(afterGate(map, true)).toEqual({ piece: true, helped: false })
    for (let i = 0; i < MAX_EXTRA_GATES; i++) expect(afterGate(map, false).piece).toBe(false)
    expect(afterGate(map, false)).toEqual({ piece: true, helped: true }) // no more extra gates
    expect(mapDone(map)).toBe(false)
    afterGate(map, true)
    expect(mapDone(map)).toBe(true)
  })

  it('so a land always ends: at most pieces + MAX_EXTRA_GATES gates even if every word is missed', () => {
    const map = newMap(4)
    let gates = 0
    while (!mapDone(map)) {
      afterGate(map, false)
      gates++
    }
    expect(gates).toBe(4 + MAX_EXTRA_GATES)
  })

  it('unlocks one land at a time and hands out each reward once', () => {
    expect(unlockedLands(0)).toBe(1)
    expect(unlockedLands(99)).toBe(LANDS.length)
    expect(wardrobe(0)).toEqual({ colors: [{ color: '#f783ac', name: 'Bubblegum' }], hats: ['none'] })
    const all = wardrobe(LANDS.length)
    expect(all.colors.length + all.hats.length).toBe(LANDS.length + 2)
    expect(all.hats).toContain('crown')
  })

  it('story text never uses the real kids as characters', () => {
    const text = JSON.stringify(LANDS)
    expect(text).not.toMatch(/\b(Ima|Millie)\b/i)
  })
})
