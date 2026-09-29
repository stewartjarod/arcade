/** Small helpers every game ends up wanting. */

export const rand = (min = 0, max = 1) => min + Math.random() * (max - min)
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
export const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]
export const chance = (probability: number) => Math.random() < probability
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Rainbow-ish nice colors. */
export const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'] as const

/**
 * Save data per game in the browser (high scores, unlocked levels).
 *   const save = storage('my-game'); save.set('best', 10); save.get('best', 0)
 */
export function storage(gameId: string) {
  const key = (k: string) => `arcade:${gameId}:${k}`
  return {
    get<T>(k: string, fallback: T): T {
      try {
        const v = localStorage.getItem(key(k))
        return v === null ? fallback : JSON.parse(v)
      } catch {
        return fallback
      }
    },
    set(k: string, value: unknown) {
      try {
        localStorage.setItem(key(k), JSON.stringify(value))
      } catch {
        /* private mode etc. */
      }
    },
    /** Saves only if higher; returns true if it's a new record. */
    highScore(score: number, k = 'best') {
      const best = this.get(k, 0)
      if (score > best) this.set(k, score)
      return score > best
    },
  }
}
