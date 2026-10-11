import { playStyleFor, type PlayStyle } from '@arcade/learning'

/**
 * How Rocket Tour plays by grade (0 = Kindergarten):
 * - cozy (K–1): one wrong answer is taken away at each gate, so there are only two to choose from.
 * - explorer (2–3): three answers, as usual.
 * - speedy (4–5): three answers, plus ⚡ bonus stardust for a quick first-try answer.
 */
export const styleFor = playStyleFor
export const startingChoices = (style: PlayStyle) => (style === 'cozy' ? 2 : 3)
export const quickSeconds = (style: PlayStyle) => (style === 'speedy' ? 6 : 0)
export const QUICK_DUST = 5
