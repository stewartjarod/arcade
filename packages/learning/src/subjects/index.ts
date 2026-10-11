import type { Skill, Subject } from '../core/types'
import { clocksCoins } from './clocksCoins'
import { geography } from './geography'
import { math } from './math'
import { reading } from './reading'
import { science as scienceBase, socialStudies as socialBase } from './scienceSocial'
import { SCIENCE_MORE, SOCIAL_MORE } from './scienceSocialMore'
import { SCIENCE_FINAL } from './scienceFinal'
import { SCIENCE_R3, SOCIAL_R3 } from './scienceSocialRound3'
import { SCIENCE_R4, SOCIAL_R4 } from './scienceSocialRound4'
import { SCIENCE_R5, SOCIAL_R5 } from './scienceSocialRound5'
import { SCIENCE_UPPER, SOCIAL_UPPER } from './scienceSocialUpper'
import { space } from './space'
import { writing } from './writing'

// Science and Social Studies grew in a second file; this puts the two halves together.
const science: Subject = { ...scienceBase, skills: [...scienceBase.skills, ...SCIENCE_MORE, ...SCIENCE_UPPER, ...SCIENCE_R3, ...SCIENCE_R4, ...SCIENCE_R5, ...SCIENCE_FINAL] }
const socialStudies: Subject = { ...socialBase, skills: [...socialBase.skills, ...SOCIAL_MORE, ...SOCIAL_UPPER, ...SOCIAL_R3, ...SOCIAL_R4, ...SOCIAL_R5] }

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
