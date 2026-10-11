import type { Format, ItemSpec, Prompt, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * Grade 3–5 math, named like IXL's categories: estimating, mixed operations, missing numbers,
 * patterns, fractions on number lines and in order, bar and line graphs, shapes and angles,
 * composite area, word problems, big multiplying and dividing, big numbers, money, and more.
 * Every skill unlocks once a player is solid on the grade 3–4 basics it builds on.
 *
 * How a question is made: each skill picks some numbers for a level (roll), and the question is
 * built only from those numbers. The key is the level plus the numbers ("est:2:387,504"), so the
 * same key always rebuilds the same question (fromKey) and a missed one can come back later.
 */

const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })

const NUMBER_CHOICE: Format[] = ['number', 'choice']
const CHOICE: Format[] = ['choice']
const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa']
const NAMES = ['Zoe', 'Mia', 'Sam', 'Leo', 'Ava', 'Max']
const ITEMS = ['cookies', 'stickers', 'marbles', 'apples', 'pencils', 'crayons']

// --- Helpers ------------------------------------------------------------------------------------

type Frac = [number, number]
type Pts = [number, number][]
type Spec = Omit<ItemSpec, 'key'>

const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-weight="700">${body}</svg>`
const txt = (x: number, y: number, t: string | number, size = 16, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#333">${t}</text>`
const line = (x1: number, y1: number, x2: number, y2: number, w = 2, color = '#495057') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"/>`
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
/** 21 → "21st", 12 → "12th" (for "What is the 18th number?"). */
const ordinal = (n: number) => {
  const teen = n % 100 >= 11 && n % 100 <= 13
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suffix}`
}
/** 1234567 → "1,234,567" (for showing big numbers; answers with commas are choice-only). */
const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
/** 1234 cents → "$12.34". */
const money = (cents: number) => `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
/** A digit of n counting from the right (digitAt(4732, 2) is 7). */
const digitAt = (n: number, place: number) => Math.floor(n / 10 ** place) % 10

const prompt = (text: string, o: { say?: string; svg?: string; sum?: boolean } = {}): Prompt => ({
  text,
  say: o.say ?? text,
  ...(o.svg ? { svg: o.svg } : {}),
  ...(o.sum ? { sum: true } : {}),
})
const spec = (p: Prompt, answer: string, wrong: (count: number) => string[]): Spec => ({ prompt: p, answer, wrong })
/** Wrong choices taken from a list of other answers (the right answer is left out). */
const from = (answer: string, all: string[]) => (count: number) => shuffle(all.filter((x) => x !== answer)).slice(0, count)

/**
 * A skill whose questions come from numbers. `roll` picks the numbers for a level; `build` makes
 * the question from them. The key is the level plus those numbers, so fromKey can rebuild it.
 */
function keyed(o: {
  tag: string
  id: string
  labels: string[]
  formats: Format[]
  unlocksAfter: { skill: string; level: number }[]
  roll: (L: number) => number[]
  build: (L: number, n: number[]) => Spec
}): Skill {
  const make = (L: number, n: number[]): ItemSpec => ({ ...o.build(L, n), key: [o.tag, L, n.join(',')].join(':') })
  return {
    id: o.id,
    label: (L) => o.labels[L - 1]!,
    maxLevel: o.labels.length,
    formats: o.formats,
    unlocksAfter: o.unlocksAfter,
    generate: (L) => make(L, o.roll(L)),
    fromKey: (key, L) => {
      const [tag, level, list = ''] = key.split(':')
      const n = list.split(',').map(Number)
      return tag === o.tag && Number(level) === L && n.every(Number.isFinite) ? make(L, n) : null
    },
  }
}

// Rounding that never lands on a tie (like 350), so every estimate has one clear answer.
const safe = (x: number, unit: number) => (x % unit === unit / 2 ? x + 1 : x)
const round100 = (x: number) => Math.round(x / 100) * 100
const round1000 = (x: number) => Math.round(x / 1000) * 1000

// --- Fractions ----------------------------------------------------------------------------------

const reduceF = ([n, d]: Frac): Frac => {
  const g = gcd(n, d)
  return [n / g, d / g]
}
const sameValue = (a: Frac, b: Frac) => a[0] * b[1] === b[0] * a[1]
/** "3/4", "5" for a whole number, or "2 1/4" for a mixed number. */
const fracText = (f: Frac) => {
  const [n, d] = reduceF(f)
  if (d === 1) return String(n)
  return n > d ? `${Math.floor(n / d)} ${n % d}/${d}` : `${n}/${d}`
}
/** Proper fractions with denominators 2 to 12, reduced: a pool of believable wrong answers. */
const PROPER: Frac[] = range(2, 12).flatMap((d) => range(1, d - 1).filter((n) => gcd(n, d) === 1).map((n): Frac => [n, d]))
/** The fractions just above and below a fraction (plus a double), to offer as close wrong answers. */
const around = ([n, d]: Frac): Frac[] => [
  [n + 1, d],
  [n - 1, d],
  [n, d + 1],
  [n, d - 1],
  [n * 2, d],
]

/** Up to `count` wrong fraction answers: nearest first, never the right value, never a whole number, never repeated. */
function fracWrongs(ans: Frac, count: number, near: Frac[], pool: Frac[]): string[] {
  const seen: Frac[] = [reduceF(ans)]
  const out: string[] = []
  for (const f of [...shuffle([...near]), ...shuffle([...pool])]) {
    const r = reduceF(f)
    // Skip whole numbers and anything with a bad denominator (a 0 can come from "one less" at the edge).
    if (r[0] <= 0 || r[1] < 2 || seen.some((s) => sameValue(s, r))) continue
    seen.push(r)
    out.push(fracText(r))
    if (out.length === count) break
  }
  return out
}

/** Flattened (whole, numerator, denominator) triples for `count` fractions with distinct values. */
function rollFractions(count: number, maxDen: number, mixed: boolean): number[] {
  const out: number[] = []
  const values: Frac[] = []
  while (values.length < count) {
    const q = rand(2, maxDen)
    const p = rand(1, q - 1)
    const w = mixed ? rand(1, 3) : 0
    const v = reduceF([w * q + p, q])
    if (gcd(p, q) !== 1 || values.some((o) => sameValue(o, v))) continue
    values.push(v)
    out.push(w, p, q)
  }
  return out
}

// --- Shapes and drawings ------------------------------------------------------------------------

/** A regular polygon with n sides, centered in a 120 by 120 box (turned so the bottom is flat or pointed evenly). */
const regular = (n: number): Pts =>
  range(0, n - 1).map((k): [number, number] => {
    const a = ((-90 + 180 / n + (360 * k) / n) * Math.PI) / 180
    return [Math.round((60 + 50 * Math.cos(a)) * 10) / 10, Math.round((62 + 50 * Math.sin(a)) * 10) / 10]
  })

