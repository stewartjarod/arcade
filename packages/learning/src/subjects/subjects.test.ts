import { describe, expect, test } from 'vitest'
import { Question } from '../core/practice'
import type { Item, Skill } from '../core/types'
import { SUBJECTS } from '.'
import { misspell } from './writing'

// Every question every subject can make should be answerable and fair.
// This sweeps all skills × levels with many random samples.
const SAMPLES = 60

const itemAt = (subject: string, skill: Skill, level: number): Item => {
  const spec = skill.generate(level)
  return { ...spec, formats: spec.formats ?? skill.formats, listen: spec.listen ?? skill.listen, skill: `${subject}.${skill.id}`, level }
}

for (const subject of SUBJECTS) {
  describe(`${subject.emoji} ${subject.name}`, () => {
    for (const skill of subject.skills) {
      test(`${skill.id}: every level makes fair questions`, () => {
        for (let level = 1; level <= skill.maxLevel; level++) {
          expect(skill.label(level), `label for level ${level}`).toBeTruthy()
          for (let i = 0; i < SAMPLES; i++) {
            const item = itemAt(subject.id, skill, level)
            const where = `${subject.id}.${skill.id} L${level}: "${item.prompt.text}" → ${item.answer}`
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
      })
    }
  })
}

test('skill ids are unique within each subject, and prerequisites exist', () => {
  for (const s of SUBJECTS) {
    const ids = s.skills.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const k of s.skills) for (const p of k.unlocksAfter ?? []) expect(ids).toContain(p.skill)
  }
})

describe('specific content', () => {
  const skill = (id: string) => {
    const [s, k] = id.split('.')
    return SUBJECTS.find((x) => x.id === s)!.skills.find((x) => x.id === k)!
  }

  test('clock times read correctly and the classic mix-ups are offered', () => {
    const it = skill('clocks.time').fromKey!('clock:3:30', 2)!
    expect(it.answer).toBe('3:30')
    expect(it.prompt.svg).toContain('<svg')
    const wrong = it.wrong(5)
    expect(wrong).toContain('6:15') // hands swapped
    expect(wrong).toContain('4:30') // hour hand read as the next hour
  })

  test('capitals: tricky state names are found exactly', () => {
    const cap = skill('geography.capitals')
    expect(cap.fromKey!('What is the capital of West Virginia?', 4)!.answer).toBe('Charleston')
    expect(cap.fromKey!('What is the capital of Virginia?', 4)!.answer).toBe('Richmond')
    expect(cap.fromKey!('What is the capital of Arkansas?', 4)!.answer).toBe('Little Rock')
    expect(cap.fromKey!('What is the capital of Kansas?', 2)!.answer).toBe('Topeka')
    expect(cap.fromKey!('Denver is the capital of which state?', 1)!.answer).toBe('Colorado')
  })

  test('spelling gives half credit for one letter off on longer words', () => {
    const it = skill('writing.spell').fromKey!('because', 5)!
    expect(new Question({ ...it, skill: 'writing.spell', level: 5, formats: ['letters'] }).score('becuase')).toBe(0.5)
    expect(new Question({ ...it, skill: 'writing.spell', level: 5, formats: ['letters'] }).score('BECAUSE')).toBe(1)
    const short = skill('writing.spell').fromKey!('cat', 1)!
    expect(new Question({ ...short, skill: 'writing.spell', level: 1, formats: ['letters'] }).score('cot')).toBe(0)
  })

  test('misspellings look like real kid mistakes', () => {
    expect(misspell('because', 3)).toEqual(expect.arrayContaining(['becuz', 'becaus', 'becose']))
    expect(misspell('rain', 6)).toContain('ran')
    expect(misspell('cake', 6)).toContain('cak')
    for (const w of ['cat', 'ship', 'boat', 'said', 'they']) expect(misspell(w, 3)).not.toContain(w)
  })

  test('homophones are spoken in a sentence so kids know which one to spell', () => {
    expect(skill('writing.spell').fromKey!('their', 5)!.prompt.say).toMatch(/their\. .+ their\./)
  })

  test('sight-word questions need sound; picture words do not', () => {
    expect(skill('reading.sight').listen).toBe(true)
    expect(skill('reading.words').listen).toBeFalsy()
  })

  test('planet order questions agree with the real order', () => {
    const order = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
    for (let i = 0; i < 300; i++) {
      const it = skill('space.order').generate(1 + (i % 4))
      const after = it.prompt.text.match(/comes right after (\w+)/)?.[1]
      if (after) expect(order.indexOf(it.answer)).toBe(order.indexOf(after) + 1)
      const before = it.prompt.text.match(/comes right before (\w+)/)?.[1]
      if (before) expect(order.indexOf(it.answer)).toBe(order.indexOf(before) - 1)
      const between = it.prompt.text.match(/between (\w+) and (\w+)/)
      if (between) expect(order.indexOf(it.answer)).toBe(order.indexOf(between[1]!) + 1)
      const nth = it.prompt.text.match(/is (\d)(st|nd|rd|th) from the Sun/)?.[1]
      if (nth) expect(order.indexOf(it.answer)).toBe(Number(nth) - 1)
      const closer = it.prompt.text.match(/closer to the Sun than (\w+)/)?.[1]
      if (closer) expect(Number(it.answer)).toBe(order.indexOf(closer))
    }
  })

  test('coin totals add up', () => {
    const value: Record<string, number> = { penny: 1, pennies: 1, nickel: 5, nickels: 5, dime: 10, dimes: 10, quarter: 25, quarters: 25 }
    for (let i = 0; i < 300; i++) {
      const it = skill('clocks.coins').generate(2 + (i % 3))
      const total = [...it.prompt.text.matchAll(/(\d+) (\w+)/g)].reduce((t, [, n, c]) => t + Number(n) * value[c!]!, 0)
      expect(Number(it.answer), it.prompt.text).toBe(total)
    }
  })

  test('math answers are right', () => {
    for (const id of ['math.add', 'math.sub', 'math.mul', 'math.div']) {
      for (let level = 1; level <= 12; level++) {
        const it = skill(id).generate(level)
        const [a, op, b] = it.prompt.text.split(' ')
        const v = { '+': +a! + +b!, '−': +a! - +b!, '×': +a! * +b!, '÷': +a! / +b! }[op!]
        expect(Number(it.answer), it.prompt.text).toBe(v)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(v)).toBe(true)
      }
    }
  })
})
