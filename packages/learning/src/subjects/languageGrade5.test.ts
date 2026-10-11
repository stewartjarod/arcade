import { describe, expect, test } from 'vitest'
import { findSubject } from '.'
import { LANGUAGE_G5_IXL, READING_G5, WRITING_G5 } from './languageGrade5'
import { expectIxlRefsReal, expectSkillFair } from './testing'

// Grade 5 (and some grade 3–4) English: every question is fair, and every IXL level points at a real IXL category.
describe('grade 5 English: reading', () => {
  for (const skill of READING_G5) {
    test(`reading.${skill.id}: every level makes fair questions`, () => expectSkillFair('reading', skill))
    test(`reading.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`reading.${skill.id}`, skill.maxLevel, LANGUAGE_G5_IXL[`reading.${skill.id}`]))
  }
})

describe('grade 5 English: writing', () => {
  for (const skill of WRITING_G5) {
    test(`writing.${skill.id}: every level makes fair questions`, () => expectSkillFair('writing', skill))
    test(`writing.${skill.id}: IXL levels are real`, () => expectIxlRefsReal(`writing.${skill.id}`, skill.maxLevel, LANGUAGE_G5_IXL[`writing.${skill.id}`]))
  }
})

// These skills are not registered in SUBJECTS yet, so compare against the subjects that are.
describe('grade 5 English: ids', () => {
  for (const [subjectId, mine] of [['reading', READING_G5], ['writing', WRITING_G5]] as const) {
    test(`${subjectId}: skill ids are unique and do not collide with existing skills`, () => {
      const registered = findSubject(subjectId)!.skills
      const others = registered.filter((s) => !mine.includes(s)).map((s) => s.id)
      const mineIds = mine.map((s) => s.id)
      expect(new Set(mineIds).size).toBe(mineIds.length)
      for (const id of mineIds) expect(others, `${subjectId}.${id} collides with an existing skill`).not.toContain(id)
    })

    test(`${subjectId}: unlocksAfter points at real skills in the same subject`, () => {
      const known = [...findSubject(subjectId)!.skills.map((s) => s.id), ...mine.map((s) => s.id)]
      for (const skill of mine) for (const p of skill.unlocksAfter ?? []) expect(known, `${skill.id} unlocks after ${p.skill}`).toContain(p.skill)
    })
  }
})