const SHAPES: Record<string, { pts: Pts; lines: number }> = {
  rectangle: { pts: [[10, 35], [110, 35], [110, 85], [10, 85]], lines: 2 },
  square: { pts: [[25, 25], [95, 25], [95, 95], [25, 95]], lines: 4 },
  trapezoid: { pts: [[30, 30], [90, 30], [110, 95], [10, 95]], lines: 0 },
  parallelogram: { pts: [[30, 25], [105, 25], [90, 95], [15, 95]], lines: 0 },
  rhombus: { pts: [[60, 10], [95, 60], [60, 110], [25, 60]], lines: 2 },
  kite: { pts: [[60, 10], [90, 40], [60, 110], [30, 40]], lines: 1 },
  'isosceles triangle': { pts: [[60, 15], [20, 105], [100, 105]], lines: 1 },
  'scalene triangle': { pts: [[15, 20], [105, 60], [40, 105]], lines: 0 },
  'equilateral triangle': { pts: regular(3), lines: 3 },
}

const shapeSvg = (pts: Pts, color = '#4dabf7') => svg(120, 120, `<polygon points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${color}" stroke="#495057" stroke-width="3"/>`)

/** Two rays from a corner with an arc marking the angle (degrees, measured from the flat ray). */
const angleSvg = (deg: number) => {
  const r = 22
  const t = (deg * Math.PI) / 180
  const ex = 60 + 60 * Math.cos(t)
  const ey = 100 - 60 * Math.sin(t)
  const ax = 60 + r * Math.cos(t)
  const ay = 100 - r * Math.sin(t)
  return svg(140, 120, line(60, 100, 120, 100, 4) + line(60, 100, ex, ey, 4) + `<path d="M 82 100 A ${r} ${r} 0 0 0 ${ax} ${ay}" fill="none" stroke="#ff6b6b" stroke-width="3"/>`)
}

/** Bars: one bar per name, each `square` tall, with the scale written beside the grid lines. */
function barGraph(names: string[], squares: number[], scale: number) {
  const base = 150
  const unit = 13
  const x0 = 44
  const slot = 82
  const top = Math.max(...squares)
  const grid = range(0, top)
    .map((j) => line(x0, base - j * unit, 290, base - j * unit, 1, '#dee2e6') + txt(x0 - 6, base - j * unit + 4, j * scale, 12, 'end'))
    .join('')
  const bars = names
    .map((name, i) => {
      const h = squares[i]! * unit
      const x = x0 + i * slot + 16
      return `<rect x="${x}" y="${base - h}" width="50" height="${h}" fill="${COLORS[i]}"/>` + txt(x + 25, base + 17, name, 14)
    })
    .join('')
  return svg(300, 175, grid + line(x0, base, 290, base) + bars)
}

/** Dots joined by lines, one per day, with a grid every 5. */
function lineGraph(days: string[], values: number[]) {
  const base = 150
  const unit = 6
  const x = (i: number) => 50 + i * 75
  const grid = range(0, 4)
    .map((k) => {
      const y = base - 5 * k * unit
      return line(40, y, 290, y, 1, '#dee2e6') + txt(34, y + 5, 5 * k, 13, 'end')
    })
    .join('')
  const pts = values.map((v, i) => `${x(i)},${base - v * unit}`).join(' ')
  const dots = values.map((v, i) => `<circle cx="${x(i)}" cy="${base - v * unit}" r="5" fill="#4dabf7"/>`).join('')
  const labels = days.map((d, i) => txt(x(i), base + 18, d, 14)).join('')
  return svg(300, 180, grid + line(40, base, 290, base) + `<polyline points="${pts}" fill="none" stroke="#4dabf7" stroke-width="3"/>` + dots + labels)
}

// --- 1. Estimating ------------------------------------------------------------------------------

/**
 * Wrong estimates: other rounded answers (multiples of `unit`, like 1,300 when the answer is 1,200) and the
 * slips a kid makes. Never a number that doesn't come from rounding, like 13,001.
 */
function estimateWrongs(ans: number, unit: number, count: number, slips: number[]): string[] {
  const rounded = range(-5, 5)
    .map((j) => ans + j * unit)
    .filter((v) => v > 0 && v !== ans)
    .map(String)
  return wrongFrom(String(ans), count, rounded, slips.filter((v) => v > 0 && v !== ans).map(String))
}

const estimate = keyed({
  tag: 'est',
  id: 'estimate',
  labels: ['Estimate sums by rounding', 'Estimate differences by rounding', 'Estimate sums and differences', 'Estimate with bigger numbers'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'round', level: 2 },
    { skill: 'add', level: 6 },
  ],
  roll: (L) => {
    if (L === 1) return [safe(rand(101, 999), 100), safe(rand(101, 999), 100)]
    if (L === 2) {
      const x = rand(2, 9)
      const y = rand(1, x - 1)
      return [100 * x + rand(-40, 40), 100 * y + rand(-40, 40)]
    }
    if (L === 3) {
      let vals = [0, 0, 0]
      do vals = [safe(rand(101, 999), 100), safe(rand(101, 999), 100), safe(rand(101, 999), 100)]
      while (round100(vals[0]!) + round100(vals[1]!) - round100(vals[2]!) < 100)
      return vals
    }
    return [safe(rand(1001, 9999), 1000), safe(rand(1001, 9999), 1000)]
  },
  build: (L, [a = 0, b = 0, c = 0]) => {
    const note = L === 4 ? 'the nearest thousand' : 'the nearest hundred'
    const r = L === 4 ? round1000 : round100
    if (L === 1) {
      const ans = r(a) + r(b)
      return spec(prompt(`Estimate ${a} + ${b}. Round each number to ${note} first.`, { say: `Estimate ${a} plus ${b}. Round each number to ${note} first.` }), String(ans), (k) =>
        estimateWrongs(ans, 100, k, [a + b, ans + 100, ans - 100]),
      )
    }
    if (L === 2) {
      const ans = r(a) - r(b)
      return spec(prompt(`Estimate ${a} − ${b}. Round each number to ${note} first.`, { say: `Estimate ${a} minus ${b}. Round each number to ${note} first.` }), String(ans), (k) =>
        estimateWrongs(ans, 100, k, [a - b, ans + 100, ans - 100]),
      )
    }
    if (L === 3) {
      const ans = r(a) + r(b) - r(c)
      return spec(prompt(`Estimate ${a} + ${b} − ${c}. Round each number to ${note} first.`, { say: `Estimate ${a} plus ${b} minus ${c}. Round each number to ${note} first.` }), String(ans), (k) =>
        estimateWrongs(ans, 100, k, [a + b - c, r(a) + r(b) + r(c), ans + 100, ans - 100]),
      )
    }
    const ans = r(a) + r(b)
    return spec(prompt(`Estimate ${commas(a)} + ${commas(b)}. Round each number to ${note} first.`, { say: `Estimate ${a} plus ${b}. Round each number to ${note} first.` }), String(ans), (k) =>
      estimateWrongs(ans, 1000, k, [a + b, ans + 1000, ans - 1000]),
    )
  },
})

// --- 2. Mixed operations ------------------------------------------------------------------------

