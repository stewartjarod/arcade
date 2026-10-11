import { learner, type LegacyMath } from '@arcade/learning'
import { playerKey } from '@arcade/players'
import { migrateRealmIndex } from './realms'

// Math levels aren't saved here: they live on the player's profile (@arcade/learning),
// shared with every game. This save is just Mouse Maze Math's own stuff.
export type Save = {
  cheese: number
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
  /** What the maze asks about: 'math', 'reading', 'science'... */
  subject: string
  /** 2 = realm numbers use the list with Candy Kitchen and Frozen Pantry. */
  realmsV?: number
}

// Game-only things (cheese, stickers, closet) live in this game's slot for the current player.
const KEY = playerKey('mouse-maze-math', 'v1')
// Before players existed, everything (skills included) lived under this one key.
const LEGACY_KEY = 'mouse-maze-math:v1'

const fresh = (): Save => ({
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
  subject: 'math',
  realmsV: 2,
})

const read = (key: string): (Partial<Save> & LegacyMath) | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

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
  // Old saves kept math levels here; hand them to the profile if it has none yet.
  const { skills, stats, ...game } = stored ?? {}
  const profile = learner()
  if (skills && profile.isNew) {
    profile.adoptLegacyMath({ skills, stats })
    profile.save()
  }
  const loaded = { ...fresh(), ...game }
  if (stored && (game as Partial<Save>).realmsV === undefined) {
    // An older save: translate its realm numbers to the new list.
    loaded.realmMax = migrateRealmIndex(loaded.realmMax)
    loaded.realmPick = migrateRealmIndex(loaded.realmPick)
    loaded.realmsV = 2
  }
  return loaded
}

export const save = load()

export const commit = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    /* storage unavailable: progress just won't be remembered */
  }
}

// Write straight away so progress adopted from the legacy key is never only in memory.
commit()
