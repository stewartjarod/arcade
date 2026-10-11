import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * Grade 5 math, plus the grade 3–4 topics that lead into it, named like IXL's categories. Like
 * mathUpper.ts, these unlock once a player is solid on the basics (see math.ts), so younger kids
 * never see them.
 *
 * Answers are whole numbers (number + choice), or choices like "3/4", "2 1/4" and "0.75" (choice only).
 * Every question is rebuilt exactly from its key, so a missed one can come back later.
 */

const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })

const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-weight="700">${body}</svg>`

// --- Helpers ------------------------------------------------------------------------------------------

type Four = [number, number, number, number]
type Five = [number, number, number, number, number]
type Seven = [number, number, number, number, number, number, number]

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
const isPrime = (n: number) => {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return n > 1
}

/** Retries `make` until `ok` accepts what it made. Only used where the good cases are common. */
function tryUntil<T>(make: () => T, ok: (x: T) => boolean): T {
  let x = make()
  while (!ok(x)) x = make()
  return x
}

/** Writes a count of tiny steps as a decimal: fmtDec(325, 2) is "3.25", fmtDec(40, 2) is "0.4". */
const fmtDec = (n: number, places: number) => {
  const digits = String(n).padStart(places + 1, '0')
  const whole = digits.slice(0, -places)
  const frac = digits.slice(-places).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}

/** Reads a key like "gcf:2:12,18" back into its numbers. `count` 0 means any amount. */
function parseKey(key: string, kind: string, L: number, count: number): number[] | null {
  const [k, level, data = ''] = key.split(':')
  if (k !== kind || Number(level) !== L) return null
  const nums = data.split(',').map(Number)
  return (count === 0 || nums.length === count) && nums.every(Number.isFinite) ? nums : null
}

/** "3/4", or just "5" when it is a whole number. */
const fracText = (n: number, d: number) => (d === 1 ? String(n) : `${n}/${d}`)
const reduce = (n: number, d: number) => [n / gcd(n, d), d / gcd(n, d)] as const
const reducedText = (n: number, d: number) => {
  const [a, b] = reduce(n, d)
  return fracText(a, b)
}
/** "2 1/4", or "3" or "3/4" when a part is missing. */
const mixedText = (n: number, d: number) => {
  const [top, bottom] = reduce(n, d)
  const whole = Math.floor(top / bottom)
  const part = top % bottom
  if (part === 0) return String(whole)
  return whole === 0 ? `${part}/${bottom}` : `${whole} ${part}/${bottom}`
}

/** The amount a choice stands for, so "2/4", "0.5" and "1/2" can be checked for matching. */
const amount = (s: string) => {
  const mixed = s.match(/^(\d+) (\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = s.match(/^(\d+)\/(\d+)$/)
  return frac ? Number(frac[1]) / Number(frac[2]) : Number(s)
}
const sameAmount = (a: string, b: string) => Math.abs(amount(a) - amount(b)) < 1e-9

/**
 * Up to `count` wrong choices. The `near` slips come first, then the `fallback` pool. Anything that
 * means the same as the answer, or as a choice already picked, is skipped ("2/4" never sits beside "1/2").
 */
function wrongChoices(answer: string, count: number, near: string[], fallback: string[], same = sameAmount): string[] {
  const out: string[] = []
  for (const w of [...shuffle([...near]), ...shuffle([...fallback])]) {
    if (out.length === count) break
    if (!same(w, answer) && !out.some((o) => same(o, w))) out.push(w)
  }
  return out
}

/** Plain fractions and whole numbers, for when the close-looking slips run out. */
const FRACTION_POOL = [
  ...range(2, 12).flatMap((d) => range(1, 3 * d).filter((n) => gcd(n, d) === 1).map((n) => `${n}/${d}`)),
  ...range(1, 12).map(String),
]
/** Just the fractions (no whole numbers), for when the answer is a fraction: "9" is a silly wrong answer for 1/2. */
const FRACTIONS_ONLY = FRACTION_POOL.filter((f) => f.includes('/'))

/** Decimals with up to two places, for decimal answers. */
const DECIMAL_POOL = [...range(1, 999).map((n) => fmtDec(n, 2)), ...range(1, 9).map(String)]

/** Mixed numbers, for the mixed-number answers. */
const MIXED_POOL = range(1, 8).flatMap((w) => [2, 3, 4, 5, 6, 8].flatMap((d) => range(1, d - 1).map((r) => `${w} ${r}/${d}`)))

// --- Factors, multiples, and divisibility: prime numbers, greatest common factor, least common multiple ---

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
const COMPOSITES = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 33, 34, 35, 36, 38, 39, 40]

function primeItem(nums: number[]): ItemSpec {
  const answer = nums.find(isPrime)!
  const text = `Which number is prime? ${nums.join(', ')}`
  return {
    key: `prime:1:${nums.join(',')}`,
    prompt: { text, say: text },
    answer: String(answer),
    wrong: (k) => wrongFrom(String(answer), k, COMPOSITES.map(String), nums.filter((v) => !isPrime(v)).map(String)),
    seconds: 10,
  }
}

// Numbers with plenty of factors to pick from, for "Which number is a factor of 24?"
const FACTOR_NUMBERS = [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 60]

function factorItem(N: number, d: number): ItemSpec {
  const answer = String(d)
  const text = `Which number is a factor of ${N}?`
  // A factor divides N with no remainder, so every wrong choice must NOT divide N (else it could be right too).
  const notFactor = (v: number) => v >= 2 && v < N && N % v !== 0
  return {
    key: `fac:2:${N},${d}`,
    prompt: { text, say: text },
    answer,
    wrong: (k) => wrongChoices(answer, k, [d + 1, d - 1, d + 2, 2 * d - 1].filter(notFactor).map(String), range(2, 20).filter(notFactor).map(String), (x, y) => x === y),
    seconds: 14,
  }
}

function lcmItem(a: number, b: number): ItemSpec {
  const answer = lcm(a, b)
  const text = `What is the least common multiple of ${a} and ${b}?`
  // A common multiple is a multiple of both, so it can't be a wrong answer that looks right.
  const notMultiple = (v: number) => !(v % a === 0 && v % b === 0)
  return {
    key: `lcm:3:${a},${b}`,
    prompt: { text, say: text },
    answer: String(answer),
    wrong: (k) => wrongChoices(String(answer), k, [a + b, gcd(a, b), a, b].filter(notMultiple).map(String), range(2, 99).filter(notMultiple).map(String)),
    seconds: 16,
  }
}

const lcmPair = (): [number, number] => {
  const [a, b] = tryUntil((): [number, number] => [rand(2, 12), rand(2, 12)], ([x, y]) => x !== y)
  return [a, b]
}

// --- Numerical expressions: order of operations ---

type Nums4 = Four
type Expr = { make: () => Nums4; text: (n: Nums4) => string; value: (n: Nums4) => number; slip: (n: Nums4) => number }

const EXPRESSIONS: Expr[] = [
  { // a + b × c: multiply first
    make: () => [rand(2, 20), rand(2, 9), rand(2, 9), 0],
    text: ([a, b, c]) => `${a} + ${b} × ${c}`,
    value: ([a, b, c]) => a + b * c,
    slip: ([a, b, c]) => (a + b) * c,
  },
  { // a × b − c
    make: (): Nums4 => {
      const a = rand(2, 9)
      const b = rand(2, 9)
      return [a, b, rand(1, a * b - 1), 0]
    },
    text: ([a, b, c]) => `${a} × ${b} − ${c}`,
    value: ([a, b, c]) => a * b - c,
    slip: ([a, b, c]) => a * (b - c),
  },
  { // (a + b) × c: parentheses first
    make: () => [rand(2, 12), rand(2, 12), rand(2, 9), 0],
    text: ([a, b, c]) => `(${a} + ${b}) × ${c}`,
    value: ([a, b, c]) => (a + b) * c,
    slip: ([a, b, c]) => a + b * c,
  },
  { // a × b + c × d
    make: () => [rand(2, 9), rand(2, 9), rand(2, 9), rand(2, 9)],
    text: ([a, b, c, d]) => `${a} × ${b} + ${c} × ${d}`,
    value: ([a, b, c, d]) => a * b + c * d,
    slip: ([a, b, c, d]) => (a * b + c) * d,
  },
  { // (a + b) ÷ c: the total always divides evenly
    make: (): Nums4 => {
      const c = rand(2, 6)
      const q = rand(2, 9)
      const a = rand(1, c * q - 1)
      return [a, c * q - a, c, 0]
    },
    text: ([a, b, c]) => `(${a} + ${b}) ÷ ${c}`,
    value: ([a, b, c]) => (a + b) / c,
    slip: ([a, b, c]) => a + b * c,
  },
  { // a × b − c × d
    make: (): Nums4 => tryUntil((): Nums4 => [rand(3, 9), rand(3, 9), rand(2, 5), rand(2, 5)], ([a, b, c, d]) => a * b > c * d),
    text: ([a, b, c, d]) => `${a} × ${b} − ${c} × ${d}`,
    value: ([a, b, c, d]) => a * b - c * d,
    slip: ([a, b, c, d]) => (a * b - c) * d,
  },
  { // a + b × c − d
    make: (): Nums4 => {
      const a = rand(2, 20)
      const b = rand(2, 9)
      const c = rand(2, 9)
      return [a, b, c, rand(1, a + b * c - 1)]
    },
    text: ([a, b, c, d]) => `${a} + ${b} × ${c} − ${d}`,
    value: ([a, b, c, d]) => a + b * c - d,
    slip: ([a, b, c, d]) => (a + b) * c - d,
  },
]
const EXPR_LEVELS = [[0, 1], [2, 3, 4], [4, 5, 6]]

function exprItem(L: number, t: number, nums: Nums4): ItemSpec {
  const e = EXPRESSIONS[t]!
  const answer = e.value(nums)
  return {
    key: `expr:${L}:${[t, ...nums].join(',')}`,
    prompt: { text: e.text(nums), sum: true },
    answer: String(answer),
    wrong: (k) => numberWrongs(answer, k, [e.slip(nums)]),
    seconds: 12 + L * 3,
  }
}

// --- Powers of ten ---

const sup = (n: number) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]!)

function powerItem(L: number, a: number, b: number): ItemSpec {
  if (L === 2) {
    // 10 to a power, like 10³. Here `a` is the power.
    const answer = 10 ** a
    return {
      key: `pow:2:${a},0`,
      prompt: { text: `10${sup(a)}`, say: `ten to the power of ${a}`, sum: true },
      answer: String(answer),
      wrong: (k) => numberWrongs(answer, k, [10 * a, 10 ** (a - 1), a * 100]),
      seconds: 10,
    }
  }
  // a × 10 to a power, like 34 × 100 (level 1) or 4 × 10³ (level 3)
  const answer = a * 10 ** b
  const text = L === 1 ? `${a} × ${10 ** b}` : `${a} × 10${sup(b)}`
  return {
    key: `pow:${L}:${a},${b}`,
    prompt: { text, sum: true },
    answer: String(answer),
    wrong: (k) => numberWrongs(answer, k, [a * 10 ** (b - 1), a * 10 ** (b + 1), a + 10 ** b, a * b]),
    seconds: 8 + L * 2,
  }
}

// --- Adding and subtracting fractions with unlike denominators ---

const addSubOk = (L: number, sign: number, a: number, b: number, c: number, d: number) => {
  if (b === d) return false
  const den = lcm(b, d)
  const top = a * (den / b) + sign * c * (den / d)
  if (top <= 0 || top % den === 0) return false // must be above zero and not a whole number
  if (L <= 3) return top < den // proper fractions
  return sign < 0 || top > den // level 4 adds some answers over 1
}

function addSubPick(L: number): Five {
  return tryUntil((): Five => {
    const sign = L === 3 || (L === 4 && Math.random() < 0.5) ? -1 : 1
    // Level 1 uses a denominator that is a multiple of the other one, like 1/2 + 1/4.
    const b = L === 1 ? rand(2, 4) : rand(2, 8)
    const d = L === 1 ? b * rand(2, 3) : rand(2, 8)
    return [sign, rand(1, b - 1), b, rand(1, d - 1), d]
  }, ([sign, a, b, c, d]) => addSubOk(L, sign, a, b, c, d))
}

function addSubItem(L: number, sign: number, a: number, b: number, c: number, d: number): ItemSpec {
  const den = lcm(b, d)
  const top = a * (den / b) + sign * c * (den / d)
  const answer = reducedText(top, den)
  const other = a * (den / b) - sign * c * (den / d) // the opposite operation, done by mistake
  const sym = sign > 0 ? '+' : '−'
  const pairs: [number, number][] = [
    [a + sign * c, b + sign * d], // added straight across, top and bottom
    [a + sign * c, den], // the top is right, but the bottom was never changed
    [top + 1, den],
    [top - 1, den],
    [other, den],
  ]
  const near = pairs.filter(([n, dd]) => n > 0 && dd > 0).map(([n, dd]) => fracText(n, dd))
  const text = `${a}/${b} ${sym} ${c}/${d}`
  return {
    key: `fas:${L}:${sign},${a},${b},${c},${d}`,
    prompt: { text, sum: true },
    answer,
    wrong: (k) => wrongChoices(answer, k, near, FRACTIONS_ONLY),
    seconds: 14 + L * 2,
  }
}

// --- Adding and subtracting mixed numbers ---

/** The sum or difference of two mixed numbers, as a value over `den` (their common denominator). */
const mixedOk = (L: number, sign: number, w1: number, n1: number, d1: number, w2: number, n2: number, d2: number) => {
  const den = lcm(d1, d2)
  const top = (w1 * d1 + n1) * (den / d1) + sign * (w2 * d2 + n2) * (den / d2)
  if (top <= 0 || top % den === 0) return false // the answer needs a fraction part
  const fracSum = n1 * d2 + sign * n2 * d1 // the fraction parts, over d1 * d2
  if (L === 1) return d1 === d2 && n1 + n2 < d1
  if (L === 2) return d1 !== d2 && sign > 0 && fracSum < d1 * d2
  if (L === 3) return d1 !== d2 && sign > 0 && n1 * d2 + n2 * d1 >= d1 * d2 // the fractions add up to 1 or more
  return sign < 0 && n1 * d2 < n2 * d1 && top >= den // borrow one whole to take away
}

function mixedPick(L: number): Seven {
  return tryUntil((): Seven => {
    const sign = L === 4 ? -1 : 1
    const d1 = rand(2, 6)
    const d2 = L === 1 ? d1 : rand(2, 6)
    return [sign, rand(1, 4), rand(1, d1 - 1), d1, rand(1, 4), rand(1, d2 - 1), d2]
  }, ([sign, w1, n1, d1, w2, n2, d2]) => mixedOk(L, sign, w1, n1, d1, w2, n2, d2))
}

function mixedItem(L: number, sign: number, w1: number, n1: number, d1: number, w2: number, n2: number, d2: number): ItemSpec {
  const den = lcm(d1, d2)
  const top = (w1 * d1 + n1) * (den / d1) + sign * (w2 * d2 + n2) * (den / d2)
  const answer = mixedText(top, den)
  const sym = sign > 0 ? '+' : '−'
  const options = [top + den, top - den, top + 1, top - 1].filter((t) => t > 0).map((t) => mixedText(t, den))
  // Adding the wholes and the fractions straight across is the classic slip.
  const w = w1 + sign * w2
  const acrossN = n1 + sign * n2
  const acrossD = d1 + sign * d2
  const slip = w >= 1 && acrossN >= 1 && acrossD >= 2 ? [`${w} ${acrossN}/${acrossD}`] : []
  return {
    key: `mix:${L}:${sign},${w1},${n1},${d1},${w2},${n2},${d2}`,
    prompt: { text: `${w1} ${n1}/${d1} ${sym} ${w2} ${n2}/${d2}`, sum: true },
    answer,
    wrong: (k) => wrongChoices(answer, k, [...options, ...slip], MIXED_POOL),
    seconds: 20 + L * 3,
  }
}

// --- Multiplying fractions and whole numbers ---

function multItem(L: number, a: number, b: number, c: number, d: number): ItemSpec {
  const answer = reducedText(a * c, b * d)
  const text = `${fracText(a, b)} × ${fracText(c, d)}`
  return {
    key: `mulf:${L}:${a},${b},${c},${d}`,
    prompt: { text, sum: true },
    answer,
    wrong: (k) => wrongChoices(answer, k, [fracText(a * c, b + d), fracText(a + c, b * d), fracText(a * c, b), fracText(a, b * d)], FRACTION_POOL),
    seconds: 14 + L * 2,
  }
}

// --- Dividing fractions and whole numbers ---

function fracDivItem(L: 1 | 2, p: number, q: number): ItemSpec {
  if (L === 1) {
    // A whole number divided by a unit fraction, like 3 ÷ 1/4 = 12: each whole holds `q` fourths.
    const answer = String(p * q)
    const text = `${p} ÷ 1/${q}`
    return {
      key: `fdiv:1:${p},${q}`,
      prompt: { text, sum: true },
      answer,
      wrong: (k) => wrongChoices(answer, k, [fracText(p, q), String(p + q), String(q)], FRACTION_POOL),
      seconds: 14,
    }
  }
  // A unit fraction divided by a whole number, like 1/2 ÷ 4 = 1/8.
  const answer = reducedText(1, p * q)
  const text = `1/${p} ÷ ${q}`
  return {
    key: `fdiv:2:${p},${q}`,
    prompt: { text, sum: true },
    answer,
    wrong: (k) => wrongChoices(answer, k, [fracText(1, p + q), fracText(q, p), String(p * q)], FRACTIONS_ONLY),
    seconds: 14,
  }
}

// Sharing a whole number of things, like 5 pizzas among 8 kids: each kid gets 5/8 of a pizza (p is less than q).
// Grade 5 is about fractions as division (sharing), not dividing by a fraction like 2/3, which comes later.
function shareItem(p: number, q: number): ItemSpec {
  const answer = reducedText(p, q)
  const text = `${p} pizzas are shared equally by ${q} kids. What fraction of a pizza does each kid get?`
  // The kid might flip the fraction, or change one number, so offer those as the close wrong answers.
  const near = [`${q}/${p}`, `${p}/${q + 1}`, `${p + 1}/${q}`, `${p - 1}/${q}`]
  return {
    key: `fdiv:3:${p},${q}`,
    prompt: { text, say: text },
    answer,
    wrong: (k) => wrongChoices(answer, k, near, FRACTIONS_ONLY),
    seconds: 18,
  }
}

// --- Converting between decimals and fractions ---

const TERMINATING = [2, 4, 5, 8, 10, 20, 25] // these fractions come out as a decimal that stops

function decFracItem(L: number, a: number, b = 1): ItemSpec {
  if (L === 1) {
    // Tenths, like 0.5 = 1/2 (a is the number of tenths)
    const answer = reducedText(a, 10)
    const text = `Write ${fmtDec(a, 1)} as a fraction.`
    return {
      key: `dfr:1:${a}`,
      prompt: { text, say: text },
      answer,
      wrong: (k) => wrongChoices(answer, k, [`10/${a}`, `${a}/100`, `${a + 1}/10`], FRACTIONS_ONLY),
      seconds: 12,
    }
  }
  if (L === 2) {
    // Hundredths, like 0.45 = 9/20 (a is the number of hundredths)
    const answer = reducedText(a, 100)
    const text = `Write ${fmtDec(a, 2)} as a fraction.`
    return {
      key: `dfr:2:${a}`,
      prompt: { text, say: text },
      answer,
      wrong: (k) => wrongChoices(answer, k, [`${a}/10`, `${a}/1000`, `${100 - a}/100`, `10/${a}`], FRACTIONS_ONLY),
      seconds: 14,
    }
  }
  // A fraction as a decimal, like 3/8 = 0.375
  const scaled = (a * 1000) / b
  const answer = fmtDec(scaled, 3)
  const text = `Write ${fracText(a, b)} as a decimal.`
  const near = [fmtDec(scaled + 10, 3), fmtDec(scaled + 100, 3), `0.${b}`, `0.${a}`]
  if (scaled > 10) near.push(fmtDec(scaled - 10, 3))
  return {
    key: `dfr:3:${a},${b}`,
    prompt: { text, say: text },
    answer,
    wrong: (k) => wrongChoices(answer, k, near, DECIMAL_POOL),
    seconds: 16,
  }
}

// --- Decimal place value ---

function placeItem(L: number, a: number, b: number, c: number): ItemSpec {
  if (L === 1) {
    // What a digit is worth. `a` is a three-digit number like 347 (shown as 3.47), `b` the spot: 0 ones, 1 tenths, 2 hundredths.
    const digit = Number(String(a)[b])
    const answer = fmtDec(digit * 10 ** (2 - b), 2)
    const text = `What is the value of the ${digit} in ${fmtDec(a, 2)}?`
    return {
      key: `dpl:1:${a},${b}`,
      prompt: { text, say: text },
      answer,
      wrong: (k) => wrongChoices(answer, k, [fmtDec(digit, 2), fmtDec(digit * 10, 2), fmtDec(digit * 100, 2)], DECIMAL_POOL),
      seconds: 12,
    }
  }
  if (L === 2) {
    // Words to a decimal: 5 and 23 hundredths is 5.23. `c` is 10 (tenths) or 100 (hundredths).
    const answer = fmtDec(a * 100 + b * (100 / c), 2)
    const text = `Write as a decimal: ${a} and ${b} ${c === 10 ? 'tenths' : 'hundredths'}`
    // Slips: the digits written the wrong way round (5.32 for 5 and 23 hundredths), or the tenths written as "0.b".
    const reversed = `${a}.${String(b).padStart(2, '0').split('').reverse().join('')}`
    return {
      key: `dpl:2:${a},${b},${c}`,
      prompt: { text, say: text },
      answer,
      wrong: (k) => wrongChoices(answer, k, [c === 10 ? `${a}.0${b}` : reversed, `${a + 1}.${b}`, `0.${b}`], DECIMAL_POOL),
      seconds: 14,
    }
  }
  // Expanded form: 3.46 = 3 + 0.4 + ?  (the missing part is the hundredths)
  const answer = fmtDec(c, 2)
  const text = `${fmtDec(a * 100 + b * 10 + c, 2)} = ${a} + ${fmtDec(b * 10, 2)} + ?`
  return {
    key: `dpl:3:${a},${b},${c}`,
    prompt: { text, say: text },
    answer,
    wrong: (k) => wrongChoices(answer, k, [fmtDec(c * 10, 2), fmtDec(b, 2), fmtDec(c * 100, 2)], DECIMAL_POOL),
    seconds: 16,
  }
}

// --- Multiplying and dividing decimals ---

/** Multiplies or divides decimals. Everything is worked out in millionths, so the answer is exact. */
function decOpItem(L: number, a: number, b: number): ItemSpec {
  const toMicro = (hundredths: number) => hundredths * 10 ** 4
  let text: string
  let micro: number
  let slip: string
  if (L === 1) {
    // Times a power of ten: 0.37 × 10 = 3.7 (a is in hundredths, b is 10, 100 or 1,000)
    text = `${fmtDec(a, 2)} × ${b}`
    micro = toMicro(a * b)
    slip = fmtDec(a, 2) // forgot to move the point at all
  } else if (L === 2) {
    text = `${fmtDec(a, 2)} × ${b}`
    micro = toMicro(a * b)
    slip = fmtDec(a, 2)
  } else if (L === 3) {
    // Two decimals with one place each: 1.2 × 0.3 = 0.36
    text = `${fmtDec(a, 1)} × ${fmtDec(b, 1)}`
    micro = toMicro(a * b)
    slip = String(a * b) // forgot the decimal point in the answer
  } else if (L === 4) {
    // Divided by a power of ten: 0.37 ÷ 10 = 0.037
    text = `${fmtDec(a, 2)} ÷ ${b}`
    micro = toMicro(a) / b
    slip = fmtDec(a * b, 2)
  } else {
    // Divided by a whole number, and it comes out even: 0.75 ÷ 3 = 0.25 (a is the answer in hundredths)
    text = `${fmtDec(a * b, 2)} ÷ ${b}`
    micro = toMicro(a)
    slip = fmtDec(a * b, 2)
  }
  const answer = fmtDec(micro, 6)
  const near = [micro * 10, micro / 10].filter(Number.isInteger).map((x) => fmtDec(x, 6))
  return {
    key: `dop:${L}:${a},${b}`,
    prompt: { text, sum: true },
    answer,
    wrong: (k) => wrongChoices(answer, k, [...near, slip], DECIMAL_POOL),
    seconds: 16 + L * 2,
  }
}

// --- Customary and metric units ---

// [from, to, how many `to` in one `from`]
const UNIT_PAIRS: [string, string, number][][] = [
  [['feet', 'inches', 12], ['yards', 'feet', 3]],
  [['kilometers', 'meters', 1000], ['meters', 'centimeters', 100], ['centimeters', 'millimeters', 10]],
  [['pounds', 'ounces', 16], ['gallons', 'quarts', 4], ['quarts', 'pints', 2]],
  [['kilograms', 'grams', 1000], ['liters', 'milliliters', 1000]],
]

function unitItem(L: number, i: number, k: number): ItemSpec {
  const [from, to, factor] = UNIT_PAIRS[L - 1]![i]!
  const answer = k * factor
  const text = `How many ${to} are in ${k} ${from}?`
  return {
    key: `unit:${L}:${i},${k}`,
    prompt: { text, say: text },
    answer: String(answer),
    wrong: (n) => numberWrongs(answer, n, [k + factor, k * factor * 10, k * 10, factor]),
    seconds: 10,
  }
}

// --- Coordinate plane: read a point on a grid (first quadrant) ---

const coordSVG = (max: number, pts: [number, number][], letters: boolean) => {
  const cell = Math.floor(240 / max)
  const pad = 26
  const X = (x: number) => pad + x * cell
  const Y = (y: number) => pad + (max - y) * cell
  const grid = range(0, max)
    .map((i) => `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(max)}" stroke="#ced4da"/><line x1="${X(0)}" y1="${Y(i)}" x2="${X(max)}" y2="${Y(i)}" stroke="#ced4da"/>`)
    .join('')
  const ticks = range(0, max)
    .map((i) => `<text x="${X(i)}" y="${Y(0) + 16}" font-size="12" text-anchor="middle" fill="#495057">${i}</text><text x="${X(0) - 8}" y="${Y(i) + 4}" font-size="12" text-anchor="end" fill="#495057">${i}</text>`)
    .join('')
  const dots = pts
    .map(([x, y], i) => `<circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="#ff6b6b"/>` + (letters ? `<text x="${X(x) + 9}" y="${Y(y) - 7}" font-size="15" fill="#333">${'ABCD'[i]}</text>` : ''))
    .join('')
  const axes = `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(0)}" stroke="#495057" stroke-width="2"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(max)}" stroke="#495057" stroke-width="2"/>`
  const size = 2 * pad + max * cell
  return svg(size, size, grid + axes + ticks + dots)
}

