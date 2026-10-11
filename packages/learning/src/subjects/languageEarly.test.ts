import { describe, test } from 'vitest'
import { LANGUAGE_EARLY_IXL, READING_EARLY, WRITING_EARLY } from './languageEarly'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// Early reading and writing (K–2): every question is fair, and every IXL level points at a real IXL category.
describe('early English: reading', () => {
  for (const skill of READING_EARLY) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_EARLY_IXL[`reading.${skill.id}`]))
  }
})

describe('early English: writing', () => {
  for (const skill of WRITING_EARLY) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_EARLY_IXL[`writing.${skill.id}`]))
  }
})
