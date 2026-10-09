import { expect } from 'vitest'
import { Question } from '../core/practice'
import type { Item, Skill } from '../core/types'
import raw from '../ixl/skills.json'
import type { IxlRef } from '../ixl/map'

/**
 * Shared checks for tests: every question a skill can make must be answerable and fair.
 * Used by subjects.test.ts for every registered skill, and by new skill files' own tests.
 * (Only tests import this file, so it never ships in a game.)
 */

const itemAt = (subjectId: string, skill: Skill, level: number): Item => {
  const spec = skill.generate(level)
  return { ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: `${subjectId}.${skill.id}`, level }
}

/** Sweep one skill: every level, many random samples. */
export function expectSkillFair(subjectId: string, skill: Skill, samples = 60) {
  for (let level = 1; level <= skill.maxLevel; level++) {
    expect(skill.label(level), `label for level ${level}`).toBeTruthy()
    for (let i = 0; i < samples; i++) {
      const item = itemAt(subjectId, skill, level)
      const where = `${subjectId}.${skill.id} L${level}: "${item.prompt.text}" → ${item.answer}`
      expect(item.key, where).toBeTruthy()
      expect(item.prompt.text, where).toBeTruthy()
      expect(item.answer, where).toBeTruthy()
      expect(item.formats.length, where).toBeGreaterThan(0)
      expect(new Question(item).score(item.answer), where).toBe(1)

      if (item.formats.includes('number')) expect(item.answer, where).toMatch(/^\d+$/)
      if (item.formats.includes('choice')) {
        for (const n of [2, 3]) {
          const wrong = item.wrong(n)
          expect(wrong, `${where} (${n} wrong)`).toHaveLength(n)
          expect(new Set(wrong).size, `${where} distinct`).toBe(n)
          for (const w of wrong) {
            expect(w, where).toBeTruthy()
            // The real rule: no wrong option may be scored as right.
            expect(new Question(item).score(w), `${where}: "${w}" must not count as right`).toBeLessThan(1)
          }
          // And options must look different to a kid (not just differ in hidden spaces).
          expect(new Set([item.answer, ...wrong].map((x) => x.trim())).size, where).toBe(n + 1)
        }
      }
      if (skill.fromKey) {
        const again = skill.fromKey(item.key, level)
        expect(again, `${where} can be rebuilt from its key`).not.toBeNull()
        expect(again!.answer, where).toBe(item.answer)
        expect(again!.prompt.text, where).toBe(item.prompt.text)
      }
    }
  }
}

const GRADES = ['kindergarten', 'grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5']
const lists = raw as unknown as Record<string, { cat: string }[]>

/** Every IXL topic a skill claims must really exist in IXL's list (skills.json), and grades never go down by level. */
export function expectIxlRefsReal(skillId: string, maxLevel: number, refs: IxlRef[] | undefined) {
  expect(refs, `${skillId} has an IXL map entry`).toBeTruthy()
  expect(refs, `${skillId}: one IXL entry per level`).toHaveLength(maxLevel)
  refs!.forEach((r, i) => {
    const cats = (lists[`${r.subject}-${GRADES[r.grade]}`] ?? []).map((c) => c.cat.replace(/^[A-Z]+\. /, ''))
    expect(cats, `${skillId} level ${i + 1}: "${r.category}" in ${r.subject} grade ${r.grade}`).toContain(r.category)
    if (i > 0) expect(r.grade, `${skillId} level ${i + 1} should not drop a grade`).toBeGreaterThanOrEqual(refs![i - 1]!.grade)
  })
}