const mixedOps = keyed({
  tag: 'mix',
  id: 'mixedOps',
  labels: ['Mixed adding and subtracting', 'Mixed multiplying and dividing', 'Order of operations: × and ÷ before + and −', 'Order of operations with parentheses'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'add', level: 6 },
    { skill: 'sub', level: 6 },
    { skill: 'mul', level: 8 },
    { skill: 'div', level: 8 },
  ],
  roll: (L) => {
    if (L === 1) {
      const a = rand(20, 300)
      const b = rand(20, 300)
      return [a, b, rand(2, a + b - 1)]
    }
    if (L === 2) return [rand(2, 9), rand(2, 9), rand(2, 9), rand(0, 1)]
    if (L === 3) {
      const form = rand(0, 2)
      if (form === 0) return [0, rand(2, 30), rand(2, 9), rand(2, 9)]
      if (form === 1) {
        const a = rand(2, 9)
        const b = rand(2, 12)
        return [1, a, b, rand(2, a * b - 1)]
      }
      const b = rand(2, 9)
      const c = rand(2, 9)
      return [2, b * c + rand(1, 40), b, c]
    }
    if (rand(0, 1) === 0) {
      const a = rand(2, 20)
      const b = rand(2, 20)
      const c = rand(2, 9)
      return [0, a, b, c, rand(1, (a + b) * c - 1)]
    }
    const c = rand(2, 9)
    return [1, rand(2, 9), c + rand(1, 20), c, rand(1, 50)]
  },
  build: (L, [p = 0, q = 0, r = 0, s = 0, t = 0]) => {
    if (L === 1) {
      const ans = p + q - r
      return spec(prompt(`${p} + ${q} − ${r}`, { say: `${p} plus ${q} minus ${r}`, sum: true }), String(ans), (k) =>
        numberWrongs(ans, k, [p + q + r, p + q, Math.abs(p - q) + r]),
      )
    }
    if (L === 2) {
      // r, k, s, form: (r × k) × s ÷ r, or (r × k) ÷ r × s. Both come out to k × s.
      const [first, k, last, form] = [p, q, r, s]
      const ans = k * last
      const text = form === 0 ? `${first * k} × ${last} ÷ ${first}` : `${first * k} ÷ ${first} × ${last}`
      const say = form === 0 ? `${first * k} times ${last}, divided by ${first}` : `${first * k} divided by ${first}, times ${last}`
      return spec(prompt(text, { sum: true, say }), String(ans), (c) => numberWrongs(ans, c, [first * k * last, k + last, k * last + last, k * last - last]))
    }
    if (L === 3) {
      // form 0: a + b × c, form 1: a × b − c, form 2: a − b × c. Doing the first sum first is the slip.
      const [form, a, b, c] = [p, q, r, s]
      if (form === 0) {
        const ans = a + b * c
        return spec(prompt(`${a} + ${b} × ${c}`, { sum: true, say: `${a} plus ${b} times ${c}` }), String(ans), (k) => numberWrongs(ans, k, [(a + b) * c, ans + c, ans - c]))
      }
      if (form === 1) {
        const ans = a * b - c
        return spec(prompt(`${a} × ${b} − ${c}`, { sum: true, say: `${a} times ${b} minus ${c}` }), String(ans), (k) => numberWrongs(ans, k, [a * (b - c), ans + c, ans - c]))
      }
      const ans = a - b * c
      return spec(prompt(`${a} − ${b} × ${c}`, { sum: true, say: `${a} minus ${b} times ${c}` }), String(ans), (k) => numberWrongs(ans, k, [(a - b) * c, ans + c, ans - c]))
    }
    // form 0: (a + b) × c − d, form 1: a × (b − c) + d
    const [form, a, b, c, d] = [p, q, r, s, t]
    if (form === 0) {
      const ans = (a + b) * c - d
      return spec(prompt(`(${a} + ${b}) × ${c} − ${d}`, { sum: true, say: `${a} plus ${b}, times ${c}, minus ${d}` }), String(ans), (k) =>
        numberWrongs(ans, k, [a + b * c - d, (a + b) * c + d, (a + b) * c - c]),
      )
    }
    const ans = a * (b - c) + d
    return spec(prompt(`${a} × (${b} − ${c}) + ${d}`, { sum: true, say: `${a} times ${b} minus ${c}, plus ${d}` }), String(ans), (k) =>
      numberWrongs(ans, k, [a * b - c + d, a * (b - c), a * b + d]),
    )
  },
})

// --- 3. Missing numbers -------------------------------------------------------------------------

const equations = keyed({
  tag: 'eq',
  id: 'equations',
  labels: ['Missing number: add or subtract', 'Missing number: multiply or divide', 'Use n: evaluate an expression'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'add', level: 6 },
    { skill: 'sub', level: 6 },
    { skill: 'mul', level: 8 },
  ],
  roll: (L) => {
    if (L === 1) return [rand(0, 1), rand(10, 60), rand(10, 60)]
    if (L === 2) return [rand(0, 1), rand(2, 9), rand(2, 12)]
    return [rand(2, 9), rand(2, 9), rand(1, 20)]
  },
  build: (L, [p = 0, a = 0, b = 0]) => {
    if (L === 3) {
      // p is n, a is the multiplier, b is what gets added.
      const ans = a * p + b
      return spec(prompt(`If n = ${p}, what is ${a} × n + ${b}?`, { say: `If n equals ${p}, what is ${a} times n plus ${b}?` }), String(ans), (k) =>
        numberWrongs(ans, k, [a * p, a * (p + b), a + p + b, a * p - b]),
      )
    }
    if (L === 1) {
      const total = a + b
      if (p === 0) return spec(prompt(`? + ${a} = ${total}`, { say: `What plus ${a} equals ${total}?` }), String(b), (k) => numberWrongs(b, k, [a, total, b + 1, b - 1]))
      return spec(prompt(`${total} − ? = ${a}`, { say: `${total} minus what equals ${a}?` }), String(b), (k) => numberWrongs(b, k, [a, total, b + 1, b - 1]))
    }
    const product = a * b
    if (p === 0) return spec(prompt(`${a} × ? = ${product}`, { say: `${a} times what equals ${product}?` }), String(b), (k) => numberWrongs(b, k, [a, product, b + 1, b - 1]))
    return spec(prompt(`? ÷ ${a} = ${b}`, { say: `What divided by ${a} equals ${b}?` }), String(product), (k) => numberWrongs(product, k, [b, a, product + a, product - a]))
  },
})

// --- 4. Number patterns -------------------------------------------------------------------------

const numberPatterns = keyed({
  tag: 'pat',
  id: 'numberPatterns',
  labels: ['Patterns that add', 'Patterns that multiply', 'Find a far-away number in a pattern'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'add', level: 6 },
    { skill: 'mul', level: 8 },
  ],
  roll: (L) => {
    if (L === 1) return [rand(2, 60), rand(3, 25)]
    if (L === 2) return [rand(2, 5), pick([2, 3, 4, 5])]
    return [rand(1, 30), rand(2, 9), rand(8, 30)]
  },
  build: (L, [a = 0, s = 0, n = 0]) => {
    if (L === 1) {
      const terms = range(0, 3).map((i) => a + i * s)
      const ans = a + 4 * s
      return spec(prompt(`${terms.join(', ')}, ?`, { say: `What comes next? ${terms.join(', ')}` }), String(ans), (k) => numberWrongs(ans, k, [ans - s, ans + s, ans + 1]))
    }
    if (L === 2) {
      // a, a × r, a × r × r, ...: the slip is adding the last gap instead of multiplying.
      const last = a * s ** 3
      const prev = a * s ** 2
      const ans = a * s ** 4
      const terms = [a, a * s, prev, last]
      return spec(prompt(`${terms.join(', ')}, ?`, { say: `What comes next? ${terms.join(', ')}` }), String(ans), (k) =>
        numberWrongs(ans, k, [last, last + (last - prev), ans - a]),
      )
    }
    const ans = a + (n - 1) * s
    return spec(
      prompt(`The pattern is ${a}, ${a + s}, ${a + 2 * s}, ${a + 3 * s}, … What is the ${ordinal(n)} number in the pattern?`, {
        say: `The pattern is ${a}, ${a + s}, ${a + 2 * s}, ${a + 3 * s}. What is the ${ordinal(n)} number in the pattern?`,
      }),
      String(ans),
      (k) => numberWrongs(ans, k, [a + n * s, a + (n - 2) * s, n * s]),
    )
  },
})

