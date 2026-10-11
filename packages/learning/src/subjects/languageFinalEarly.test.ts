import { describe, expect, test } from 'vitest'
import type { Skill } from '../core/types'
import { reading } from './reading'
import { writing } from './writing'
import { LANGUAGE_FE_IXL, READING_FE, WRITING_FE } from './languageFinalEarly'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// The last early English (K–2) skills: every question is fair, and every IXL level points at a real IXL category.
describe('final early English: reading', () => {
  for (const skill of READING_FE) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_FE_IXL[`reading.${skill.id}`]))
  }
})

describe('final early English: writing', () => {
  for (const skill of WRITING_FE) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_FE_IXL[`writing.${skill.id}`]))
  }
})

// Each new id must show up exactly once among the registered skills of its subject (never assert absence).
describe('final early English: ids', () => {
  const countOf = (registered: Skill[], id: string) => registered.filter((s) => s.id === id).length
  test('reading ids are unique', () => {
    const registered = [...new Set<Skill>([...reading.skills, ...READING_FE])]
    for (const skill of READING_FE) expect(countOf(registered, skill.id), `reading.${skill.id}`).toBe(1)
  })
  test('writing ids are unique', () => {
    const registered = [...new Set<Skill>([...writing.skills, ...WRITING_FE])]
    for (const skill of WRITING_FE) expect(countOf(registered, skill.id), `writing.${skill.id}`).toBe(1)
  })
})
