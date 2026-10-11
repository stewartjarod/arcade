import { findSkill } from '@arcade/learning'
import { describe, expect, test } from 'vitest'
import { questionHTML, svgWidthFor } from './questionHtml'

// Every math question that comes with a picture must show its picture in the maze.
describe('Mouse Maze question banner', () => {
  test('picture questions show the picture ("How many?", "How many sides?", shape names)', () => {
    for (const id of ['math.count', 'math.sides', 'math.shapes']) {
      const skill = findSkill(id)!
      for (let level = 1; level <= skill.maxLevel; level++) {
        const html = questionHTML(skill.generate(level).prompt)
        expect(html, `${id} L${level}`).toContain('<svg')
        expect(html, `${id} L${level}`).toContain('qpic')
      }
    }
  })

  test('plain sums look the same as before', () => {
    const html = questionHTML({ text: '7 + 5', sum: true })
    expect(html).not.toContain('qpic')
    expect(html).toContain('qmark')
  })
})

test('the words are one box, with or without a picture', () => {
  expect(questionHTML({ text: '7 + 5', sum: true })).toMatch(/^<span class="qwords">.*<\/span>$/)
  const html = questionHTML({ text: 'How many?', emoji: '🐟 🐟' })
  expect(html.match(/class="qwords"/g)?.length).toBe(1)
})

test('a fill-in blank of any length shows as one ?', () => {
  for (const blank of ['__', '___', '____']) {
    const html = questionHTML({ text: `We ride our ${blank} to the park.` })
    expect(html).toContain('qmark')
    expect(html).not.toContain('_')
  }
})

describe('Picture sums', () => {
  test('keep each side together so a long row wraps at the + sign', () => {
    const html = questionHTML({ text: 'Mia has 8 stars. Mia gets 1 more.', emoji: '⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ + ⭐' })
    expect(html.match(/white-space:nowrap/g)?.length).toBe(2)
    expect(html).toContain('>+ ⭐</span>')
  })
})

describe('Drawings with text', () => {
  test('get the labeled class so they are drawn larger', () => {
    const svg = '<svg viewBox="0 0 100 100"><text x="1" y="1">5</text></svg>'
    expect(questionHTML({ text: 'How many?', svg })).toContain('qpic labeled')
    expect(questionHTML({ text: 'How many?', svg: '<svg viewBox="0 0 100 100"><circle r="4"/></svg>' })).not.toContain('labeled')
  })
})

describe('Drawing size', () => {
  test('a drawing with tiny text grows, up to a cap', () => {
    const tiny = '<svg viewBox="0 0 292 292"><text font-size="12">3</text></svg>'
    expect(svgWidthFor(tiny)).toBe(250)
    const roomy = '<svg viewBox="0 0 100 100"><text font-size="20">3</text></svg>'
    expect(svgWidthFor(roomy)).toBe(55)
    expect(svgWidthFor('<svg viewBox="0 0 100 100"><circle r="4"/></svg>')).toBe(0)
  })
})
