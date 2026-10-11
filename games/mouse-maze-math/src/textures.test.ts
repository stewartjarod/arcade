import { describe, expect, test } from 'vitest'
import { mulberry32, grey, seedFor, textureKey, wrapCopies, neutralizePixels, TEXTURE_SIZE, type SurfaceKind } from './textures'
import type { Style } from './realms'

const STYLES: Style[] = ['plain', 'hedge', 'stone', 'crystal', 'brass', 'neon']
const KINDS: SurfaceKind[] = ['floor', 'wall', 'door']

describe('random numbers for the paint', () => {
  test('the same seed always gives the same numbers', () => {
    const a = mulberry32(1234)
    const b = mulberry32(1234)
    const first = Array.from({ length: 20 }, () => a())
    const second = Array.from({ length: 20 }, () => b())
    expect(first).toEqual(second)
  })

  test('numbers stay between 0 and 1', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  test('different seeds give different numbers', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('texture cache keys', () => {
  test('every style and kind gets its own key and its own seed', () => {
    const keys = new Set<string>()
    const seeds = new Set<number>()
    for (const style of STYLES) {
      for (const kind of KINDS) {
        keys.add(textureKey(style, kind))
        seeds.add(seedFor(style, kind))
      }
    }
    expect(keys.size).toBe(STYLES.length * KINDS.length)
    expect(seeds.size).toBe(STYLES.length * KINDS.length)
  })

  test('the same style and kind always give the same key', () => {
    expect(textureKey('hedge', 'wall')).toBe(textureKey('hedge', 'wall'))
    expect(seedFor('hedge', 'wall')).toBe(seedFor('hedge', 'wall'))
  })
})

describe('colour text for the canvas', () => {
  test('0 is black, 1 is white, and levels outside 0..1 are clamped', () => {
    expect(grey(0)).toBe('rgba(0,0,0,1)')
    expect(grey(1)).toBe('rgba(255,255,255,1)')
    expect(grey(2)).toBe('rgba(255,255,255,1)')
    expect(grey(-1)).toBe('rgba(0,0,0,1)')
  })

  test('alpha is passed through', () => {
    expect(grey(0.5, 0.25)).toBe('rgba(128,128,128,0.25)')
  })
})

describe('wrapping at the edges', () => {
  test('a spot in the middle is drawn once', () => {
    expect(wrapCopies(100, 10, 256)).toEqual([100])
  })

  test('a spot near the left edge gets a copy one canvas to the right', () => {
    expect(wrapCopies(4, 10, 256)).toEqual([4, 260])
  })

  test('a spot near the right edge gets a copy one canvas to the left', () => {
    expect(wrapCopies(250, 10, 256)).toEqual([250, -6])
  })

  test('the texture size is a power of two (so mipmaps work nicely)', () => {
    expect(Math.log2(TEXTURE_SIZE) % 1).toBe(0)
    expect(TEXTURE_SIZE).toBeGreaterThanOrEqual(128)
    expect(TEXTURE_SIZE).toBeLessThanOrEqual(256)
  })
})

describe('neutral textures (no second tint on the realm colours)', () => {
  test('colours become plain grey with the same alpha', () => {
    const pixels = [200, 100, 50, 255, 10, 200, 240, 128]
    neutralizePixels(pixels, 1)
    expect(pixels[0]).toBe(pixels[1])
    expect(pixels[1]).toBe(pixels[2])
    expect(pixels[3]).toBe(255)
    expect(pixels[4]).toBe(pixels[5])
    expect(pixels[7]).toBe(128)
  })

  test('white stays white and the gain never goes past 255', () => {
    const pixels = [255, 255, 255, 255]
    neutralizePixels(pixels, 1.12)
    expect(pixels.slice(0, 3)).toEqual([255, 255, 255])
  })
})
