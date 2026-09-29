import { sfx } from '@arcade/engine'
import { startPractice, type Practice, type Question } from '../core/practice'
import type { PickOptions } from '../core/scheduler'
import type { Format } from '../core/types'
import { choicePad } from './choicePad'
import { letterPad } from './letterPad'
import { numberPad } from './numberPad'

/**
 * The one-liner for putting learning in any game: pops up a question at the
 * player's level — any subject — lets them answer, and updates their profile.
 *
 *   game.paused = true
 *   const { solved } = await challenge({ title: '⭐ Bonus star!' })
 *   game.paused = false
 *
 * Only the first answer is scored. Typed answers get a few tries, then show the
 * answer; multiple choice lets them keep picking until they find it.
 */
export interface ChallengeOptions extends PickOptions {
  title?: string
  /** Tries for typed answers before showing the answer. */
  tries?: number
  /** How many options for multiple choice. */
  choices?: number
}

export interface ChallengeResult {
  /** They got it (on any try). */
  solved: boolean
  /** They got it on the very first try. */
  firstTry: boolean
  answer: string
  subject: string
  skill: string
}

// One practice per set of options, so questions don't repeat back to back.
const practices = new Map<string, Practice>()
const practiceFor = (o: PickOptions) => {
  const key = JSON.stringify([o.subjects, o.formats])
  let p = practices.get(key)
  if (!p) practices.set(key, (p = startPractice({ subjects: o.subjects, formats: o.formats, audio: o.audio })))
  return p
}

// Typing can't be a lucky guess, so it's preferred when a question allows it.
const PREFERENCE: Format[] = ['letters', 'number', 'choice']

export async function challenge(o: ChallengeOptions = {}): Promise<ChallengeResult> {
  const formats = o.formats ?? PREFERENCE
  const moment = practiceFor({ ...o, formats }).moment()
  const q = moment.ask()
  const format = PREFERENCE.find((f) => formats.includes(f) && q.item.formats.includes(f))!
  const title = o.title ?? 'Solve it!'
  const result = format === 'choice' ? await askChoice(q, moment, title, o.choices ?? 3) : await askTyped(q, moment, title, format, o.tries ?? 3)
  return { ...result, answer: q.answer, subject: q.subject, skill: q.item.skill }
}

type Moment = ReturnType<Practice['moment']>

async function askTyped(q: Question, moment: Moment, title: string, format: Format, tries: number) {
  const pad = format === 'letters' ? letterPad() : numberPad()
  let msg = ''
  for (let t = 0; t < tries; t++) {
    const value = await pad.ask({ title, prompt: q.prompt, listen: q.item.listen, msg })
    if (t === 0) q.restartTimer()
    if (moment.check(q, value)) {
      sfx.good(t === 0 ? 2 : 0)
      pad.close()
      return { solved: true, firstTry: t === 0 }
    }
    sfx.bad()
    const close = q.score(value) > 0
    msg = t < tries - 1 ? (close ? 'So close! Try again!' : 'Not quite, try again!') : `It was ${q.answer}!`
    pad.feedback(msg)
  }
  await new Promise((r) => setTimeout(r, 1800)) // let them read the answer
  pad.close()
  return { solved: false, firstTry: false }
}

async function askChoice(q: Question, moment: Moment, title: string, count: number) {
  const pad = choicePad()
  const options = q.options(count)
  let open = options.length
  let picked = await pad.ask({ title, prompt: q.prompt, options, listen: q.item.listen })
  let firstTry = true
  for (;;) {
    // Each wrong pick rules one out, so the next guess is likelier to be lucky.
    const right = moment.check(q, picked, { choices: open })
    pad.mark(picked, right)
    if (right) break
    sfx.bad()
    firstTry = false
    open--
    pad.feedback('Not that one — try again!')
    picked = await pad.again()
  }
  sfx.good(firstTry ? 2 : 0)
  await new Promise((r) => setTimeout(r, 600))
  pad.close()
  return { solved: true, firstTry }
}

/** A math-only challenge with the number pad (the original one-liner). */
export const mathChallenge = (o: Omit<ChallengeOptions, 'subjects'> = {}) =>
  challenge({ formats: ['number'], ...o, subjects: ['math'] })
