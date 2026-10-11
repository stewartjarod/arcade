import { describe, expect, test } from 'vitest'
import type { Skill } from '../core/types'
import { MATH_LAST, MATH_LAST_IXL } from './mathLast'
import { SUBJECTS } from './index'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('last math skills', () => {
  test('ids appear exactly once among math skills (registry plus these)', () => {
    const registered = SUBJECTS.find((s) => s.id === 'math')?.skills ?? []
    // Same skill object may be in both lists once it is registered; count each object once.
    const all = [...new Set<Skill>([...registered, ...MATH_LAST])]
    for (const skill of MATH_LAST) {
      expect(all.filter((s) => s.id === skill.id), `math.${skill.id} id`).toHaveLength(1)
    }
  })

  for (const skill of MATH_LAST) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, MATH_LAST_IXL[`math.${skill.id}`])
    })
  }
})
