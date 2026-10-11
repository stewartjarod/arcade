import { playStyleFor, type PlayStyle } from '@arcade/learning'
import type { MazeOpts } from './maze'

// Grades are 0 (Kindergarten) to 5. Anything outside that range is treated as the nearest end.
const clampGrade = (grade: number) => Math.min(Math.max(grade, 0), 5)

// The most door questions a maze can have, by grade. Mazes are meant to be big and grand to walk through,
// so even kindergarten gets a proper adventure.
const JUNCTION_CAP = [8, 9, 10, 11, 12, 12]

/**
 * How long a Mouse Maze is: 5 door questions at kindergarten, one more for every grade up, and one more for every
 * three mazes won, up to the grade's cap.
 */
export const junctionsFor = (grade: number, mazesWon: number) => {
  const g = clampGrade(grade)
  return Math.min(5 + g + Math.floor(mazesWon / 3), JUNCTION_CAP[g]!)
}

/**
 * How the maze plays by grade (0 = Kindergarten):
 * - Kindergarten and grade 1, "cozy": no trap cage. A wrong door is a friendly dead end.
 * - Grades 2 and 3, "explorer": some wrong doors are traps (solve a question or two to escape).
 * - Grades 4 and 5, "speedy": traps too, plus a ⚡ bonus for answering fast.
 */
export type MazeStyle = PlayStyle
export const styleFor = playStyleFor

/**
 * Chance that a wrong door is a trap instead of a dead end. Cozy players never get traps.
 * Explorers start gentler than speedy players, and every style creeps up a little with each maze won, up to its cap.
 */
export const trapChanceFor = (grade: number, mazesWon: number) => {
  const style = styleFor(grade)
  if (style === 'cozy') return 0
  // [chance on the first maze, the highest it can grow to]
  const [start, cap] = style === 'speedy' ? [0.3, 0.5] : grade <= 2 ? [0.2, 0.35] : [0.3, 0.4]
  return Math.min(start + mazesWon * 0.02, cap)
}

/**
 * How many questions a trapped player must solve to get out of the cage: one for grade 2, two for grade 3 and up.
 * Cozy players are never caged (0).
 */
export const cageQuestionsFor = (grade: number) => (styleFor(grade) === 'cozy' ? 0 : grade <= 2 ? 1 : 2)

/**
 * Corridors (how many straight runs, and how many cells long each run is) for the maze.
 * Everyone gets long, winding ones, a little grander than the realm's own settings: watching the mouse run
 * through a big maze is half the fun, and the camera follows it all the way.
 */
export const corridorFor = (_grade: number, realm: MazeOpts): MazeOpts => ({
  runs: [1, Math.max(realm.runs[1], 3)], // 1 to 3 straight runs: open corridors spread out, which also makes a big maze quick to build
  len: [Math.max(realm.len[0], 3), Math.max(realm.len[1], 3) + 2],
})

/**
 * Seconds of thinking before the question is read out again (and the doors wiggle to say "pick one!").
 * It repeats every time that much more thinking passes.
 */
export const nudgeSecondsFor = (grade: number) => (styleFor(grade) === 'cozy' ? 8 : 12)

/** Seconds of thinking before one wrong door fades away, as a hint. Only cozy players get it (0 = never). */
export const hintSecondsFor = (grade: number) => (styleFor(grade) === 'cozy' ? 16 : 0)

/** Seconds to answer for the ⚡ quick bonus (speedy style only; 0 = no bonus). */
export const quickSecondsFor = (grade: number) => (styleFor(grade) === 'speedy' ? 6 : 0)
export const QUICK_BONUS = 5
