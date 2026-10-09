import { describe, expect, test } from 'vitest'
import { shapes } from './shapes'

const NAMES = [
  ['circle', 'triangle', 'square', 'rectangle', 'hexagon'],
  ['circle', 'triangle', 'square', 'rectangle', 'rhombus', 'pentagon', 'hexagon'],
  ['pentagon', 'hexagon', 'heptagon', 'octagon'],
]

describe('shape questions stay at their level', () => {
  test('wrong answers only use shapes that level teaches', () => {
    for (let level = 1; level <= shapes.maxLevel; level++) {
      for (let i = 0; i < 100; i++) {
        const item = shapes.generate(level)
        for (const w of item.wrong(3)) expect(NAMES[level - 1], `L${level}: ${item.answer} offered "${w}"`).toContain(w)
      }
    }
  })
})
