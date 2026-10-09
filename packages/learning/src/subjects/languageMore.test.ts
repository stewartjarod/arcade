import { describe, test } from 'vitest'
import { LANGUAGE_MORE_IXL, READING_MORE, WRITING_MORE } from './languageMore'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// More English skills (K–5): every question is fair, and every IXL level points at a real IXL category.
describe('more English: reading', () => {
  for (const skill of READING_MORE) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_MORE_IXL[`reading.${skill.id}`]))
  }
})

describe('more English: writing', () => {
  for (const skill of WRITING_MORE) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_MORE_IXL[`writing.${skill.id}`]))
  }
})
