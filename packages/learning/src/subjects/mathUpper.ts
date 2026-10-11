import type { ItemSpec, Skill } from '../core/types'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * Math for grades 3–5, named like IXL's categories: Rounding, Area, Perimeter, Fractions, Decimals,
 * Multiplication and Division with bigger numbers, and Elapsed time. These unlock once a player is
 * solid with the basics (see math.ts), so younger kids never see them.
 *
 * Every question is rebuilt exactly from its key, so a missed one can come back later.
 */

const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']
const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-weight="700">${body}</svg>`
const int = (s: string) => Number(s)

// --- Rounding ------------------------------------------------------------------------------

const PLACES = [10, 100, 1000]
const PLACE_NAMES: Record<number, string> = { 10: 'ten', 100: 'hundred', 1000: 'thousand' }
const roundTo = (n: number, p: number) => Math.round(n / p + 1e-9) * p // halves round up, like in class

function roundItem(L: number, n = [rand(11, 99), rand(101, 999), rand(1001, 9999)][L - 1]!): ItemSpec {
  const p = PLACES[L - 1]!
  const answer = roundTo(n, p)
  const down = Math.floor(n / p) * p
  const other = answer === down ? down + p : down // rounding the wrong way
  return {
    key: `round:${L}:${n}`,
    prompt: { text: `Round ${n} to the nearest ${PLACE_NAMES[p]}.`, say: `Round ${n} to the nearest ${PLACE_NAMES[p]}.` },
    answer: String(answer),
    wrong: (k) => numberWrongs(answer, k, [other, answer + p, answer - p, answer + 2 * p]),
    seconds: 8,
  }
}

export const round: Skill = {
  id: 'round',
  label: (L) => `Round to the nearest ${PLACE_NAMES[PLACES[L - 1]!]}`,
  maxLevel: PLACES.length,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'add', level: 5 }],
  generate: (L) => roundItem(L),
  fromKey: (key, L) => {
    const m = key.match(/^round:(\d):(\d+)$/)
    return m && int(m[1]!) === L ? roundItem(L, int(m[2]!)) : null
  },
}

// --- Area and perimeter ------------------------------------------------------------------------

const gridSVG = (w: number, h: number, color: string) => {
  const cell = Math.min(34, Math.floor(260 / w))
  const squares = Array.from({ length: w * h }, (_, i) => `<rect x="${(i % w) * cell + 4}" y="${Math.floor(i / w) * cell + 4}" width="${cell}" height="${cell}" fill="${color}" stroke="#fff" stroke-width="2"/>`)
  return svg(w * cell + 8, h * cell + 8, squares.join(''))
}
const rectSVG = (w: number, h: number, color: string, top: string | number, side: string | number) => {
  // Draw it in proportion (a 3 by 6 rectangle is taller than wide, a square is square) inside a 150 by 80 box (short, so the question card never covers the doors).
  const scale = Math.min(150 / w, 80 / h)
  const pw = Math.max(28, Math.round(w * scale))
  const ph = Math.max(28, Math.round(h * scale))
  // Big labels: the picture is shown small on a phone.
  const big = (x: number, y: number, t: string | number) => `<text x="${x}" y="${y}" font-size="24" text-anchor="middle" fill="#333">${t}</text>`
  return svg(pw + 70, ph + 60, `<rect x="48" y="34" width="${pw}" height="${ph}" fill="${color}" opacity=".85"/>${big(48 + pw / 2, 26, top)}${big(24, 34 + ph / 2 + 8, side)}`)
}

function areaItem(L: number, a: number, b: number): ItemSpec {
  const color = COLORS[(a + b) % COLORS.length]!
  const area = a * b
  const near = [2 * (a + b), a + b, area + a, area - b]
  if (L === 1) {
    return { key: `area:1:${a}:${b}`, prompt: { text: 'What is the area? (Each square is 1 square unit.)', say: 'What is the area? Count the squares.', svg: gridSVG(a, b, color) }, answer: String(area), wrong: (k) => numberWrongs(area, k, near), seconds: 10 }
  }
  if (L === 2) {
    return { key: `area:2:${a}:${b}`, prompt: { text: 'What is the area of this rectangle? (square units)', say: 'What is the area of this rectangle?', svg: rectSVG(a, b, color, a, b) }, answer: String(area), wrong: (k) => numberWrongs(area, k, near), seconds: 10 }
  }
  // The figure shows the width and a "?" for the length, drawn in proportion so the picture never disagrees with the numbers.
  const text = `A rectangle has an area of ${area} square units. Its width is ${a}. What is its length?`
  return { key: `area:3:${a}:${b}`, prompt: { text, say: text, svg: rectSVG(a, b, color, a, '?') }, answer: String(b), wrong: (k) => numberWrongs(b, k, [area - a, area + a, b + a, a]), seconds: 14 }
}

export const area: Skill = {
  id: 'area',
  label: (L) => ['Area of figures made of unit squares', 'Area of rectangles', 'Area: find the missing side'][L - 1]!,
  maxLevel: 3,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'mul', level: 3 }],
  generate: (L) => areaItem(L, L === 1 ? rand(2, 6) : rand(3, 12), L === 1 ? rand(2, 5) : rand(2, 9)),
  fromKey: (key, L) => {
    const m = key.match(/^area:(\d):(\d+):(\d+)$/)
    return m && int(m[1]!) === L ? areaItem(L, int(m[2]!), int(m[3]!)) : null
  },
}

function perimeterItem(L: number, a: number, b: number): ItemSpec {
  const color = COLORS[(a * b) % COLORS.length]!
  if (L === 1) {
    const p = 2 * (a + b)
    return { key: `perim:1:${a}:${b}`, prompt: { text: 'What is the perimeter of this rectangle?', say: 'What is the perimeter of this rectangle?', svg: rectSVG(a, b, color, a, b) }, answer: String(p), wrong: (k) => numberWrongs(p, k, [a * b, a + b, 2 * a + b, a + 2 * b]), seconds: 10 }
  }
  if (L === 2) {
    const p = 4 * a
    return { key: `perim:2:${a}:${b}`, prompt: { text: `What is the perimeter of a square with sides of ${a}?`, say: `What is the perimeter of a square with sides of ${a}?`, svg: rectSVG(1, 1, color, a, a) }, answer: String(p), wrong: (k) => numberWrongs(p, k, [a * a, 2 * a, a + 4, 3 * a]), seconds: 10 }
  }
  const p = 2 * (a + b)
  // The figure marks the side we want with "?" and gives the top side.
  const text = `A rectangle has a perimeter of ${p}. Its top side is ${a}. How long is its left side?`
  return { key: `perim:3:${a}:${b}`, prompt: { text, say: text, svg: rectSVG(a, b, color, a, '?') }, answer: String(b), wrong: (k) => numberWrongs(b, k, [p - a, p / 2, p - 2 * a, a]), seconds: 16 }
}

export const perimeter: Skill = {
  id: 'perimeter',
  label: (L) => ['Perimeter of rectangles', 'Perimeter of squares', 'Perimeter: find the missing side'][L - 1]!,
  maxLevel: 3,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'mul', level: 3 }],
  generate: (L) => perimeterItem(L, rand(3, 15), L === 2 ? 0 : rand(2, 12)),
  fromKey: (key, L) => {
    const m = key.match(/^perim:(\d):(\d+):(\d+)$/)
    return m && int(m[1]!) === L ? perimeterItem(L, int(m[2]!), int(m[3]!)) : null
  },
}

// --- Fractions (like denominators; wrong choices are never equal in value to the right one) ----------

const sameValue = (x: string, y: string) => {
  const [a, b] = x.split('/').map(Number)
  const [c, d] = y.split('/').map(Number)
  return a! * d! === c! * b!
}
// Plain fractions to fall back on when the close-looking slips aren't enough (e.g. only 2 for a half).
const FALLBACK = Array.from({ length: 11 }, (_, i) => i + 2).flatMap((d) => Array.from({ length: d - 1 }, (_, n) => `${n + 1}/${d}`))
const fractionWrongs = (answer: string, count: number, candidates: string[]) => {
  const usable = (f: string) => !sameValue(f, answer) && !f.startsWith('0/') && !f.endsWith('/0') && !f.endsWith('/1')
  // The close-looking slips come first; the plain fractions only fill in if there aren't enough of those.
  return wrongFrom(answer, count, FALLBACK.filter(usable), [...new Set(candidates)].filter(usable))
}
const barSVG = (n: number, d: number, color: string) => {
  const w = 260 / d
  const parts = Array.from({ length: d }, (_, i) => `<rect x="${4 + i * w}" y="4" width="${w}" height="46" fill="${i < n ? color : '#f1f3f5'}" stroke="#495057" stroke-width="2"/>`)
  return svg(268, 54, parts.join(''))
}

// Read aloud the way kids say them: "three fifths", "one fifth" (not "3 5ths").
const SPOKEN_ONE: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth' }
const SPOKEN_MANY: Record<number, string> = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 11: 'elevenths', 12: 'twelfths' }
const spoken = (n: number, d: number) => (n === 1 ? `one ${SPOKEN_ONE[d]}` : `${n} ${SPOKEN_MANY[d]}`)

function fractionItem(L: number, p: number[]): ItemSpec {
  if (L === 1) {
    const [n, d] = p as [number, number]
    const answer = `${n}/${d}`
    const text = 'What fraction of the bar is shaded?'
    const near = [`${d - n}/${d}`, `${n}/${d + 1}`, `${n + 1}/${d}`, `${n}/${d - 1}`, `${d}/${n}`, `${n - 1}/${d}`]
    return { key: `frac:1:${n}:${d}`, prompt: { text, say: text, svg: barSVG(n, d, COLORS[d % COLORS.length]!) }, answer, wrong: (k) => fractionWrongs(answer, k, near), seconds: 8 }
  }
  if (L === 2) {
    const [d, ...ns] = p as [number, number, number, number]
    const all = ns.map((n) => `${n}/${d}`)
    const answer = `${Math.max(...ns)}/${d}`
    const text = `Which fraction is greatest? ${all.join(', ')}`
    const pool = Array.from({ length: d - 1 }, (_, i) => `${i + 1}/${d}`)
    return { key: `frac:2:${[d, ...ns].join(':')}`, prompt: { text, say: text.replace(/(\d+)\/(\d+)/g, (_, n: string, dn: string) => spoken(Number(n), Number(dn))) }, answer, wrong: (k) => wrongFrom(answer, k, pool.filter((f) => int(f.split('/')[0]!) < Math.max(...ns)), all), seconds: 10 }
  }
  if (L === 3) {
    const [n, d, k] = p as [number, number, number]
    const answer = `${n * k}/${d * k}`
    const text = `Which fraction is equal to ${n}/${d}?`
    const near = [`${n * k}/${d * k + 1}`, `${n * k + 1}/${d * k}`, `${n}/${d * k}`, `${n * k}/${d}`, `${n + 1}/${d + 1}`, `${n + k}/${d + k}`]
    return { key: `frac:3:${n}:${d}:${k}`, prompt: { text, say: text }, answer, wrong: (c) => fractionWrongs(answer, c, near), seconds: 12 }
  }
  const [a, b, d] = p as [number, number, number]
  const answer = `${a + b}/${d}`
  const text = `${a}/${d} + ${b}/${d} = ?`
  const near = [`${a + b}/${d * 2}`, `${a + b + 1}/${d}`, `${a + b - 1}/${d}`, `${a * b}/${d}`, `${a + b}/${d + d + 1}`, `${a + b}/${d + 1}`]
  return { key: `frac:4:${a}:${b}:${d}`, prompt: { text, say: `${spoken(a, d)} plus ${spoken(b, d)}`, sum: false }, answer, wrong: (c) => fractionWrongs(answer, c, near), seconds: 12 }
}

const EQUIVALENT: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5]]

export const fractions: Skill = {
  id: 'fractions',
  label: (L) => ['Understand fractions', 'Compare fractions with like denominators', 'Find equivalent fractions', 'Add fractions with like denominators'][L - 1]!,
  maxLevel: 4,
  formats: ['choice'],
  unlocksAfter: [{ skill: 'mul', level: 3 }],
  generate: (L) => {
    if (L === 1) {
      const d = rand(2, 8)
      return fractionItem(1, [rand(1, d - 1), d])
    }
    if (L === 2) {
      const d = rand(5, 12)
      // The greatest is at least 4/d, so there are always three smaller fractions to offer.
      let ns: number[]
      do ns = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 3)
      while (Math.max(...ns) < 4)
      return fractionItem(2, [d, ...ns])
    }
    if (L === 3) {
      const [n, d] = pick(EQUIVALENT)
      return fractionItem(3, [n, d, rand(2, 4)])
    }
    const d = rand(5, 12)
    const a = rand(1, d - 3)
    return fractionItem(4, [a, rand(1, d - a - 1), d])
  },
  fromKey: (key, L) => {
    const [kind, level, ...rest] = key.split(':')
    const nums = rest.map(Number)
    return kind === 'frac' && Number(level) === L && nums.length && nums.every(Number.isFinite) ? fractionItem(L, nums) : null
  },
}

// --- Decimals --------------------------------------------------------------------------------------

const dec = (hundredths: number, places: 1 | 2) => (hundredths / 100).toFixed(places).replace(/(\.\d)0$/, '$1')

function decimalItem(L: number, p: number[]): ItemSpec {
  if (L === 1) {
    const [n] = p as [number] // like 372 for 3.72
    const text = `What digit is in the tenths place of ${(n / 100).toFixed(2)}?`
    const digits = String(n).padStart(3, '0').split('')
    const answer = digits[1]!
    return { key: `dec:1:${n}`, prompt: { text, say: text }, answer, wrong: (k) => wrongFrom(answer, k, '0123456789'.split(''), [digits[0]!, digits[2]!]), seconds: 8 }
  }
  if (L === 2) {
    const [a, b, c] = p as [number, number, number] // in hundredths, all ending in 0 or all two places
    const places: 1 | 2 = a % 10 === 0 && b % 10 === 0 && c % 10 === 0 ? 1 : 2
    const shown = [a, b, c].map((x) => dec(x, places))
    const answer = dec(Math.max(a, b, c), places)
    const step = places === 1 ? 10 : 1
    const lower = Array.from({ length: 12 }, (_, i) => Math.max(a, b, c) - (i + 1) * step).filter((x) => x > 0).map((x) => dec(x, places))
    const text = `Which decimal is greatest? ${shown.join(', ')}`
    return { key: `dec:2:${a}:${b}:${c}`, prompt: { text, say: text }, answer, wrong: (k) => wrongFrom(answer, k, lower, shown), seconds: 10 }
  }
  if (L === 3) {
    const [x, y, minus] = p as [number, number, number] // tenths as integers, minus 0/1
    const big = minus ? Math.max(x, y) : x
    const small = minus ? Math.min(x, y) : y
    const r = minus ? big - small : x + y
    const answer = (r / 10).toFixed(1)
    const text = `${(big / 10).toFixed(1)} ${minus ? '−' : '+'} ${(small / 10).toFixed(1)} = ?`
    const near = [r + 1, r - 1, r + 10, r - 10, minus ? big + small : Math.abs(x - y)].filter((v) => v > 0).map((v) => (v / 10).toFixed(1))
    return { key: `dec:3:${x}:${y}:${minus}`, prompt: { text, say: text.replace('−', 'minus').replace('+', 'plus') }, answer, wrong: (k) => wrongFrom(answer, k, near), seconds: 14 }
  }
  const [b] = p as [number] // tenths, like 5 for 0.5
  const one = dec(b * 10, 1)
  const shown = [one, dec(b * 10 - 5, 2), dec(b * 10 - 15, 2)]
  const below = [dec(b * 10 - 1, 2), dec(b * 10 - 7, 2), dec(b * 10 - 12, 2), dec(b * 10 - 20, 2), dec(b * 10 - 25, 2)]
  const text = `Which decimal is greatest? ${shown.join(', ')}`
  return { key: `dec:4:${b}`, prompt: { text, say: text }, answer: one, wrong: (k) => wrongFrom(one, k, below, shown.slice(1)), seconds: 12 }
}

export const decimals: Skill = {
  id: 'decimals',
  label: (L) => ['Decimal place value', 'Compare decimals', 'Add and subtract decimals', 'Compare decimals: different lengths'][L - 1]!,
  maxLevel: 4,
  formats: ['choice'],
  unlocksAfter: [{ skill: 'fractions', level: 2 }],
  generate: (L) => {
    if (L === 1) return decimalItem(1, [rand(101, 999)])
    if (L === 2) {
      if (Math.random() < 0.5) {
        // At least 0.4 is the greatest, so there are always enough smaller decimals to offer.
        let t: number[]
        do t = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)
        while (Math.max(...t) < 4)
        return decimalItem(2, t.map((x) => x * 10))
      }
      const t = new Set<number>()
      while (t.size < 3) t.add(rand(11, 99))
      return decimalItem(2, [...t].map((x) => (x % 10 === 0 ? x + 1 : x)))
    }
    if (L === 3) {
      // Taking away needs two different numbers, so the answer is never 0.0.
      const x = rand(11, 59)
      const minus = rand(0, 1)
      let y = rand(11, 59)
      while (minus && y === x) y = rand(11, 59)
      return decimalItem(3, [x, y, minus])
    }
    return decimalItem(4, [rand(3, 9)])
  },
  fromKey: (key, L) => {
    const [kind, level, ...rest] = key.split(':')
    const nums = rest.map(Number)
    return kind === 'dec' && Number(level) === L && nums.length && nums.every(Number.isFinite) ? decimalItem(L, nums) : null
  },
}

// --- Multiplication with bigger numbers ----------------------------------------------------------------

function multiplyItem(L: number, a: number, b: number): ItemSpec {
  const answer = a * b
  const text = `${a} × ${b}`
  // The classic slips: dropping a carry, or putting the zeros in the wrong place.
  const near = [answer + 10, answer - 10, answer + 100, answer - 100, a * (b % 10) + (b - (b % 10)) * (a % 10), answer * 10, answer / 10]
  return { key: `mul:${L}:${a}:${b}`, prompt: { text, say: `${a} times ${b}`, sum: true }, answer: String(answer), wrong: (k) => numberWrongs(answer, k, near.filter(Number.isInteger)), seconds: 10 + L * 4 }
}

export const multiply: Skill = {
  id: 'multiply',
  label: (L) => ['Multiply by a multiple of ten', 'Multiply a two-digit number by one digit', 'Multiply a three-digit number by one digit', 'Multiply two two-digit numbers'][L - 1]!,
  maxLevel: 4,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'mul', level: 8 }],
  generate: (L) => (L === 1 ? multiplyItem(1, rand(2, 9), rand(2, 9) * 10) : L === 2 ? multiplyItem(2, rand(12, 99), rand(2, 9)) : L === 3 ? multiplyItem(3, rand(101, 999), rand(2, 9)) : multiplyItem(4, rand(12, 99), rand(11, 99))),
  fromKey: (key, L) => {
    const m = key.match(/^mul:(\d):(\d+):(\d+)$/)
    return m && int(m[1]!) === L ? multiplyItem(L, int(m[2]!), int(m[3]!)) : null
  },
}

// --- Division by one digit ---------------------------------------------------------------------------------

function divideItem(L: number, b: number, q: number, r: number): ItemSpec {
  const a = b * q + r
  if (L === 3) {
    const text = `What is the remainder of ${a} ÷ ${b}?`
    return { key: `div:3:${b}:${q}:${r}`, prompt: { text, say: `What is the remainder when ${a} is divided by ${b}?` }, answer: String(r), wrong: (k) => numberWrongs(r, k, [q, r + 1, r - 1, b - r, b - 1]), seconds: 14 }
  }
  return { key: `div:${L}:${b}:${q}:0`, prompt: { text: `${a} ÷ ${b}`, say: `${a} divided by ${b}`, sum: true }, answer: String(q), wrong: (k) => numberWrongs(q, k, [q + 10, q - 10, q + 1, q - 1, Math.floor(q / 10)]), seconds: 12 + L * 4 }
}

export const divide: Skill = {
  id: 'divide',
  label: (L) => ['Divide a two-digit number by one digit', 'Divide a three-digit number by one digit', 'Division with remainders'][L - 1]!,
  maxLevel: 3,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'div', level: 6 }],
  generate: (L) => {
    const b = rand(L === 3 ? 3 : 2, 9)
    return L === 1 ? divideItem(1, b, rand(11, Math.floor(99 / b)), 0) : L === 2 ? divideItem(2, b, rand(Math.ceil(101 / b), Math.floor(999 / b)), 0) : divideItem(3, b, rand(2, 12), rand(1, b - 1))
  },
  fromKey: (key, L) => {
    const m = key.match(/^div:(\d):(\d+):(\d+):(\d+)$/)
    return m && int(m[1]!) === L ? divideItem(L, int(m[2]!), int(m[3]!), int(m[4]!)) : null
  },
}

// --- Elapsed time ------------------------------------------------------------------------------------------

const clock = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`

