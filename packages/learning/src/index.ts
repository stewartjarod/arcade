/**
 * @arcade/learning — i+1 practice in every subject, saved on each player's profile.
 *
 * In a game, the easy way:      await challenge({ title: 'Bonus!' })
 * Your own way of asking:       startPractice() → practice.moment() → moment.ask() → moment.check()
 * Adding a subject:             write a Subject (subjects/) and list it in subjects/index.ts
 */

// Core: what's the same for every subject.
export type { Format, Item, ItemSpec, Prompt, Skill, Subject } from './core/types'
export { learner, peekLearner, Learner, MAX_MOMENT_DROP, type Fact, type LegacyMath } from './core/learner'
export { pickItem, canPick, type PickOptions } from './core/scheduler'
export { startPractice, Practice, Moment, Question, normalize, type PracticeOptions } from './core/practice'
export { skillSummary, subjectSummary, subjectDepth, subjectGrowth, type SkillInfo, type SubjectInfo } from './core/summary'

// Subjects.
export { SUBJECTS, findSkill, findSubject } from './subjects'

// Ready-made UI.
export { challenge, mathChallenge, type ChallengeOptions, type ChallengeResult } from './ui/challenge'
export { numberPad, type NumberPad } from './ui/numberPad'
export { choicePad, type ChoicePad } from './ui/choicePad'
export { letterPad, type LetterPad } from './ui/letterPad'
export { renderPrompt, problemHTML } from './ui/prompt'
export { speak, canSpeak } from './ui/speak'