// --- 5. Comparing and ordering fractions --------------------------------------------------------

const compareFractions = keyed({
  tag: 'cmpf',
  id: 'compareFractions',
  labels: ['Compare fractions with like numerators', 'Compare fractions', 'Order fractions: smallest', 'Compare mixed numbers'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'fractions', level: 2 }],
  roll: (L) => {
    // Each list starts with mode: 0 = the biggest, 1 = the smallest. Then (whole, numerator, denominator) per fraction.
    if (L === 1) {
      const p = rand(1, 4)
      const ds = shuffle(range(p + 1, 12).filter((d) => gcd(p, d) === 1)).slice(0, 4)
      return [0, ...ds.flatMap((d) => [0, p, d])]
    }
    if (L === 2) return [0, ...rollFractions(4, 10, false)]
    if (L === 3) return [1, ...rollFractions(4, 12, false)]
    return [0, ...rollFractions(4, 10, true)]
  },
  build: (_L, [mode = 0, ...rest]) => {
    const items: Frac[] = []
    for (let i = 0; i + 2 < rest.length; i += 3) {
      const [w = 0, p = 0, q = 1] = rest.slice(i, i + 3)
      items.push(reduceF([w * q + p, q]))
    }
    const cmp = (a: Frac, b: Frac) => a[0] * b[1] - b[0] * a[1]
    const sorted = [...items].sort((a, b) => (mode === 0 ? cmp(b, a) : cmp(a, b)))
    const best = sorted[0]!
    const others = sorted.slice(1).map(fracText)
    const word = mode === 0 ? 'biggest' : 'smallest'
    return spec(prompt(`Which fraction is the ${word}?`), fracText(best), (k) => shuffle([...others]).slice(0, k))
  },
})

// --- 6. Fractions on number lines ---------------------------------------------------------------

const MIXED_POOL: Frac[] = [1, 2].flatMap((w) => [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]].map(([p, q]): Frac => [w * q + p, q]))

const fractionLine = keyed({
  tag: 'frl',
  id: 'fractionLine',
  labels: ['Fractions on a number line: fourths', 'Fractions on a number line: thirds, sixths, and eighths', 'Mixed numbers on a number line'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'fractions', level: 1 }],
  roll: (L) => {
    if (L === 1) return [4, rand(1, 3)]
    if (L === 2) {
      const d = pick([3, 6, 8])
      return [d, rand(1, d - 1)]
    }
    return [4, pick([1, 2, 3, 5, 6, 7])]
  },
  build: (L, [d = 4, k = 1]) => {
    if (L < 3) {
      // A 0-to-1 line with a tick for every 1/d; the dot sits on k/d.
      const x = (j: number) => 30 + (240 * j) / d
      const ticks = range(0, d)
        .map((j) => line(x(j), 44, x(j), 56, 2))
        .join('')
      const picture = svg(300, 95, line(30, 50, 270, 50, 3) + ticks + `<circle cx="${x(k)}" cy="50" r="8" fill="#ff6b6b"/>` + txt(30, 85, '0') + txt(270, 85, '1'))
      const ans: Frac = [k, d]
      // Close wrong answers are other marks on this same line (one or two ticks off), so they look like real slips.
      const onLine = ([[k - 1, d], [k + 1, d], [k - 2, d], [k + 2, d]] as Frac[]).filter(([n]) => n > 0 && n < d)
      return spec(prompt('What fraction is the dot at?', { svg: picture }), fracText(ans), (c) => fracWrongs(ans, c, onLine, PROPER))
    }
    // A line from 1 to 3 with a tick for every quarter; the dot sits on 1 + k/4.
    const x = (j: number) => 30 + 30 * j
    const ticks = range(0, 8)
      .map((j) => line(x(j), 44, x(j), 56, 2))
      .join('')
    const labels = [0, 1, 2].map((i) => txt(x(i * 4), 85, i + 1)).join('')
    const picture = svg(300, 95, line(30, 50, 270, 50, 3) + ticks + `<circle cx="${x(k)}" cy="50" r="8" fill="#ff6b6b"/>` + labels)
    const ans: Frac = [4 + k, 4]
    return spec(prompt('What mixed number is the dot at?', { svg: picture }), fracText(ans), (c) => fracWrongs(ans, c, [[3 + k, 4], [5 + k, 4]], MIXED_POOL))
  },
})

// --- 7. Bar and line graphs ---------------------------------------------------------------------

const CATS = ['cats', 'dogs', 'fish', 'birds', 'frogs']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu']

const dataGraphs = keyed({
  tag: 'dat',
  id: 'dataGraphs',
  labels: ['Read a bar graph', 'Bar graphs with a scale', 'Read a line graph'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'statistics', level: 1 }],
  roll: (L) => {
    if (L === 1) return [rand(0, 1), 1, ...shuffle(range(0, 4)).slice(0, 3), ...shuffle(range(1, 9)).slice(0, 3)]
    if (L === 2) return [rand(0, 2), pick([2, 5, 10]), ...shuffle(range(0, 4)).slice(0, 3), ...shuffle(range(1, 8)).slice(0, 3)]
    const i = rand(0, 2)
    const j = rand(i + 1, 3)
    let vals = [0, 0, 0, 0]
    do vals = range(0, 3).map(() => rand(2, 20))
    while (vals[i] === vals[j])
    return [i, j, ...vals]
  },
  build: (L, n) => {
    if (L === 3) {
      const [i = 0, j = 1, v0 = 0, v1 = 0, v2 = 0, v3 = 0] = n
      const vals = [v0, v1, v2, v3]
      const hi = vals[i]! > vals[j]! ? i : j
      const lo = hi === i ? j : i
      const diff = Math.abs(vals[i]! - vals[j]!)
      const ans = String(diff)
      // The graph has no title, so the question says what the numbers count.
      return spec(prompt(`This line graph shows cups of lemonade sold each day. How many more cups were sold on ${DAYS[hi]} than on ${DAYS[lo]}?`, { svg: lineGraph(DAYS, vals) }), ans, (k) =>
        numberWrongs(diff, k, [vals[i]! + vals[j]!, diff + 1, diff - 1, Math.max(...vals)]),
      )
    }
    const [type = 0, scale = 1, a = 0, b = 0, c = 0, v1 = 0, v2 = 0, v3 = 0] = n
    const names = [CATS[a]!, CATS[b]!, CATS[c]!]
    const vals = [v1, v2, v3]
    const picture = barGraph(names, vals, scale)
    const total = (v1 + v2 + v3) * scale
    const top = Math.max(...vals) * scale
    if (type === 0) {
      const hi = v1 > v2 ? 0 : 1
      const lo = 1 - hi
      const diff = Math.abs(v1 - v2) * scale
      return spec(prompt(`How many more ${names[hi]} than ${names[lo]}?`, { svg: picture }), String(diff), (k) =>
        numberWrongs(diff, k, [(v1 + v2) * scale, diff + scale, diff - scale, top]),
      )
    }
    if (type === 1) return spec(prompt('How many are there in all?', { svg: picture }), String(total), (k) => numberWrongs(total, k, [total + scale, total - scale, top]))
    return spec(prompt('How many does the tallest bar show?', { svg: picture }), String(top), (k) => numberWrongs(top, k, [total, top - scale, top + scale]))
  },
})

