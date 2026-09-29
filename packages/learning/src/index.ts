// The i+1 math model: problem generator, skill ratings, unlock order.
export * from './math'
// Each player's saved levels (shared by every game).
export { mathLearner, peekMathSkills, mathDepth, skillSummary, type MathLearner, type SkillInfo } from './learner'
// The easy way to use it in a game: practice → moment → question → check.
export { startPractice, Practice, Moment, Question } from './practice'
// Ready-made UI.
export { numberPad, type NumberPad } from './numberPad'
export { mathChallenge, type ChallengeResult } from './challenge'

/** "7 + 5" → HTML with the operator wrapped in <span class="op">, for colorful question text. */
export const problemHTML = (text: string) => text.replace(/[+−×÷=]/g, (op) => `<span class="op">${op}</span>`)
