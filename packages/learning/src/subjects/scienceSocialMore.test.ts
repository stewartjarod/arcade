import { describe, expect, test } from 'vitest'
import { science, socialStudies } from './scienceSocial'
import { SCIENCE_MORE, SOCIAL_MORE, SCIENCE_SOCIAL_MORE_IXL } from './scienceSocialMore'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('science more: skill ids', () => {
  test('do not collide with existing science skills', () => {
    const ids = [...science.skills, ...SCIENCE_MORE].map((s) => s.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })
  test('do not collide with existing social skills', () => {
    const ids = [...socialStudies.skills, ...SOCIAL_MORE].map((s) => s.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })
})

describe('science more: unlocks point at real skills in the same subject', () => {
  test('unlocksAfter targets exist and levels are in range', () => {
    const all = [...science.skills, ...SCIENCE_MORE]
    for (const skill of SCIENCE_MORE) {
      for (const u of skill.unlocksAfter ?? []) {
        const target = all.find((s) => s.id === u.skill)
        expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
        expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
})

describe('social more: unlocks point at real skills in the same subject', () => {
  test('unlocksAfter targets exist and levels are in range', () => {
    const all = [...socialStudies.skills, ...SOCIAL_MORE]
    for (const skill of SOCIAL_MORE) {
      for (const u of skill.unlocksAfter ?? []) {
        const target = all.find((s) => s.id === u.skill)
        expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
        expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
})

for (const skill of SCIENCE_MORE) {
  describe(`science.${skill.id}`, () => {
    test('every question is fair at every level', () => {
      expectSkillFair('science', skill)
    })
    test('IXL levels are real and climb in grade', () => {
      expectIxlRefsReal(`science.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_MORE_IXL[`science.${skill.id}`])
    })
  })
}

for (const skill of SOCIAL_MORE) {
  describe(`social.${skill.id}`, () => {
    test('every question is fair at every level', () => {
      expectSkillFair('social', skill)
    })
    test('IXL levels are real and climb in grade', () => {
      expectIxlRefsReal(`social.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_MORE_IXL[`social.${skill.id}`])
    })
  })
}
