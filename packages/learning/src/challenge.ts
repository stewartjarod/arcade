import { sfx } from '@arcade/engine'
import { numberPad } from './numberPad'
import { startPractice, type Practice } from './practice'

/**
 * The one-liner for putting math in any game: pops up a question at the
 * player's level, lets them type the answer, and updates their profile.
 *
 *   game.paused = true
 *   const { solved } = await mathChallenge({ title: '⭐ Bonus star! Solve it for +3' })
 *   game.paused = false
 *   if (solved) score += 3
 *
 * Only their first answer is scored; they get a few tries, then see the answer.
 */
export interface ChallengeResult {
  /** They got it (on any try). */
  solved: boolean
  /** They got it on the very first try. */
  firstTry: boolean
  answer: number
}

// One practice per page, so questions don't repeat back to back across challenges.
let practice: Practice | undefined

export async function mathChallenge({ title = 'Solve it!', tries = 3 } = {}): Promise<ChallengeResult> {
  practice ??= startPractice()
  const moment = practice.moment()
  const q = moment.ask()
  const pad = numberPad()
  let msg = ''
  for (let t = 0; t < tries; t++) {
    const value = await pad.ask({ title, text: q.text, msg })
    if (moment.check(q, value)) {
      sfx.good(t === 0 ? 2 : 0)
      pad.close()
      return { solved: true, firstTry: t === 0, answer: q.answer }
    }
    sfx.bad()
    msg = t < tries - 1 ? 'Not quite, try again!' : `It was ${q.answer}!`
    pad.feedback(msg)
  }
  await new Promise((r) => setTimeout(r, 1500)) // let them read the answer
  pad.close()
  return { solved: false, firstTry: false, answer: q.answer }
}
