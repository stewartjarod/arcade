import { describe, expect, test } from 'vitest'
import type { Skill, Teach } from '../core/types'
import { math } from './math'
import { MATH_EARLY } from './mathEarly'

/** The skills defined in math.ts itself (the + − × ÷ facts, counting, comparing, place value, skip counting) plus mathEarly.ts. */
const OWN_IDS = new Set(['add', 'sub', 'mul', 'div', 'count', 'compare', 'place', 'skip'])
const skills = [...math.skills.filter((s) => OWN_IDS.has(s.id)), ...MATH_EARLY]
const withTeach = skills.filter((s): s is Skill & { teach: (L: number) => Teach } => typeof s.teach === 'function')

const NAMES = /\b(Ima|Millie)\b/
const KID_BANNED = /\bgrade\b|IXL|\bscore\b|\blevel\b/i
// Kids hear the say version, so signs are spelled out there ("plus", "minus", "times", "equals").
const SIGNS = /[+−×÷=<>]/

describe('math teach cards', () => {
  test('at least 6 skills define teach', () => {
    expect(withTeach.length).toBeGreaterThanOrEqual(6)
  })

  for (const skill of withTeach) {
    test(`${skill.id}: every level has a short, kid-safe card`, () => {
      for (let L = 1; L <= skill.maxLevel; L++) {
        const card = skill.teach(L)
        const where = `math.${skill.id} level ${L}`
        expect(card.text.length, where).toBeGreaterThan(0)
        expect(card.text.length, where).toBeLessThanOrEqual(140)
        expect(card.say, where).toBeTruthy()
        expect(`${card.text} ${card.say}`, where).not.toMatch(NAMES)
        expect(`${card.text} ${card.say}`, where).not.toMatch(KID_BANNED)
        expect(card.say!, where).not.toMatch(SIGNS)
        if (card.example) {
          expect(card.example.answer.trim(), where).not.toBe('')
          expect(card.example.prompt.text.trim(), where).not.toBe('')
        }
      }
    })
  }
})
