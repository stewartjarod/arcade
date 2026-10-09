import { findSkill } from '@arcade/learning'
import { describe, expect, test } from 'vitest'
import { questionHTML } from './questionHtml'

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
