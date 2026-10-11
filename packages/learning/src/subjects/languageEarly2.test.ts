import { describe, expect, test } from 'vitest'
import { LANGUAGE_E2_IXL, READING_E2, WRITING_E2 } from './languageEarly2'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// More early reading and writing (K–2): every question is fair, and every IXL level points at a real IXL category.
describe('more early English: reading', () => {
  for (const skill of READING_E2) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_E2_IXL[`reading.${skill.id}`]))
  }
})

describe('more early English: writing', () => {
  for (const skill of WRITING_E2) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_E2_IXL[`writing.${skill.id}`]))
  }
})

// Ids inside this file are unique, so a key like "reading.wordMatch" always means one skill.
test('ids in this file are unique', () => {
  const ids = [...READING_E2, ...WRITING_E2].map((s) => s.id)
  expect(new Set(ids).size).toBe(ids.length)
})
