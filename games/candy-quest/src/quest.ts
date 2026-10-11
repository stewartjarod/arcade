import { playStyleFor } from '@arcade/learning'
import { LANDS, type Reward } from './lands'

// ------------------------------------------------------------------
//  The rules of Candy Quest, with no 3D in them (so they're easy to test).
// ------------------------------------------------------------------

/** How a land plays for a spelling grade (0 = Kindergarten). Older kids get a longer map and a faster run. */
export function landFor(grade: number) {
  const style = playStyleFor(grade)
  return {
    pieces: { cozy: 4, explorer: 5, speedy: 6 }[style], // map pieces to find
    speed: { cozy: 6, explorer: 7, speedy: 8.5 }[style], // how fast Buddy runs
    puddles: { cozy: 1, explorer: 2, speedy: 3 }[style], // sticky taffy puddles between gates
    creep: { cozy: 0.5, explorer: 0.8, speedy: 1.1 }[style], // how fast the Candy Monster catches up (gap per second)
  }
}

/** A missed word adds one more gate, but only this many times a land, so a land never drags on. */
export const MAX_EXTRA_GATES = 2

/** Map progress for one trip through a land. */
export interface MapRun {
  pieces: number // how many the map has
  found: number
  extraGates: number
}

export const newMap = (pieces: number): MapRun => ({ pieces, found: 0, extraGates: 0 })

/**
 * A gate was answered. Spelling it (on any try) wins a map piece. Missing it adds a gate instead,
 * until that has happened MAX_EXTRA_GATES times; after that you get the piece "with a little help".
 */
export function afterGate(map: MapRun, solved: boolean): { piece: boolean; helped: boolean } {
  if (solved || map.extraGates >= MAX_EXTRA_GATES) {
    map.found++
    return { piece: true, helped: !solved }
  }
  map.extraGates++
  return { piece: false, helped: false }
}

export const mapDone = (map: MapRun) => map.found >= map.pieces

/** Lands you may pick: every finished one plus the next. */
export const unlockedLands = (finished: number) => Math.min(LANDS.length, finished + 1)

/** Everything Buddy can wear: the starting look plus a reward from each finished land. */
export function wardrobe(finished: number) {
  const won = LANDS.slice(0, finished).map((l) => l.reward)
  return {
    colors: [{ color: '#f783ac', name: 'Bubblegum' }, ...won.filter((r): r is Extract<Reward, { kind: 'color' }> => r.kind === 'color')],
    hats: ['none' as const, ...won.filter((r): r is Extract<Reward, { kind: 'hat' }> => r.kind === 'hat').map((r) => r.hat)],
  }
}

// ------------------------------------------------------------------
//  The Candy Monster. Miss two words in a land and it wakes up and chases you.
//  The "gap" is how far behind it is. It shrinks every second; right answers push it back.
// ------------------------------------------------------------------

/** The monster wakes on this many missed gate words in a land (only once a land). */
export const MONSTER_AFTER_MISSES = 2
export const monsterWakes = (misses: number) => misses === MONSTER_AFTER_MISSES

/** Right answers needed to get away. */
export const ESCAPE_ANSWERS = 3
export const START_GAP = 10
export const MAX_GAP = 14

export interface Chase {
  gap: number
  escapes: number
}

export const newChase = (): Chase => ({ gap: START_GAP, escapes: 0 })

/** Time passes: the monster stomps closer. */
export function creep(chase: Chase, seconds: number, rate: number) {
  chase.gap = Math.max(0, chase.gap - seconds * rate)
}

/**
 * An answer during the chase. Right on the first try is a big speed boost; right after a
 * wrong pick still counts, but only a small one. A wrong pick lets the monster close in.
 */
export function chaseAnswer(chase: Chase, right: boolean, firstTry: boolean) {
  if (right) {
    chase.escapes++
    chase.gap = Math.min(MAX_GAP, chase.gap + (firstTry ? 4 : 1.5))
  } else {
    chase.gap = Math.max(0, chase.gap - 1.5)
  }
}

export const escaped = (chase: Chase) => chase.escapes >= ESCAPE_ANSWERS
export const caught = (chase: Chase) => chase.gap <= 0

/** CHOMP! How many candies the monster eats: half (rounded up), so you always keep some if you had two. */
export const eaten = (candies: number) => Math.ceil(candies / 2)
