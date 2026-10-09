import { describe, test } from 'vitest'
import { GRADE5_MATH, GRADE5_MATH_IXL } from './mathGrade5'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('grade 5 math skills', () => {
  for (const skill of GRADE5_MATH) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, GRADE5_MATH_IXL[`math.${skill.id}`])
    })
  }
})
