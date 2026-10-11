// Quality tiers: how much work the renderer does.
// High is for desktops, medium for phones, tablets and Chromebooks, low is the safety net.
// Everything here is plain logic (no document or window), so the tests can run in node.

export type Tier = 'high' | 'medium' | 'low'

export interface TierSettings {
  pixelRatio: number // cap on screen sharpness; big screens at 2x cost 4x the pixels
  shadowMap: number // shadow texture size in pixels; 0 = no shadows at all
  composer: boolean // use the glow/colour pass (postfx.ts)
  msaa: number // smooth edges for the composer; 0 = off
  bloom: boolean // glow on bright colours (only matters when composer is on)
}

export const TIERS: Record<Tier, TierSettings> = {
  // Tablets must not render at 2x with half-float plus MSAA, so the ratio is capped.
  high: { pixelRatio: 1.5, shadowMap: 2048, composer: true, msaa: 4, bloom: true },
  // Medium is the tablet/Chromebook tier and keeps smooth edges (MSAA 4): without it, edges look jagged at this pixel ratio.
  // The step-down governor is the safety net if a weak GPU can't keep up.
  medium: { pixelRatio: 1.25, shadowMap: 1024, composer: true, msaa: 4, bloom: true },
  low: { pixelRatio: 1, shadowMap: 0, composer: false, msaa: 0, bloom: false },
}

const TIER_NAMES: Tier[] = ['high', 'medium', 'low']

// Phones, tablets and Chromebooks are the places where the game must stay smooth.
const SMALL_DEVICE = /Android|iPhone|iPad|iPod|Mobile|Tablet|CrOS/i

// Picks the starting tier. The ?quality= link always wins, so a parent can test a tier.
// The choice lives in memory only (never localStorage), so each visit starts fresh.
export function pickTier(search: string, ua: string, dpr: number, cores: number): Tier {
  const asked = new URLSearchParams(search).get('quality')
  if (asked && (TIER_NAMES as string[]).includes(asked)) return asked as Tier

  // dpr is not used yet: the pixel-ratio cap already handles sharp screens.
  // Weak processors (4 cores or fewer) start on medium too, even on a laptop.
  if (SMALL_DEVICE.test(ua) || cores <= 4) return 'medium'
  return 'high'
}

// Timing rules for the governor.
const WARMUP_MS = 2000 // the first moments after a maze loads are slow (shader compiles)
const TAB_SWITCH_MS = 100 // a frame this long means the tab was hidden, so skip it
const WINDOW_FRAMES = 90 // about 1.5 seconds of frames to look at
const SLOW_FRAME_MS = 22 // a median frame longer than this counts as "slow"
const SLOW_FOR_MS = 2000 // how long the slowness must last before stepping down

export interface Governor {
  frame(dtMs: number, now: number): void
  tier(): Tier
  reset(now: number): void
}

// Watches frame times and steps the tier down when the game is too slow.
// It only ever goes down, so the game never flips back and forth.
export function createGovernor(startTier: Tier, onStepDown: (to: Tier) => void): Governor {
  let current = startTier
  let recent: number[] = []
  let slowMs = 0 // how long the median has been slow so far
  let quietUntil: number | null = null // null = the warm-up starts at the first frame

  function frame(dtMs: number, now: number) {
    if (quietUntil === null) quietUntil = now + WARMUP_MS
    if (now < quietUntil) return
    if (dtMs > TAB_SWITCH_MS) return
    if (current === 'low') return

    recent.push(dtMs)
    if (recent.length > WINDOW_FRAMES) recent.shift()

    // The median ignores a single hitch, unlike the average.
    if (medianOf(recent) > SLOW_FRAME_MS) {
      slowMs += dtMs
    } else {
      slowMs = 0
    }

    if (slowMs >= SLOW_FOR_MS) stepDown(now)
  }

  function stepDown(now: number) {
    current = TIER_NAMES[TIER_NAMES.indexOf(current) + 1]
    onStepDown(current)
    reset(now)
  }

  function reset(now: number) {
    recent = []
    slowMs = 0
    quietUntil = now + WARMUP_MS
  }

  return { frame, tier: () => current, reset }
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}
