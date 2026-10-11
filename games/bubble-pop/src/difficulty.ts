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
 * Long questions need time to read: "7 + 5" is quick, a word problem is not.
 * Every word past the first few adds half a second, up to 8 seconds more.
 */
export function readingSeconds(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.min(8, Math.max(0, words - 4) * 0.5)
}

/**
 * How fast the bubbles fall this round, compared to normal (1 = normal).
 * A miss slows things down a lot, so a kid who is stuck gets breathing room;
 * a right answer speeds it back up a little. It never gets much faster than normal.
 */
export const START_PACE = 1
export function nextPace(pace: number, right: boolean) {
  return right ? Math.min(1.15, pace + 0.04) : Math.max(0.6, pace - 0.15)
}

/** Every few right answers, a bubble party: free bubbles to pop just for fun. */
export const PARTY_EVERY = 3
export const PARTY_SECONDS = 4

/**
 * How Bubble Pop plays by grade:
 * - cozy (K–1): no hearts. If the right bubble floats down, it lights up to show the answer and a question like it comes next.
 * - explorer (2–3): three hearts; a missed bubble costs one (it lights up too, so you see the answer).
 * - speedy (4–5): hearts too, plus ⚡ bonus points for popping within a few seconds.
 */
export const styleFor = playStyleFor
export const heartsMatter = (style: PlayStyle) => style !== 'cozy'
export const quickPopSeconds = (style: PlayStyle) => (style === 'speedy' ? 5 : 0)
export const QUICK_POINTS = 5
