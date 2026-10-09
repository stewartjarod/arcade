import { describe, expect, test } from 'vitest'
import { settingsFor } from './difficulty'

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
