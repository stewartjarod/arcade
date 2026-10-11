import { describe, test } from 'vitest'
import { MATH_345, MATH_345_IXL } from './mathGrades345'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('grades 3–5 math skills', () => {
  for (const skill of MATH_345) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, MATH_345_IXL[`math.${skill.id}`])
    })
  }
})
