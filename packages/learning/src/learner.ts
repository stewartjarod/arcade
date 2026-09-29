import { currentPlayer, playerKey } from '@arcade/players'
import { KINDS, START_SKILLS, START_STATS, describe, unlocked, type Kind, type Skills, type Stats } from './math'

/**
 * What a player knows, saved on their profile — not inside any one game.
 * Every game that asks math questions uses the same learner, so practice in
 * one game levels you up in all of them.
 *
 * Most games should use startPractice() (practice.ts), which applies all the
 * i+1 rules for you. Use the learner directly only to read levels.
 */
export interface MathLearner {
  readonly playerId: string
  skills: Skills
  stats: Stats
  /** True if this player has never practiced math in any game yet. */
  readonly isNew: boolean
  save(): void
}

// Stored under a pseudo-game called "learning", so it's deleted with the player
// and handed from Guest to the first real player like any other save.
const key = (playerId: string) => playerKey('learning', 'math', playerId)

// One learner per player per page, so every part of a game shares the same
// numbers instead of loading separate copies that overwrite each other.
const cache = new Map<string, MathLearner>()

type Stored = Partial<{ skills: Skills; stats: Stats }> | null
const readStored = (playerId: string): Stored => {
  try {
    return JSON.parse(localStorage.getItem(key(playerId)) ?? 'null')
  } catch {
    return null // unreadable or unavailable: start fresh
  }
}

/**
 * A player's current levels straight from storage, for display only (e.g. the homepage),
 * so they're never stale. Returns null if they haven't practiced yet.
 */
export function peekMathSkills(playerId = currentPlayer().id): Skills | null {
  const stored = readStored(playerId)
  return stored ? { ...START_SKILLS, ...stored.skills } : null
}

export function mathLearner(playerId = currentPlayer().id): MathLearner {
  const cached = cache.get(playerId)
  if (cached) return cached

  const stored = readStored(playerId)
  const skills: Skills = { ...START_SKILLS, ...stored?.skills }
  const fresh = START_STATS()
  const stats: Stats = {
    seen: { ...fresh.seen, ...stored?.stats?.seen },
    fast: { ...fresh.fast, ...stored?.stats?.fast },
  }
  let isNew = !stored
  const learner: MathLearner = {
    playerId,
    skills,
    stats,
    get isNew() {
      return isNew
    },
    save() {
      isNew = false
      try {
        localStorage.setItem(key(playerId), JSON.stringify({ skills, stats }))
      } catch {
        /* storage unavailable */
      }
    },
  }
  cache.set(playerId, learner)
  return learner
}

/** The player's overall math "depth": their best level among unlocked skills. */
export const mathDepth = (skills: Skills) => Math.max(...unlocked(skills).map((k) => skills[k]))

export interface SkillInfo {
  kind: Kind
  unlocked: boolean
  /** Whole level they're practicing at. */
  level: number
  /** 0..1 progress toward the next level. */
  progress: number
  /** "Adding up to 20", "Times tables: 2, 5, 10"... */
  label: string
}

/** Every skill with a friendly label — for menus, profile cards, finish screens. */
export function skillSummary(skills: Skills): SkillInfo[] {
  const open = unlocked(skills)
  return KINDS.map((kind) => {
    const r = skills[kind]
    const on = open.includes(kind)
    return {
      kind,
      unlocked: on,
      level: Math.round(r),
      progress: r - Math.floor(r),
      label: on ? describe(kind, Math.round(r)) : 'Unlocks as you grow',
    }
  })
}
