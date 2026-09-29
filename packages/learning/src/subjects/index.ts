import type { Skill, Subject } from '../core/types'
import { clocksCoins } from './clocksCoins'
import { geography } from './geography'
import { math } from './math'
import { reading } from './reading'
import { space } from './space'
import { writing } from './writing'

/**
 * Every subject in the arcade. To add one: write a Subject (see math.ts or space.ts
 * for examples), add it here, and every game can start asking its questions.
 */
export const SUBJECTS: Subject[] = [math, reading, writing, space, geography, clocksCoins]

const skills = new Map<string, Skill>()
for (const s of SUBJECTS) for (const k of s.skills) skills.set(`${s.id}.${k.id}`, k)

/** Look up a skill by its full id ("math.add"). */
export const findSkill = (id: string) => skills.get(id)
export const findSubject = (id: string) => SUBJECTS.find((s) => s.id === id)
