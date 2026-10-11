import { playStyleFor, type PlayStyle } from '@arcade/learning'

/** How hard Lily Hop is for an IXL math grade (0 = Kindergarten). */
// Harder as the grade goes up: a longer pond, and from grade 2 the gator also swims on its own.
export function pondFor(grade: number) {
  return {
    pads: Math.min(6 + grade * 2, 16),
    gatorEvery: grade >= 4 ? 8 : grade >= 2 ? 14 : 0, // seconds between sneaky swims (0 = only when you miss)
  }
}

/**
 * How Lily Hop plays by grade:
 * - cozy (K–1): no gator, so nothing can go wrong; a wrong pad just sinks and you pick another.
 * - explorer (2–3): the gator swims after you.
 * - speedy (4–5): the gator too, and a quick right answer is a ⚡ super hop over two pads.
 */
export const styleFor = playStyleFor
export const gatorHunts = (style: PlayStyle) => style !== 'cozy'
export const superHopSeconds = (style: PlayStyle) => (style === 'speedy' ? 5 : 0)
