import { describe, expect, test } from 'vitest'
import { createGovernor, pickTier, TIERS, type Tier } from './quality'

const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const CHROMEBOOK_UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// Runs the governor with frames of `ms` each for `seconds` of game time, starting at `start`.
function runFrames(governor: ReturnType<typeof createGovernor>, ms: number, seconds: number, start = 0) {
  let now = start
  const end = start + seconds * 1000
  while (now < end) {
    now += ms
    governor.frame(ms, now)
  }
  return now
}

describe('pickTier', () => {
  test('the ?quality= link wins over the device', () => {
    expect(pickTier('?quality=low', DESKTOP_UA, 1, 16)).toBe('low')
    expect(pickTier('?quality=medium', DESKTOP_UA, 1, 16)).toBe('medium')
    expect(pickTier('?quality=high', IPAD_UA, 2, 2)).toBe('high')
  })

  test('an unknown ?quality= value is ignored', () => {
    expect(pickTier('?quality=ultra', DESKTOP_UA, 1, 16)).toBe('high')
  })

  test('tablets, phones and Chromebooks start on medium', () => {
    expect(pickTier('', IPAD_UA, 2, 8)).toBe('medium')
    expect(pickTier('', CHROMEBOOK_UA, 1, 8)).toBe('medium')
  })

  test('a desktop with plenty of cores starts on high', () => {
    expect(pickTier('', DESKTOP_UA, 1, 16)).toBe('high')
  })

  test('a weak processor starts on medium even on a desktop', () => {
    expect(pickTier('', DESKTOP_UA, 1, 4)).toBe('medium')
  })
})

describe('TIERS', () => {
  test('low has no composer and no shadows, high caps the pixel ratio', () => {
    expect(TIERS.low.composer).toBe(false)
    expect(TIERS.low.shadowMap).toBe(0)
    expect(TIERS.high.pixelRatio).toBe(1.5)
  })
})

describe('createGovernor', () => {
  test('steps down after sustained slow frames', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    runFrames(governor, 30, 6)
    expect(steps).toEqual(['medium'])
    expect(governor.tier()).toBe('medium')
  })

  test('a single spike does not step down', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    let now = runFrames(governor, 16, 3)
    now += 90
    governor.frame(90, now)
    now = runFrames(governor, 16, 3, now)
    expect(steps).toEqual([])
    expect(governor.tier()).toBe('high')
  })

  test('frames longer than 100 ms are ignored (tab switches)', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    let now = 0
    for (let i = 0; i < 200; i++) {
      now += 500
      governor.frame(500, now)
    }
    expect(steps).toEqual([])
  })

  test('the first 2 seconds are ignored', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    // 1.9 seconds of slow frames right at the start: still inside the warm-up.
    runFrames(governor, 40, 1.9)
    expect(steps).toEqual([])
    expect(governor.tier()).toBe('high')
  })

  test('never goes back up in the same session', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    let now = runFrames(governor, 30, 6)
    now = runFrames(governor, 8, 10, now)
    expect(steps).toEqual(['medium'])
    expect(governor.tier()).toBe('medium')
  })

  test('stops at low and does not call onStepDown again', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    let now = runFrames(governor, 30, 6)
    now = runFrames(governor, 30, 20, now)
    expect(steps).toEqual(['medium', 'low'])
    expect(governor.tier()).toBe('low')
  })

  test('reset() restarts the warm-up so a maze load spike is ignored', () => {
    const steps: Tier[] = []
    const governor = createGovernor('high', (to) => steps.push(to))
    governor.reset(10_000)
    runFrames(governor, 40, 1.9, 10_000)
    expect(steps).toEqual([])
  })
})