function coordItem(L: number, idx: number, pts: [number, number][]): ItemSpec {
  const max = L === 2 ? 10 : 5
  const [x, y] = pts[idx]!
  const answer = `(${x}, ${y})`
  const text = L === 3 ? `What are the coordinates of point ${'ABCD'[idx]}?` : 'What are the coordinates of the dot?'
  const onGrid = (px: number, py: number) => px >= 0 && py >= 0 && px <= max && py <= max
  const others = pts.map(([px, py]) => `(${px}, ${py})`).filter((s) => s !== answer)
  const near = [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y + 1})`, `(${x - 1}, ${y})`, `(${x}, ${y - 1})`, ...others]
    .filter((s) => {
      const [px, py] = s.match(/\d+/g)!.map(Number)
      return onGrid(px!, py!)
    })
  const fallback = range(0, max).flatMap((px) => range(0, max).map((py) => `(${px}, ${py})`))
  return {
    key: `coord:${L}:${idx},${pts.flat().join(',')}`,
    prompt: { text, say: text, svg: coordSVG(max, pts, L === 3) },
    answer,
    wrong: (k) => wrongChoices(answer, k, near, fallback, (a, b) => a === b),
    seconds: 12,
  }
}

// --- Volume of rectangular prisms ---

/**
 * A box drawn in 3D (length, width, height), so a kid can see it. With `grid`, every unit cube is marked
 * so it can be counted. With `labels` ([length, width, height]), the sides are named instead.
 */
function boxSVG(l: number, w: number, h: number, labels?: string[], grid = false) {
  const c = Math.cos(Math.PI / 6)
  const u = Math.min(230 / (c * (l + w)), 180 / ((l + w) / 2 + h)) // pixels per unit
  const M = 46 // room on each side for labels
  const ox = w * c * u + M
  const oy = h * u + 14
  // A 3D corner (x along the length, y along the width, z up) on the flat picture.
  const P = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * c * u, oy + ((x + y) / 2 - z) * u]
  const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
  const face = (corners: [number, number][], fill: string) => `<polygon points="${corners.map(pt).join(' ')}" fill="${fill}" stroke="#1c7ed6" stroke-width="2"/>`
  const seg = (a: [number, number], b: [number, number]) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#1c7ed6" stroke-width="1.5"/>`
  let body = face([P(0, 0, h), P(l, 0, h), P(l, w, h), P(0, w, h)], '#d0ebff') + face([P(l, 0, 0), P(l, w, 0), P(l, w, h), P(l, 0, h)], '#339af0') + face([P(0, w, 0), P(l, w, 0), P(l, w, h), P(0, w, h)], '#74c0fc')
  if (grid) {
    for (let i = 1; i < l; i++) body += seg(P(i, 0, h), P(i, w, h)) + seg(P(i, w, 0), P(i, w, h))
    for (let j = 1; j < w; j++) body += seg(P(0, j, h), P(l, j, h)) + seg(P(l, j, 0), P(l, j, h))
    for (let k = 1; k < h; k++) body += seg(P(l, 0, k), P(l, w, k)) + seg(P(0, w, k), P(l, w, k))
  }
  if (labels) {
    const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const text = (x: number, y: number, t: string, anchor: string) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="14" text-anchor="${anchor}" fill="#333">${t}</text>`
    const [lx, ly] = mid(P(0, w, 0), P(l, w, 0))
    const [wx, wy] = mid(P(l, 0, 0), P(l, w, 0))
    const [hx, hy] = mid(P(0, w, 0), P(0, w, h))
    body += text(lx, ly + 20, labels[0]!, 'middle') + text(wx + 8, wy + 5, labels[1]!, 'start') + text(hx - 8, hy + 5, labels[2]!, 'end')
  }
  const width = (l + w) * c * u + 2 * M
  const height = oy + ((l + w) / 2) * u + 34
  return svg(width, height, body)
}

function volumeItem(L: number, l: number, w: number, h: number): ItemSpec {
  const V = l * w * h
  const surface = 2 * (l * w + w * h + l * h)
  if (L === 3) {
    // Find the missing height from the volume and the base. The picture names the two sides we know, and "?" for the height.
    const text = `A box has a volume of ${V} cubic cm. It is ${l} cm long and ${w} cm wide. How tall is it?`
    return {
      key: `vol:3:${l},${w},${h}`,
      prompt: { text, say: text, svg: boxSVG(l, w, h, [`${l} cm`, `${w} cm`, '?']) },
      answer: String(h),
      wrong: (k) => numberWrongs(h, k, [l * w, w * h, l * h, l + w]),
      seconds: 18,
    }
  }
  const text =
    L === 1
      ? `A box is ${l} cubes long, ${w} cubes wide, and ${h} cubes tall. How many unit cubes fill it?`
      : `A box is ${l} cm long, ${w} cm wide, and ${h} cm tall. What is its volume in cubic cm?`
  return {
    key: `vol:${L}:${l},${w},${h}`,
    // Level 1 marks every cube so it can be counted; level 2 names the sides in cm.
    prompt: { text, say: text, svg: L === 1 ? boxSVG(l, w, h, undefined, true) : boxSVG(l, w, h, [`${l} cm`, `${w} cm`, `${h} cm`]) },
    answer: String(V),
    wrong: (k) => numberWrongs(V, k, [l * w, l + w + h, surface]),
    seconds: 14,
  }
}

// --- Mode, median, range, and mean ---

const STAT_NAMES = ['range', 'mode', 'median', 'mean (average)']
const count = (xs: number[], v: number) => xs.filter((x) => x === v).length

function statAnswer(L: number, xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  if (L === 1) return sorted[sorted.length - 1]! - sorted[0]!
  if (L === 2) return [...new Set(xs)].reduce((best, v) => (count(xs, v) > count(xs, best) ? v : best))
  if (L === 3) return sorted[(sorted.length - 1) / 2]!
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function statItem(L: number, xs: number[]): ItemSpec {
  const answer = statAnswer(L, xs)
  const sum = xs.reduce((a, b) => a + b, 0)
  const text = `Find the ${STAT_NAMES[L - 1]} of: ${xs.join(', ')}`
  return {
    key: `stat:${L}:${xs.join(',')}`,
    prompt: { text, say: text },
    answer: String(answer),
    wrong: (k) => numberWrongs(answer, k, [...xs, sum, Math.max(...xs), Math.min(...xs)]),
    seconds: 14 + L * 2,
  }
}

function statPick(L: number): number[] {
  if (L === 1) return shuffle(range(1, 30)).slice(0, 4)
  if (L === 2) {
    // One number shows up twice, so it is the only mode
    const mode = rand(1, 12)
    const others = shuffle(range(1, 12).filter((v) => v !== mode)).slice(0, 3)
    return shuffle([mode, mode, ...others])
  }
  if (L === 3) return shuffle(range(1, 20)).slice(0, 5)
  // Four numbers whose total divides by 4, so the mean is a whole number
  return tryUntil(() => [rand(1, 20), rand(1, 20), rand(1, 20), rand(1, 20)], (xs) => xs.reduce((a, b) => a + b, 0) % 4 === 0)
}

// --- The skills ---

export const GRADE5_MATH: Skill[] = [
  {
    id: 'factors',
    label: (L) => ['Prime numbers', 'Identify factors', 'Least common multiple'][L - 1]!,
    maxLevel: 3,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'mul', level: 8 }],
    generate: (L) => {
      if (L === 1) return primeItem(shuffle([pick(PRIMES), ...shuffle([...COMPOSITES]).slice(0, 3)]))
      if (L === 2) {
        const N = pick(FACTOR_NUMBERS)
        return factorItem(N, pick(range(2, Math.floor(N / 2)).filter((v) => N % v === 0)))
      }
      const [a, b] = lcmPair()
      return lcmItem(a, b)
    },
    fromKey: (key, L) => {
      if (L === 1) {
        const n = parseKey(key, 'prime', 1, 4)
        return n && primeItem(n)
      }
      if (L === 2) {
        const n = parseKey(key, 'fac', 2, 2)
        return n && factorItem(n[0]!, n[1]!)
      }
      const n = parseKey(key, 'lcm', 3, 2)
      return n && lcmItem(n[0]!, n[1]!)
    },
  },
  {
    id: 'expressions',
    label: (L) => ['Order of operations: multiply first', 'Order of operations: parentheses', 'Order of operations: mixed'][L - 1]!,
    maxLevel: 3,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'mul', level: 4 }, { skill: 'add', level: 5 }],
    generate: (L) => {
      const t = pick(EXPR_LEVELS[L - 1]!)
      return exprItem(L, t, EXPRESSIONS[t]!.make())
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'expr', L, 5)
      return n && exprItem(L, n[0]!, n.slice(1) as Nums4)
    },
  },
  {
    id: 'powers',
    label: (L) => ['Multiply by 10, 100, or 1,000', 'Powers of ten', 'Multiply by powers of ten'][L - 1]!,
    maxLevel: 3,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'place', level: 5 }],
    generate: (L) => {
      if (L === 1) return powerItem(1, rand(11, 99), rand(1, 3))
      if (L === 2) return powerItem(2, rand(2, 5), 0)
      return powerItem(3, rand(2, 9), rand(2, 4))
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'pow', L, 2)
      return n && powerItem(L, n[0]!, n[1]!)
    },
  },
  {
    id: 'addSubFractions',
    label: (L) => ['Add fractions: one bottom number is a multiple of the other', 'Add fractions with unlike denominators', 'Subtract fractions with unlike denominators', 'Add and subtract unlike fractions: answers over 1'][L - 1]!,
    maxLevel: 4,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'fractions', level: 4 }],
    generate: (L) => {
      const [sign, a, b, c, d] = addSubPick(L)
      return addSubItem(L, sign, a, b, c, d)
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'fas', L, 5)
      return n && addSubItem(L, n[0]!, n[1]!, n[2]!, n[3]!, n[4]!)
    },
  },
  {
    id: 'mixedNumbers',
    label: (L) => ['Add mixed numbers with the same denominator', 'Add mixed numbers with unlike denominators', 'Add mixed numbers and regroup', 'Subtract mixed numbers and regroup'][L - 1]!,
    maxLevel: 4,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'addSubFractions', level: 2 }],
    generate: (L) => {
      const [sign, w1, n1, d1, w2, n2, d2] = mixedPick(L)
      return mixedItem(L, sign, w1, n1, d1, w2, n2, d2)
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'mix', L, 7)
      return n && mixedItem(L, n[0]!, n[1]!, n[2]!, n[3]!, n[4]!, n[5]!, n[6]!)
    },
  },
  {
    id: 'multiplyFractions',
    label: (L) => ['Multiply unit fractions and whole numbers', 'Multiply fractions and whole numbers', 'Multiply fractions'][L - 1]!,
    maxLevel: 3,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'fractions', level: 4 }, { skill: 'mul', level: 8 }],
    generate: (L) => {
      if (L === 1) return multItem(1, 1, rand(2, 10), rand(2, 12), 1)
      if (L === 2) {
        const b = rand(3, 10)
        return multItem(2, rand(1, b - 1), b, rand(2, 12), 1)
      }
      const b = rand(2, 10)
      const d = rand(2, 10)
      return multItem(3, rand(1, b - 1), b, rand(1, d - 1), d)
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'mulf', L, 4)
      return n && multItem(L, n[0]!, n[1]!, n[2]!, n[3]!)
    },
  },
  {
    id: 'fractionDivision',
    label: (L) => ['Divide a whole number by a unit fraction', 'Divide a unit fraction by a whole number', 'Understand fractions as division: sharing'][L - 1]!,
    maxLevel: 3,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'multiplyFractions', level: 2 }],
    generate: (L) => {
      if (L === 1) return fracDivItem(1, rand(2, 9), rand(2, 8))
      if (L === 2) return fracDivItem(2, rand(2, 6), rand(2, 5))
      const q = rand(3, 8)
      return shareItem(rand(2, q - 1), q)
    },
    fromKey: (key, L) => {
      if (L === 3) {
        const n = parseKey(key, 'fdiv', 3, 2)
        return n && shareItem(n[0]!, n[1]!)
      }
      const n = parseKey(key, 'fdiv', L, 2)
      return n && fracDivItem(L === 1 ? 1 : 2, n[0]!, n[1]!)
    },
  },
  {
    id: 'decimalFractions',
    label: (L) => ['Decimals to fractions: tenths', 'Decimals to fractions: hundredths', 'Fractions to decimals'][L - 1]!,
    maxLevel: 3,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'decimals', level: 3 }, { skill: 'fractions', level: 4 }],
    generate: (L) => {
      if (L === 1) return decFracItem(1, rand(1, 9))
      if (L === 2) return decFracItem(2, tryUntil(() => rand(1, 99), (x) => x % 10 !== 0))
      const den = pick(TERMINATING)
      return decFracItem(3, tryUntil(() => rand(1, den - 1), (x) => gcd(x, den) === 1), den)
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'dfr', L, L === 3 ? 2 : 1)
      return n && decFracItem(L, n[0]!, n[1])
    },
  },
  {
    id: 'decimalPlaces',
    label: (L) => ['Decimal place value: what a digit is worth', 'Decimal place value: words to decimals', 'Decimal place value: expanded form'][L - 1]!,
    maxLevel: 3,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'decimals', level: 2 }],
    generate: (L) => {
      if (L === 1) {
        const spot = rand(0, 2)
        return placeItem(1, tryUntil(() => rand(100, 999), (x) => String(x)[spot] !== '0'), spot, 0)
      }
      if (L === 2) {
        const unit = pick([10, 100])
        return placeItem(2, rand(1, 9), unit === 10 ? rand(1, 9) : rand(10, 99), unit)
      }
      return placeItem(3, rand(1, 9), rand(1, 9), rand(1, 9))
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'dpl', L, L === 1 ? 2 : 3)
      return n && placeItem(L, n[0]!, n[1]!, n[2]!)
    },
  },
  {
    id: 'decimalOps',
    label: (L) => ['Multiply decimals by powers of ten', 'Multiply decimals by whole numbers', 'Multiply decimals', 'Divide decimals by powers of ten', 'Divide decimals by whole numbers'][L - 1]!,
    maxLevel: 5,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'decimals', level: 3 }, { skill: 'multiply', level: 3 }],
    generate: (L) => {
      if (L === 1) return decOpItem(1, rand(11, 999), pick([10, 100, 1000]))
      if (L === 2) return decOpItem(2, rand(11, 999), rand(2, 9))
      // Leave out 10 (it is 1.0, a trivial times-one), so both decimals really get multiplied.
      if (L === 3) return decOpItem(3, tryUntil(() => rand(2, 19), (x) => x !== 10), tryUntil(() => rand(2, 19), (x) => x !== 10))
      if (L === 4) return decOpItem(4, rand(11, 999), pick([10, 100, 1000]))
      return decOpItem(5, rand(11, 99), rand(2, 9))
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'dop', L, 2)
      return n && decOpItem(L, n[0]!, n[1]!)
    },
  },
  {
    id: 'units',
    label: (L) => ['Customary units: feet, inches, and yards', 'Metric units: kilometers to millimeters', 'Customary units: pounds, gallons, and quarts', 'Metric units: kilograms and liters'][L - 1]!,
    maxLevel: 4,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'mul', level: 6 }],
    generate: (L) => unitItem(L, rand(0, UNIT_PAIRS[L - 1]!.length - 1), rand(2, 9)),
    fromKey: (key, L) => {
      const n = parseKey(key, 'unit', L, 2)
      return n && unitItem(L, n[0]!, n[1]!)
    },
  },
  {
    id: 'coordinates',
    label: (L) => ['Coordinate plane: read a point', 'Coordinate plane: bigger grid', 'Coordinate plane: name a labeled point'][L - 1]!,
    maxLevel: 3,
    formats: ['choice'],
    unlocksAfter: [{ skill: 'area', level: 2 }],
    generate: (L) => {
      if (L === 1) return coordItem(1, 0, [[rand(1, 5), rand(1, 5)]])
      if (L === 2) return coordItem(2, 0, [[rand(1, 10), rand(1, 10)]])
      const pts = new Set<string>()
      while (pts.size < 4) pts.add(`${rand(1, 5)},${rand(1, 5)}`)
      const list = [...pts].map((s) => s.split(',').map(Number) as [number, number])
      return coordItem(3, rand(0, 3), list)
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'coord', L, 0)
      if (!n || n.length < 3 || (n.length - 1) % 2 !== 0) return null
      const pts: [number, number][] = []
      for (let i = 1; i < n.length; i += 2) pts.push([n[i]!, n[i + 1]!])
      return coordItem(L, n[0]!, pts)
    },
  },
  {
    id: 'volume',
    label: (L) => ['Volume: count unit cubes', 'Volume: length × width × height', 'Volume: find the missing side'][L - 1]!,
    maxLevel: 3,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'area', level: 3 }, { skill: 'mul', level: 8 }],
    generate: (L) => {
      if (L === 1) return volumeItem(1, rand(2, 6), rand(2, 5), rand(2, 4))
      if (L === 2) return volumeItem(2, rand(2, 12), rand(2, 12), rand(2, 9))
      return volumeItem(3, rand(2, 9), rand(2, 9), rand(2, 9))
    },
    fromKey: (key, L) => {
      const n = parseKey(key, 'vol', L, 3)
      return n && volumeItem(L, n[0]!, n[1]!, n[2]!)
    },
  },
  {
    id: 'statistics',
    label: (L) => ['Range', 'Mode', 'Median', 'Mean (average)'][L - 1]!,
    maxLevel: 4,
    formats: ['number', 'choice'],
    unlocksAfter: [{ skill: 'add', level: 5 }],
    generate: (L) => statItem(L, statPick(L)),
    fromKey: (key, L) => {
      const n = parseKey(key, 'stat', L, 0)
      return n && statItem(L, n)
    },
  },
]

const ref = (grade: number, category: string, levels: number) => Array.from({ length: levels }, () => m(grade, category))

export const GRADE5_MATH_IXL: Record<string, IxlRef[]> = {
  'math.factors': ref(5, 'Factors, multiples, and divisibility', 3),
  'math.expressions': ref(5, 'Numerical expressions', 3),
  // Level 1 and 3 multiply a whole number by 10, 100, or 1,000 (IXL's "Multiplication" category); level 2 is powers of ten.
  'math.powers': [m(5, 'Multiplication'), m(5, 'Powers of ten'), m(5, 'Multiplication')],
  'math.addSubFractions': [
    m(4, 'Add and subtract fractions with unlike denominators'),
    m(4, 'Add and subtract fractions with unlike denominators'),
    m(5, 'Add and subtract fractions'),
    m(5, 'Add and subtract fractions'),
  ],
  'math.mixedNumbers': ref(5, 'Add and subtract mixed numbers', 4),
  'math.multiplyFractions': [m(4, 'Multiply unit fractions and whole numbers'), m(4, 'Multiply fractions and whole numbers'), m(5, 'Multiply fractions')],
  'math.fractionDivision': [m(5, 'Understand fraction division'), m(5, 'Divide unit fractions and whole numbers'), m(5, 'Understand fraction division')],
  'math.decimalFractions': ref(5, 'Convert between decimals and fractions', 3),
  'math.decimalPlaces': ref(5, 'Decimal place value', 3),
  'math.decimalOps': [
    m(5, 'Multiply decimals by powers of ten'),
    m(5, 'Multiply decimals by whole numbers'),
    m(5, 'Multiply decimals'),
    m(5, 'Divide decimals by powers of ten'),
    m(5, 'Divide decimals'),
  ],
  'math.units': [m(4, 'Customary units of measurement'), m(4, 'Metric units of measurement'), m(5, 'Customary units of measurement'), m(5, 'Metric units of measurement')],
  'math.coordinates': ref(5, 'Coordinate plane', 3),
  'math.volume': ref(5, 'Volume', 3),
  'math.statistics': [m(4, 'Mode, median, and range'), m(4, 'Mode, median, and range'), m(4, 'Mode, median, and range'), m(5, 'Statistics')],
}
