import { describe, test } from 'vitest'
import { LANGUAGE_UPPER_IXL, READING_UPPER, WRITING_UPPER } from './languageUpper'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// Grade 2–5 English skills: every question is fair, and every IXL level points at a real IXL category.
describe('upper English: writing', () => {
  for (const skill of WRITING_UPPER) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_UPPER_IXL[`writing.${skill.id}`]))
  }
})

describe('upper English: reading', () => {
  for (const skill of READING_UPPER) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_UPPER_IXL[`reading.${skill.id}`]))
  }
})
