import { PLANET_CARDS, PLANET_MNEMONIC, PLANETS } from '@arcade/learning'

/** Everything Rocket Tour says out loud, for `pnpm voices` to record. Keep in step with main.ts. */
export const LINES: string[] = [
  'I will read to you!',
  'Three, two, one, blast off!',
  'Not that one. Try again!',
  `You toured the whole solar system! Remember: ${PLANET_MNEMONIC}.`,
  ...PLANET_CARDS.flatMap((c) => [`${c.name}. ${c.facts[0]}`, ...c.facts]),
  ...PLANETS.flatMap((name, k) => [
    `Yes! ${name}!`,
    `That's ${name}. Try again!`,
    `You found ${name}! ${PLANET_CARDS.find((c) => c.name === name)?.facts[0]}`,
    `Welcome back to ${name}! ${PLANET_CARDS.find((c) => c.name === name)?.facts[0]}`,
    `Next stop: ${name}, planet number ${k + 1} from the Sun.`,
    `${name}.`,
    `Is it ${name}?`,
    `Or ${name}?`,
  ]),
]
