import { describe, expect, test } from 'vitest'
import { READING_PH } from './languagePhonemes'

describe('phoneme skills never ask the voice to say a single sound', () => {
  for (const skill of READING_PH) {
    test(`${skill.id}: nothing read aloud is a lone letter or a "+" sum`, () => {
      for (let level = 1; level <= skill.maxLevel; level++) {
        for (let i = 0; i < 80; i++) {
          const spec = skill.generate(level)
          const say = spec.prompt.say ?? spec.prompt.text
          expect(say, `${skill.id} L${level}`).not.toMatch(/\+/)
          expect(say.replace(/"[^"]*"/g, ''), `${skill.id} L${level}: "${say}"`).not.toMatch(/(^|\s)[a-z]($|\s)/i)
        }
      }
    })
  }

  test('an answer is never a wrong choice too (no homophone pairs)', () => {
    const homophones = [['sun', 'son'], ['bear', 'bare'], ['bone', 'own'], ['for', 'four'], ['tail', 'tale']]
    for (const skill of READING_PH)
      for (let level = 1; level <= skill.maxLevel; level++)
        for (let i = 0; i < 80; i++) {
          const spec = skill.generate(level)
          const wrong = spec.wrong(3)
          for (const [x, y] of homophones) if (spec.answer === x || spec.answer === y) expect(wrong).not.toContain(spec.answer === x ? y : x)
        }
  })
})
