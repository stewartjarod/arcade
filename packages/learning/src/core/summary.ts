import { SUBJECTS } from '../subjects'
import { Learner } from './learner'

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
  /** "Adding up to 20", "Order of the inner planets"... (for locked skills: its first level) */
  label: string
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
