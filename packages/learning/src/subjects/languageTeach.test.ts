import { describe, expect, test } from 'vitest'
import { SUBJECTS } from '.'
import type { Skill } from '../core/types'

// Checks for the skills these files own: teach cards, fromKey rebuilds, and speed bonuses.
// Listed by id so other files' skills (edited by other people) don't break this test.
const TEACH_IDS = ['clocks.time', 'clocks.coins', 'reading.sounds', 'reading.words', 'reading.sight', 'reading.rhyme', 'reading.syllables', 'reading.stories', 'writing.caps']
const FROM_KEY_IDS = ['writing.caps', 'reading.stories', 'reading.sounds']
const SECONDS_IDS = ['clocks.time', 'clocks.coins', 'reading.sight']

function skill(id: string): Skill {
  const [subjectId, skillId] = id.split('.')
  const found = SUBJECTS.find((s) => s.id === subjectId)?.skills.find((k) => k.id === skillId)
  if (!found) throw new Error(`no skill ${id}`)
  return found
}

describe('teach cards', () => {
  test.each(TEACH_IDS)('%s has a short, spoken, kid-safe card at every level', (id) => {
    const s = skill(id)
    for (let L = 1; L <= s.maxLevel; L++) {
      expect(s.teach, `${id} needs teach`).toBeTruthy()
      const t = s.teach!(L)
      expect(t.text.length, `${id} L${L} text`).toBeGreaterThan(0)
      expect(t.text.length, `${id} L${L} text length`).toBeLessThanOrEqual(140)
      expect(t.say, `${id} L${L} needs say`).toBeTruthy()
      const texts = [t.text, t.say ?? '', t.example?.prompt.text ?? '', t.example?.answer ?? '']
      for (const text of texts) {
        expect(text, `${id} L${L}: no Ima or Millie`).not.toMatch(/\b(Ima|Millie)\b/)
        expect(text, `${id} L${L}: no grades, IXL, scores or levels`).not.toMatch(/\bgrade\b|IXL|\bscore\b|\blevel\b/i)
      }
    }
  })
})

describe('fromKey rebuilds the same question', () => {
  test.each(FROM_KEY_IDS)('%s', (id) => {
    const s = skill(id)
    for (let L = 1; L <= s.maxLevel; L++) {
      for (let i = 0; i < 20; i++) {
        const spec = s.generate(L)
        const again = s.fromKey!(spec.key, L)
        const where = `${id} L${L} key "${spec.key}"`
        expect(again, `${where} can be rebuilt`).not.toBeNull()
        expect(again!.key, where).toBe(spec.key)
        expect(again!.prompt.text, where).toBe(spec.prompt.text)
        expect(again!.answer, where).toBe(spec.answer)
      }
    }
  })
})

describe('speed bonus window', () => {
  test.each(SECONDS_IDS)('%s gives a seconds value at every level', (id) => {
    const s = skill(id)
    for (let L = 1; L <= s.maxLevel; L++) {
      for (let i = 0; i < 40; i++) {
        const spec = s.generate(L)
        expect(spec.seconds, `${id} L${L} "${spec.prompt.text}"`).toBeGreaterThan(0)
      }
    }
  })
})
