import { playStyleFor } from '@arcade/learning'

// Pure helpers for the picture-first ("cozy") screens. Kindergarten and grade 1 players can't read
// much yet, so these screens say things with pictures. They live apart from ui.ts so they can be
// tested without a page.

/** Kindergarten and grade 1 get the picture-first screens (the same "cozy" style the other games use). */
export const isCozy = (grade: number) => playStyleFor(grade) === 'cozy'

/** The hint under the question. Older players get the words. */
export const doorHint = (cozy: boolean) => (cozy ? '🚪➜🧀' : 'Which door leads to the cheese? 🧀')

/** When the door signs only show arrows (the answers are words), the hint points down at the big buttons. */
export const wordsHint = (cozy: boolean) => (cozy ? '👇' : '👇 Read the answers below, then pick a door')

/** Cheese at the end of a maze: the star bonus, plus 20 more when the sticker was a repeat. Same sum as game.ts. */
export const cheeseFromFinish = (bonus: number, isNew: boolean) => bonus + (isNew ? 0 : 20)

/**
 * A toast a non-reader can follow. Keep the emoji and the numbers ("⚡ Quick! +5 🧀" becomes "⚡ +5 🧀"),
 * and fall back to one big picture when the message is all words ("Dead end! Try another problem" becomes 🙈).
 */
export const wordlessToast = (msg: string, kind: 'good' | 'bad' | '') => {
  // Drop each plain word (and the punctuation right after it); emoji and digits are left alone.
  const left = msg
    .replace(/[A-Za-z][A-Za-z']*[!.,?]?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return left || (kind === 'bad' ? '🙈' : '🎉')
}
