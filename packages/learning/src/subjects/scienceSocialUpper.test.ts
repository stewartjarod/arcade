import { describe, expect, test } from 'vitest'
import { science, socialStudies } from './scienceSocial'
import { SCIENCE_MORE, SOCIAL_MORE } from './scienceSocialMore'
import { SCIENCE_UPPER, SOCIAL_UPPER, SCIENCE_SOCIAL_UPPER_IXL } from './scienceSocialUpper'
import { expectIxlRefsReal, expectSkillFair } from './testing'
import type { Skill } from '../core/types'

/** Sample a skill at a level many times and collect what comes up. */
function sample(skill: Skill, level: number, n: number) {
  const keys = new Set<string>()
  const answers: string[] = []
  for (let i = 0; i < n; i++) {
    const spec = skill.generate(level)
    keys.add(spec.key)
    answers.push(spec.answer)
  }
  return { keys, answers }
}

const camel = /^[a-z][a-zA-Z0-9]*$/

describe('upper science and social: skill ids', () => {
  test('science ids do not collide with scienceSocial.ts or scienceSocialMore.ts', () => {
    const ids = [...science.skills, ...SCIENCE_MORE, ...SCIENCE_UPPER].map((s) => s.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })
  test('social ids do not collide with scienceSocial.ts or scienceSocialMore.ts', () => {
    const ids = [...socialStudies.skills, ...SOCIAL_MORE, ...SOCIAL_UPPER].map((s) => s.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })
  test('ids are camelCase', () => {
    for (const s of [...SCIENCE_UPPER, ...SOCIAL_UPPER]) expect(s.id, s.id).toMatch(camel)
  })
  test('there are 14 to 20 new skills in total, 3 to 4 levels each', () => {
    const all = [...SCIENCE_UPPER, ...SOCIAL_UPPER]
    expect(all.length).toBeGreaterThanOrEqual(14)
    expect(all.length).toBeLessThanOrEqual(20)
    for (const s of all) expect(s.maxLevel, s.id).toBeGreaterThanOrEqual(3)
    for (const s of all) expect(s.maxLevel, s.id).toBeLessThanOrEqual(4)
  })
})

describe('upper science and social: unlocks point at real skills in the same subject', () => {
  test('science unlocksAfter targets exist and levels are in range', () => {
    const all = [...science.skills, ...SCIENCE_MORE, ...SCIENCE_UPPER]
    for (const skill of SCIENCE_UPPER) {
      expect(skill.unlocksAfter?.length, `${skill.id} is gated`).toBeGreaterThan(0)
      for (const u of skill.unlocksAfter ?? []) {
        const target = all.find((s) => s.id === u.skill)
        expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
        expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
  test('social unlocksAfter targets exist and levels are in range', () => {
    const all = [...socialStudies.skills, ...SOCIAL_MORE, ...SOCIAL_UPPER]
    for (const skill of SOCIAL_UPPER) {
      expect(skill.unlocksAfter?.length, `${skill.id} is gated`).toBeGreaterThan(0)
      for (const u of skill.unlocksAfter ?? []) {
        const target = all.find((s) => s.id === u.skill)
        expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
        expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
})

describe('upper science and social: content', () => {
  for (const skill of SCIENCE_UPPER) {
    describe(`science.${skill.id}`, () => {
      test('every question is fair at every level', () => {
        expectSkillFair('science', skill)
      })
      test('IXL levels are real and climb in grade', () => {
        expectIxlRefsReal(`science.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_UPPER_IXL[`science.${skill.id}`])
      })
      test('each level adds at least 8 new facts', () => {
        let before = 0
        for (let level = 1; level <= skill.maxLevel; level++) {
          const now = sample(skill, level, 2000).keys.size
          expect(now - before, `${skill.id} level ${level} new facts`).toBeGreaterThanOrEqual(8)
          before = now
        }
      })
      test('answers are short and no single answer dominates a level', () => {
        for (let level = 1; level <= skill.maxLevel; level++) {
          const { answers } = sample(skill, level, 1200)
          for (const a of answers) expect(a.length, `${skill.id} "${a}"`).toBeLessThanOrEqual(45)
          const counts = new Map<string, number>()
          for (const a of answers) counts.set(a, (counts.get(a) ?? 0) + 1)
          const top = Math.max(...counts.values()) / answers.length
          expect(top, `${skill.id} L${level} most common answer`).toBeLessThanOrEqual(0.35)
        }
      })
    })
  }

  for (const skill of SOCIAL_UPPER) {
    describe(`social.${skill.id}`, () => {
      test('every question is fair at every level', () => {
        expectSkillFair('social', skill)
      })
      test('IXL levels are real and climb in grade', () => {
        expectIxlRefsReal(`social.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_UPPER_IXL[`social.${skill.id}`])
      })
      test('each level adds at least 8 new facts', () => {
        let before = 0
        for (let level = 1; level <= skill.maxLevel; level++) {
          const now = sample(skill, level, 2000).keys.size
          expect(now - before, `${skill.id} level ${level} new facts`).toBeGreaterThanOrEqual(8)
          before = now
        }
      })
      test('answers are short and no single answer dominates a level', () => {
        for (let level = 1; level <= skill.maxLevel; level++) {
          const { answers } = sample(skill, level, 1200)
          for (const a of answers) expect(a.length, `${skill.id} "${a}"`).toBeLessThanOrEqual(45)
          const counts = new Map<string, number>()
          for (const a of answers) counts.set(a, (counts.get(a) ?? 0) + 1)
          const top = Math.max(...counts.values()) / answers.length
          expect(top, `${skill.id} L${level} most common answer`).toBeLessThanOrEqual(0.35)
        }
      })
    })
  }

  test('the IXL map has exactly one entry for each new skill and nothing extra', () => {
    const expected = [...SCIENCE_UPPER.map((s) => `science.${s.id}`), ...SOCIAL_UPPER.map((s) => `social.${s.id}`)].sort()
    expect(Object.keys(SCIENCE_SOCIAL_UPPER_IXL).sort()).toEqual(expected)
  })
})
