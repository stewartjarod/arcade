/** Little helpers for writing subjects. */

export const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
export const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]!
export const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Up to `count` wrong answers from a pool: distinct, never the answer, preferring `near` ones first. */
export function wrongFrom(answer: string, count: number, pool: readonly string[], near: readonly string[] = []) {
  const out: string[] = []
  const add = (v: string) => {
    if (v !== answer && !out.includes(v) && out.length < count) out.push(v)
  }
  shuffle([...near]).forEach(add)
  shuffle([...pool]).forEach(add)
  return out
}

/** Items are picked from a list by level: everything up to `level` can come up, the newest most often. */
export function upToLevel<T extends { level: number }>(list: readonly T[], level: number): T {
  const newest = list.filter((x) => x.level === level)
  const all = list.filter((x) => x.level <= level)
  return newest.length && Math.random() < 0.6 ? pick(newest) : pick(all.length ? all : list)
}

/**
 * How many single-letter slips turn `a` into `b`: a letter added, dropped, changed,
 * or two neighbors swapped ("becuase" is 1 slip from "because"). For spelling partial credit.
 */
export function editDistance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[])
  for (let j = 1; j <= b.length; j++) d[0]![j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1)
    }
  return d[a.length]![b.length]!
}
