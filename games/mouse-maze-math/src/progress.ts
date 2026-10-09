import { SUBJECTS, learner, subjectGrowth } from '@arcade/learning'
import { realmForDepth } from './realms'
import { save } from './save'

// The maze asks door-pick (multiple choice) questions, so any subject that has some can be played.
export const playableSubjects = () => SUBJECTS.filter((s) => s.skills.some((k) => k.formats.includes('choice')))
export const currentSubject = () => (playableSubjects().some((s) => s.id === save.subject) ? save.subject : 'math')

// Realms are earned by growing in the subject you're practicing, from wherever you started (1 = where
// you began), so a 1st grader and a 2nd grader both begin in the Cheese Cupboards.
export const depth = () => 1 + subjectGrowth(learner(), currentSubject())

export const activeRealm = () => {
  save.realmMax = Math.max(save.realmMax, realmForDepth(depth()))
  return save.realmPick >= 0 ? Math.min(save.realmPick, save.realmMax) : save.realmMax
}
