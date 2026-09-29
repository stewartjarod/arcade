import { unlocked } from './math'
import { realmForDepth } from './realms'
import { save } from './save'

export const depth = () => Math.max(...unlocked(save.skills).map((k) => save.skills[k]))

export const activeRealm = () => {
  save.realmMax = Math.max(save.realmMax, realmForDepth(depth()))
  return save.realmPick >= 0 ? Math.min(save.realmPick, save.realmMax) : save.realmMax
}
