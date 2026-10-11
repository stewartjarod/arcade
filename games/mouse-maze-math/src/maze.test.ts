import { describe, expect, test } from 'vitest'
import { REALMS } from './realms'
import { generateMaze, type Layout } from './maze'
import { corridorFor, junctionsFor } from './difficulty'

// Every cell the maze uses along its exits: a rough size of the maze.
const pathCells = (layout: Layout) => layout.junctions.reduce((sum, j) => sum + j.exits.reduce((s, e) => s + e.path.length, 0), 0)

describe('big mazes still make quickly, in every realm', () => {
  test('the biggest maze of each realm usually makes in well under 200 ms (the middle one of 15 tries)', () => {
    for (const r of REALMS) {
      const times: number[] = []
      for (let i = 0; i < 15; i++) {
        const t0 = performance.now()
        generateMaze(junctionsFor(5, 100), 0.3, corridorFor(0, { runs: r.runs, len: r.len }))
        times.push(performance.now() - t0)
      }
      // The median, so one slow try (or a busy computer) can't fail the test.
      expect(times.sort((a, b) => a - b)[7]!, r.id).toBeLessThan(200)
    }
  }, 30_000) // 120 big mazes: give a busy computer plenty of time

  test('mazes have the right number of questions, three exits each, and a goal', { timeout: 30_000 }, () => {
    for (const r of REALMS) {
      for (let g = 0; g <= 5; g++) {
        const layout = generateMaze(junctionsFor(g, 0), 0, corridorFor(g, { runs: r.runs, len: r.len }))
        expect(layout.junctions.length).toBe(junctionsFor(g, 0))
        expect(layout.junctions.every((j) => j.exits.length === 3)).toBe(true)
        expect(layout.goal).toBeTruthy()
      }
    }
  })

  test('wrong doors lead to short corridors, so a wrong answer is a quick walk back', () => {
    for (let i = 0; i < 30; i++) {
      for (const j of generateMaze(junctionsFor(5, 100), 0.3, corridorFor(0, { runs: REALMS[0]!.runs, len: REALMS[0]!.len })).junctions)
        for (const e of j.exits) if (e.kind !== 'path') expect(e.path.length).toBeLessThanOrEqual(3)
    }
  })

  test('a kindergarten maze is big: plenty of corridor to run through', () => {
    const realm = REALMS[0]!
    let total = 0
    for (let i = 0; i < 30; i++) total += pathCells(generateMaze(junctionsFor(0, 0), 0, corridorFor(0, { runs: realm.runs, len: realm.len })))
    expect(total / 30).toBeGreaterThan(60)
  })
})
