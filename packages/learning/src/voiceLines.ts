import { SUBJECTS } from './subjects'
import { sentences } from './ui/clips'

/**
 * Everything the questions can say out loud — the to-do list for `pnpm voices`.
 * Questions are made at random, so we ask each skill for lots of them at every level;
 * the set of things to say is small, so we catch them all.
 */
export function learningLines(tries = 400): string[] {
  const lines = new Set<string>()
  for (const subject of SUBJECTS) {
    for (const skill of subject.skills) {
      for (let level = 1; level <= skill.maxLevel; level++) {
        for (let i = 0; i < tries; i++) {
          const { say, text } = skill.generate(level).prompt
          // Space questions have no `say`, but Rocket Tour reads their text aloud.
          const spoken = say ?? (subject.id === 'space' ? text : undefined)
          if (spoken) sentences(spoken).forEach((s) => lines.add(s))
        }
      }
    }
  }
  return [...lines]
}
