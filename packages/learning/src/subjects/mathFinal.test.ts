import { describe, expect, test } from 'vitest'
import type { Skill } from '../core/types'
import { findSkill, SUBJECTS } from './index'
import { MATH_FINAL, MATH_FINAL_IXL } from './mathFinal'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('final math skills', () => {
  test('ids appear exactly once among math skills (registry plus these)', () => {
    const registered = SUBJECTS.find((s) => s.id === 'math')?.skills ?? []
    // The same skill object may already be registered; count each object once.
    const all = [...new Set<Skill>([...registered, ...MATH_FINAL])]
    for (const skill of MATH_FINAL) {
      expect(all.filter((s) => s.id === skill.id), `math.${skill.id} id`).toHaveLength(1)
    }
  })

  test('every skill has an IXL entry, and every entry belongs to a skill', () => {
    const ids = new Set(MATH_FINAL.map((s) => `math.${s.id}`))
    for (const id of ids) expect(MATH_FINAL_IXL[id], `${id} IXL entry`).toBeTruthy()
    for (const key of Object.keys(MATH_FINAL_IXL)) expect(ids.has(key), `${key} has a skill`).toBe(true)
  })

  test('unlock gates point at real math skills at levels they reach', () => {
    for (const skill of MATH_FINAL) {
      for (const gate of skill.unlocksAfter ?? []) {
        const target = findSkill(`math.${gate.skill}`) ?? MATH_FINAL.find((s) => s.id === gate.skill)
        expect(target, `${skill.id} unlocks after ${gate.skill}`).toBeTruthy()
        expect(gate.level, `${skill.id} gate ${gate.skill} level`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })

  for (const skill of MATH_FINAL) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, MATH_FINAL_IXL[`math.${skill.id}`])
    })
  }
})
