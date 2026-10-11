/**
 * Spotting answer-mashing: tapping answers as fast as possible to get to the end of a game,
 * without reading the question. With multiple choice that "works", because the right answer
 * is always one of the buttons.
 *
 * The fix is to make mashing slower than thinking. A wrong pick made faster than anyone could
 * read the question earns a short "slow down" wait before the next pick, and the wait grows
 * if they keep doing it. Fast RIGHT answers never count: a kid who just knows it should fly.
 */

/** Seconds: a wrong first pick quicker than this after the question shows is a guess. */
export const LOOK_FIRST = 1
/** Seconds: a wrong pick this soon after the last wrong pick (on the same question) is a guess. */
export const RE_PICK = 0.7
/** How long each mash in a row has to wait, in seconds. */
export const SLOW_DOWN_WAITS = [1.5, 3, 4]

export class SmashGuard {
  /** Mashes in a row. A careful right answer resets it. */
  private mashes = 0
  /** When the last wrong pick happened (ms, performance.now() time). */
  private lastWrongAt = -Infinity
  private wait = 0

  /**
   * Note a pick on a question that was shown at `askedAt` (ms). Returns how many seconds
   * the player should wait before picking again (0 = go ahead).
   */
  pick(right: boolean, askedAt: number, now: number): number {
    const sinceAsked = (now - askedAt) / 1000
    const missedThisOne = this.lastWrongAt > askedAt
    if (right) {
      // Only a careful first-try answer shows they're reading again. A lucky fast tap doesn't.
      if (!missedThisOne && sinceAsked >= LOOK_FIRST) this.mashes = 0
      this.wait = 0
      return 0
    }
    const sinceWrong = (now - this.lastWrongAt) / 1000
    const mashed = sinceAsked < LOOK_FIRST || (missedThisOne && sinceWrong < RE_PICK)
    this.lastWrongAt = now
    if (!mashed) return (this.wait = 0)
    this.wait = SLOW_DOWN_WAITS[Math.min(this.mashes, SLOW_DOWN_WAITS.length - 1)]!
    this.mashes++
    return this.wait
  }

  /** Seconds to wait after the latest pick (0 = go ahead). */
  get slowDown() {
    return this.wait
  }
}
