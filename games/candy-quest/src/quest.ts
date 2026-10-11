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