function elapsedItem(L: number, h: number, m: number, minutes: number): ItemSpec {
  const end = h * 60 + m + minutes
  const text = `Art class starts at ${clock(h, m)} and ends at ${clock(Math.floor(end / 60), end % 60)}. How many ${L === 1 ? 'hours' : 'minutes'} long is it?`
  const answer = L === 1 ? minutes / 60 : minutes
  const near = L === 1 ? [answer + 1, answer - 1, answer * 2] : [answer + 5, answer - 5, answer + 10, 60 - answer, answer + 60 > 0 ? answer + 60 : 0]
  return { key: `elapsed:${L}:${h}:${m}:${minutes}`, prompt: { text, say: text }, answer: String(answer), wrong: (k) => numberWrongs(answer, k, near), seconds: 18 }
}

export const elapsed: Skill = {
  id: 'elapsed',
  label: (L) => ['Elapsed time: hours', 'Elapsed time: minutes', 'Elapsed time: across the hour'][L - 1]!,
  maxLevel: 3,
  formats: ['number', 'choice'],
  unlocksAfter: [{ skill: 'add', level: 5 }],
  generate: (L) => {
    const h = rand(1, 10)
    if (L === 1) return elapsedItem(1, h, 0, rand(1, 4) * 60)
    if (L === 2) {
      const m = rand(0, 5) * 5
      return elapsedItem(2, h, m, rand(1, (55 - m) / 5) * 5)
    }
    const m = rand(3, 11) * 5
    return elapsedItem(3, h, m, rand((65 - m) / 5, (115 - m) / 5) * 5)
  },
  fromKey: (key, L) => {
    const m = key.match(/^elapsed:(\d):(\d+):(\d+):(\d+)$/)
    return m && int(m[1]!) === L ? elapsedItem(L, int(m[2]!), int(m[3]!), int(m[4]!)) : null
  },
}

export const UPPER_MATH = [round, area, perimeter, fractions, decimals, multiply, divide, elapsed]