// --- 8. Lines of symmetry -----------------------------------------------------------------------

const poly = (n: number) => ({ pts: regular(n), lines: n })
const SYM_LEVELS = [
  [SHAPES.rectangle!, SHAPES['isosceles triangle']!, SHAPES['scalene triangle']!, SHAPES.parallelogram!, SHAPES.rhombus!],
  [SHAPES.square!, SHAPES['equilateral triangle']!, SHAPES.kite!, SHAPES.rectangle!],
  [poly(5), poly(6), poly(8), SHAPES['equilateral triangle']!],
]

const symmetry = keyed({
  tag: 'sym',
  id: 'symmetry',
  labels: ['Lines of symmetry: simple shapes', 'Lines of symmetry: four-sided and triangle shapes', 'Lines of symmetry: regular shapes'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'area', level: 2 }],
  roll: (L) => [rand(0, SYM_LEVELS[L - 1]!.length - 1)],
  build: (L, [idx = 0]) => {
    const shape = SYM_LEVELS[L - 1]![idx]!
    const ans = shape.lines
    // Wrong counts are other real counts (0 to 8), never silly ones like 11.
    return spec(prompt('How many lines of symmetry does this shape have?', { svg: shapeSvg(shape.pts) }), String(ans), (k) =>
      wrongFrom(String(ans), k, range(0, 8).map(String), SYM_LEVELS[L - 1]!.map((s) => String(s.lines))),
    )
  },
})

// --- 9. Polygons and angles ---------------------------------------------------------------------

const NGON: Record<number, string> = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' }
const pic = (name: string) => ({ name, pts: SHAPES[name]!.pts })
const POLY_LEVELS: { name: string; pts: Pts }[][] = [
  [pic('square'), pic('rectangle'), pic('trapezoid')],
  [3, 4, 5, 6, 8].map((n) => ({ name: NGON[n]!, pts: regular(n) })),
  [pic('equilateral triangle'), pic('isosceles triangle'), pic('scalene triangle')],
  [pic('trapezoid'), pic('kite'), pic('parallelogram')],
]
const POLY_NAMES: string[][] = [
  ['square', 'rectangle', 'trapezoid', 'triangle', 'pentagon'],
  ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'],
  // Level 3 counts the sides that are the same length, so every choice is about sides (and exactly one is right).
  ['none', 'one', 'two', 'all three'],
  ['trapezoid', 'kite', 'parallelogram', 'rectangle'],
]
const SAME_SIDES: Record<string, string> = { 'equilateral triangle': 'all three', 'isosceles triangle': 'two', 'scalene triangle': 'none' }
const POLY_QUESTIONS = ['What is this shape called?', 'What is this polygon called?', 'How many sides of this triangle are the same length?', 'What is this four-sided shape called?']

const polygons = keyed({
  tag: 'pol',
  id: 'polygons',
  labels: ['Name a quadrilateral', 'Name a polygon', 'Count the equal sides of a triangle', 'Name a four-sided shape'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'perimeter', level: 2 }],
  roll: (L) => [rand(0, POLY_LEVELS[L - 1]!.length - 1)],
  build: (L, [idx = 0]) => {
    const shape = POLY_LEVELS[L - 1]![idx]!
    const answer = L === 3 ? SAME_SIDES[shape.name]! : shape.name
    // A square is also a rectangle, so "rectangle" is never a wrong choice for a square.
    const names = answer === 'square' ? POLY_NAMES[L - 1]!.filter((n) => n !== 'rectangle') : POLY_NAMES[L - 1]!
    return spec(prompt(POLY_QUESTIONS[L - 1]!, { svg: shapeSvg(shape.pts) }), answer, from(answer, names))
  },
})

const LINE_PICS = [
  svg(120, 120, line(15, 40, 105, 40, 4) + line(15, 80, 105, 80, 4)),
  svg(120, 120, line(60, 15, 60, 105, 4) + line(15, 60, 105, 60, 4)),
  svg(120, 120, line(15, 100, 105, 20, 4) + line(15, 40, 105, 90, 4)),
]
const LINE_NAMES = ['parallel', 'perpendicular', 'neither']

const angles = keyed({
  tag: 'ang',
  id: 'angles',
  labels: ['Right, acute, or obtuse', 'Parallel and perpendicular lines', 'Measure an angle'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'perimeter', level: 2 }],
  roll: (L) => {
    if (L === 1) return [pick([30, 45, 60, 70, 75, 80, 90, 100, 110, 120, 135, 150])]
    if (L === 2) return [rand(0, 2)]
    return [5 * rand(4, 32)]
  },
  build: (L, [v = 90]) => {
    if (L === 1) {
      const answer = v === 90 ? 'right angle' : v < 90 ? 'acute angle' : 'obtuse angle'
      return spec(prompt('What kind of angle is this?', { svg: angleSvg(v) }), answer, from(answer, ['right angle', 'acute angle', 'obtuse angle', 'straight angle']))
    }
    if (L === 2) {
      const answer = LINE_NAMES[v]!
      return spec(prompt('Are these two lines parallel, perpendicular, or neither?', { svg: LINE_PICS[v] }), answer, from(answer, [...LINE_NAMES, 'curved']))
    }
    return spec(prompt('How many degrees is this angle?', { svg: angleSvg(v) }), `${v}°`, (k) => numberWrongs(v, k, [180 - v, v + 10, v - 10]).map((x) => `${x}°`))
  },
})

// --- 10. Composite area and perimeter -----------------------------------------------------------

