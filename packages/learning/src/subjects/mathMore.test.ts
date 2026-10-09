import { describe, test } from 'vitest'
import { MORE_MATH, MORE_MATH_IXL } from './mathMore'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('more math skills', () => {
  for (const skill of MORE_MATH) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, MORE_MATH_IXL[`math.${skill.id}`])
    })
  }
})
