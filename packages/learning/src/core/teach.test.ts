import { describe, expect, test } from 'vitest'
import { SUBJECTS } from '../subjects'
import type { Item, ItemSpec, Skill } from './types'
import { kidLabel, lessonFor } from './teach'

// Every skill at every level gets a teach card that is safe to show a kid.

/** Make one question the way the scheduler does (defaults for formats and listen). */
function sample(subjectId: string, skill: Skill, level: number): Item {
  const spec: ItemSpec = skill.generate(level)
  return { ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: `${subjectId}.${skill.id}`, level }
}

const NO_NAMES = /\b(Ima|Millie)\b/
const NO_GRADES = /\bgrade\b|IXL|score/i

describe('teach cards for every skill and level', () => {
  test('every skill has a card that is kid-safe and never shows the asked question', () => {
    let checked = 0
    let examples = 0
    for (const subject of SUBJECTS) {
      for (const skill of subject.skills) {
        for (let level = 1; level <= skill.maxLevel; level++) {
          for (let i = 0; i < 2; i++) {
            const item = sample(subject.id, skill, level)
            const where = `${subject.id}.${skill.id} L${level}: "${item.prompt.text}"`
            const lesson = lessonFor(item)
            const kidText = [lesson.text, lesson.say, lesson.example?.prompt.text, lesson.example?.prompt.say]
            expect(lesson.text.trim(), `${where}: text`).not.toBe('')
            expect(lesson.say?.trim(), `${where}: say`).toBeTruthy()
            if (lesson.example) {
              examples++
              // Never the asked question: same words, picture and answer.
              const shown = (p: typeof item.prompt, answer: string) => JSON.stringify([p.text, p.svg ?? '', p.emoji ?? '', answer])
              expect(shown(lesson.example.prompt, lesson.example.answer), `${where}: example must not be the asked question`).not.toBe(shown(item.prompt, item.answer))
              expect(lesson.example.answer, `${where}: example answer`).toBeTruthy()
            }
            for (const text of kidText) {
              if (!text) continue
              expect(NO_NAMES.test(text), `${where}: no Ima or Millie in "${text}"`).toBe(false)
              expect(NO_GRADES.test(text), `${where}: no grade, IXL or score in "${text}"`).toBe(false)
            }
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
    console.info(`teach examples: ${examples} of ${checked}`)
    // Almost every card should show a worked example (questions told apart by picture count as different).
    expect(examples / checked).toBeGreaterThan(0.95)
  })

  test('a skill without its own card gets a "New!" line with its name', () => {
    const plain = SUBJECTS.flatMap((s) => s.skills.map((k) => [s.id, k] as const)).find(([, k]) => !k.teach)
    expect(plain).toBeTruthy()
    const [subjectId, skill] = plain!
    const lesson = lessonFor(sample(subjectId, skill, 1))
    expect(lesson.text).toBe(`New! ${kidLabel(skill.label(1))}`)
  })
})