const compositeAreaBase = keyed({
  tag: 'cmp',
  id: 'compositeArea',
  labels: ['Perimeter of a rectangle', 'Area of an L-shape', 'Area of a rectangle with a fraction side'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'area', level: 2 },
    { skill: 'perimeter', level: 2 },
  ],
  roll: (L) => {
    if (L === 1) return [rand(3, 12), rand(2, 9)]
    if (L === 2) {
      const W = rand(5, 10)
      const H = rand(4, 9)
      return [W, H, rand(2, W - 2), rand(2, H - 2)]
    }
    // A whole number of cm plus a half (like 3 1/2 cm) by an even height, so the area is a whole number.
    return [rand(2, 9), pick([2, 4, 6, 8])]
  },
  build: (L, [a = 0, b = 0, c = 0, d = 0]) => {
    if (L === 1) {
      const w = a
      const h = b
      const s = Math.min(150 / w, 90 / h)
      const pw = w * s
      const ph = h * s
      const picture = svg(240, 140, `<rect x="56" y="25" width="${pw}" height="${ph}" fill="#4dabf7" opacity=".85" stroke="#495057" stroke-width="2"/>` + txt(56 + pw / 2, 17, `${w} cm`, 13) + txt(48, 25 + ph / 2 + 5, `${h} cm`, 13, 'end'))
      const ans = 2 * (w + h)
      return spec(prompt('What is the perimeter of this rectangle?', { svg: picture }), String(ans), (k) => numberWrongs(ans, k, [w + h, w * h, 2 * w + h, 2 * h + w]))
    }
    if (L === 2) {
      // The big rectangle is W by H, with a ch-by-cw corner cut out of the top right.
      const W = a
      const H = b
      const cw = c
      const ch = d
      const s = Math.min(150 / W, 100 / H)
      const pts: Pts = [
        [0, 0],
        [W - cw, 0],
        [W - cw, ch],
        [W, ch],
        [W, H],
        [0, H],
      ]
      const outline = pts.map(([x, y]) => `${56 + x * s},${20 + y * s}`).join(' ')
      // The notch's two sizes are named too, so the picture has everything needed to answer.
      const notchX = 56 + (W - cw) * s
      const notchY = 20 + ch * s
      const picture = svg(
        240,
        160,
        `<polygon points="${outline}" fill="#51cf66" stroke="#495057" stroke-width="2"/>` +
          txt(56 + (W * s) / 2, 20 + H * s + 20, `${W} cm`, 13) +
          txt(48, 20 + (H * s) / 2, `${H} cm`, 13, 'end') +
          txt(notchX + (cw * s) / 2, notchY + 16, `${cw} cm`, 13) +
          txt(notchX - 6, 20 + (ch * s) / 2 + 4, `${ch} cm`, 13, 'end'),
      )
      const ans = W * H - cw * ch
      return spec(prompt('What is the area of this L-shape?', { svg: picture }), String(ans), (k) => numberWrongs(ans, k, [W * H, 2 * (W + H), (W - cw) * (H - ch), W * H - cw]))
    }
    // A rectangle that is `whole` and a half cm wide and `height` cm tall (drawn to scale).
    const whole = a
    const height = b
    const width = whole + 0.5
    const s = Math.min(150 / width, 90 / height)
    const pw = width * s
    const ph = height * s
    const picture = svg(240, 140, `<rect x="56" y="25" width="${pw}" height="${ph}" fill="#ffa94d" opacity=".85" stroke="#495057" stroke-width="2"/>` + txt(56 + pw / 2, 17, `${whole} 1/2 cm`, 13) + txt(48, 25 + ph / 2 + 5, `${height} cm`, 13, 'end'))
    const ans = whole * height + height / 2
    return spec(prompt('What is the area of this rectangle? (square cm)', { svg: picture }), String(ans), (k) =>
      numberWrongs(ans, k, [whole * height, (whole + 1) * height, 2 * (width + height), whole + height]),
    )
  },
})

// Level 3 used to be a triangle. Saved keys from that version (whose height could be odd) can't be rebuilt
// as a whole-number question, so they are dropped; the rest still rebuild exactly.
const compositeArea: Skill = {
  ...compositeAreaBase,
  fromKey: (key, L) => (L === 3 && !/^cmp:3:\d+,(2|4|6|8)$/.test(key) ? null : compositeAreaBase.fromKey!(key, L)),
}

// --- 11. Word problems --------------------------------------------------------------------------

const divStories = keyed({
  tag: 'dvs',
  id: 'divStories',
  labels: ['Share equally', 'Share in bigger groups', 'Measure and divide'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'mulStories', level: 2 },
    { skill: 'div', level: 8 },
  ],
  roll: (L) => {
    if (L === 1) return [rand(0, 1), rand(0, 5), rand(0, 5), rand(2, 5), rand(2, 9)]
    if (L === 2) return [rand(0, 1), rand(0, 5), rand(0, 5), rand(3, 12), rand(10, 30)]
    return [rand(2, 6), rand(0, 2)]
  },
  build: (L, [t = 0, ni = 0, ii = 0, k = 2, q = 2]) => {
    if (L === 3) {
      const cup = [125, 250, 500][ni] ?? 250
      const liters = t
      const ans = (liters * 1000) / cup
      return spec(prompt(`A jug holds ${liters} liters of juice. How many ${cup} milliliter cups can it fill?`), String(ans), (c) => numberWrongs(ans, c, [liters * 1000, ans * 2, ans + 1]))
    }
    const who = NAMES[ni % NAMES.length]!
    const what = ITEMS[ii % ITEMS.length]!
    const total = k * q
    const text =
      t === 0
        ? `${who} shares ${total} ${what} equally among ${k} friends. How many does each friend get?`
        : `${who} has ${total} ${what}. ${who} puts ${k} ${what} in each bag. How many bags can ${who} fill?`
    return spec(prompt(text), String(q), (c) => numberWrongs(q, c, [k, total, q + 1, q - 1]))
  },
})

const multiStep = keyed({
  tag: 'ms',
  id: 'multiStep',
  labels: ['Two steps: multiply, then take away', 'Two steps: divide, then add', 'Three steps'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'multiply', level: 2 }],
  roll: (L) => {
    if (L === 1) {
      const a = rand(2, 5)
      const b = rand(3, 9)
      return [a, b, rand(1, a * b - 1), rand(0, 5), rand(0, 5)]
    }
    if (L === 2) return [rand(2, 9), rand(2, 9), rand(2, 9), rand(0, 5), rand(0, 5)]
    const a = rand(2, 6)
    const b = rand(10, 30)
    const c = rand(5, 30)
    return [a, b, c, rand(1, a * b + c - 1), rand(0, 5), rand(0, 5)]
  },
  build: (L, n) => {
    const who = NAMES[(n[L === 3 ? 4 : 3] ?? 0) % NAMES.length]!
    const what = ITEMS[(n[L === 3 ? 5 : 4] ?? 0) % ITEMS.length]!
    if (L === 1) {
      const [a = 0, b = 0, c = 0] = n
      const ans = a * b - c
      const text = `${who} has ${a} packs of ${what}. Each pack has ${b} ${what}. ${who} gives away ${c}. How many ${what} does ${who} have now?`
      return spec(prompt(text), String(ans), (k) => numberWrongs(ans, k, [a * b, a * b + c, a + b - c, ans + b]))
    }
    if (L === 2) {
      const [c = 2, q = 2, d = 0] = n
      const total = c * q
      const ans = q + d
      const text = `${total} ${what} are shared equally among ${c} kids. Then each kid gets ${d} more. How many does each kid have now?`
      return spec(prompt(text), String(ans), (k) => numberWrongs(ans, k, [q, total, q * d, total + d]))
    }
    const [a = 0, b = 0, c = 0, e = 0] = n
    const ans = a * b + c - e
    const text = `${who} has ${a} bags with ${b} ${what} in each. ${who} also has ${c} loose ${what}. Then ${who} loses ${e}. How many ${what} does ${who} have now?`
    return spec(prompt(text), String(ans), (k) => numberWrongs(ans, k, [a * b + c, a * b - e, a * (b + c) - e, a + b + c - e]))
  },
})

