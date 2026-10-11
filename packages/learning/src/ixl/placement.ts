/**
 * Putting levels on IXL's grade scale: 0–100 is Kindergarten, 100–200 is 1st grade, 200–300 is 2nd, and so on.
 * "Placement" is a player's spot on that scale for a whole subject (1.4 = 140: 40% of the way through 1st grade).
 *
 * Every level of a skill is tagged with an IXL grade (map.ts). Levels at the same grade share that grade's 100
 * points evenly, so a skill with K, 1, 2, 2, 3 levels starts its levels at 0, 100, 200, 250, 300.
 * Skills we haven't mapped to IXL have no score and always start at level 1.
 */
import { IXL_LEVELS } from './map'

/** Points per grade — the IXL-style scale. */
export const POINTS_PER_GRADE = 100

/** Where each level of a skill starts on the scale, plus one last entry for where its top level ends. */
const startsCache = new Map<string, number[] | null>()
export function levelStarts(skillId: string): number[] | null {
  const hit = startsCache.get(skillId)
  if (hit !== undefined) return hit
  const refs = IXL_LEVELS[skillId]
  let starts: number[] | null = null
  if (refs?.length) {
    const perGrade = new Map<number, number>()
    for (const r of refs) perGrade.set(r.grade, (perGrade.get(r.grade) ?? 0) + 1)
    const seenAtGrade = new Map<number, number>()
    starts = refs.map((r) => {
      const j = seenAtGrade.get(r.grade) ?? 0
      seenAtGrade.set(r.grade, j + 1)
      return POINTS_PER_GRADE * (r.grade + j / perGrade.get(r.grade)!)
    })
    // The top level ends where its grade's share runs out (a lone level at a grade covers all 100 points).
    const last = refs[refs.length - 1]!
    starts.push(POINTS_PER_GRADE * (last.grade + seenAtGrade.get(last.grade)! / perGrade.get(last.grade)!))
  }
  startsCache.set(skillId, starts)
  return starts
}

/** The grade (1.4 = 140) a question at this level asks about. Undefined for skills we haven't mapped. */
export function itemGrade(skillId: string, level: number): number | undefined {
  const starts = levelStarts(skillId)
  if (!starts) return undefined
  const i = Math.min(Math.max(Math.round(level), 1), starts.length - 1) - 1
  return starts[i]! / POINTS_PER_GRADE
}

/**
 * The level a player placed at `grade` begins this skill on: the last level that starts at or below their spot.
 * A skill that only begins above them starts at level 1; one they've outgrown starts at its top level.
 */
export function startLevel(skillId: string, grade: number): number {
  const starts = levelStarts(skillId)
  if (!starts) return 1
  const at = grade * POINTS_PER_GRADE
  let level = 1
  for (let i = 0; i < starts.length - 1; i++) if (starts[i]! <= at + 1e-9) level = i + 1
  return level
}

/**
 * An IXL-style score for a skill rating: 0 up to about 600. Undefined for unmapped skills.
 * Level L covers ratings L−0.5 … L+0.5 (see smartScore), so the score slides smoothly across the level.
 */
export function ixlScore(skillId: string, rating: number): number | undefined {
  const starts = levelStarts(skillId)
  if (!starts) return undefined
  const levels = starts.length - 1
  const u = Math.min(Math.max(rating - 0.5, 0), levels)
  const i = Math.min(Math.floor(u), levels - 1)
  return Math.round(starts[i]! + (u - i) * (starts[i + 1]! - starts[i]!))
}

/** "134" → "Grade 1 · 34%". */
export const scoreLabel = (score: number) => {
  const grade = Math.floor(score / POINTS_PER_GRADE)
  const part = Math.round(score - grade * POINTS_PER_GRADE)
  return `${grade === 0 ? 'Kindergarten' : `Grade ${grade}`} · ${part}%`
}
