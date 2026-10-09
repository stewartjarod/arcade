import { describe, expect, test } from 'vitest'
import { SCIENCE_SOCIAL_IXL, science, socialStudies } from './scienceSocial'
import { expectIxlRefsReal, expectSkillFair } from './testing'

for (const subject of [science, socialStudies]) {
  describe(`${subject.name} subject`, () => {
    test('skill ids are unique', () => {
      const ids = subject.skills.map((s) => s.id)
      expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
    })

    test('every unlocksAfter points at a real skill and level in the same subject', () => {
      for (const skill of subject.skills) {
        for (const u of skill.unlocksAfter ?? []) {
          const target = subject.skills.find((s) => s.id === u.skill)
          expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
          expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
        }
      }
    })

    for (const skill of subject.skills) {
      test(`${skill.id}: every question is fair at every level`, () => {
        expectSkillFair(subject.id, skill)
      })

      test(`${skill.id}: IXL levels are real and climb in grade`, () => {
        expectIxlRefsReal(`${subject.id}.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_IXL[`${subject.id}.${skill.id}`])
      })
    }
  })
}
