import { playStyleFor, type PlayStyle } from '@arcade/learning'

/** How hard Bubble Pop is for an IXL math grade (0 = Kindergarten). */
// Harder as the IXL grade goes up: more bubbles to choose from, and they fall faster.
export function settingsFor(grade: number) {
  return {
    bubbles: grade >= 4 ? 5 : grade >= 2 ? 4 : 3,
    fallSeconds: grade >= 4 ? 7 : grade >= 2 ? 10 : 14,
  }
}

/**
 * How Bubble Pop plays by grade:
 * - cozy (K–1): no hearts. If the right bubble floats down, it just comes back up for another try.
 * - explorer (2–3): three hearts; a missed bubble costs one.
 * - speedy (4–5): hearts too, plus ⚡ bonus points for popping within a few seconds.
 */
export const styleFor = playStyleFor
export const heartsMatter = (style: PlayStyle) => style !== 'cozy'
export const quickPopSeconds = (style: PlayStyle) => (style === 'speedy' ? 5 : 0)
export const QUICK_POINTS = 5
