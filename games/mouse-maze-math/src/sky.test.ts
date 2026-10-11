import { describe, expect, test } from 'vitest'
import { REALMS } from './realms'
import { isNightRealm, skyColors, SKY_RADIUS, SKY_ZENITH, starDirections } from './sky'

describe('sky colours', () => {
  test('the horizon is exactly the fog colour of every realm, so fog melts into the sky', () => {
    for (const realm of REALMS) {
      expect(skyColors(realm.id, realm.fog[0]).horizon).toBe(realm.fog[0])
    }
  })

  test('every realm has its own zenith colour that is not the horizon colour', () => {
    for (const realm of REALMS) {
      expect(SKY_ZENITH[realm.id]).toBeDefined()
      const { horizon, zenith } = skyColors(realm.id, realm.fog[0])
      expect(zenith).not.toBe(horizon)
    }
  })

  test('an unknown realm falls back to the fog colour overhead (flat, but never broken)', () => {
    expect(skyColors('nowhere', 0x123456)).toEqual({ horizon: 0x123456, zenith: 0x123456 })
  })

  test('the dark realms are the ones that get stars', () => {
    const night = REALMS.filter((r) => isNightRealm(r.id)).map((r) => r.id)
    expect(night.sort()).toEqual(['cellar', 'crystal', 'star'])
  })
})

describe('star spots', () => {
  test('stars sit on the sky sphere, above the horizon', () => {
    const pts = starDirections(300, 7)
    expect(pts.length).toBe(300 * 3)
    for (let i = 0; i < pts.length; i += 3) {
      const r = Math.hypot(pts[i]!, pts[i + 1]!, pts[i + 2]!)
      expect(r).toBeCloseTo(280, 3)
      expect(pts[i + 1]!).toBeGreaterThan(0)
    }
  })

  test('the same seed gives the same stars', () => {
    expect(Array.from(starDirections(50, 3))).toEqual(Array.from(starDirections(50, 3)))
  })

  test('the dome radius leaves room under the overview camera far plane (400)', () => {
    expect(SKY_RADIUS).toBeLessThan(400)
    expect(SKY_RADIUS).toBeGreaterThanOrEqual(280)
  })
})
