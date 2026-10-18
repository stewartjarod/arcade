import { findSkill } from '../subjects'
import { mathWords } from '../ui/clips'
import { spokenText } from '../ui/prompt'
import type { Item, ItemSpec, Skill, Teach } from './types'

/**
 * The "here's how it works" card for a topic a kid has never seen (an item marked `frontier`).
 * A skill can write its own card with `teach(level)`. Otherwise we make one: a short "New!" line
 * and a worked example from the same skill, so the card always has something to show.
 */

/** Words kids never see in our own text. A question that uses one of them isn't picked as an example. */
const GRADE_WORDS = /\bgrade\b|IXL|score/i

/** How many random tries to find an example that differs from the question being asked. */
const TRIES = 20

/** Make one question from a skill, with the same defaults the scheduler uses (formats, listen). */
function sample(skill: Skill, skillId: string, level: number): Item {
  const spec: ItemSpec = skill.generate(level)
  return { ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: skillId, level }
}

/**
 * The same question: the same fact (key), or the same words, picture AND answer. "What time is it?" with
 * another clock face, or "Which word is a compound word?" with another right answer, is a different question.
 */
const sameQuestion = (a: Item, b: Item) =>
  a.key === b.key ||
  (a.answer === b.answer && a.prompt.text === b.prompt.text && a.prompt.svg === b.prompt.svg && a.prompt.emoji === b.prompt.emoji)

/** A worked example that is never the question they'll be asked, preferably with a different answer. */
function exampleFor(item: Item, skill: Skill): Teach['example'] | undefined {
  let sameAnswer: Item | undefined
  for (let i = 0; i < TRIES; i++) {
    const it = sample(skill, item.skill, item.level)
    if (sameQuestion(it, item)) continue // the very question being asked: never show it
    if (it.listen && !item.listen) continue // a sound-only example would be silent for a kid who reads
    if (GRADE_WORDS.test(`${it.prompt.text} ${it.prompt.say ?? ''}`)) continue // no grade or score wording in the example
    if (it.answer !== item.answer) return toExample(it)
    sameAnswer ??= it // keep one as a backup if no different answer turns up
  }
  return sameAnswer && toExample(sameAnswer)
}

const toExample = (it: Item): Teach['example'] => ({ prompt: it.prompt, answer: it.answer })

/** Read the card aloud: text, then the example, then its answer. Math signs are spelled out. */
function sayFor(text: string, example?: Teach['example']): string {
  if (!example) return mathWords(text)
  return [sentence(mathWords(text)), sentence(spokenText(example.prompt)), sentence(`The answer is ${example.answer}`)].join(' ')
}

/**
 * A skill's label with its grade taken out ("Read sight words: grade 1" → "Read sight words").
 * Kids never see grade names; the label keeps its IXL wording otherwise.
 */
export const kidLabel = (label: string) => label.replace(/[:(\s]*\bgrades?\s*\d+\)?/gi, '').trim()

/** Make sure a spoken line ends like a sentence, so the voice pauses before the next one. */
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)

/** The teach card for an item. Uses the skill's own `teach()` when it has one; otherwise a generic card. */
export function lessonFor(item: Item): Teach {
  const skill = findSkill(item.skill)
  if (!skill) return { text: 'New! Let’s try this one together.', say: 'New! Let’s try this one together.' }

  const own = skill.teach?.(item.level)
  const text = own?.text ?? `New! ${kidLabel(skill.label(item.level))}`
  const example = own?.example ?? exampleFor(item, skill)
  return {
    text,
    say: own?.say ?? sayFor(text, example),
    ...(own?.emoji ? { emoji: own.emoji } : {}),
    ...(own?.svg ? { svg: own.svg } : {}),
    ...(example ? { example } : {}),
  }
}
