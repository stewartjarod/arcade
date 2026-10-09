import { SUBJECTS } from '../subjects'
import { gradeName, ixlRef, type IxlRef } from '../ixl/map'
import { CALIBRATION_ANSWERS, Learner } from './learner'

/**
 * A SmartScore-style 0–100 for the level they're on, with IXL's bands: 80 = proficient, 90+ = the
 * challenge zone. It's worked out from the rating (no extra saved state), so it always agrees with
 * what we ask next: at 100 the rating rolls over into the next level. IXL doesn't publish its exact
 * formula, so only the bands match; the numbers in between are ours.
 */
export type ScoreBand = 'placing' | 'practicing' | 'proficient' | 'challenge'

export interface Smart {
  band: ScoreBand
  /** 0–100 within the current level. Absent while we're still finding their starting level. */
  score?: number
}

export const smartScore = (rating: number, calibrating: boolean): Smart => {
  if (calibrating) return { band: 'placing' }
  const level = Math.max(1, Math.round(rating))
  const score = Math.min(99, Math.max(0, Math.round((rating - (level - 0.5)) * 100)))
  return { band: score >= 90 ? 'challenge' : score >= 80 ? 'proficient' : 'practicing', score }
}

export { gradeName }

/** A skill with a friendly label — for menus, profile cards, finish screens. */
export interface SkillInfo {
  id: string
  unlocked: boolean
  /** Whole level they're practicing at (0 = locked). */
  level: number
  /** 0..1 progress toward the next level. */
  progress: number
  /** Finished every level. */
  mastered: boolean
  /** "Addition up to 20", "Order of the inner planets"... (for locked skills: its first level) */
  label: string
  /** The IXL topic for their current level, if we've mapped it ("Addition up to 20", grade 1). */
  ixl?: IxlRef
  /** Where they are in this level, IXL-style. */
  smart?: Smart
}

export function skillSummary(l: Learner, subjectId: string): SkillInfo[] {
  const subject = SUBJECTS.find((s) => s.id === subjectId)
  if (!subject) return []
  return subject.skills.map((k) => {
    const id = `${subject.id}.${k.id}`
    const r = l.rating(id)
    const level = Math.round(r)
    return {
      id,
      unlocked: r > 0,
      level,
      progress: r - Math.floor(r),
      mastered: r >= k.maxLevel + 0.5,
      label: k.label(Math.min(Math.max(level, 1), k.maxLevel)),
      ixl: r > 0 ? ixlRef(id, level) : undefined,
      smart: r > 0 ? smartScore(r, l.isCalibrating(id)) : undefined,
    }
  })
}

export interface SubjectInfo {
  id: string
  name: string
  emoji: string
  /** Practiced at least once. */
  started: boolean
  /** Share of the subject's levels reached, 0..1 — for a progress bar. */
  progress: number
  /** What they're working on right now (their most-practiced unlocked skill). */
  current: string
  /** Missed facts still coming back for review. */
  review: number
  /**
   * The IXL grade they're working at in this subject (0 = Kindergarten), found from what they've
   * practiced, not from age. Absent until a mapped skill has been practiced and placed.
   */
  ixlGrade?: number
}

/** Average IXL grade across the subject's mapped, practiced, placed skills. */
export function ixlGradeFor(l: Learner, subjectId: string): number | undefined {
  const grades = SUBJECTS.find((s) => s.id === subjectId)!
    .skills.map((k) => `${subjectId}.${k.id}`)
    .filter((id) => l.seen(id) >= CALIBRATION_ANSWERS || (l.seen(id) > 0 && !l.isCalibrating(id)))
    .map((id) => ixlRef(id, Math.round(l.rating(id)))?.grade)
    .filter((g): g is number => g !== undefined)
  return grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : undefined
}

export function subjectSummary(l: Learner): SubjectInfo[] {
  return SUBJECTS.map((s) => {
    const ids = s.skills.map((k) => `${s.id}.${k.id}`)
    const total = s.skills.reduce((t, k) => t + k.maxLevel, 0)
    const reached = s.skills.reduce((t, k, i) => t + Math.min(k.maxLevel, Math.max(0, l.rating(ids[i]!) - 1)), 0)
    const open = s.skills.map((k, i) => ({ k, id: ids[i]! })).filter((x) => l.isUnlocked(x.id))
    const busiest = open.reduce<(typeof open)[number] | undefined>((a, b) => (!a || l.seen(b.id) > l.seen(a.id) ? b : a), undefined)
    return {
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      started: ids.some((id) => l.seen(id) > 0),
      progress: total ? reached / total : 0,
      current: busiest ? busiest.k.label(Math.min(Math.max(Math.round(l.rating(busiest.id)), 1), busiest.k.maxLevel)) : '',
      review: l.reviewCount(s.id),
      ixlGrade: ixlGradeFor(l, s.id),
    }
  })
}

/** Their best level in a subject — e.g. to unlock harder worlds in a game. */
export const subjectDepth = (l: Learner, subjectId: string) =>
  Math.max(0, ...l.unlockedSkills(subjectId).map((id) => l.rating(id)))

/**
 * How far they've come in a subject from the very start (0 = brand new).
 * Handy for in-game rewards like new worlds.
 */
export const subjectGrowth = (l: Learner, subjectId: string) =>
  Math.max(0, subjectDepth(l, subjectId) - subjectDepth(new Learner(l.playerId, null, {}), subjectId))

/**
 * The grade a game should use to set its difficulty in a subject. Subjects we've mapped to IXL give a real grade
 * (`known: true`); others (like geography) borrow the player's math grade so the game still ramps up, but a game
 * shouldn't show that as "Grade N <subject>".
 */
export function practiceGrade(l: Learner, subjectId: string): { grade: number; known: boolean } {
  const own = ixlGradeFor(l, subjectId)
  if (own !== undefined) return { grade: Math.round(own), known: true }
  return { grade: Math.round(ixlGradeFor(l, 'math') ?? 0), known: false }
}
