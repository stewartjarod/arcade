/**
 * How long a Mouse Maze is: more door questions as the player's IXL grade in the subject goes up
 * (0 = Kindergarten), and a few more as they win mazes, up to 10 questions.
 */
export const junctionsFor = (grade: number, mazesWon: number) => Math.min(3 + Math.min(Math.max(grade, 0), 5) + Math.floor(mazesWon / 3), 10)

/**
 * How the maze plays by grade (0 = Kindergarten):
 * - Kindergarten and grade 1, "cozy": no trap cage. A wrong door is a friendly dead end.
 * - Grades 2 and 3, "explorer": some wrong doors are traps (solve two questions to escape).
 * - Grades 4 and 5, "speedy": traps too, plus a ⚡ bonus for answering fast.
 */
export type MazeStyle = 'cozy' | 'explorer' | 'speedy'
export const styleFor = (grade: number): MazeStyle => (grade <= 1 ? 'cozy' : grade <= 3 ? 'explorer' : 'speedy')

/** Chance that a wrong door is a trap instead of a dead end. */
export const trapChanceFor = (grade: number, mazesWon: number) => (styleFor(grade) === 'cozy' ? 0 : Math.min(0.3 + mazesWon * 0.02, 0.5))

/** Seconds to answer for the ⚡ quick bonus (speedy style only; 0 = no bonus). */
export const quickSecondsFor = (grade: number) => (styleFor(grade) === 'speedy' ? 6 : 0)
export const QUICK_BONUS = 5
