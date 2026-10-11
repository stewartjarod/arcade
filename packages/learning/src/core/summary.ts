import { SUBJECTS } from '../subjects'
import { gradeName, ixlRef, IXL_LEVELS, type IxlRef } from '../ixl/map'
import { ixlScore, POINTS_PER_GRADE } from '../ixl/placement'
import { Learner, PLACING_ANSWERS } from './learner'

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

/**
 * The IXL grade they're working at in a subject, from their placement (1.4 = 140). Undefined until we know
 * something: no grade on their profile and nothing practiced yet, or a subject we haven't mapped to IXL.
 */
export function ixlGradeFor(l: Learner, subjectId: string): number | undefined {
  const subject = SUBJECTS.find((s) => s.id === subjectId)
  if (!subject?.skills.some((k) => IXL_LEVELS[`${subjectId}.${k.id}`])) return undefined
  const { grade, answers } = l.placement(subjectId)
  if (answers === 0 && l.grade === undefined) return undefined
  return Math.round(grade * 10) / 10
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
  Math.max(0, subjectDepth(l, subjectId) - subjectDepth(new Learner(l.playerId, null, { grade: l.grade, focus: l.focus }), subjectId))

/**
 * The grade a game should use to set its difficulty in a subject. Subjects we've mapped to IXL give a real grade
 * (`known: true`); others (like geography) borrow the player's math grade so the game still ramps up, but a game
 * shouldn't show that as "Grade N <subject>".
 */
export function practiceGrade(l: Learner, subjectId: string): { grade: number; known: boolean } {
  const own = ixlGradeFor(l, subjectId)
  if (own !== undefined) return { grade: l.playGrade(subjectId, Math.round(own)), known: true }
  return { grade: l.playGrade('math', Math.round(ixlGradeFor(l, 'math') ?? 0)), known: false }
}

/** A round is starting in these subjects: remember the grade it plays at (see Learner.playGrade). */
export function notePracticeGrades(l: Learner, subjectIds: string[]) {
  for (const id of subjectIds) l.notePlayed(id, practiceGrade(l, id).grade)
}

/**
 * How a game should play for an IXL grade (0 = Kindergarten), so every game changes its *mechanics*, not just its size:
 * cozy (K–1: gentle, nothing can be lost), explorer (2–3: real stakes) and speedy (4–5: stakes plus a bonus for answering fast).
 */
export type PlayStyle = 'cozy' | 'explorer' | 'speedy'
export const playStyleFor = (grade: number): PlayStyle => (grade <= 1 ? 'cozy' : grade <= 3 ? 'explorer' : 'speedy')


// ---------------------------------------------------------------------------------------------
//  The grown-up report: IXL-style scores. Kids don't see these (see the parent page).
// ---------------------------------------------------------------------------------------------

export interface ReportSkill {
  id: string
  label: string
  /** The IXL topic for their current level. */
  ixl?: IxlRef
  /** 0–600 on the IXL-style scale (100 per grade). Absent for skills we haven't mapped. */
  score?: number
  level: number
  /** Answers so far. 0 = never asked yet; the score is then just where we'd start them. */
  seen: number
  band: ScoreBand | 'new'
  smart?: number
}

export interface ReportSubject {
  id: string
  name: string
  emoji: string
  /** Their spot on the scale, 0–600. Absent for subjects we haven't mapped to IXL. */
  score?: number
  /** Answers that spot rests on; low means it's still a rough guess. */
  answers: number
  placing: boolean
  skills: ReportSkill[]
  review: number
}

export function ixlReport(l: Learner): ReportSubject[] {
  return SUBJECTS.map((s) => {
    const grade = ixlGradeFor(l, s.id)
    const { answers } = l.placement(s.id)
    const skills = s.skills.map((k): ReportSkill => {
      const id = `${s.id}.${k.id}`
      const r = l.rating(id)
      const level = Math.min(Math.max(Math.round(r), 1), k.maxLevel)
      const sm = r > 0 ? smartScore(r, l.isCalibrating(id)) : undefined
      return {
        id,
        label: k.label(level),
        ixl: r > 0 ? ixlRef(id, level) : undefined,
        score: r > 0 ? ixlScore(id, r) : undefined,
        level: r > 0 ? level : 0,
        seen: l.seen(id),
        band: l.seen(id) === 0 ? 'new' : sm!.band,
        smart: sm?.score,
      }
    })
    return {
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      score: grade === undefined ? undefined : Math.round(grade * POINTS_PER_GRADE),
      answers,
      placing: answers < PLACING_ANSWERS,
      skills,
      review: l.reviewCount(s.id),
    }
  })
}