// --- 12. Big multiplying and dividing -----------------------------------------------------------

const bigMulDiv = keyed({
  tag: 'bmd',
  id: 'bigMulDiv',
  labels: ['Multiply a 3-digit by a 2-digit number', 'Divide by a 2-digit number', 'Divide a 4- or 5-digit number by a 2-digit number'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'multiply', level: 4 },
    { skill: 'divide', level: 3 },
  ],
  roll: (L) => {
    if (L === 1) {
      let b = 0
      do b = rand(11, 99)
      while (b % 10 === 0)
      return [rand(101, 999), b]
    }
    if (L === 2) return [rand(11, 25), rand(11, 99)]
    return [rand(12, 39), rand(100, 999)]
  },
  build: (L, [a = 0, b = 0]) => {
    if (L === 1) {
      const ans = a * b
      return spec(prompt(`${a} × ${b}`, { sum: true, say: `${a} times ${b}` }), String(ans), (k) =>
        numberWrongs(ans, k, [a * Math.floor(b / 10) * 10, a * (b % 10), ans + a, ans - a]),
      )
    }
    // a is the divisor and b the answer; the big number is a × b.
    const n = a * b
    const ans = b
    return spec(prompt(`${n} ÷ ${a}`, { sum: true, say: `${n} divided by ${a}` }), String(ans), (k) => numberWrongs(ans, k, [ans + 1, ans - 1, ans + 10, a]))
  },
})

// --- 13. Big numbers ----------------------------------------------------------------------------

function rollDigitNumber(): [number, number] {
  let N = 0
  let p = 0
  let d = 0
  do {
    N = rand(100000, 9999999)
    p = rand(2, 6)
    d = digitAt(N, p)
  } while (!d || String(N).split(String(d)).length !== 2)
  return [N, p]
}

const bigNumbers = keyed({
  tag: 'bign',
  id: 'bigNumbers',
  labels: ['Value of a digit', 'Greatest and least', 'How many times bigger'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'place', level: 6 }],
  roll: (L) => {
    if (L === 1) return rollDigitNumber()
    if (L === 2) {
      const xs = new Set<number>()
      while (xs.size < 4) xs.add(rand(100000, 9999999))
      return [rand(0, 1), ...xs]
    }
    return [rand(1, 9), rand(0, 3), rand(1, 3)]
  },
  build: (L, n) => {
    if (L === 1) {
      const [N = 0, p = 0] = n
      const d = digitAt(N, p)
      const value = d * 10 ** p
      const ans = commas(value)
      const pool = range(0, 6).map((j) => commas(d * 10 ** j))
      const near = [p - 1, p + 1].filter((j) => j >= 0 && j <= 6).map((j) => commas(d * 10 ** j))
      return spec(prompt(`What is the value of the ${d} in ${commas(N)}?`, { say: `What is the value of the ${d} in ${N}?` }), ans, (k) => wrongFrom(ans, k, pool, near))
    }
    if (L === 2) {
      const [mode = 0, ...nums] = n
      const sorted = [...nums].sort((x, y) => x - y)
      const answerNum = mode === 0 ? sorted[3]! : sorted[0]!
      const others = nums.filter((x) => x !== answerNum).map(commas)
      const word = mode === 0 ? 'greatest' : 'least'
      return spec(prompt(`Which number is the ${word}?`), commas(answerNum), (k) => shuffle([...others]).slice(0, k))
    }
    const [d = 1, p2 = 0, gap = 1] = n
    const p1 = p2 + gap
    const ans = commas(10 ** gap)
    const text = `How many times bigger is the ${d} in ${commas(d * 10 ** p1)} than the ${d} in ${commas(d * 10 ** p2)}?`
    return spec(prompt(text), ans, (k) => wrongFrom(ans, k, ['10', '100', '1,000', '10,000', '100,000'], [commas(10 ** (gap + 1)), commas(10 ** (gap - 1))]))
  },
})

// --- 14. Money ----------------------------------------------------------------------------------

const moneySkill = keyed({
  tag: 'mon',
  id: 'money',
  labels: ['Add money', 'Make change', 'Save money each week', 'Spend and keep track'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'decimals', level: 3 }],
  roll: (L) => {
    if (L === 1) return [rand(25, 499), rand(25, 499)]
    if (L === 2) return [pick([10, 20]), rand(150, 450), rand(150, 450)]
    if (L === 3) return [rand(25, 200), rand(3, 12)]
    return [rand(35, 150), rand(2, 5), rand(1000, 2000)]
  },
  build: (L, [a = 0, b = 0, c = 0]) => {
    if (L === 1) {
      const ans = money(a + b)
      const near = [a + b + 100, a + b + 10, a + b - 10, a + b - 100].filter((v) => v > 0).map(money)
      const pool = [a + b + 50, a + b - 50, a + b + 1].filter((v) => v > 0).map(money)
      return spec(prompt(`${money(a)} + ${money(b)}`, { sum: true, say: `${money(a)} plus ${money(b)}` }), ans, (k) => wrongFrom(ans, k, pool, near))
    }
    if (L === 2) {
      // a is the bill in dollars; b and c are the prices in cents.
      const change = a * 100 - b - c
      const near = [a * 100 - b, b + c, change + 100, change - 100].filter((v) => v > 0).map(money)
      return spec(
        prompt(`Sam buys a toy for ${money(b)} and a book for ${money(c)}. He pays with $${a}. How much change should he get?`),
        money(change),
        (k) => wrongFrom(money(change), k, [money(change + 50), money(change - 50)], near),
      )
    }
    if (L === 3) {
      const ans = a * b
      const near = [a * (b + 1), a * (b - 1), a * b * 10].filter((v) => v > 0).map(money)
      const pool = [a * (b + 2), a * (b - 2), a * b + 100].filter((v) => v > 0).map(money)
      return spec(prompt(`Mia saves ${money(a)} every week. How much will she have after ${b} weeks?`), money(ans), (k) => wrongFrom(money(ans), k, pool, near))
    }
    // a is the price of one pencil, b the number of pencils, c the money Zoe starts with.
    const spent = a * b
    const ans = c - spent
    const near = [c - a, spent + 100, ans + 100, ans - 100].filter((v) => v > 0).map(money)
    const pool = [ans + 10, ans - 10, spent].filter((v) => v > 0).map(money)
    return spec(
      prompt(`Zoe has ${money(c)}. She buys ${b} pencils that cost ${money(a)} each. How much money is left?`),
      money(ans),
      (k) => wrongFrom(money(ans), k, pool, near),
    )
  },
})

// --- 15. Fractions: times whole numbers, mixed numbers, and scaling -----------------------------

const neighbors = (f: Frac) => around(reduceF(f))

