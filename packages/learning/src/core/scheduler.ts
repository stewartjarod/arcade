import { findSkill, SUBJECTS } from '../subjects'
import type { Learner } from './learner'
import type { Format, Item, Skill } from './types'

/**
 * Choosing what to ask next — the "i+1" part.
 *
 * 1. Subject: the grown-up's focus subject half the time; otherwise rotate, favoring
 *    whatever hasn't been practiced for longest.
 * 2. Skill: weaker skills in that subject come up more, so nothing gets left behind.
 * 3. Question: sometimes a fact they missed earlier that's due for another go;
 *    otherwise a fresh one — mostly at their level, sometimes one harder (the i+1
 *    zone), sometimes one easier as review. That mix lands around 85% right.
 */
export interface PickOptions {
  /** Only these subjects (ids). Default: all. */
  subjects?: string[]
  /** Only questions answerable this way. Default: any. */
  formats?: Format[]
  /** Can we play sound? Default: yes if the browser can speak. */
  audio?: boolean
}

const canSpeakDefault = () => typeof speechSynthesis !== 'undefined'

interface Candidate {
  id: string
  subject: string
  skill: Skill
}

function candidates(l: Learner, o: PickOptions): Candidate[] {
  const audio = o.audio ?? canSpeakDefault()
  return SUBJECTS.filter((s) => !o.subjects || o.subjects.includes(s.id)).flatMap((s) =>
    s.skills
      .filter((k) => !o.formats || k.formats.some((f) => o.formats!.includes(f)))
      .filter((k) => audio || !k.listen)
      .map((k) => ({ id: `${s.id}.${k.id}`, subject: s.id, skill: k }))
      .filter((c) => l.isUnlocked(c.id)),
  )
}

const weighted = <T,>(items: T[], weight: (t: T) => number): T => {
  const ws = items.map(weight)
  let roll = Math.random() * ws.reduce((a, b) => a + b, 0)
  return items.find((_, i) => (roll -= ws[i]!) < 0) ?? items[0]!
}

/** Can anything be asked with these options? */
export function canPick(l: Learner, o: PickOptions = {}) {
  return candidates(l, o).length > 0
}

export function pickItem(l: Learner, o: PickOptions = {}, avoidKey?: string): Item {
  const all = candidates(l, o)
  if (!all.length) throw new Error('Nothing to practice with these options')

  // 1. Subject
  const subjects = [...new Set(all.map((c) => c.subject))]
  let subject: string
  if (l.focus && subjects.includes(l.focus) && Math.random() < 0.5) subject = l.focus
  else {
    const stalest = subjects.reduce((a, b) => (l.lastPracticed(a) <= l.lastPracticed(b) ? a : b))
    subject = weighted(subjects, (s) => (s === stalest && subjects.length > 1 ? 2 : 1))
  }

  // 2. Skill: weaker ones more often
  const skills = all.filter((c) => c.subject === subject)
  const top = Math.max(...skills.map((c) => l.rating(c.id)))
  const c = weighted(skills, (k) => 1 + (top - l.rating(k.id)) * 0.4)

  // 3. A missed fact that's due, some of the time
  const formats = o.formats
  const usable = (it: Item) => (!formats || it.formats.some((f) => formats.includes(f))) && it.key !== avoidKey
  const due = l.dueFacts(c.id)
  if (due.length && c.skill.fromKey && Math.random() < 0.35) {
    const f = due[0]!
    const spec = c.skill.fromKey(f.key, f.level)
    if (spec) {
      const it = finish(c, spec, f.level)
      if (usable(it)) return it
    }
  }

  // ...or a fresh one around their level
  const base = Math.max(1, Math.round(l.rating(c.id)))
  const r = Math.random()
  const level = clampLevel(c.skill, r < 0.7 ? base : r < 0.9 ? base + 1 : base - 1)
  return generate(c.id, level, usable)
}

/** Another question from the same skill and level (e.g. "try one like it"). */
export function pickSimilar(to: Item, avoidKey = to.key): Item {
  return generate(to.skill, to.level, (it) => it.key !== avoidKey)
}

function generate(skillId: string, level: number, ok: (it: Item) => boolean): Item {
  const skill = findSkill(skillId)!
  const c = { id: skillId, subject: skillId.split('.')[0]!, skill }
  let it = finish(c, skill.generate(level), level)
  for (let i = 0; i < 20 && !ok(it); i++) it = finish(c, skill.generate(level), level)
  return it
}

const clampLevel = (skill: Skill, level: number) => Math.min(skill.maxLevel, Math.max(1, level))

function finish(c: Candidate, spec: ReturnType<Skill['generate']>, level: number): Item {
  return { ...spec, formats: spec.formats ?? c.skill.formats, listen: spec.listen ?? c.skill.listen, skill: c.id, level }
}
