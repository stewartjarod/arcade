export type Kind = 'add' | 'sub' | 'mul' | 'div'
export type Problem = { text: string; answer: number; kind: Kind; tier: number; operands: [number, number] }
export type Skills = Record<Kind, number>

export const KINDS: Kind[] = ['add', 'sub', 'mul', 'div']
export const START_SKILLS: Skills = { add: 1, sub: 1, mul: 0, div: 0 }

const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]!
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const cap = (L: number) => [1, 2, 5][(L - 1) % 3]! * 10 ** (1 + Math.floor((L - 1) / 3))

// Times tables in the order schools teach them: 2 and 10, then 5, 3, 4, then the harder ones.
const TABLE_ORDER = [2, 10, 5, 3, 4, 6, 7, 8, 9, 11, 12]
const TABLE_LEVELS = TABLE_ORDER.length - 1
const tables = (L: number) => TABLE_ORDER.slice(0, Math.min(L + 1, TABLE_ORDER.length))
// The newest table gets extra practice once there are a few to mix.
const pickTable = (L: number) => {
  const t = tables(L)
  return t.length >= 3 && Math.random() < 0.35 ? t[t.length - 1]! : pick(t)
}
const bigFactor = (L: number) => 12 + (L - TABLE_LEVELS) * 4

const build = (kind: Kind, L: number): Problem => {
  let a: number
  let b: number
  switch (kind) {
    case 'add':
      a = rand(Math.max(1, Math.floor(cap(L) / 4)), cap(L) - 1)
      b = rand(1, cap(L) - a)
      return { text: `${a} + ${b}`, answer: a + b, kind, tier: L, operands: [a, b] }
    case 'sub':
      a = rand(Math.max(2, Math.floor(cap(L) / 4)), cap(L))
      b = rand(1, a - 1)
      return { text: `${a} − ${b}`, answer: a - b, kind, tier: L, operands: [a, b] }
    case 'mul': {
      if (L <= TABLE_LEVELS) {
        a = pickTable(L)
        b = rand(2, 10)
      } else {
        a = rand(2, 12)
        b = rand(Math.floor(bigFactor(L) / 3), bigFactor(L))
      }
      const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a]
      return { text: `${x} × ${y}`, answer: a * b, kind, tier: L, operands: [x, y] }
    }
    case 'div':
      if (L <= TABLE_LEVELS) {
        b = pickTable(L)
        a = rand(2, 10)
      } else {
        b = rand(2, 12)
        a = rand(Math.floor(bigFactor(L) / 3), bigFactor(L))
      }
      return { text: `${a * b} ÷ ${b}`, answer: a, kind, tier: L, operands: [a * b, b] }
  }
}

export const makeProblem = (kind: Kind, tier: number, avoid?: string): Problem => {
  for (let i = 0; i < 20; i++) {
    const p = build(kind, tier)
    if (p.text !== avoid) return p
  }
  return build(kind, tier)
}

export const similarTo = (p: Problem, avoid?: string) => makeProblem(p.kind, p.tier, avoid ?? p.text)

// [2, 3, 4, 5, 10] -> "2–5, 10"
const runs = (ns: number[]) => {
  const out: string[] = []
  const s = [...ns].sort((a, b) => a - b)
  for (let i = 0; i < s.length; ) {
    let j = i
    while (s[j + 1] === s[j]! + 1) j++
    out.push(j - i >= 2 ? `${s[i]}–${s[j]}` : s.slice(i, j + 1).join(', '))
    i = j + 1
  }
  return out.join(', ')
}

export const describe = (kind: Kind, L: number) => {
  switch (kind) {
    case 'add':
      return `Adding up to ${cap(L)}`
    case 'sub':
      return `Subtracting from ${cap(L)}`
    case 'mul':
      return L <= TABLE_LEVELS ? `Times tables: ${runs(tables(L))}` : `Big times tables`
    case 'div':
      return L <= TABLE_LEVELS ? `Dividing by ${runs(tables(L))}` : `Big division`
  }
}

// Skills unlock in order: mul once add/sub are solid, div once mul is.
export const unlocked = (s: Skills): Kind[] => {
  const out: Kind[] = ['add', 'sub']
  if (Math.min(s.add, s.sub) >= 3 || s.mul > 0) out.push('mul')
  if (s.mul >= 3 || s.div > 0) out.push('div')
  return out
}

export const ensureUnlocked = (s: Skills) => {
  for (const k of unlocked(s)) if (s[k] < 1) s[k] = 1
}

