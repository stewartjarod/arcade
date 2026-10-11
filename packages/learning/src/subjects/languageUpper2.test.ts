import { describe, expect, test } from 'vitest'
import { findSubject } from '.'
import { LANGUAGE_U2_IXL, READING_U2, WRITING_U2 } from './languageUpper2'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// Grades 3–5 English (the skills not covered before): every question is fair, and every IXL level points at a real IXL category.
describe('grades 3–5 English: reading', () => {
  for (const skill of READING_U2) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_U2_IXL[`reading.${skill.id}`]))
  }
})

describe('grades 3–5 English: writing', () => {
  for (const skill of WRITING_U2) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_U2_IXL[`writing.${skill.id}`]))
  }
})

// These skills are not registered in SUBJECTS yet. Build the pool from the registered skills plus these,
// de-duplicated by object, so the check works both before and after they are registered.
describe('grades 3–5 English: ids', () => {
  for (const [subjectId, mine] of [['reading', READING_U2], ['writing', WRITING_U2]] as const) {
    test(`${subjectId}: skill ids are unique and do not collide with existing skills`, () => {
      const pool = [...new Set([...findSubject(subjectId)!.skills, ...mine])]
      for (const skill of mine) {
        expect(pool.filter((s) => s.id === skill.id), `${subjectId}.${skill.id} must appear exactly once`).toHaveLength(1)
      }
    })

    test(`${subjectId}: unlocksAfter points at real skills in the same subject`, () => {
      const known = new Set([...findSubject(subjectId)!.skills, ...mine].map((s) => s.id))
      for (const skill of mine) for (const p of skill.unlocksAfter ?? []) expect(known, `${skill.id} unlocks after ${p.skill}`).toContain(p.skill)
    })
  }
})
