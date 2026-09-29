import { mathDepth } from '@arcade/learning'
import { realmForDepth } from './realms'
import { save } from './save'

export const depth = () => mathDepth(save.skills)

export const activeRealm = () => {
  save.realmMax = Math.max(save.realmMax, realmForDepth(depth()))
  return save.realmPick >= 0 ? Math.min(save.realmPick, save.realmMax) : save.realmMax
}
