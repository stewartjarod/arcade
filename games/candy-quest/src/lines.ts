import { COACH_LINES, LANDS, MONSTER_LINES } from './lands'

/** Everything Candy Quest says out loud (besides the spelling words), for `pnpm voices` to record. Keep in step with main.ts. */
export const LINES: string[] = [
  'Nice try! One more gate to find this map piece.',
  ...Object.values(MONSTER_LINES),
  ...Object.values(COACH_LINES),
  ...LANDS.flatMap((land) => [land.intro, land.treasure, ...land.landmarks.map((l) => l.clue)]),
]