const fractionMulMixed = keyed({
  tag: 'fmm',
  id: 'fractionMulMixed',
  labels: ['Fraction times a whole number', 'Multiply mixed numbers', 'Scaling: bigger or smaller?'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'multiplyFractions', level: 2 }],
  roll: (L) => {
    if (L === 1) {
      const q = rand(2, 12)
      return [rand(1, q - 1), q, rand(2, 9)]
    }
    if (L === 2) {
      const q1 = rand(2, 5)
      const q2 = rand(2, 5)
      return [rand(1, 2), rand(1, q1 - 1), q1, rand(1, 2), rand(1, q2 - 1), q2]
    }
    const q = rand(2, 6)
    const t = rand(0, 2)
    const p = t === 0 ? rand(1, q - 1) : t === 1 ? rand(q + 1, q + 4) : q
    return [rand(2, 9), p, q]
  },
  build: (L, [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0]) => {
    if (L === 1) {
      const [p = 1, q = 2, w = 2] = [a, b, c]
      const ans: Frac = reduceF([p * w, q])
      return spec(prompt(`${p}/${q} × ${w}`, { sum: true, say: `${p} over ${q}, times ${w}` }), fracText(ans), (k) =>
        fracWrongs(ans, k, [...neighbors(ans), [p + w, q], [p * w, q + 1]], PROPER),
      )
    }
    if (L === 2) {
      // (a and b/c) × (d and e/f), as improper fractions.
      const x: Frac = [a * c + b, c]
      const y: Frac = [d * f + e, f]
      const ans = reduceF([x[0] * y[0], x[1] * y[1]])
      const text = `${a} ${b}/${c} × ${d} ${e}/${f}`
      const slip: Frac = [a * d * c * f + b * e, c * f]
      return spec(prompt(text, { sum: true, say: `${a} and ${b} over ${c}, times ${d} and ${e} over ${f}` }), fracText(ans), (k) =>
        fracWrongs(ans, k, [slip, ...neighbors(ans)], PROPER),
      )
    }
    // w × p/q: more than w when p is bigger than q, less when smaller, the same when equal.
    const [w = 2, p = 1, q = 2] = [a, b, c]
    const ans = p < q ? `less than ${w}` : p > q ? `more than ${w}` : `equal to ${w}`
    const names = [`less than ${w}`, `more than ${w}`, `equal to ${w}`, 'cannot tell']
    return spec(prompt(`Will ${w} × ${p}/${q} be more or less than ${w}?`, { say: `Will ${w} times ${p} over ${q} be more or less than ${w}?` }), ans, from(ans, names))
  },
})

// --- 16. Factors and multiples ------------------------------------------------------------------

const COMPOSITES = [12, 15, 18, 20, 21, 24, 27, 28, 30, 32, 33, 35, 36, 40, 42, 44, 45, 48, 50, 52, 54, 56, 60, 63, 64, 66, 70, 72, 75, 80, 84, 90]
const smallestFactor = (n: number) => range(2, n).find((d) => n % d === 0)!

const factorsMultiples = keyed({
  tag: 'fm',
  id: 'factorsMultiples',
  labels: ['Next multiple', 'Greatest factor', 'Biggest multiple under 100'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [
    { skill: 'mul', level: 8 },
    { skill: 'div', level: 8 },
  ],
  roll: (L) => {
    if (L === 1) return [rand(3, 9), rand(20, 90)]
    if (L === 2) return [pick(COMPOSITES)]
    return [pick([3, 4, 6, 7, 8, 9, 11, 12, 13])]
  },
  build: (L, [a = 0, b = 0]) => {
    if (L === 1) {
      const ans = (Math.floor(b / a) + 1) * a
      return spec(prompt(`What is the next multiple of ${a} after ${b}?`), String(ans), (k) => numberWrongs(ans, k, [b, ans + a, ans - a]))
    }
    if (L === 2) {
      const spf = smallestFactor(a)
      const ans = a / spf
      return spec(prompt(`What is the greatest factor of ${a} that is less than ${a}?`), String(ans), (k) => numberWrongs(ans, k, [spf, a, ans * 2]))
    }
    const ans = Math.floor(99 / a) * a
    return spec(prompt(`What is the biggest 2-digit multiple of ${a}?`, { say: `What is the biggest two-digit multiple of ${a}?` }), String(ans), (k) =>
      numberWrongs(ans, k, [99, ans - a, ans + 1]),
    )
  },
})

// --- Exports ------------------------------------------------------------------------------------

export const MATH_345: Skill[] = [
  estimate,
  mixedOps,
  equations,
  numberPatterns,
  compareFractions,
  fractionLine,
  dataGraphs,
  symmetry,
  polygons,
  angles,
  compositeArea,
  divStories,
  multiStep,
  bigMulDiv,
  bigNumbers,
  moneySkill,
  fractionMulMixed,
  factorsMultiples,
]

/** One IXL topic per level, keyed by skill id. Each category is in skills.json for its grade. */
export const MATH_345_IXL: Record<string, IxlRef[]> = {
  'math.estimate': [m(3, 'Estimate sums'), m(3, 'Estimate differences'), m(3, 'Estimate sums and differences'), m(5, 'Addition and subtraction')],
  'math.mixedOps': [m(3, 'Mixed operations: addition and subtraction'), m(3, 'Mixed operations: multiplication and division'), m(4, 'Mixed operations'), m(5, 'Mixed operations: whole numbers')],
  'math.equations': [m(3, 'Equations with unknown numbers'), m(3, 'Equations with unknown numbers'), m(5, 'Variable expressions')],
  'math.numberPatterns': [m(4, 'Number patterns'), m(4, 'Number patterns'), m(5, 'Number patterns')],
  'math.compareFractions': [m(3, 'Compare fractions with like numerators'), m(3, 'Compare fractions'), m(4, 'Compare and order fractions'), m(5, 'Compare fractions')],
  'math.fractionLine': [m(3, 'Fractions on number lines'), m(3, 'Fractions on number lines'), m(4, 'Mixed numbers')],
  'math.dataGraphs': [m(3, 'Data and graphs'), m(4, 'Data and graphs'), m(4, 'Data and graphs')],
  'math.symmetry': [m(4, 'Symmetry'), m(4, 'Symmetry'), m(4, 'Symmetry')],
  'math.polygons': [m(3, 'Quadrilaterals'), m(3, 'Polygons'), m(4, 'Triangles'), m(5, 'Quadrilaterals')],
  'math.angles': [m(3, 'Lines and angles'), m(4, 'Lines and angles'), m(4, 'Angle measurement')],
  'math.compositeArea': [m(3, 'Perimeter'), m(4, 'Area'), m(5, 'Area')],
  'math.divStories': [m(3, 'Division word problems'), m(4, 'Division word problems'), m(4, 'Measurement word problems')],
  'math.multiStep': [m(4, 'Multi-step word problems'), m(5, 'Multi-step word problems'), m(5, 'Multi-step word problems')],
  'math.bigMulDiv': [m(5, 'Multiplication'), m(5, 'Division'), m(5, 'Division')],
  'math.bigNumbers': [m(4, 'Place value'), m(4, 'Comparing and ordering'), m(5, 'Whole numbers and place value')],
  'math.money': [m(3, 'Money'), m(4, 'Money'), m(4, 'Money'), m(4, 'Money')],
  'math.fractionMulMixed': [m(5, 'Multiply fractions and whole numbers'), m(5, 'Multiply mixed numbers'), m(5, 'Scaling by fractions')],
  'math.factorsMultiples': [m(4, 'Factors and multiples'), m(4, 'Factors and multiples'), m(5, 'Factors, multiples, and divisibility')],
}
