import { describe, expect, test } from 'vitest'
import { findSkill } from '../subjects'
import { IXL_LEVELS } from './map'
import raw from './skills.json'

// skills.json is the full IXL list: "<subject>-<grade>" → categories → [code, name].
const lists = raw as unknown as Record<string, { cat: string; skills: [string, string][] }[]>
const GRADES = ['kindergarten', 'grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5']
const categories = (subject: string, grade: number) => (lists[`${subject}-${GRADES[grade]}`] ?? []).map((c) => c.cat.replace(/^[A-Z]+\. /, ''))

describe('IXL level map', () => {
  test('the full IXL list covers every subject and grade', () => {
    for (const subject of ['math', 'ela', 'science', 'social-studies']) for (const g of GRADES) expect(lists[`${subject}-${g}`]?.length, `${subject}-${g}`).toBeGreaterThan(5)
  })

  for (const [id, refs] of Object.entries(IXL_LEVELS)) {
    test(`${id}: one real IXL category per level, climbing in grade`, () => {
      const skill = findSkill(id)
      expect(skill, `${id} exists`).toBeTruthy()
      expect(refs, 'one entry per level').toHaveLength(skill!.maxLevel)
      refs.forEach((r, i) => {
        expect(categories(r.subject, r.grade), `level ${i + 1}: "${r.category}" in grade ${r.grade}`).toContain(r.category)
        if (i > 0) expect(r.grade, `level ${i + 1} should not drop a grade`).toBeGreaterThanOrEqual(refs[i - 1]!.grade)
      })
    })
  }
})
