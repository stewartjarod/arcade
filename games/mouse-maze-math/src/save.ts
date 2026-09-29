import { mathLearner, type Skills, type Stats } from '@arcade/learning'
import { playerKey } from '@arcade/players'

export type Save = {
  cheese: number
  /** The player's math levels — shared with every game (see @arcade/learning). */
  skills: Skills
  stats: Stats
  mazes: number
  realmMax: number
  realmPick: number
  perfect: number
  stickers: string[]
  ownedColors: string[]
  ownedHats: string[]
  color: string
  hat: string
  muted: boolean
}

type GameSave = Omit<Save, 'skills' | 'stats'>

// Game-only things (cheese, stickers, closet) live in this game's slot for the current player.
const KEY = playerKey('mouse-maze-math', 'v1')
// Before players existed, everything (skills included) lived under this one key.
const LEGACY_KEY = 'mouse-maze-math:v1'

const fresh = (): GameSave => ({
  cheese: 0,
  mazes: 0,
  realmMax: 0,
  realmPick: -1,
  perfect: 0,
  stickers: [],
  ownedColors: ['gray'],
  ownedHats: ['none'],
  color: 'gray',
  hat: 'none',
  muted: false,
})

const read = (key: string): (Partial<Save> & Record<string, unknown>) | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

const math = mathLearner()

const load = (): Save => {
  let stored = read(KEY)
  if (!stored) {
    // Adopt progress from before players existed, once, for whoever plays first.
    stored = read(LEGACY_KEY)
    if (stored) {
      try {
        localStorage.removeItem(LEGACY_KEY)
      } catch {
        /* ignore */
      }
    }
  }
  const { skills, stats, ...game } = stored ?? {}
  if (math.isNew && skills) {
    Object.assign(math.skills, skills)
    if (stats?.seen) Object.assign(math.stats.seen, stats.seen)
    if (stats?.fast) Object.assign(math.stats.fast, stats.fast)
  }
  // skills/stats are the learner's own objects, so updates made through save.skills are shared.
  return { ...fresh(), ...game, skills: math.skills, stats: math.stats }
}

export const save = load()

export const commit = () => {
  const { skills: _skills, stats: _stats, ...game } = save
  try {
    localStorage.setItem(KEY, JSON.stringify(game))
  } catch {
    /* storage unavailable: progress just won't be remembered */
  }
  math.save()
}

// Write straight away so progress adopted from the legacy key is never only in memory.
commit()
