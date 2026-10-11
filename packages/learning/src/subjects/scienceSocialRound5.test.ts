import { describe, expect, test } from 'vitest'
import type { Skill } from '../core/types'
import { findSubject } from './index'
import { SCIENCE_R5, SOCIAL_R5, SCIENCE_SOCIAL_R5_IXL } from './scienceSocialRound5'
import { expectIxlRefsReal, expectSkillFair } from './testing'

const ALL = [
  ...SCIENCE_R5.map((s) => ({ subject: 'science' as const, skill: s })),
  ...SOCIAL_R5.map((s) => ({ subject: 'social' as const, skill: s })),
]

const camel = /^[a-z][a-zA-Z0-9]*$/

describe('round 5 science and social: fair questions', () => {
  for (const { subject, skill } of ALL) {
    test(`${subject}.${skill.id} is fair at every level`, () => {
      expectSkillFair(subject, skill)
    })
  }

  test('answers are at most 45 characters', () => {
    for (const { subject, skill } of ALL) {
      for (let level = 1; level <= skill.maxLevel; level++) {
        for (let i = 0; i < 80; i++) {
          const item = skill.generate(level)
          expect(item.answer.length, `${subject}.${skill.id} L${level}: "${item.answer}"`).toBeLessThanOrEqual(45)
        }
      }
    }
  })
})

describe('round 5 science and social: IXL', () => {
  for (const { subject, skill } of ALL) {
    const prefix = subject === 'science' ? 'science' : 'social'
    test(`${prefix}.${skill.id} maps to real IXL categories`, () => {
      expectIxlRefsReal(`${prefix}.${skill.id}`, skill.maxLevel, SCIENCE_SOCIAL_R5_IXL[`${prefix}.${skill.id}`])
    })
  }

  test('every IXL entry belongs to a skill in this file', () => {
    const keys = ALL.map(({ subject, skill }) => `${subject === 'science' ? 'science' : 'social'}.${skill.id}`)
    expect(Object.keys(SCIENCE_SOCIAL_R5_IXL).sort()).toEqual([...keys].sort())
  })
})

describe('round 5 science and social: ids', () => {
  test('ids are camelCase and unique within this file', () => {
    const ids = ALL.map(({ skill }) => skill.id)
    for (const id of ids) expect(id, id).toMatch(camel)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })

  test('ids do not collide with the registered science or social skills', () => {
    // Count every id across the registered subjects: each of ours must appear exactly once (itself), so none is shared with another file.
    const counts = new Map<string, number>()
    for (const id of [...findSubject('science')!.skills, ...findSubject('social')!.skills].map((k) => k.id)) counts.set(id, (counts.get(id) ?? 0) + 1)
    for (const { skill } of ALL) {
      expect(counts.get(skill.id) ?? 1, `${skill.id} exists more than once among the registered skills`).toBe(1)
    }
  })

  test('there are 14 to 20 new skills, 3 levels each', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(14)
    expect(ALL.length).toBeLessThanOrEqual(20)
    for (const { skill } of ALL) expect(skill.maxLevel, skill.id).toBe(3)
  })

  test('unlocksAfter only points at skills in the same subject that exist at that level', () => {
    const subjectSkills: Record<string, Skill[]> = {
      science: [...findSubject('science')!.skills, ...SCIENCE_R5],
      social: [...findSubject('social')!.skills, ...SOCIAL_R5],
    }
    for (const { subject, skill } of ALL) {
      for (const gate of skill.unlocksAfter ?? []) {
        const target = subjectSkills[subject]!.find((s) => s.id === gate.skill)
        expect(target, `${skill.id} unlocks after ${gate.skill} in ${subject}`).toBeTruthy()
        expect(gate.level, `${skill.id} gate level`).toBeLessThanOrEqual(target!.maxLevel)
      }
    }
  })
})
