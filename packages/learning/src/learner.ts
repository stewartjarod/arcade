import { playerKey } from '@arcade/players'
import { START_SKILLS, START_STATS, type Skills, type Stats } from './math'

/**
 * What a player knows, saved on their profile — not inside any one game.
 * Every game that asks math questions uses the same learner, so practice in
 * one game levels you up in all of them.
 *
 *   const math = mathLearner()
 *   const p = chooseProblem(math.skills)
 *   updateSkill(math.skills, math.stats, p, correct ? 1 : 0)
 *   math.save()
 */
export interface MathLearner {
  skills: Skills
  stats: Stats
  /** True if this player has never practiced math in any game yet. */
  readonly isNew: boolean
  save(): void
}

// Stored under a pseudo-game called "learning", so it's deleted with the player
// and handed from Guest to the first real player like any other save.
const key = (playerId?: string) => playerKey('learning', 'math', playerId)

export function mathLearner(playerId?: string): MathLearner {
  let stored: Partial<{ skills: Skills; stats: Stats }> | null = null
  try {
    stored = JSON.parse(localStorage.getItem(key(playerId)) ?? 'null')
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  const skills: Skills = { ...START_SKILLS, ...stored?.skills }
  const fresh = START_STATS()
  const stats: Stats = {
    seen: { ...fresh.seen, ...stored?.stats?.seen },
    fast: { ...fresh.fast, ...stored?.stats?.fast },
  }
  return {
    skills,
    stats,
    isNew: !stored,
    save() {
      try {
        localStorage.setItem(key(playerId), JSON.stringify({ skills, stats }))
      } catch {
        /* storage unavailable */
      }
    },
  }
}
