import { describe, expect, it } from 'vitest'
import { LANDS } from './lands'
import {
  MAX_EXTRA_GATES, afterGate, caught, chaseAnswer, creep, eaten, escaped, landFor, mapDone, monsterWakes, newChase, newMap, unlockedLands, wardrobe, type Chase,
} from './quest'

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

/** Play a chase second by second: each question takes `seconds` to answer, after `wrongFirst` wrong picks. */
function playChase(grade: number, seconds: number, wrongFirst: number) {
  const chase: Chase = newChase()
  const { creep: rate } = landFor(grade)
  for (let t = 0; t < 200; t++) {
    creep(chase, 1, rate)
    if (caught(chase)) return 'caught'
    if ((t + 1) % seconds === 0) {
      for (let w = 0; w < wrongFirst; w++) chaseAnswer(chase, false, false)
      if (caught(chase)) return 'caught'
      chaseAnswer(chase, true, wrongFirst === 0)
      if (escaped(chase)) return 'escaped'
    }
  }
  return 'caught'
}

describe('the candy monster', () => {
  it('wakes on the second missed word, and only then', () => {
    expect([0, 1, 2, 3, 4].map(monsterWakes)).toEqual([false, false, true, false, false])
  })

  it('a slow 1st grader who knows the words gets away (about 7 seconds a question, word read aloud first)', () => {
    expect(playChase(0, 7, 0)).toBe('escaped')
  })

  it('but guessing slowly gets you caught, and doing nothing gets you caught too', () => {
    expect(playChase(0, 8, 1)).toBe('caught')
    expect(playChase(0, 999, 0)).toBe('caught')
  })

  it('older kids need to be quicker', () => {
    expect(playChase(4, 4, 0)).toBe('escaped')
    expect(playChase(4, 9, 0)).toBe('caught')
  })

  it('eats half the candies, rounded up', () => {
    expect([0, 1, 2, 7].map(eaten)).toEqual([0, 1, 1, 4])
  })
})