// Rating r means "comfortable at level r". Mostly ask at r, sometimes r+1 (the i+1 zone), sometimes r-1 as review.
// With the calibration in `solves`, this mix lands around 85% correct for a kid rated accurately.
export const chooseProblem = (s: Skills, avoid?: string): Problem => {
  const kinds = unlocked(s)
  const top = Math.max(...kinds.map((k) => s[k]))
  const weights = kinds.map((k) => 1 + (top - s[k]) * 0.4)
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
  const kind = kinds.find((_, i) => (roll -= weights[i]!) < 0) ?? kinds[0]!
  const base = Math.max(1, Math.round(s[kind]))
  const r = Math.random()
  const L = r < 0.7 ? base : r < 0.9 ? base + 1 : Math.max(1, base - 1)
  return makeProblem(kind, L, avoid)
}

export type Stats = { seen: Record<Kind, number>; fast: Record<Kind, number> }
export const START_STATS = (): Stats => ({
  seen: { add: 0, sub: 0, mul: 0, div: 0 },
  fast: { add: 0, sub: 0, mul: 0, div: 0 },
})

// Seconds a fluent kid needs: reading three signs plus working it out, growing gently with difficulty.
const nominalSeconds = (p: Problem) => 4 + 2 * p.tier ** 0.8

// Speed only ever helps: quick = fluent (>1). Slow but right is still right, so careful kids aren't marked down.
export const speedOutcome = (p: Problem, ms: number) => {
  const ratio = ms / 1000 / nominalSeconds(p)
  return ratio < 0.4 ? 1.2 : ratio < 0.65 ? 1.1 : 1
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

// Chance a kid rated s works out a level-`tier` problem unaided: ~83% at their own level.
const solves = (s: number, tier: number) => sigmoid(1.4 * (s - tier) + 1.6)

// Elo-style update: surprise (result vs. expected) moves the rating; new players move fast, then settle.
// `guess` is the chance of being right without knowing (1/3 with three doors, 0 for a typed answer),
// so lucky taps count for less and a wrong pick among few doors counts for more.
// Three quick first-try answers in a row at or above your level trigger a skip-ahead bump.
export const updateSkill = (s: Skills, st: Stats, p: Problem, outcome: number, { weight = 1, guess = 0 } = {}) => {
  if (guess >= 1) return
  const k = p.kind
  const expected = guess + (1 - guess) * solves(s[k], p.tier)
  const warmup = 1 + 1.5 * Math.max(0, 1 - st.seen[k] / 15)
  s[k] = Math.max(1, s[k] + 0.4 * warmup * weight * (outcome - expected))
  st.seen[k]++
  st.fast[k] = outcome > 1 && p.tier >= Math.round(s[k]) ? st.fast[k] + 1 : 0
  if (st.fast[k] >= 3) {
    s[k] += 0.25
    st.fast[k] = 0
  }
  ensureUnlocked(s)
}

// One junction (wrong doors plus the cage) can cost at most this much, so one bad moment can't undo a level.
export const MAX_JUNCTION_DROP = 0.4
export const limitDrop = (s: Skills, before: Skills) => {
  for (const k of KINDS) s[k] = Math.max(s[k], before[k] - MAX_JUNCTION_DROP)
}

// Wrong answers are common slips, and the correct one is equally likely to be the smallest, middle or
// largest, so "pick the middle one" is no better than chance. With two-digit numbers, add/sub slips are
// tens slips (a missed or extra carry/borrow) that share the ones digit, so checking only the last digit isn't enough.
export const distractors = (p: Problem): number[] => {
  const a = p.answer
  const [x, y] = p.operands
  const pool = new Set<number>()
  if ((p.kind === 'add' || p.kind === 'sub') && a >= 10 && Math.max(x, y) >= 20) {
    for (const d of a >= 200 ? [10, 20, 100] : [10, 20, 30]) pool.add(a + d).add(a - d)
  } else {
    for (const d of [1, 2, 3]) pool.add(a + d).add(a - d)
    if (p.kind === 'add') pool.add(Math.abs(x - y))
    if (p.kind === 'sub') pool.add(x + y)
  }
  if (p.kind === 'mul') pool.add((x + 1) * y).add((x - 1) * y).add(x * (y + 1)).add(x * (y - 1)).add(x + y)
  if (p.kind === 'div') pool.add(y)
  const options = [...pool].filter((v) => v >= 0 && v !== a)
  const below = shuffle(options.filter((v) => v < a))
  const above = shuffle(options.filter((v) => v > a))
  const rank = pick([0, 1, 2].filter((r) => below.length >= r && above.length >= 2 - r))
  return shuffle([...below.slice(0, rank), ...above.slice(0, 2 - rank)])
}
