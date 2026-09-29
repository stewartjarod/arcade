/** Smooth animations: game.tweens.to(coin.scale, { x: 0, y: 0, z: 0 }, 0.3) */
export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: (t: number) => 1 - (1 - t) ** 3,
  bounce: (t: number) => {
    const n = 7.5625, d = 2.75
    if (t < 1 / d) return n * t * t
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
    return n * (t -= 2.625 / d) * t + 0.984375
  },
  elastic: (t: number) =>
    t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
}

interface Tween {
  target: any
  from: Record<string, number>
  to: Record<string, number>
  time: number
  elapsed: number
  easing: (t: number) => number
  resolve: () => void
}

export class Tweens {
  private list: Tween[] = []

  /** Animate number properties of any object. Returns a promise you can await. */
  to<T extends object>(target: T, to: Partial<Record<keyof T, number>>, seconds: number, easing = ease.out) {
    return new Promise<void>((resolve) => {
      const from: Record<string, number> = {}
      for (const k in to) from[k] = (target as any)[k]
      this.list.push({ target, from, to: to as Record<string, number>, time: seconds, elapsed: 0, easing, resolve })
    })
  }

  update(dt: number) {
    for (const tw of this.list) {
      tw.elapsed = Math.min(tw.elapsed + dt, tw.time)
      const k = tw.easing(tw.elapsed / tw.time)
      for (const p in tw.to) tw.target[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * k
      if (tw.elapsed >= tw.time) tw.resolve()
    }
    this.list = this.list.filter((tw) => tw.elapsed < tw.time)
  }

  clear() {
    this.list = []
  }
}
