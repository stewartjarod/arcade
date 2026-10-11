import { describe, expect, test } from 'vitest'
import { nextPace, readingSeconds, settingsFor, START_PACE } from './difficulty'

describe('Bubble Pop gets harder with the IXL grade', () => {
  test('more bubbles and a faster fall at higher grades, never easier', () => {
    const s = [0, 1, 2, 3, 4, 5].map(settingsFor)
    for (let g = 1; g < s.length; g++) {
      expect(s[g]!.bubbles).toBeGreaterThanOrEqual(s[g - 1]!.bubbles)
      expect(s[g]!.fallSeconds).toBeLessThanOrEqual(s[g - 1]!.fallSeconds)
    }
    expect(s[5]!.bubbles).toBeGreaterThan(s[0]!.bubbles)
    expect(s[5]!.fallSeconds).toBeLessThan(s[0]!.fallSeconds)
  })
})

describe('Bubble Pop is fair to young readers', () => {
  test('long questions fall slower, short ones get no extra time', () => {
    expect(readingSeconds('7 + 5')).toBe(0)
    expect(readingSeconds('Ava has 3 red apples and 4 green apples. How many apples does she have?')).toBeGreaterThan(3)
    expect(readingSeconds('word '.repeat(100))).toBe(8)
  })

  test('a miss slows the bubbles down, right answers speed them back up, within limits', () => {
    let pace = START_PACE
    for (let i = 0; i < 10; i++) pace = nextPace(pace, false)
    expect(pace).toBe(0.6)
    for (let i = 0; i < 30; i++) pace = nextPace(pace, true)
    expect(pace).toBe(1.15)
    expect(nextPace(1, false)).toBeLessThan(1)
  })
})
