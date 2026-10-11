import { describe, test } from 'vitest'
import { MATH_EARLY, MATH_EARLY_IXL } from './mathEarly'
import { expectIxlRefsReal, expectSkillFair } from './testing'

describe('early math skills (K-2)', () => {
  for (const skill of MATH_EARLY) {
    test(`${skill.id}: every level is fair`, () => {
      expectSkillFair('math', skill)
    })
    test(`${skill.id}: IXL refs are real`, () => {
      expectIxlRefsReal(`math.${skill.id}`, skill.maxLevel, MATH_EARLY_IXL[`math.${skill.id}`])
    })
  }
})
