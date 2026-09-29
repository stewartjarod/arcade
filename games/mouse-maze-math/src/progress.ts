import { learner, subjectGrowth } from '@arcade/learning'
import { realmForDepth } from './realms'
import { save } from './save'

// Realms are earned by growing in math from wherever you started (1 = where your grade placed you),
// so a 1st grader and a 2nd grader both begin in the Cheese Cupboards.
export const depth = () => 1 + subjectGrowth(learner(), 'math')

export const activeRealm = () => {
  save.realmMax = Math.max(save.realmMax, realmForDepth(depth()))
  return save.realmPick >= 0 ? Math.min(save.realmPick, save.realmMax) : save.realmMax
}
