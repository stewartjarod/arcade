import type { Skill, Subject } from '../core/types'
import { clocksCoins } from './clocksCoins'
import { geography } from './geography'
import { math } from './math'
import { reading } from './reading'
import { science as scienceBase, socialStudies as socialBase } from './scienceSocial'
import { SCIENCE_MORE, SOCIAL_MORE } from './scienceSocialMore'
import { space } from './space'
import { writing } from './writing'

// Science and Social Studies grew in a second file; this puts the two halves together.
const science: Subject = { ...scienceBase, skills: [...scienceBase.skills, ...SCIENCE_MORE] }
const socialStudies: Subject = { ...socialBase, skills: [...socialBase.skills, ...SOCIAL_MORE] }

/**
 * Every subject in the arcade. To add one: write a Subject (see math.ts or space.ts
 * for examples), add it here, and every game can start asking its questions.
 */
export const SUBJECTS: Subject[] = [math, reading, writing, science, socialStudies, space, geography, clocksCoins]

const skills = new Map<string, Skill>()
for (const s of SUBJECTS) for (const k of s.skills) skills.set(`${s.id}.${k.id}`, k)

/** Look up a skill by its full id ("math.add"). */
export const findSkill = (id: string) => skills.get(id)
export const findSubject = (id: string) => SUBJECTS.find((s) => s.id === id)
