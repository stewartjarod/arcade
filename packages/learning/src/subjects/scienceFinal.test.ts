import { describe, expect, test } from 'vitest'
import { findSubject } from './index'
import { SCIENCE_FINAL, SCIENCE_FINAL_IXL } from './scienceFinal'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('science final: skill shape', () => {
  test('there are 3 to 8 new skills, 3 levels each', () => {
    expect(SCIENCE_FINAL.length).toBeGreaterThanOrEqual(3)
    expect(SCIENCE_FINAL.length).toBeLessThanOrEqual(8)
    for (const skill of SCIENCE_FINAL) expect(skill.maxLevel, skill.id).toBe(3)
  })

  test('ids are unique and camelCase', () => {
    const ids = SCIENCE_FINAL.map((s) => s.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
    for (const id of ids) expect(id, id).toMatch(/^[a-z][a-zA-Z0-9]*$/)
  })

  test('every skill is multiple choice only', () => {
    for (const skill of SCIENCE_FINAL) expect(skill.formats, skill.id).toEqual(['choice'])
  })

  test('answers fit on a choice button (45 characters or fewer)', () => {
    for (const skill of SCIENCE_FINAL) {
      for (let level = 1; level <= skill.maxLevel; level++) {
        for (let i = 0; i < 60; i++) {
          const { answer } = skill.generate(level)
          expect(answer.length, `${skill.id} L${level}: "${answer}"`).toBeLessThanOrEqual(45)
        }
      }
    }
  })
})

describe('science final: each id is registered exactly once', () => {
  test('ids appear once among the registered science skills (never zero, never twice)', () => {
    const registered = findSubject('science')!.skills.map((s) => s.id)
    for (const skill of SCIENCE_FINAL) {
      const count = registered.filter((id) => id === skill.id).length
      expect(count, `science.${skill.id} registered count`).toBe(1)
    }
  })
})

describe('science final: unlocksAfter points at real skills in the same subject', () => {
  test('targets exist and levels are in range; grade 3+ skills are gated', () => {
    const registered = findSubject('science')!.skills
    for (const skill of SCIENCE_FINAL) {
      const grade = SCIENCE_FINAL_IXL[`science.${skill.id}`]![0]!.grade
      if (grade >= 3) expect(skill.unlocksAfter?.length ?? 0, `${skill.id} is gated`).toBeGreaterThan(0)
      for (const u of skill.unlocksAfter ?? []) {
        const target = registered.find((s) => s.id === u.skill)
        expect(target, `${skill.id} unlocks after ${u.skill}`).toBeTruthy()
        expect(u.level, `${skill.id} unlocks after ${u.skill} level ${u.level}`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
})

for (const skill of SCIENCE_FINAL) {
  describe(`science.${skill.id}`, () => {
    test('every question is fair at every level', () => {
      expectSkillFair('science', skill)
    })

    test('IXL levels are real and climb in grade', () => {
      expectIxlRefsReal(`science.${skill.id}`, skill.maxLevel, SCIENCE_FINAL_IXL[`science.${skill.id}`])
    })
  })
}
