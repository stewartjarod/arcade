import type { Format, ItemSpec, Prompt, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * The last IXL math topics: kindergarten counting to 10, grade 2 strategies, grade 3 properties and
 * fractions, grade 4 multi-digit work and quadrilaterals, grade 5 fractions, decimals and polygons.
 *
 * Each level's key is made with randomness once ("2:23:5" = level, then the numbers). The same key
 * always rebuilds the same question, so a missed one can come back (fromKey).
 */

const NUMBER_CHOICE: Format[] = ['number', 'choice']
const CHOICE: Format[] = ['choice']
const plain = (text: string): Prompt => ({ text, say: text })
const nums = (key: string) => key.split(':').map(Number)
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

interface KeyedOpts {
  id: string
  labels: string[]
  formats: Format[]
  /** A random key for level L. Its first field is always the level. */
  key: (L: number) => string
  /** Make the question from its key. Returns null only for a key that cannot be made. */
  build: (key: string) => ItemSpec | null
  unlocksAfter?: { skill: string; level: number }[]
}

/** A skill whose questions are rebuilt from their keys. */
function keyedSkill(o: KeyedOpts): Skill {
  return {
    id: o.id,
    label: (L) => o.labels[L - 1]!,
    maxLevel: o.labels.length,
    formats: o.formats,
    ...(o.unlocksAfter ? { unlocksAfter: o.unlocksAfter } : {}),
    generate: (L) => o.build(o.key(L))!,
    fromKey: (key, L) => (key.split(':')[0] === String(L) ? o.build(key) : null),
  }
}

/** A whole-number answer. The wrong options are slips near the answer, first. */
function numeric(key: string, prompt: Prompt, answer: number, near: number[] = []): ItemSpec {
  return { key, prompt, answer: String(answer), wrong: (k) => numberWrongs(answer, k, near) }
}

/** A word, letter, fraction or money answer. The wrong options come from `pool`; any in `near` go first. */
function choice(key: string, prompt: Prompt, answer: string, pool: readonly string[], near: readonly string[] = []): ItemSpec {
  return { key, prompt, answer, wrong: (k) => wrongFrom(answer, k, pool, near) }
}

// --- Drawings -------------------------------------------------------------------------------------

const svgWrap = (w: number, h: number, body: string, label: string) =>
  `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><g font-family="sans-serif" font-size="22" text-anchor="middle">${body}</g></svg>`

/** Base-ten blocks: a flat is 100, a rod is 10, a small square is 1. Each group is [hundreds, tens, ones]. */
function blocksSVG(groups: [number, number, number][], label: string) {
  let x = 10
  let body = ''
  for (const [h, t, o] of groups) {
    for (let i = 0; i < h; i++) {
      body += `<rect x="${x}" y="6" width="90" height="90" fill="#60a5fa" stroke="#1e3a8a"/>`
      x += 98
    }
    for (let i = 0; i < t; i++) {
      body += `<rect x="${x}" y="6" width="12" height="90" fill="#34d399" stroke="#065f46"/>`
      x += 16
    }
    for (let i = 0; i < o; i++) {
      body += `<rect x="${x}" y="78" width="14" height="14" fill="#fbbf24" stroke="#92400e"/>`
      x += 18
    }
    x += 30
  }
  return svgWrap(Math.max(x, 200), 110, body, label)
}

/** A number line from lo to hi. `marks` are dots; `jumps` are [from, to] arcs. Long ranges get ticks every 10, so they stay readable. */
function numberLineSVG(lo: number, hi: number, marks: number[], jumps: [number, number][], label: string) {
  const W = 640
  const pad = 30
  const range = hi - lo
  const step = (W - 2 * pad) / range
  const X = (v: number) => pad + (v - lo) * step
  const tick = range > 100 ? 10 : 1
  const every = range > 200 ? 100 : range > 100 ? 50 : range <= 12 ? 1 : range <= 30 ? 5 : 10
  let body = `<line x1="${pad}" y1="90" x2="${W - pad}" y2="90" stroke="#334155" stroke-width="3"/>`
  for (let v = lo; v <= hi; v += tick) {
    body += `<line x1="${X(v)}" y1="82" x2="${X(v)}" y2="98" stroke="#334155" stroke-width="2"/>`
    if ((v - lo) % every === 0) body += `<text x="${X(v)}" y="124" font-size="18">${v}</text>`
  }
  for (const [a, b] of jumps) body += `<path d="M ${X(a)} 84 Q ${(X(a) + X(b)) / 2} 16 ${X(b)} 84" fill="none" stroke="#ef4444" stroke-width="3"/>`
  for (const m of marks) body += `<circle cx="${X(m)}" cy="90" r="7" fill="#22c55e"/>`
  return svgWrap(W, 135, body, label)
}

/** A row of boxes to read left to right, like "23", "+ 2", "+ 3", "= ?". */
function boxRowSVG(texts: string[], label: string) {
  const body = texts
    .map(
      (t, i) =>
        `<rect x="${10 + i * 130}" y="20" width="120" height="60" rx="10" fill="#fef3c7" stroke="#92400e" stroke-width="2"/>` +
        `<text x="${70 + i * 130}" y="60" font-size="26">${t}</text>`,
    )
    .join('')
  return svgWrap(texts.length * 130 + 10, 100, body, label)
}

/** A bar cut into `den` equal parts, with the first `num` shaded. */
function fractionBarSVG(num: number, den: number, label: string) {
  const W = 300
  const cell = W / den
  let body = ''
  for (let i = 0; i < den; i++) {
    body += `<rect x="${10 + i * cell}" y="10" width="${cell}" height="60" fill="${i < num ? '#f59e0b' : '#ffffff'}" stroke="#92400e" stroke-width="2"/>`
  }
  return svgWrap(W + 20, 80, body, label)
}

// --- Kindergarten: Numbers to 10 ----------------------------------------------------------------

/**
 * IXL: "Identify numbers - up to 10", "Names of numbers - up to 10", "Choose the number that you hear - up to 10".
 * Keys: "L:n" where n is the number 0-10.
 */
const numbersTo10 = keyedSkill({
  id: 'numbersTo10',
  labels: ['Identify numbers up to 10', 'Names of numbers up to 10', 'Choose the number you hear'],
  formats: NUMBER_CHOICE,
  key: (L) => `${L}:${rand(0, 10)}`,
  build: (key) => {
    const [L = 1, n = -1] = nums(key)
    if (!(n >= 0 && n <= 10) || !(L >= 1 && L <= 3)) return null
    const near = [n - 1, n + 1].filter((v) => v >= 0)
    if (L === 1) {
      const svg = svgWrap(200, 200, `<text x="100" y="150" font-size="150" font-weight="bold">${n}</text>`, `The number ${n}`)
      return numeric(key, { text: 'What number is this?', say: 'What number is this?', svg }, n, near)
    }
    if (L === 2) return numeric(key, plain(`What number is ${WORDS[n]}?`), n, near)
    return { ...numeric(key, { text: 'Listen. Which number is it?', say: WORDS[n]! }, n, near), listen: true }
  },
})

// --- Grade 2: Addition strategies, two digits ---------------------------------------------------

/**
 * IXL: "Addition strategies: two digits" (all four levels are grade 2): break apart a one-digit number,
 * models without regrouping, models with regrouping, number lines.
 * Keys: "1:a:b:p" (p is the first part of b), "2:a:b", "3:a:b", "4:a:b".
 */
const addStrategies2 = keyedSkill({
  id: 'addStrategies2',
  labels: [
    'Break apart a one-digit number to add',
    'Add with blocks, no regrouping',
    'Add with blocks, with regrouping',
    'Add two-digit numbers on a number line',
  ],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const b = rand(2, 9)
      return `1:${rand(10, 49)}:${b}:${rand(1, b - 1)}`
    }
    if (L === 2) {
      const o = rand(0, 4)
      return `2:${rand(1, 6) * 10 + o}:${rand(1, 9 - o)}`
    }
    if (L === 3) {
      const o = rand(5, 9)
      return `3:${rand(1, 6) * 10 + o}:${rand(10 - o, 9)}`
    }
    return `4:${rand(20, 60)}:${rand(11, 29)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, p = 0] = nums(key)
    if (L === 1) {
      const q = b - p
      const sum = a + b
      const prompt = { text: `Break ${b} into ${p} and ${q}. Add them one at a time.`, svg: boxRowSVG([`${a}`, `+ ${p}`, `+ ${q}`, '= ?'], `${a} plus ${p} plus ${q}`) }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, a + p, a + 10])
    }
    if (L === 2 || L === 3) {
      const sum = a + b
      const t = Math.floor(a / 10)
      const o = a % 10
      const prompt = {
        text: `${a} + ${b}. How many blocks in all?`,
        say: `${a} plus ${b}. How many in all?`,
        svg: blocksSVG([[0, t, o], [0, 0, b]], `${a} blocks and ${b} more`),
      }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, sum - 10, sum + 10])
    }
    if (L === 4) {
      const sum = a + b
      const tens = Math.floor(b / 10) * 10
      const lo = Math.floor(a / 10) * 10
      const hi = Math.ceil(sum / 10) * 10
      const prompt = {
        text: `Start at ${a}. Jump ${tens} (the tens part), then jump ${b - tens} more. Where do you land?`,
        say: `Start at ${a}. Jump ${tens}, then jump ${b - tens} more. Where do you land?`,
        svg: numberLineSVG(lo, hi, [a], [[a, a + tens]], `Number line from ${lo} to ${hi}`),
      }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, a + tens, a + b + 10])
    }
    return null
  },
})

// --- Grade 2: Subtraction strategies, two digits ------------------------------------------------

/**
 * IXL: "Subtraction strategies: two digits" (all four levels are grade 2): break apart a one-digit number,
 * models without and with regrouping, number lines.
 * Keys: "1:a:b:p", "2:a:b", "3:a:b", "4:a:b".
 */
const subStrategies2 = keyedSkill({
  id: 'subStrategies2',
  labels: [
    'Break apart a one-digit number to subtract',
    'Subtract with blocks, no regrouping',
    'Subtract with blocks, with regrouping',
    'Subtract two-digit numbers on a number line',
  ],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const b = rand(2, 9)
      return `1:${rand(20, 89)}:${b}:${rand(1, b - 1)}`
    }
    if (L === 2) {
      const o = rand(1, 9)
      return `2:${rand(2, 8) * 10 + o}:${rand(1, o)}`
    }
    if (L === 3) {
      const o = rand(0, 7)
      return `3:${rand(2, 8) * 10 + o}:${rand(o + 1, 9)}`
    }
    const a = rand(40, 89)
    return `4:${a}:${rand(11, Math.min(29, a - 1))}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, p = 0] = nums(key)
    if (L === 1) {
      const q = b - p
      const diff = a - b
      const prompt = { text: `Break ${b} into ${p} and ${q}. Take them away one at a time.`, svg: boxRowSVG([`${a}`, `- ${p}`, `- ${q}`, '= ?'], `${a} minus ${p} minus ${q}`) }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, a - p, a - 10])
    }
    if (L === 2) {
      const diff = a - b
      const prompt = {
        text: `${a} take away ${b}. Cross out ${b} ${b === 1 ? 'block' : 'blocks'}. How many are left?`,
        say: `${a} take away ${b}. How many are left?`,
        svg: blocksSVG([[0, Math.floor(a / 10), a % 10]], `${a} blocks`),
      }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff - 10, diff + 10])
    }
    if (L === 3) {
      const diff = a - b
      const prompt = {
        text: `${a} take away ${b}. There are not enough ones, so trade 1 ten for 10 ones first.`,
        say: `${a} take away ${b}. Trade one ten for ten ones first. How many are left?`,
        svg: blocksSVG([[0, Math.floor(a / 10), a % 10]], `${a} blocks`),
      }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff + 10, diff - 10])
    }
    if (L === 4) {
      const diff = a - b
      const tens = Math.floor(b / 10) * 10
      const lo = Math.floor(diff / 10) * 10
      const hi = Math.ceil(a / 10) * 10
      const prompt = {
        text: `Start at ${a}. Jump back ${tens} (the tens part), then jump back ${b - tens} more. Where do you land?`,
        say: `Start at ${a}. Jump back ${tens}, then jump back ${b - tens} more. Where do you land?`,
        svg: numberLineSVG(lo, hi, [a], [[a, a - tens]], `Number line from ${lo} to ${hi}`),
      }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff + tens, diff - 10])
    }
    return null
  },
})

// --- Grade 2: Addition and subtraction strategies, three digits ---------------------------------

/**
 * IXL: "Addition strategies: three digits" (all grade 2): number lines, break apart a three-digit number,
 * compensation, models without regrouping.
 * Keys: "1:a:b:p" (p is a tens part of b), "2:a:b", "3:a:b:d" (d is what b is short of a ten), "4:a:b".
 */
const addStrategies3 = keyedSkill({
  id: 'addStrategies3',
  labels: ['Break apart a number to add, up to three digits', 'Add three-digit blocks, no regrouping', 'Use compensation to add', 'Add three-digit numbers on a number line'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const b = rand(11, 99)
      return `1:${rand(100, 599)}:${b}:${10 * rand(1, Math.floor((b - 1) / 10))}`
    }
    if (L === 2) {
      const [h1, t1, o1] = [rand(1, 4), rand(0, 4), rand(0, 4)]
      const [h2, t2, o2] = [rand(0, 9 - h1), rand(0, 9 - t1), rand(0, 9 - o1)]
      return `2:${100 * h1 + 10 * t1 + o1}:${100 * h2 + 10 * t2 + o2}`
    }
    if (L === 3) {
      const d = rand(1, 3)
      return `3:${rand(100, 800)}:${10 * rand(3, 9) - d}:${d}`
    }
    return `4:${rand(100, 700)}:${rand(30, 250)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, x = 0] = nums(key)
    const sum = a + b
    if (L === 1) {
      const q = b - x
      const prompt = { text: `Break ${b} into ${x} and ${q}. Add them one at a time.`, svg: boxRowSVG([`${a}`, `+ ${x}`, `+ ${q}`, '= ?'], `${a} plus ${x} plus ${q}`) }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, a + x, sum + 10])
    }
    if (L === 2) {
      const groups: [number, number, number][] = [
        [Math.floor(a / 100), Math.floor((a % 100) / 10), a % 10],
        [Math.floor(b / 100), Math.floor((b % 100) / 10), b % 10],
      ]
      const prompt = { text: `${a} + ${b}. Put the blocks together. How many in all?`, say: `${a} plus ${b}. How many in all?`, svg: blocksSVG(groups, `${a} blocks and ${b} blocks`) }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, sum - 10, sum + 100])
    }
    if (L === 3) {
      const near = [sum - 1, sum + 1, sum + x, sum - x]
      const prompt = { text: `Add ${b + x} (a round number), then take away ${x}.`, say: `Add ${b + x}, then take away ${x}.`, svg: boxRowSVG([`${a}`, `+ ${b + x}`, `- ${x}`, '= ?'], `${a} plus ${b + x} minus ${x}`) }
      return numeric(key, prompt, sum, near)
    }
    if (L === 4) {
      const tens = Math.floor(b / 10) * 10
      const lo = Math.floor(a / 100) * 100
      const hi = Math.ceil(sum / 100) * 100
      const prompt = {
        text: `Start at ${a}. Jump ${tens} (the tens part), then jump ${b - tens} more. Where do you land?`,
        say: `Start at ${a}. Jump ${tens}, then jump ${b - tens} more. Where do you land?`,
        svg: numberLineSVG(lo, hi, [a], [[a, a + tens]], `Number line from ${lo} to ${hi}`),
      }
      return numeric(key, prompt, sum, [sum - 1, sum + 1, a + tens, sum + 10])
    }
    return null
  },
})

/**
 * IXL: "Subtraction strategies: three digits" (all grade 2): number lines, break apart a three-digit number,
 * compensation, models without regrouping.
 * Keys: "1:a:b:p", "2:a:b", "3:a:b:d", "4:a:b".
 */
const subStrategies3 = keyedSkill({
  id: 'subStrategies3',
  labels: ['Break apart a number to subtract, up to three digits', 'Subtract three-digit blocks, no regrouping', 'Use compensation to subtract', 'Subtract three-digit numbers on a number line'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const b = rand(11, 99)
      return `1:${rand(200, 899)}:${b}:${10 * rand(1, Math.floor((b - 1) / 10))}`
    }
    if (L === 2) {
      const [h, t, o] = [rand(1, 9), rand(1, 9), rand(1, 9)]
      const [hb, tb, ob] = [rand(0, h), rand(0, t), rand(0, o)]
      const b = 100 * hb + 10 * tb + ob || 1
      return `2:${100 * h + 10 * t + o}:${b}`
    }
    if (L === 3) {
      const d = rand(1, 3)
      return `3:${rand(200, 800)}:${10 * rand(3, 9) - d}:${d}`
    }
    return `4:${rand(300, 900)}:${rand(30, 250)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, x = 0] = nums(key)
    const diff = a - b
    if (L === 1) {
      const q = b - x
      const prompt = { text: `Break ${b} into ${x} and ${q}. Take them away one at a time.`, svg: boxRowSVG([`${a}`, `- ${x}`, `- ${q}`, '= ?'], `${a} minus ${x} minus ${q}`) }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, a - x, diff + 10])
    }
    if (L === 2) {
      const prompt = {
        text: `${a} take away ${b}. Cross out ${b} ${b === 1 ? 'block' : 'blocks'}. How many are left?`,
        say: `${a} take away ${b}. How many are left?`,
        svg: blocksSVG([[Math.floor(a / 100), Math.floor((a % 100) / 10), a % 10]], `${a} blocks`),
      }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff - 10, diff + 100])
    }
    if (L === 3) {
      const prompt = { text: `Take away ${b + x} (a round number), then add back ${x}.`, say: `Take away ${b + x}, then add back ${x}.`, svg: boxRowSVG([`${a}`, `- ${b + x}`, `+ ${x}`, '= ?'], `${a} minus ${b + x} plus ${x}`) }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff + x, diff - x])
    }
    if (L === 4) {
      const tens = Math.floor(b / 10) * 10
      const lo = Math.floor(diff / 100) * 100
      const hi = Math.ceil(a / 100) * 100
      const prompt = {
        text: `Start at ${a}. Jump back ${tens} (the tens part), then jump back ${b - tens} more. Where do you land?`,
        say: `Start at ${a}. Jump back ${tens}, then jump back ${b - tens} more. Where do you land?`,
        svg: numberLineSVG(lo, hi, [a], [[a, a - tens]], `Number line from ${lo} to ${hi}`),
      }
      return numeric(key, prompt, diff, [diff - 1, diff + 1, diff + tens, diff - 10])
    }
    return null
  },
})

// --- Grade 3: Addition properties, skip-counting, multiplication and division builders ---------

/**
 * IXL: "Addition properties" (grade 3): commutative fill-ins, associative fill-ins, the zero property.
 * Keys: "1:a:b", "2:a:b:c", "3:a".
 */
const addProperties = keyedSkill({
  id: 'addProperties',
  labels: ['Complete the equation using properties of addition', 'Add using properties', 'The zero property of addition'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 20)}:${rand(1, 20)}`
    if (L === 2) return `2:${rand(1, 20)}:${rand(1, 20)}:${rand(1, 20)}`
    return `3:${rand(1, 50)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0] = nums(key)
    if (L === 1) {
      const prompt = { text: `${a} + ${b} = ${b} + ?`, say: `${a} plus ${b} equals ${b} plus what?` }
      return numeric(key, prompt, a, [b, a + 1, a - 1])
    }
    if (L === 2) {
      const prompt = { text: `(${a} + ${b}) + ${c} = ${a} + (${b} + ?)`, say: `${a} plus ${b}, plus ${c}, equals ${a}, plus ${b} plus what?` }
      return numeric(key, prompt, c, [a, b, c + 1, c - 1])
    }
    if (L === 3) {
      const prompt = { text: `The zero property: ${a} + ? = ${a}`, say: `${a} plus what equals ${a}?` }
      return numeric(key, prompt, 0, [1, a])
    }
    return null
  },
})

/**
 * IXL: "Addition properties" (grade 3), "Even or odd: addition patterns". Each option is a sum, so these are choice only.
 * Keys: "L:p0:q0:p1:q1:p2:q2:p3:q3". The first pair is right; the other three are wrong. Level 1 asks for the even sum
 * (right pair both odd, wrong pairs odd + even); level 2 asks for the odd sum (right pair odd + even, wrong pairs even + even or odd + odd).
 */
const oddSums = keyedSkill({
  id: 'oddSums',
  labels: ['Which sum is even?', 'Which sum is odd?'],
  formats: CHOICE,
  key: (L) => {
    const odd = () => 2 * rand(0, 24) + 1
    const even = () => 2 * rand(1, 25)
    for (;;) {
      const right: [number, number] = L === 1 ? [odd(), odd()] : [odd(), even()]
      const wrong: [number, number][] = L === 1 ? [[odd(), even()], [even(), odd()], [odd(), even()]] : [[odd(), odd()], [even(), even()], [odd(), odd()]]
      const pairs = [right, ...wrong]
      if (new Set(pairs.map(([x, y]) => `${x} + ${y}`)).size === 4) return `${L}:${pairs.flat().join(':')}`
    }
  },
  build: (key) => {
    const [L = 1, ...rest] = nums(key)
    const exprs = [0, 1, 2, 3].map((i) => `${rest[2 * i]} + ${rest[2 * i + 1]}`)
    const question = L === 1 ? 'Which sum is even?' : 'Which sum is odd?'
    return choice(key, plain(question), exprs[0]!, exprs.slice(1))
  },
})

/**
 * IXL: "Skip-counting" (grade 3): count on by 3s to 9s, then fill in a skip-counting sequence, then count backwards.
 * Keys: "L:step:start:k": the sequence is start + step*i for i = 0..4, and term k is blank (backwards in level 3).
 */
const skipCount3 = keyedSkill({
  id: 'skipCount3',
  labels: ['Skip-count by 3s to 6s', 'Skip-counting sequences', 'Skip-counting backwards'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(3, 6)}:${rand(0, 12)}:4`
    if (L === 2) return `2:${rand(3, 9)}:${rand(0, 20)}:${rand(1, 3)}`
    const step = rand(4, 9)
    return `3:${step}:${step * rand(5, 9)}:${rand(1, 3)}`
  },
  build: (key) => {
    const [L = 0, step = 0, start = 0, k = 0] = nums(key)
    const back = L === 3
    const term = (i: number) => (back ? start - step * i : start + step * i)
    const answer = term(k)
    const shown = [0, 1, 2, 3, 4].map((i) => (i === k ? '___' : String(term(i))))
    const word = back ? 'backwards' : 'forward'
    const text = `Count ${word} by ${step}s: ${shown.join(', ')}. What goes in the blank?`
    const say = `Count ${word} by ${step}s. What goes in the blank?`
    return numeric(key, { text, say }, answer, [answer - 1, answer + 1, answer - step, answer + step])
  },
})

/**
 * IXL: "Multiplication skill builders up to 10" (levels 1-3) and "up to 12" (level 4), all grade 3.
 * Keys: "L:a:b" where b is the factor being practiced at that level.
 */
const mulBuilders = keyedSkill({
  id: 'mulBuilders',
  labels: ['Multiplication skill builders up to 10: times 0 and 1', 'Multiplication skill builders up to 10: times 2 to 5', 'Multiplication skill builders up to 10: times 6 to 10', 'Multiplication skill builders up to 12: times 11 and 12'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(0, 10)}:${rand(0, 1)}`
    if (L === 2) return `2:${rand(0, 10)}:${rand(2, 5)}`
    if (L === 3) return `3:${rand(0, 10)}:${rand(6, 10)}`
    return `4:${rand(0, 12)}:${rand(11, 12)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0] = nums(key)
    const p = a * b
    return numeric(key, { text: `${a} × ${b} = ?`, say: `${a} times ${b}` }, p, [p + a, p - a, p + b, p - b])
  },
})

/**
 * IXL: "Multiplication properties" (grade 3): commutative fill-ins, associative fill-ins, times 0 or 1.
 * Keys: "1:a:b", "2:a:b:c", "3:a:f" (f is 0 or 1).
 */
const mulProperties = keyedSkill({
  id: 'mulProperties',
  labels: ['Complete the equation using properties of multiplication', 'Multiply three numbers using properties', 'Multiply by 0 or 1: complete the sentence'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 9)}:${rand(2, 9)}`
    if (L === 2) return `2:${rand(2, 5)}:${rand(2, 5)}:${rand(2, 5)}`
    return `3:${rand(1, 9)}:${rand(0, 1)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0] = nums(key)
    if (L === 1) {
      return numeric(key, { text: `${a} × ${b} = ${b} × ?`, say: `${a} times ${b} equals ${b} times what?` }, a, [b, a + 1, a - 1])
    }
    if (L === 2) {
      return numeric(key, { text: `(${a} × ${b}) × ${c} = ${a} × (${b} × ?)`, say: `${a} times ${b}, times ${c}, equals ${a} times ${b} times what?` }, c, [a, b, c + 1, c - 1])
    }
    if (L === 3) {
      const answer = b
      const prompt = answer === 1 ? { text: `${a} × ? = ${a}`, say: `${a} times what equals ${a}?` } : { text: `${a} × ? = 0`, say: `${a} times what equals 0?` }
      return numeric(key, prompt, answer, [1 - answer, 2])
    }
    return null
  },
})

/**
 * IXL: "Division skill builders up to 10" (levels 1-3) and "up to 12" (level 4), all grade 3.
 * Keys: "L:d:q": divide d*q by d to get q.
 */
const divBuilders = keyedSkill({
  id: 'divBuilders',
  labels: ['Division skill builders up to 10: divide by 1 and 2', 'Division skill builders up to 10: divide by 3 and 4', 'Division skill builders up to 10: divide by 5 to 10', 'Division skill builders up to 12: quotients up to 12'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 2)}:${rand(1, 10)}`
    if (L === 2) return `2:${rand(3, 4)}:${rand(1, 10)}`
    if (L === 3) return `3:${rand(5, 10)}:${rand(1, 10)}`
    return `4:${rand(6, 12)}:${rand(1, 12)}`
  },
  build: (key) => {
    const [L = 0, d = 0, q = 0] = nums(key)
    const dividend = d * q
    return numeric(key, { text: `${dividend} ÷ ${d} = ?`, say: `${dividend} divided by ${d}` }, q, [q - 1, q + 1, d, q + 2])
  },
})

/** Several whole bars stacked, each cut into `parts` equal pieces and fully shaded. */
function wholeBarsSVG(count: number, parts: number, label: string) {
  const cell = 300 / parts
  let body = ''
  for (let r = 0; r < count; r++) {
    for (let i = 0; i < parts; i++) {
      body += `<rect x="${10 + i * cell}" y="${10 + r * 40}" width="${cell}" height="30" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>`
    }
  }
  return svgWrap(320, 20 + count * 40, body, label)
}

/** A number line from 0 to 1 cut into `den` parts, with a green dot at num/den. */
function fractionLineSVG(num: number, den: number, label: string) {
  const W = 620
  const X = (k: number) => 30 + (k / den) * (W - 60)
  let body = `<line x1="${X(0)}" y1="90" x2="${X(den)}" y2="90" stroke="#334155" stroke-width="3"/>`
  for (let k = 0; k <= den; k++) body += `<line x1="${X(k)}" y1="80" x2="${X(k)}" y2="100" stroke="#334155" stroke-width="2"/>`
  body += `<text x="${X(0)}" y="126" font-size="18">0</text><text x="${X(den)}" y="126" font-size="18">1</text>`
  body += `<circle cx="${X(num)}" cy="90" r="11" fill="#22c55e"/>`
  return svgWrap(W, 135, body, label)
}

/** A vertical thermometer showing `value` on a scale from `lo` to `hi` (lo and hi are multiples of 10). Ticks every 5. */
function thermometerSVG(value: number, lo: number, hi: number, unit: string, label: string) {
  const top = 20
  const bottom = 260
  const Y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top)
  let body = `<rect x="90" y="${top}" width="20" height="${bottom - top}" rx="10" fill="#ffffff" stroke="#334155" stroke-width="2"/>`
  body += `<rect x="93" y="${Y(value)}" width="14" height="${bottom - Y(value)}" fill="#ef4444"/>`
  for (let v = lo; v <= hi; v += 5) {
    const long = v % 10 === 0
    body += `<line x1="110" y1="${Y(v)}" x2="${long ? 124 : 117}" y2="${Y(v)}" stroke="#334155" stroke-width="2"/>`
    if (long) body += `<text x="150" y="${Y(v) + 6}" font-size="16" text-anchor="start">${v}${unit}</text>`
  }
  return svgWrap(220, 280, body, label)
}
/**
 * IXL: "Mixed operations" (grade 3): addition and subtraction facts, multiplication and division facts,
 * then mixed word problems. Keys: "1:op:a:b" (op 0 is +, 1 is -), "2:op:a:b" (op 0 is ×, 1 is ÷), "3:a:b:c".
 */
const mixedOps3 = keyedSkill({
  id: 'mixedOps3',
  labels: ['Addition and subtraction facts mixed', 'Multiplication and division facts mixed', 'Mixed operations word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const op = rand(0, 1)
      const a = rand(1, 20)
      return `1:${op}:${a}:${op ? rand(1, a) : rand(1, 20)}`
    }
    if (L === 2) return `2:${rand(0, 1)}:${rand(2, 9)}:${rand(2, 9)}`
    const a = rand(2, 9)
    const b = rand(2, 9)
    return `3:${a}:${b}:${rand(1, a * b - 1)}`
  },
  build: (key) => {
    const [L = 0, op = 0, a = 0, b = 0] = nums(key)
    if (L === 1) {
      const ans = op ? a - b : a + b
      const text = op ? `${a} − ${b} = ?` : `${a} + ${b} = ?`
      return numeric(key, { text, say: op ? `${a} minus ${b}` : `${a} plus ${b}` }, ans, [ans - 1, ans + 1, ans - 2, ans + 2])
    }
    if (L === 2) {
      const ans = op ? b : a * b
      const text = op ? `${a * b} ÷ ${a} = ?` : `${a} × ${b} = ?`
      return numeric(key, { text, say: op ? `${a * b} divided by ${a}` : `${a} times ${b}` }, ans, [ans - 1, ans + 1, ans + a, ans - a])
    }
    if (L === 3) {
      // Key is "3:bags:apples:gives".
      const bags = op
      const apples = a
      const gives = b
      const ans = bags * apples - gives
      const text = `Ava has ${bags} bags with ${apples} apples in each bag. She gives away ${gives} apples. How many apples are left?`
      return numeric(key, { text, say: `Ava has ${bags} bags with ${apples} apples in each bag. She gives away ${gives} apples. How many are left?` }, ans, [ans + 1, ans - 1, bags + apples, bags * apples])
    }
    return null
  },
})

/**
 * IXL: "Fraction word problems" (grade 3): unit fractions and fractions of a whole, with pictures and in words.
 * Keys: "1:n" (picture), "2:n" (words), "3:n:k" (picture), "4:n:k" (words). The answer is a fraction.
 */
const fracWordProblems3 = keyedSkill({
  id: 'fracWordProblems3',
  labels: ['Unit fractions: modeling word problems', 'Unit fractions: word problems', 'Fractions of a whole: modeling word problems', 'Fractions of a whole: word problems'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1 || L === 2) return `${L}:${rand(2, 8)}`
    const n = rand(3, 8)
    return `${L}:${n}:${rand(2, n - 1)}`
  },
  build: (key) => {
    const [L = 0, n = 0, k = 0] = nums(key)
    if (L === 1) {
      const answer = `1/${n}`
      const pool = [`1/${n + 1}`, `1/${n + 2}`, `2/${n}`, `3/${n}`]
      const text = `Ava ate one part of a bar cut into ${n} equal parts. What fraction of the bar did she eat?`
      return choice(key, { text, say: `Ava ate one part of a bar cut into ${n} equal parts. What fraction did she eat?`, svg: fractionBarSVG(1, n, `A bar cut into ${n} parts, one shaded`) }, answer, pool)
    }
    if (L === 2) {
      const answer = `1/${n}`
      const pool = [`1/${n + 1}`, `1/${n + 2}`, `2/${n}`, `3/${n}`]
      return choice(key, plain(`Leo cut a pizza into ${n} equal slices and ate 1 slice. What fraction of the pizza did he eat?`), answer, pool)
    }
    if (L === 3) {
      const answer = `${k}/${n}`
      const pool = [`${n}/${k}`, `${k + 1}/${n}`, `${k}/${n + 1}`, `${k - 1}/${n}`]
      const text = `A bar is cut into ${n} equal parts. ${k} parts are shaded. What fraction is shaded?`
      return choice(key, { text, say: `A bar is cut into ${n} equal parts. ${k} parts are shaded. What fraction is shaded?`, svg: fractionBarSVG(k, n, `A bar cut into ${n} parts, ${k} shaded`) }, answer, pool)
    }
    const answer = `${n - k}/${n}`
    const pool = [`${k}/${n}`, `${n}/${n - k}`, `${n - k + 1}/${n}`, `${n - k}/${n + 1}`]
    return choice(key, plain(`Zoe has a pan of ${n} muffins. She eats ${k} of them. What fraction of the muffins is left?`), answer, pool)
  },
})

/**
 * IXL: "Fractions equivalent to whole numbers" (grade 3): fractions that equal 1, then equal a whole number.
 * Keys: "1:n" (equal to 1), "2:w:m" (w whole bars, each cut into m), "3:w:m" (equal to w, in words).
 */
const fracWhole3 = keyedSkill({
  id: 'fracWhole3',
  labels: ['Which fraction equals 1', 'Select fractions equivalent to whole numbers using models', 'Find fractions equivalent to whole numbers'],
  formats: CHOICE,
  key: (L) => (L === 1 ? `1:${rand(2, 8)}` : `${L}:${rand(1, 3)}:${rand(2, 6)}`),
  build: (key) => {
    const [L = 0, p = 0, m = 0] = nums(key)
    if (L === 1) {
      const n = p
      const pool = [`${n}/${n + 1}`, `${n + 1}/${n}`, `${n - 1}/${n}`, `${n}/${n - 1}`]
      return choice(key, { text: 'Which fraction is the same as 1 whole?', say: 'Which fraction is the same as one whole?', svg: fractionBarSVG(n, n, `A whole bar cut into ${n} parts`) }, `${n}/${n}`, pool)
    }
    const w = p
    const ans = `${w * m}/${m}`
    const pool = [`${w * m + 1}/${m}`, `${w * m - 1}/${m}`, `${w * m}/${m + 1}`, `${w}/${m}`]
    if (L === 2) {
      const text = `The picture shows ${w} whole bars, each cut into ${m} equal parts. Which fraction is the same as ${w} wholes?`
      return choice(key, { text, say: `Which fraction is the same as ${w} wholes?`, svg: wholeBarsSVG(w, m, `${w} whole bars`) }, ans, pool)
    }
    return choice(key, plain(`Which fraction is the same as ${w}?`), ans, pool)
  },
})

/**
 * IXL: "Order fractions" (grade 3): greatest of fractions with like denominators, like numerators,
 * then fractions on a number line. Keys: "1:d:m", "2:k:s", "3:d:num".
 */
const orderFractions3 = keyedSkill({
  id: 'orderFractions3',
  labels: ['Order fractions with like denominators', 'Order fractions with like numerators', 'Graph and order fractions on number lines'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) {
      const d = rand(5, 10)
      return `1:${d}:${rand(4, d - 1)}`
    }
    if (L === 2) return `2:${rand(1, 3)}:${rand(3, 8)}`
    // Lowest terms only, so every dot is named by a fraction a kid would write.
    const d = rand(2, 6)
    let num = rand(1, d - 1)
    while (gcd(num, d) !== 1) num = rand(1, d - 1)
    return `3:${d}:${num}`
  },
  build: (key) => {
    const [L = 0, x = 0, y = 0] = nums(key)
    if (L === 1) {
      const d = x
      const top = y
      const pool = Array.from({ length: top - 1 }, (_, i) => `${i + 1}/${d}`)
      return choice(key, plain(`Which fraction is the greatest?`), `${top}/${d}`, pool)
    }
    if (L === 2) {
      const k = x
      const s = y
      const ans = `${k}/${s}`
      const pool = [`${k}/${s + 1}`, `${k}/${s + 2}`, `${k}/${s + 3}`]
      return choice(key, plain(`Which fraction is the greatest? Remember, the same top number and a smaller bottom number means a bigger piece.`), ans, pool)
    }
    const d = x
    const num = y
    const ans = `${num}/${d}`
    const pool: string[] = []
    for (let den = 2; den <= 6; den++) {
      for (let n = 1; n < den; n++) {
        if (n * d !== num * den) pool.push(`${n}/${den}`)
      }
    }
    return choice(key, { text: 'Which fraction is at the green dot?', say: 'Which fraction is at the green dot?', svg: fractionLineSVG(num, d, `Number line from 0 to 1 cut into ${d} parts`) }, ans, pool)
  },
})

/**
 * IXL: "Financial literacy" (grade 3): factors that affect income, scarcity and cost, planned and
 * unplanned spending, and uses for credit. Each level has a few questions; the key is "L:i" for item i.
 */
const FIN3: { text: string; answer: string; pool: string[] }[][] = [
  [
    { text: 'Which one affects how much money a person earns?', answer: 'The kind of job they have', pool: ['The color of their shoes', 'Their favorite food', 'How many pets they have', 'The day of the week'] },
    { text: 'Ava earns money by mowing lawns. What affects how much she earns?', answer: 'How many lawns she mows', pool: ['The color of her bike', 'Her favorite song', 'The name of her dog', 'What she has for lunch'] },
  ],
  [
    { text: 'Mia has $10. A book costs $6 and a game costs $8, so she can buy only one. Why?', answer: 'Money is limited, so she has to choose', pool: ['Stores never sell books', 'Games are free on Tuesdays', 'She has too many toys', 'Money grows on trees'] },
    { text: 'Leo wants a bike that costs more than he has. What must he do?', answer: 'Save money and choose what to buy', pool: ['Spend all his money at once', 'Give his money away', 'Wait for the bike to get cheaper', 'Buy the bike with no money'] },
  ],
  [
    { text: 'Which is a planned spending decision?', answer: 'Saving part of her allowance each week for a bike', pool: ['Buying a candy bar on the spur of the moment', 'Spending her whole allowance on the first toy she sees', 'Lending her money to a friend and forgetting about it'] },
    { text: 'Which is an unplanned spending decision?', answer: 'Buying a snack because it looked good at the checkout', pool: ['Writing a shopping list before going to the store', 'Saving $2 a week for a book', 'Setting aside money for a birthday gift in advance'] },
  ],
  [
    { text: 'Credit lets you buy now and pay later. What is one use for credit?', answer: 'Paying for a big purchase over time', pool: ['Earning a paycheck', 'Saving coins in a piggy bank', 'Finding money on the sidewalk'] },
    { text: 'When you borrow money with credit, what do you have to do later?', answer: 'Pay the money back, sometimes with extra', pool: ['Keep the money forever with no cost', 'Give the money to a friend', 'Put the money in a jar and forget it'] },
  ],
]

const financeG3 = keyedSkill({
  id: 'financeG3',
  labels: ['Factors that affect income', 'Scarcity and cost', 'Planned and unplanned spending decisions', 'Uses for credit'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, FIN3[L - 1]!.length - 1)}`,
  build: (key) => {
    const [L = 1, i = 0] = nums(key)
    const q = FIN3[L - 1]?.[i]
    if (!q) return null
    return choice(key, plain(q.text), q.answer, q.pool)
  },
})

/**
 * IXL: "Customary units of measurement" (grade 3): read a Fahrenheit thermometer, measure with an inch
 * ruler to the nearest inch, and read a pound scale. Keys: "L:value".
 */
const customaryUnits = keyedSkill({
  id: 'customaryUnits',
  labels: ['Read a Fahrenheit thermometer', 'Measure using an inch ruler', 'Read a scale in pounds'],
  formats: NUMBER_CHOICE,
  key: (L) => (L === 1 ? `1:${5 * rand(8, 20)}` : L === 2 ? `2:${rand(1, 11)}` : `3:${rand(1, 9)}`),
  build: (key) => {
    const [L = 0, v = 0] = nums(key)
    if (L === 1) {
      const svg = thermometerSVG(v, 30, 110, '°', 'A Fahrenheit thermometer')
      return numeric(key, { text: 'What temperature does the thermometer show, in degrees Fahrenheit?', say: 'What temperature does the thermometer show?', svg }, v, [v - 5, v + 5, v - 10, v + 10])
    }
    if (L === 2) {
      const ticks = Array.from({ length: 13 }, (_, i) => `<line x1="${20 + i * 46}" y1="60" x2="${20 + i * 46}" y2="80" stroke="#334155" stroke-width="2"/><text x="${20 + i * 46}" y="100" font-size="16">${i}</text>`).join('')
      const body = `<rect x="20" y="20" width="${v * 46}" height="30" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>${ticks}<line x1="20" y1="60" x2="572" y2="60" stroke="#334155" stroke-width="2"/>`
      return numeric(key, { text: 'How long is the bar, to the nearest inch?', say: 'How long is the bar, to the nearest inch?', svg: svgWrap(600, 120, body, `A bar ${v} inches long on an inch ruler`) }, v, [v - 1, v + 1])
    }
    const ticks = Array.from({ length: 11 }, (_, i) => `<line x1="${30 + i * 52}" y1="50" x2="${30 + i * 52}" y2="70" stroke="#334155" stroke-width="2"/><text x="${30 + i * 52}" y="95" font-size="16">${i}</text>`).join('')
    const pointer = `<path d="M ${30 + v * 52} 30 L ${24 + v * 52} 8 L ${36 + v * 52} 8 Z" fill="#ef4444"/>`
    const body = `<line x1="30" y1="60" x2="550" y2="60" stroke="#334155" stroke-width="3"/>${ticks}${pointer}`
    return numeric(key, { text: 'The arrow points to the weight. How many pounds is it?', say: 'The arrow points to the weight. How many pounds is it?', svg: svgWrap(580, 110, body, `A scale with the arrow at ${v} pounds`) }, v, [v - 1, v + 1])
  },
})

/**
 * IXL: "Metric units of measurement" (grade 3): read a Celsius thermometer, measure in centimeters,
 * and read liquid volume in milliliters. Keys: "L:value".
 */
const metricUnits = keyedSkill({
  id: 'metricUnits',
  labels: ['Read a Celsius thermometer', 'Measure in centimeters', 'Measure liquid in milliliters'],
  formats: NUMBER_CHOICE,
  key: (L) => (L === 1 ? `1:${5 * rand(0, 12)}` : L === 2 ? `2:${rand(1, 19)}` : `3:${50 * rand(1, 10)}`),
  build: (key) => {
    const [L = 0, v = 0] = nums(key)
    if (L === 1) {
      const svg = thermometerSVG(v, 0, 60, '°', 'A Celsius thermometer')
      return numeric(key, { text: 'What temperature does the thermometer show, in degrees Celsius?', say: 'What temperature does the thermometer show?', svg }, v, [v - 5, v + 5, v - 10, v + 10])
    }
    if (L === 2) {
      const ticks = Array.from({ length: 21 }, (_, i) => `<line x1="${20 + i * 30}" y1="60" x2="${20 + i * 30}" y2="80" stroke="#334155" stroke-width="2"/><text x="${20 + i * 30}" y="100" font-size="15">${i}</text>`).join('')
      const body = `<rect x="20" y="20" width="${v * 30}" height="30" fill="#60a5fa" stroke="#1e3a8a" stroke-width="2"/>${ticks}<line x1="20" y1="60" x2="620" y2="60" stroke="#334155" stroke-width="2"/>`
      return numeric(key, { text: 'How long is the line, in centimeters?', say: 'How long is the line, in centimeters?', svg: svgWrap(640, 120, body, `A line ${v} centimeters long`) }, v, [v - 1, v + 1])
    }
    const level = 280 - v * 0.5
    let marks = ''
    for (let m = 50; m <= 500; m += 50) {
      const y = 280 - m * 0.5
      marks += `<line x1="80" y1="${y}" x2="100" y2="${y}" stroke="#334155" stroke-width="2"/><text x="60" y="${y + 6}" font-size="16">${m}</text>`
    }
    const body = `<path d="M 100 30 L 100 280 L 220 280 L 220 30" fill="none" stroke="#334155" stroke-width="3"/><rect x="102" y="${level}" width="116" height="${280 - level - 2}" fill="#60a5fa"/>${marks}`
    return numeric(key, { text: 'How many milliliters of liquid are in the beaker? The lines are every 50 mL.', say: 'How many milliliters of liquid are in the beaker?', svg: svgWrap(240, 300, body, 'A beaker with liquid in it') }, v, [v - 50, v + 50, v - 100, v + 100])
  },
})

/**
 * IXL: "Area and perimeter" (grade 3): choose perimeter for a fence, find area or length from a word problem,
 * and find the perimeter of a square from its area. Keys: "1:l:w", "2:l:w:q" (q 0 is area, 1 is length), "3:s".
 */
const areaPerim3 = keyedSkill({
  id: 'areaPerim3',
  labels: ['Choose between area and perimeter: word problems', 'Find the area, perimeter, or side length: word problems', 'Relationship between area and perimeter: find the perimeter'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const l = rand(4, 9)
      return `1:${l}:${rand(2, l - 1)}`
    }
    if (L === 2) {
      const l = rand(3, 9)
      return `2:${l}:${rand(2, l - 1)}:${rand(0, 1)}`
    }
    return `3:${rand(2, 9)}`
  },
  build: (key) => {
    const [L = 0, l = 0, w = 0, q = 0] = nums(key)
    if (L === 1) {
      const ans = 2 * (l + w)
      const text = `Max wants a fence around a garden that is ${l} feet long and ${w} feet wide. How many feet of fence does he need?`
      return numeric(key, { text, say: `Max wants a fence around a garden that is ${l} feet long and ${w} feet wide. How many feet of fence does he need?` }, ans, [l * w, l + w, ans - 1, ans + 1])
    }
    if (L === 2 && q === 0) {
      const ans = l * w
      const text = `A garden is ${l} feet long and ${w} feet wide. What is its area, in square feet?`
      return numeric(key, { text, say: `A garden is ${l} feet long and ${w} feet wide. What is its area?` }, ans, [l + w, 2 * (l + w), ans - 1, ans + 1])
    }
    if (L === 2) {
      const per = 2 * (l + w)
      const text = `A rectangle has a perimeter of ${per} feet and a width of ${w} feet. What is its length?`
      return numeric(key, { text, say: `A rectangle has a perimeter of ${per} feet and a width of ${w} feet. What is its length?` }, l, [l + 1, l - 1, per - w, w])
    }
    if (L === 3) {
      const s = l
      const ans = 4 * s
      const text = `A square has an area of ${s * s} square units. What is its perimeter?`
      return numeric(key, { text, say: `A square has an area of ${s * s} square units. What is its perimeter?` }, ans, [s * s, 2 * s, ans + 4, ans - 4])
    }
    return null
  },
})

// --- Grade 4: Multi-digit addition and subtraction, estimation, time ----------------------------

/** Round to the nearest hundred. Keys never end in 50, so there is never a tie. */
const toHundred = (n: number) => Math.round(n / 100) * 100

/** Four-digit numbers, never ending in 50 (estimates would be a tie). */
const bigNumber = (lo: number, hi: number) => {
  const n = rand(lo, hi)
  return n % 100 === 50 ? n + 1 : n
}

/**
 * IXL: "Addition" (grade 4): estimate sums, estimate sums in word problems, add two multi-digit numbers,
 * and add in word problems. Keys: "1:a:b" and "2:a:b" (estimates), "3:a:b" and "4:a:b" (exact).
 */
const addMulti4 = keyedSkill({
  id: 'addMulti4',
  labels: ['Estimate sums', 'Estimate sums: word problems', 'Add two multi-digit numbers', 'Add two multi-digit numbers: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L <= 2) return `${L}:${bigNumber(1000, 4999)}:${bigNumber(1000, 4999)}`
    return `${L}:${bigNumber(1000, 4900)}:${bigNumber(1000, 4900)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0] = nums(key)
    const sum = a + b
    if (L === 1) {
      const est = toHundred(a) + toHundred(b)
      const text = `About how much is ${a} + ${b}? Round each number to the nearest hundred, then add.`
      return numeric(key, { text, say: `About how much is ${a} plus ${b}? Round each number to the nearest hundred, then add.` }, est, [sum, est - 100, est + 100])
    }
    if (L === 2) {
      const est = toHundred(a) + toHundred(b)
      const text = `Zoe counted ${a} stickers on one shelf and ${b} on another. About how many stickers in all? Round each number to the nearest hundred first.`
      return numeric(key, { text, say: 'About how many stickers in all? Round each number to the nearest hundred first.' }, est, [sum, est - 100, est + 100])
    }
    if (L === 3) {
      return numeric(key, { text: `${a} + ${b} = ?`, say: `${a} plus ${b}` }, sum, [sum - 1, sum + 1, sum - 10, sum + 100])
    }
    const text = `Ravi collected ${a} stamps and Sam collected ${b} stamps. How many stamps do they have in all?`
    return numeric(key, { text, say: 'Ravi collected some stamps and Sam collected some stamps. How many do they have in all?' }, sum, [sum - 1, sum + 1, sum - 10, sum + 100])
  },
})

/**
 * IXL: "Subtraction" (grade 4): estimate differences, estimate in word problems, subtract two multi-digit
 * numbers, and subtract in word problems. Keys: "L:a:b" with a bigger than b.
 */
const subMulti4 = keyedSkill({
  id: 'subMulti4',
  labels: ['Estimate differences', 'Estimate differences: word problems', 'Subtract two multi-digit numbers', 'Subtract two multi-digit numbers: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    const b = bigNumber(1000, 4000)
    const a = bigNumber(b + 200, 9000)
    return `${L}:${a}:${b}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0] = nums(key)
    const diff = a - b
    if (L === 1) {
      const est = toHundred(a) - toHundred(b)
      const text = `About how much is ${a} − ${b}? Round each number to the nearest hundred, then subtract.`
      return numeric(key, { text, say: `About how much is ${a} minus ${b}? Round each number to the nearest hundred, then subtract.` }, est, [diff, est - 100, est + 100])
    }
    if (L === 2) {
      const est = toHundred(a) - toHundred(b)
      const text = `Max had ${a} beads and gave away ${b}. About how many beads does he have left? Round each number to the nearest hundred first.`
      return numeric(key, { text, say: 'About how many beads does he have left? Round each number to the nearest hundred first.' }, est, [diff, est - 100, est + 100])
    }
    if (L === 3) {
      return numeric(key, { text: `${a} − ${b} = ?`, say: `${a} minus ${b}` }, diff, [diff - 1, diff + 1, diff - 10, diff + 100])
    }
    const text = `Lily has ${a} points and Noah has ${b} points. How many more points does Lily have?`
    return numeric(key, { text, say: 'How many more points does Lily have than Noah?' }, diff, [diff - 1, diff + 1, diff - 10, diff + 100])
  },
})

/**
 * IXL: "Time" (grade 4): convert time units, convert mixed time units, add and subtract mixed time units,
 * and elapsed time. Keys: "1:h", "2:h:m", "3:op:h:m:m2", "4:h:m:d" (start h:m, d minutes later).
 */
const timeUnits4 = keyedSkill({
  id: 'timeUnits4',
  labels: ['Convert time units', 'Convert mixed time units', 'Add and subtract mixed time units', 'Elapsed time'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 9)}`
    if (L === 2) return `2:${rand(1, 5)}:${5 * rand(1, 11)}`
    if (L === 3) {
      const op = rand(0, 1)
      const h = rand(1, 4)
      const m = 5 * rand(1, 11)
      return `3:${op}:${h}:${m}:${op ? rand(1, m / 5) * 5 : 5 * rand(1, 11)}`
    }
    return `4:${rand(1, 9)}:${5 * rand(0, 11)}:${5 * rand(1, 30)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0, d = 0] = nums(key)
    if (L === 1) {
      const ans = 60 * a
      return numeric(key, { text: `How many minutes are in ${a} hours?`, say: `How many minutes are in ${a} hours?` }, ans, [ans - 60, ans + 60, ans - 10, ans + 10])
    }
    if (L === 2) {
      const ans = 60 * a + b
      return numeric(key, { text: `How many minutes are in ${a} hours and ${b} minutes?`, say: `How many minutes are in ${a} hours and ${b} minutes?` }, ans, [ans - 60, ans + 60, 60 * a, ans - 5])
    }
    if (L === 3) {
      const op = a
      const total = 60 * b + c
      const ans = op ? total - d : total + d
      const text = op
        ? `Ava planned to practice for ${b} hours and ${c} minutes, but she stopped ${d} minutes early. How many minutes did she practice?`
        : `Ava practiced for ${b} hours and ${c} minutes, then practiced ${d} more minutes. How many minutes did she practice in all?`
      return numeric(key, { text, say: text }, ans, [ans - 60, ans + 60, ans - 10, ans + 10])
    }
    if (L === 4) {
      const start = 60 * a + b
      const dur = c
      const end = start + dur
      const eh = Math.floor(end / 60)
      const em = String(end % 60).padStart(2, '0')
      const sm = String(b).padStart(2, '0')
      const text = `Ava starts reading at ${a}:${sm} and stops at ${eh}:${em}. How many minutes did she read?`
      return numeric(key, { text, say: `Ava starts reading at ${a}, ${sm}, and stops at ${eh}, ${em}. How many minutes did she read?` }, dur, [dur - 5, dur + 5, dur + 10, dur - 10])
    }
    return null
  },
})

// --- Grade 4: Area and perimeter, equivalent and decomposed fractions ---------------------------

/**
 * IXL: "Area and perimeter" (grade 4): compare area and perimeter of rectangles and squares, rectangles
 * with the same perimeter, the relationship between area and perimeter, and word problems.
 * Keys: "1:s:w", "2:l:w", "3:l:w", "4:l:w".
 */
const areaPerim4 = keyedSkill({
  id: 'areaPerim4',
  labels: ['Compare area of a square and a rectangle', 'Rectangles with the same perimeter', 'Relationship between area and perimeter', 'Area and perimeter: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const s = rand(3, 9)
      return `1:${s}:${rand(1, s - 1)}`
    }
    return `${L}:${rand(3, 9)}:${rand(2, 8)}`
  },
  build: (key) => {
    const [L = 0, x = 0, y = 0] = nums(key)
    if (L === 1) {
      const s = x
      const w = y
      const ans = s * s - s * w
      const text = `A square has sides of ${s} units. A rectangle is ${s} units long and ${w} wide. How much more area does the square have?`
      return numeric(key, { text, say: `A square has sides of ${s} units. A rectangle is ${s} units long and ${w} wide. How much more area does the square have?` }, ans, [s * s, s * w, ans - 1, ans + 1])
    }
    if (L === 2) {
      const l = x
      const w = y
      const per = 2 * (l + w)
      const text = `A rectangle has a perimeter of ${per} units and a length of ${l} units. What is its width?`
      return numeric(key, { text, say: `A rectangle has a perimeter of ${per} units and a length of ${l} units. What is its width?` }, w, [w + 1, w - 1, l, per - l])
    }
    if (L === 3) {
      const ans = 4 * x * y
      const text = `Each side of a ${x} by ${y} rectangle is doubled. What is the new area?`
      return numeric(key, { text, say: `Each side of a ${x} by ${y} rectangle is doubled. What is the new area?` }, ans, [2 * x * y, x * y, ans + x, ans - y])
    }
    const area = x * y
    const text = `Leo wants to cover the floor of a room that is ${x} feet by ${y} feet with square tiles, one square foot each. How many tiles does he need?`
    return numeric(key, { text, say: `Leo wants to cover the floor of a room that is ${x} feet by ${y} feet with square tiles, one square foot each. How many tiles does he need?` }, area, [2 * (x + y), area + 1, area - 1, x + y])
  },
})

/** Fractions with a shared shape: value of a fraction as a plain number, for checking that wrong options differ. */
const fracValue = (f: string) => {
  const [n = 0, d = 1] = f.split('/').map(Number)
  return n / d
}

/**
 * IXL: "Equivalent fractions" (grade 4): find equivalent fractions with area models, and identify them on
 * number lines. Keys: "L:n:k:m": the fraction k/n is shown, and k*m/(n*m) is the right answer.
 */
const equivFractions4 = keyedSkill({
  id: 'equivFractions4',
  labels: ['Find equivalent fractions using area models', 'Identify equivalent fractions using number lines'],
  formats: CHOICE,
  key: (L) => {
    const n = rand(2, 6)
    return `${L}:${n}:${rand(1, n - 1)}:${rand(2, 3)}`
  },
  build: (key) => {
    const [L = 0, n = 0, k = 0, m = 0] = nums(key)
    const answer = `${k * m}/${n * m}`
    const target = k / n
    const cands = [`${k * m + 1}/${n * m}`, `${k * m}/${n * m + 1}`, `${k}/${n * m}`, `${k * m - 1}/${n * m}`].filter((f) => fracValue(f) !== target)
    if (L === 1) {
      return choice(key, { text: 'The shaded part of this bar is a fraction. Which fraction is the same amount?', say: 'Which fraction is the same amount as the shaded part?', svg: fractionBarSVG(k, n, `A bar cut into ${n} parts with ${k} shaded`) }, answer, cands)
    }
    return choice(key, { text: `The green dot is at ${k}/${n}. Which fraction is at the same spot?`, say: `The green dot is at ${k} over ${n}. Which fraction is at the same spot?`, svg: fractionLineSVG(k, n, `Number line from 0 to 1 cut into ${n} parts`) }, answer, cands)
  },
})

/**
 * IXL: "Equivalent fractions" (grade 4), "Fractions of a group: word problems" and "Fractions of a whole: word
 * problems". The answer is a whole number. Keys: "L:d:q:k": the group is d*q and the fraction is k/d.
 */
const fracOfGroup4 = keyedSkill({
  id: 'fracOfGroup4',
  labels: ['Fractions of a group: word problems', 'Fractions of a whole: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    const d = rand(2, 6)
    return `${L}:${d}:${rand(2, 8)}:${rand(1, d - 1)}`
  },
  build: (key) => {
    const [L = 0, d = 0, q = 0, k = 0] = nums(key)
    const group = d * q
    const ans = k * q
    if (L === 1) {
      const text = `Ravi has ${group} stickers. ${k}/${d} of them are stars. How many stars does he have?`
      return numeric(key, { text, say: `Ravi has ${group} stickers. ${k} out of ${d} of them are stars. How many stars does he have?` }, ans, [ans + 1, ans - 1, group - ans, q])
    }
    const text = `A ribbon is ${group} inches long. Lily uses ${k}/${d} of it. How many inches did she use?`
    return numeric(key, { text, say: `A ribbon is ${group} inches long. Lily uses ${k} out of ${d} parts of it. How many inches did she use?` }, ans, [ans + 1, ans - 1, group - ans, q])
  },
})

/**
 * IXL: "Understand fraction addition and subtraction" (grade 4): decompose fractions into unit fractions with
 * a model, then into unit fractions, then into two or three fractions, and in reverse.
 * Keys: "1:n:k", "2:n:k:a" (two parts), "3:n:k:a:b" (three parts), "4:n:k".
 */
const decompFractions4 = keyedSkill({
  id: 'decompFractions4',
  labels: ['Decompose fractions into unit fractions using models', 'Decompose fractions into unit fractions', 'Decompose fractions into two parts', 'Decompose fractions multiple ways'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1 || L === 2) {
      const n = rand(3, 8)
      return `${L}:${n}:${rand(2, n - 1)}`
    }
    if (L === 3) {
      const n = rand(4, 10)
      const k = rand(3, 7)
      const a = rand(1, k - 2)
      return `3:${n}:${k}:${a}:${rand(1, k - a - 1)}`
    }
    const n = rand(3, 8)
    return `4:${n}:${rand(2, n - 1)}`
  },
  build: (key) => {
    const [L = 0, n = 0, k = 0, a = 0, b = 0] = nums(key)
    const units = (count: number, den: number) => Array(count).fill(`1/${den}`).join(' + ')
    if (L === 1 || L === 2) {
      const answer = units(k, n)
      const pool = [units(k - 1, n), units(k + 1, n), units(k, n + 1)]
      if (L === 1) return choice(key, { text: `The shaded part is ${k}/${n}. Which sum of unit fractions matches it?`, say: `The shaded part is ${k} out of ${n}. Which sum of unit fractions matches it?`, svg: fractionBarSVG(k, n, `A bar cut into ${n} parts with ${k} shaded`) }, answer, pool)
      return choice(key, plain(`Which sum of unit fractions equals ${k}/${n}?`), answer, pool)
    }
    if (L === 3) {
      const c = k - a - b
      const answer = `${a}/${n} + ${b}/${n} + ${c}/${n}`
      const pool = [`${a}/${n} + ${b}/${n}`, `${a + 1}/${n} + ${b}/${n} + ${c}/${n}`, `${a}/${n} + ${b}/${n} + ${c}/${n + 1}`, `${a}/${n} + ${b}/${n + 1} + ${c}/${n}`]
      return choice(key, plain(`Which sum of fractions equals ${k}/${n}?`), answer, pool)
    }
    return choice(key, plain(`Which fraction equals 1/${n} + ${k - 1}/${n}?`), `${k}/${n}`, [`${k + 1}/${n}`, `${k - 1}/${n}`, `${k}/${n + 1}`, `${k - 2}/${n}`])
  },
})

/** Four-sided and three-sided drawings for the shape questions. Letters A to D are the choices. */
const SHAPE_POINTS: Record<string, [number, number][]> = {
  rectangle: [[20, 40], [100, 40], [100, 90], [20, 90]],
  parallelogram: [[30, 35], [100, 35], [80, 90], [10, 90]],
  trapezoid: [[20, 40], [100, 40], [85, 90], [35, 90]],
  irregular: [[60, 15], [95, 45], [60, 95], [30, 60]],
  triangle: [[60, 20], [100, 90], [20, 90]],
}

/** Shapes side by side, each with its letter below. Keys: "L:r" where r is the position of the right shape. */
function shapesSVG(shapes: string[], label: string) {
  let body = ''
  shapes.forEach((name, i) => {
    const x0 = i * 150
    const pts = SHAPE_POINTS[name]!.map(([x, y]) => `${x + x0},${y}`).join(' ')
    body += `<polygon points="${pts}" fill="#c4b5fd" stroke="#4c1d95" stroke-width="3"/>`
    body += `<text x="${x0 + 60}" y="130" font-size="26">${'ABCD'[i]}</text>`
  })
  return svgWrap(shapes.length * 150, 140, body, label)
}

/**
 * IXL: "Quadrilaterals" (grade 4): parallel sides, sides and angles, parallelograms, and trapezoids.
 * Each level shows four labeled shapes and asks for the letter of the right one. Keys: "L:r".
 */
const QUAD_LEVELS: { ask: string; right: string; others: string[] }[] = [
  { ask: 'Which shape has exactly one pair of parallel sides?', right: 'trapezoid', others: ['rectangle', 'parallelogram', 'irregular'] },
  { ask: 'Which shape has four right angles?', right: 'rectangle', others: ['trapezoid', 'parallelogram', 'irregular'] },
  { ask: 'Which shape is a parallelogram?', right: 'parallelogram', others: ['trapezoid', 'irregular', 'triangle'] },
  { ask: 'Which shape is a trapezoid?', right: 'trapezoid', others: ['parallelogram', 'rectangle', 'irregular'] },
]

const quads4 = keyedSkill({
  id: 'quads4',
  labels: ['Parallel sides in quadrilaterals', 'Sides and angles of quadrilaterals', 'Identify parallelograms', 'Identify trapezoids'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, 3)}`,
  build: (key) => {
    const [L = 1, r = 0] = nums(key)
    const level = QUAD_LEVELS[L - 1]
    if (!level || r < 0 || r > 3) return null
    const shapes = [...level.others]
    shapes.splice(r, 0, level.right)
    const answer = 'ABCD'[r]!
    const pool = 'ABCD'.split('').filter((c) => c !== answer)
    return choice(key, { text: level.ask, say: level.ask, svg: shapesSVG(shapes, level.ask) }, answer, pool)
  },
})

/**
 * IXL: "Financial literacy" (grade 4): fixed and variable expenses, profit, comparing savings options,
 * and a weekly allowance budget. Keys: "1:f1:f2", "2:n:p:c", "3:a:b:w", "4:A:s1:s2".
 */
const financeG4 = keyedSkill({
  id: 'financeG4',
  labels: ['Identify fixed and variable expenses', 'Calculate profit: word problems', 'Compare savings options', 'Budget a weekly allowance: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const f1 = rand(40, 90)
      return `1:${f1}:${rand(f1 + 1, f1 + 30)}`
    }
    if (L === 2) {
      const n = rand(6, 12)
      const p = rand(1, 5)
      return `2:${n}:${p}:${rand(1, n * p - 1)}`
    }
    if (L === 3) {
      const b = rand(1, 5)
      return `3:${b + rand(1, 4)}:${b}:${rand(4, 12)}`
    }
    // The allowance is always more than the two spending amounts together (at most 16), so the answer stays positive.
    const A = rand(20, 30)
    return `4:${A}:${rand(2, 8)}:${rand(2, 8)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0] = nums(key)
    if (L === 1) {
      const ans = b - a
      const text = `Rent is $500 every month, and it never changes. Food cost $${a} in one month and $${b} in the next. How many more dollars did food cost in the second month?`
      return numeric(key, { text, say: `Rent is 500 dollars every month and never changes. Food cost ${a} dollars in one month and ${b} dollars in the next. How many more dollars did food cost in the second month?` }, ans, [ans + 1, ans - 1, b, a])
    }
    if (L === 2) {
      const ans = a * b - c
      const text = `Lily sells ${a} cookie bags for $${b} each. The cookies cost $${c} to make. What is her profit, in dollars?`
      return numeric(key, { text, say: `Lily sells ${a} cookie bags for ${b} dollars each. The cookies cost ${c} dollars to make. What is her profit, in dollars?` }, ans, [a * b, ans + 1, ans - 1, c])
    }
    if (L === 3) {
      const ans = (a - b) * c
      const text = `Option A saves $${a} a week. Option B saves $${b} a week. How many more dollars does Option A save after ${c} weeks?`
      return numeric(key, { text, say: `Option A saves ${a} dollars a week. Option B saves ${b} dollars a week. How many more dollars does Option A save after ${c} weeks?` }, ans, [a * c, b * c, ans + a, ans - 1])
    }
    if (L === 4) {
      const ans = a - b - c
      const text = `Noah gets $${a} allowance each week. He spends $${b} on a snack and $${c} on a comic. How many dollars are left?`
      return numeric(key, { text, say: `Noah gets ${a} dollars allowance each week. He spends ${b} dollars on a snack and ${c} dollars on a comic. How many dollars are left?` }, ans, [ans + 1, ans - 1, a - b, a])
    }
    return null
  },
})

// --- Grade 5: Fractions and mixed numbers -------------------------------------------------------

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const reduceFrac = (n: number, d: number): [number, number] => {
  const g = gcd(n, d)
  return [n / g, d / g]
}
/** The number a mixed string ("2 1/3", "5/4", "3") stands for, so wrong options can be checked by value. */
const valueOf = (s: string) => {
  const parts = s.split(' ')
  if (parts.length === 2) {
    const [n = 0, d = 1] = (parts[1] ?? '1/1').split('/').map(Number)
    return Number(parts[0]) + n / d
  }
  if (s.includes('/')) {
    const [n = 0, d = 1] = s.split('/').map(Number)
    return n / d
  }
  return Number(s)
}

/** Several bars, one per row, each cut into `n` parts with the first part shaded. */
function eachBarSVG(rows: number, n: number, label: string) {
  const cell = 300 / n
  let body = ''
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n; i++) {
      body += `<rect x="${10 + i * cell}" y="${10 + r * 45}" width="${cell}" height="32" fill="${i === 0 ? '#f59e0b' : '#ffffff'}" stroke="#92400e" stroke-width="2"/>`
    }
  }
  return svgWrap(320, 30 + rows * 45, body, label)
}

/** Rows of mixed numbers: each row has `whole` full bars and one bar with p/q shaded. */
function mixedRowsSVG(rows: number, whole: number, p: number, q: number, label: string) {
  let body = ''
  for (let r = 0; r < rows; r++) {
    const y = 10 + r * 45
    let x = 10
    for (let w = 0; w < whole; w++) {
      body += `<rect x="${x}" y="${y}" width="90" height="32" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>`
      x += 98
    }
    for (let i = 0; i < q; i++) {
      body += `<rect x="${x + i * (90 / q)}" y="${y}" width="${90 / q}" height="32" fill="${i < p ? '#f59e0b' : '#ffffff'}" stroke="#92400e" stroke-width="2"/>`
    }
  }
  return svgWrap(Math.max(120 * (whole + 1), 200), 30 + rows * 45, body, label)
}

/** A number line from 0 to 2 cut into fifths-style parts of 1/n, with the first jump drawn and a dot where the last jump lands. */
function fractionJumpSVG(n: number, k: number, landing: number, label: string) {
  const W = 620
  const X = (t: number) => 30 + (t / (2 * n)) * (W - 60)
  let body = `<line x1="${X(0)}" y1="90" x2="${X(2 * n)}" y2="90" stroke="#334155" stroke-width="3"/>`
  for (let t = 0; t <= 2 * n; t++) body += `<line x1="${X(t)}" y1="82" x2="${X(t)}" y2="98" stroke="#334155" stroke-width="2"/>`
  for (const w of [0, 1, 2]) body += `<text x="${X(w * n)}" y="124" font-size="18">${w}</text>`
  body += `<path d="M ${X(0)} 84 Q ${X(k / 2)} 16 ${X(k)} 84" fill="none" stroke="#ef4444" stroke-width="3"/>`
  body += `<circle cx="${X(landing)}" cy="90" r="7" fill="#22c55e"/>`
  return svgWrap(W, 135, body, label)
}

/**
 * IXL: "Fractions and mixed numbers" (grade 5): fraction review, equivalent fractions, lowest terms, and
 * converting improper fractions and mixed numbers. Answers are fractions, so these are choice only.
 * Keys: "1:n:k", "2:a:b:m", "3:i:m" (a coprime pair from COPRIMES, times m), "4:w:p:q".
 */
const COPRIMES: [number, number][] = [[3, 4], [2, 5], [3, 8], [5, 6], [3, 10], [4, 9], [5, 8], [2, 7], [7, 9], [5, 12]]
const fracMixed5 = keyedSkill({
  id: 'fracMixed5',
  labels: ['Fractions review', 'Equivalent fractions', 'Write fractions in lowest terms', 'Convert between improper fractions and mixed numbers'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) {
      const n = rand(3, 10)
      return `1:${n}:${rand(2, n - 1)}`
    }
    if (L === 2) {
      const b = rand(3, 8)
      return `2:${rand(1, b - 1)}:${b}:${rand(2, 3)}`
    }
    if (L === 3) return `3:${rand(0, COPRIMES.length - 1)}:${rand(2, 3)}`
    const q = rand(2, 6)
    return `4:${rand(1, 4)}:${rand(1, q - 1)}:${q}`
  },
  build: (key) => {
    const [L = 0, x = 0, y = 0, z = 0] = nums(key)
    if (L === 1) {
      const n = x
      const k = y
      const pool = [`${k + 1}/${n}`, `${k}/${n + 1}`, `${n}/${k}`, `${k - 1}/${n}`]
      return choice(key, { text: 'Which fraction is shaded?', say: 'Which fraction is shaded?', svg: fractionBarSVG(k, n, `A bar cut into ${n} parts with ${k} shaded`) }, `${k}/${n}`, pool)
    }
    if (L === 2) {
      const [a, b, m] = [x, y, z]
      const pool = [`${a * m + 1}/${b * m}`, `${a * m}/${b * m + 1}`, `${a * m - 1}/${b * m}`, `${a}/${b * m + 1}`]
      return choice(key, plain(`Which fraction is equal to ${a}/${b}?`), `${a * m}/${b * m}`, pool)
    }
    if (L === 3) {
      const [a, b] = COPRIMES[x]!
      const m = y
      const pool = [`${a}/${b * m}`, `${a * m}/${b}`, `${a + 1}/${b}`, `${b}/${a}`]
      return choice(key, plain(`Write ${a * m}/${b * m} in lowest terms.`), `${a}/${b}`, pool)
    }
    const [w, p, q] = [x, y, z]
    const ans = `${w * q + p}/${q}`
    const pool = [`${w * q + p + 1}/${q}`, `${w * q + p - 1}/${q}`, `${w * q}/${q}`, `${w}/${q + p}`]
    return choice(key, plain(`Write ${w} ${p}/${q} as an improper fraction.`), ans, pool)
  },
})

/**
 * IXL: "Understand fraction multiplication" (grade 5): multiply fractions by whole numbers with a model, with
 * the equation, on a number line, and find the missing multiples. Answers are fractions, so these are choice only.
 * Keys: "1:w:n", "2:w:n:k", "3:n:k:j", "4:n:k:b".
 */
const fracMultiply5 = keyedSkill({
  id: 'fracMultiply5',
  labels: ['Multiply fractions by whole numbers: choose the model', 'Multiply fractions by whole numbers using models', 'Multiply fractions by whole numbers using number lines', 'Multiples of fractions: find the missing numbers'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 4)}:${rand(3, 6)}`
    if (L === 2) {
      const n = rand(3, 6)
      return `2:${rand(2, 4)}:${n}:${rand(2, n - 1)}`
    }
    if (L === 3) {
      const n = rand(3, 5)
      const k = rand(1, n - 1)
      return `3:${n}:${k}:${rand(2, Math.floor((2 * n) / k))}`
    }
    return `4:${rand(3, 8)}:${rand(1, 4)}:${rand(2, 4)}`
  },
  build: (key) => {
    const [L = 0, x = 0, y = 0, z = 0] = nums(key)
    if (L === 1) {
      const [w, n] = [x, y]
      const pool = [`${w + 1}/${n}`, `${w}/${n + 1}`, `${w * n}/${n}`, `1/${w * n}`]
      return choice(key, { text: `There are ${w} bars. Each bar has 1/${n} shaded. What is ${w} × 1/${n}?`, say: `There are ${w} bars. Each bar has 1 part of ${n} shaded. What is ${w} times 1 over ${n}?`, svg: eachBarSVG(w, n, `${w} bars with 1/${n} shaded in each`) }, `${w}/${n}`, pool)
    }
    if (L === 2) {
      const [w, n, k] = [x, y, z]
      const pool = [`${w * k + 1}/${n}`, `${w * k}/${n + 1}`, `${w * k - 1}/${n}`, `${w}/${n * k}`]
      return choice(key, plain(`${w} × ${k}/${n} = ?`), `${w * k}/${n}`, pool)
    }
    if (L === 3) {
      const [n, k, j] = [x, y, z]
      const ans = `${j * k}/${n}`
      const target = (j * k) / n
      const cands = [`${j * k + 1}/${n}`, `${j * k}/${n + 1}`, `${j * k - 1}/${n}`, `${j + k}/${n}`].filter((f) => Math.abs(valueOf(f) - target) > 1e-9)
      const text = `Start at 0. Each jump is ${k}/${n}. Make ${j} jumps. Where do you land?`
      return choice(key, { text, say: `Start at 0. Each jump is ${k} over ${n}. Make ${j} jumps. Where do you land?`, svg: fractionJumpSVG(n, k, j * k, `Number line in ${n}ths from 0 to 2`) }, ans, cands)
    }
    const [n, k, b] = [x, y, z]
    const shown = [1, 2, 3, 4].map((i) => (i === b ? '___' : `${i * k}/${n}`))
    const ans = `${b * k}/${n}`
    const cands = [`${b * k + 1}/${n}`, `${b * k}/${n + 1}`, `${b * k - 1}/${n}`, `${(b + 1) * k}/${n}`].filter((f) => Math.abs(valueOf(f) - (b * k) / n) > 1e-9)
    return choice(key, { text: `Count by ${k}/${n}: ${shown.join(', ')}. What goes in the blank?`, say: `Count by ${k} over ${n}. What goes in the blank?` }, ans, cands)
  },
})

/**
 * IXL: "Understand multiplication with mixed numbers" (grade 5): multiply a mixed number by a whole number with
 * a model, by breaking the number apart, and with an area model. Answers are mixed numbers, so these are choice only.
 * Keys: "L:whole:fractionIndex:groups". The product always has a fraction part left over.
 */
const MIXED_FRACS: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]
/** An area model for rows × (whole + p/q): one column of wholes, and a narrower column for the fraction. */
function areaModelSVG(rows: number, whole: number, p: number, q: number, label: string) {
  const cw = 80
  const rh = 36
  const x0 = 40
  const y0 = 40
  const fw = cw * (p / q)
  let body = `<text x="${x0 + (cw * whole) / 2}" y="26" font-size="18">${whole}</text>`
  body += `<text x="${x0 + cw * whole + fw / 2}" y="26" font-size="18">${p}/${q}</text>`
  body += `<text x="20" y="${y0 + (rows * rh) / 2 + 6}" font-size="18">${rows}</text>`
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * rh
    body += `<rect x="${x0}" y="${y}" width="${cw * whole}" height="${rh}" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>`
    body += `<rect x="${x0 + cw * whole}" y="${y}" width="${fw}" height="${rh}" fill="#fcd34d" stroke="#92400e" stroke-width="2"/>`
  }
  return svgWrap(x0 + cw * whole + fw + 30, y0 + rows * rh + 20, body, label)
}

const mixedMultiply5 = keyedSkill({
  id: 'mixedMultiply5',
  labels: ['Multiply a mixed number by a whole number using a model I', 'Multiply a mixed number by a whole number using a model II', 'Multiply with mixed numbers using area models'],
  formats: CHOICE,
  key: (L) => {
    let fi = 0
    let g = 2
    do {
      fi = rand(0, MIXED_FRACS.length - 1)
      g = rand(2, 4)
    } while ((g * MIXED_FRACS[fi]![0]) % MIXED_FRACS[fi]![1] === 0)
    return `${L}:${rand(1, 3)}:${fi}:${g}`
  },
  build: (key) => {
    const [L = 1, wh = 0, fi = 0, g = 0] = nums(key)
    const [p, q] = MIXED_FRACS[fi]!
    // The leftover part is never zero (the key rules that out), and it is always written in lowest terms.
    const [rn, rd] = reduceFrac((g * p) % q, q)
    const total = g * wh + Math.floor((g * p) / q)
    const ans = `${total} ${rn}/${rd}`
    const cands = [`${total + 1} ${rn}/${rd}`, `${total - 1} ${rn}/${rd}`, `${g * wh} ${rn}/${rd}`, `${total + 2} ${rn}/${rd}`, `${total} ${rd - rn}/${rd}`].filter((c) => Math.abs(valueOf(c) - valueOf(ans)) > 1e-9)
    const mixed = `${wh} ${p}/${q}`
    if (L === 1) {
      return choice(key, { text: `Ava made ${g} rows. Each row has ${mixed} shaded. What is ${g} × ${mixed}?`, say: `Ava made ${g} rows. Each row has ${mixed} shaded. What is ${g} times ${mixed}?`, svg: mixedRowsSVG(g, wh, p, q, `${g} rows of ${mixed}`) }, ans, cands)
    }
    if (L === 2) {
      return choice(key, plain(`Break ${mixed} into ${wh} and ${p}/${q}. Multiply each part by ${g}. What is the total? ${g} × ${mixed} = ?`), ans, cands)
    }
    return choice(key, { text: `Use the area model to find ${g} × ${mixed}. What is the product?`, say: `Use the area model to find ${g} times ${mixed}. What is the product?`, svg: areaModelSVG(g, wh, p, q, `Area model with ${g} rows`) }, ans, cands)
  },
})

/**
 * IXL: "Mixed operations: fractions" (grade 5): add, subtract, multiply, and divide fractions, in word problems,
 * and in multi-step problems. Every answer is a fraction that is not a whole number, so these are choice only.
 * Keys: "L:op:a:b:c:d" with op 0 +, 1 -, 2 x, 3 divided by, 4 (multi-step: half of a sum).
 */
const fracOpCalc = (op: number, a: number, b: number, c: number, d: number): [number, number] | null => {
  let n = 0
  let den = 1
  if (op === 0) [n, den] = [a * d + c * b, b * d]
  if (op === 1) [n, den] = [a * d - c * b, b * d]
  if (op === 2) [n, den] = [a * c, b * d]
  if (op === 3) {
    if (c === 0) return null
    ;[n, den] = [a * d, b * c]
  }
  if (op === 4) [n, den] = [a * d + c * b, b * d * 2]
  if (n <= 0) return null
  const [rn, rd] = reduceFrac(n, den)
  return rd === 1 ? null : [rn, rd]
}
const fracOpKey = (L: number) => {
  const ops = L === 1 ? [0, 1, 2, 3] : L === 2 ? [0, 1] : [4]
  for (;;) {
    const op = pick(ops)
    const b = rand(2, 6)
    const d = rand(2, 6)
    const a = rand(1, b - 1)
    const c = rand(1, d - 1)
    if (fracOpCalc(op, a, b, c, d)) return `${L}:${op}:${a}:${b}:${c}:${d}`
  }
}
const mixedOpsFrac5 = keyedSkill({
  id: 'mixedOpsFrac5',
  labels: ['Add, subtract, multiply, and divide fractions', 'Fraction word problems with add and subtract', 'Multi-step word problems with fractions'],
  formats: CHOICE,
  key: (L) => fracOpKey(L),
  build: (key) => {
    const [L = 1, op = 0, a = 0, b = 0, c = 0, d = 0] = nums(key)
    const res = fracOpCalc(op, a, b, c, d)
    if (!res) return null
    const [p, q] = res
    const ans = `${p}/${q}`
    const cands = [`${p + 1}/${q}`, `${p}/${q + 1}`, `${p + 2}/${q}`, `${p}/${q + 2}`, `${p - 1}/${q}`, `${q}/${p}`].filter((f) => Math.abs(valueOf(f) - p / q) > 1e-9 && f !== ans)
    if (L === 1) {
      const sym = ['+', '−', '×', '÷'][op]!
      return choice(key, plain(`${a}/${b} ${sym} ${c}/${d} = ?`), ans, cands)
    }
    if (L === 2) {
      const text = op === 0
        ? `Max has ${a}/${b} of a pizza. He gets ${c}/${d} more. How much pizza does he have in all?`
        : `Max has ${a}/${b} of a pizza and eats ${c}/${d} of a pizza. How much is left?`
      return choice(key, plain(text), ans, cands)
    }
    return choice(key, plain(`Ava has ${a}/${b} cup of milk and pours in ${c}/${d} cup more. Then she uses half of all the milk. How much milk is left?`), ans, cands)
  },
})

// --- Grade 5: Decimals, money, data, shapes, perimeter, and taxes ------------------------------

/** Decimals written with one digit (tenths, stored as whole tenths) and two digits (hundredths). */
const fmt1 = (t: number) => (t / 10).toFixed(1)
const fmt2 = (c: number) => (c / 100).toFixed(2)
const fmtM = (c: number) => `$${(c / 100).toFixed(2)}`

/** Decimal blocks: a whole is a 60 by 60 square, and each tenth is a 60 by 6 strip under it. Values are in tenths. */
function decimalBlocksSVG(values: number[], label: string) {
  let x = 10
  let body = ''
  for (const t of values) {
    const whole = Math.floor(t / 10)
    const tenths = t % 10
    for (let i = 0; i < whole; i++) {
      body += `<rect x="${x}" y="10" width="60" height="60" fill="#60a5fa" stroke="#1e3a8a"/>`
      x += 66
    }
    for (let i = 0; i < tenths; i++) body += `<rect x="${x - 66 * whole}" y="${80 + i * 8}" width="60" height="6" fill="#34d399" stroke="#065f46"/>`
    x += 40
  }
  return svgWrap(Math.max(x, 140), 170, body, label)
}

/** A line plot: one X per count above each value on a number line. */
function linePlotSVG(labels: string[], counts: number[], label: string) {
  const xs = (i: number) => 60 + i * 90
  const axisY = 200
  let body = `<line x1="${xs(0) - 30}" y1="${axisY}" x2="${xs(labels.length - 1) + 30}" y2="${axisY}" stroke="#334155" stroke-width="3"/>`
  labels.forEach((text, i) => {
    body += `<line x1="${xs(i)}" y1="${axisY - 4}" x2="${xs(i)}" y2="${axisY + 8}" stroke="#334155" stroke-width="2"/>`
    body += `<text x="${xs(i)}" y="${axisY + 32}" font-size="18">${text}</text>`
    for (let k = 0; k < counts[i]!; k++) body += `<text x="${xs(i)}" y="${axisY - 14 - k * 26}" font-size="24">X</text>`
  })
  return svgWrap(xs(labels.length - 1) + 90, 250, body, label)
}

/** Several shapes side by side, each with its letter below. */
function figuresSVG(elems: string[], label: string) {
  const body = elems.map((e, i) => `<g transform="translate(${i * 150} 0)">${e}<text x="60" y="132" font-size="26">${'ABCD'[i]}</text></g>`).join('')
  return svgWrap(elems.length * 150, 140, body, label)
}

const polyEl = (pts: [number, number][]) =>
  `<polygon points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="#c4b5fd" stroke="#4c1d95" stroke-width="3"/>`

/** Corners of a regular polygon with n sides, centered at (60, 60). */
const regularPts = (n: number, r = 45): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [Math.round((60 + r * Math.cos(a)) * 10) / 10, Math.round((60 + r * Math.sin(a)) * 10) / 10]
  })

/** Corners of a polygon with n sides and unequal sides: the corners sit at different distances from the center. */
const IRREGULAR_RADII: Record<number, number[]> = { 3: [45, 30, 38], 4: [45, 28, 40, 22], 6: [45, 30, 40, 25, 45, 35] }
const irregularPts = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const r = IRREGULAR_RADII[n]![i]!
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [Math.round((60 + r * Math.cos(a)) * 10) / 10, Math.round((60 + r * Math.sin(a)) * 10) / 10]
  })

const TRI: Record<string, [number, number][]> = {
  right: [[20, 90], [20, 20], [90, 90]],
  acute: [[60, 15], [20, 95], [100, 95]],
  obtuse: [[10, 90], [50, 50], [110, 90]],
  scalene: [[20, 90], [100, 90], [50, 30]],
  equilateral: [[20, 90], [100, 90], [60, 21]],
}

/**
 * IXL: "Data and graphs" (grade 5): read a line plot with whole numbers, decimals, fractions, and fractions with
 * mixed numbers. Keys: "L:type:i:counts" (type 0 asks about one value i, type 1 asks for the total).
 */
const DATA_LABELS: string[][] = [
  ['0', '1', '2', '3', '4', '5'],
  ['0.1', '0.2', '0.3', '0.4', '0.5'],
  ['0', '1/4', '1/2', '3/4', '1'],
  ['1/2', '1', '1 1/2', '2', '2 1/2'],
]
const dataPlots5 = keyedSkill({
  id: 'dataPlots5',
  labels: ['Interpret line plots with whole numbers', 'Interpret line plots with decimals', 'Interpret line plots with fractions', 'Create and interpret line plots with fractions'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    const n = DATA_LABELS[L - 1]!.length
    let counts: number[]
    do {
      counts = Array.from({ length: n }, () => rand(0, 4))
    } while (counts.reduce((s, c) => s + c, 0) === 0)
    return `${L}:${rand(0, 1)}:${rand(0, n - 1)}:${counts.join('-')}`
  },
  build: (key) => {
    const parts = key.split(':')
    const L = Number(parts[0])
    const labels = DATA_LABELS[L - 1]
    const type = Number(parts[1])
    const i = Number(parts[2])
    const counts = (parts[3] ?? '').split('-').map(Number)
    if (!labels || counts.length !== labels.length || i < 0 || i >= labels.length) return null
    const total = counts.reduce((s, c) => s + c, 0)
    const svg = linePlotSVG(labels, counts, `Line plot with ${total} X marks`)
    if (type === 0) {
      const ans = counts[i]!
      return numeric(key, { text: `How many X's are at ${labels[i]}?`, say: `How many X's are at ${labels[i]}?`, svg }, ans, [ans - 1, ans + 1, ans + 2])
    }
    return numeric(key, { text: "How many X's are on the line plot in all?", say: "How many X's are on the line plot in all?", svg }, total, [total - 1, total + 1, total + 2])
  },
})

/**
 * IXL: "Add and subtract decimals" (grade 5): add with blocks, add decimals, use properties to add three
 * decimals, and subtract with blocks. Answers are decimals, so these are choice only.
 * Keys: "1:a:b" (tenths), "2:a:b" (hundredths), "3:a:b:c" (tenths), "4:a:b" (tenths, a bigger than b).
 */
const decimalsAddSub5 = keyedSkill({
  id: 'decimalsAddSub5',
  labels: ['Add decimal numbers using blocks', 'Add decimal numbers', 'Use properties to add three decimals', 'Subtract decimal numbers using blocks'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(11, 29)}:${rand(1, 9)}`
    if (L === 2) return `2:${rand(150, 899)}:${rand(15, 399)}`
    if (L === 3) return `3:${rand(11, 49)}:${rand(11, 49)}:${rand(11, 49)}`
    const a = rand(12, 29)
    return `4:${a}:${rand(1, a - 1)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0] = nums(key)
    if (L === 1) {
      const s = a + b
      const pool = [s + 1, s - 1, s + 10, s - 10, s + 2, s - 2].filter((v) => v >= 0).map(fmt1)
      return choice(key, { text: `${fmt1(a)} + ${fmt1(b)} = ?`, say: `${fmt1(a)} plus ${fmt1(b)}`, svg: decimalBlocksSVG([a, b], `${fmt1(a)} and ${fmt1(b)} in blocks`) }, fmt1(s), pool)
    }
    if (L === 2) {
      const s = a + b
      const pool = [s + 1, s - 1, s + 10, s - 10, s + 100, s - 100].filter((v) => v >= 0).map(fmt2)
      return choice(key, plain(`${fmt2(a)} + ${fmt2(b)} = ?`), fmt2(s), pool)
    }
    if (L === 3) {
      const s = a + b + c
      const pool = [s + 1, s - 1, s + 10, s - 10, s + 2].filter((v) => v >= 0).map(fmt1)
      return choice(key, plain(`${fmt1(a)} + ${fmt1(b)} + ${fmt1(c)} = ?  Try adding two easy numbers first.`), fmt1(s), pool)
    }
    const d = a - b
    const pool = [d + 1, d - 1, d + 10, d - 10, d + 2, d - 2].filter((v) => v >= 0).map(fmt1)
    return choice(key, { text: `${fmt1(a)} − ${fmt1(b)} = ?`, say: `${fmt1(a)} minus ${fmt1(b)}`, svg: decimalBlocksSVG([a, b], `${fmt1(a)} and ${fmt1(b)} in blocks`) }, fmt1(d), pool)
  },
})

/**
 * IXL: "Mixed operations: decimals" (grade 5): add, subtract, multiply, and divide decimals; word problems;
 * a multi-step money problem; and picking the true equation. Keys: "1:op:x:y" and "2:op:x:y" (tenths),
 * "3:x:z" (price in tenths, count), "4:x:y" (tenths).
 */
const decimalOpKey = (L: number) => {
  for (;;) {
    const op = rand(0, 3)
    if (op === 0) {
      const x = rand(11, 39)
      const y = rand(1, 39)
      if ((x + y) % 10 !== 0) return `${L}:${op}:${x}:${y}`
    } else if (op === 1) {
      const x = rand(12, 39)
      const y = rand(1, x - 1)
      if ((x - y) % 10 !== 0) return `${L}:${op}:${x}:${y}`
    } else if (op === 2) {
      const x = rand(11, 39)
      const y = rand(2, 9)
      if ((x * y) % 10 !== 0) return `${L}:${op}:${x}:${y}`
    } else {
      const y = rand(2, 5)
      const q = rand(11, 39)
      if (q % 10 !== 0) return `${L}:${op}:${y * q}:${y}`
    }
  }
}
const mixedOpsDec5 = keyedSkill({
  id: 'mixedOpsDec5',
  labels: ['Add, subtract, multiply, and divide decimals', 'Decimal word problems', 'Multi-step money word problems with decimals', 'Find the true equation'],
  formats: CHOICE,
  key: (L) => {
    if (L === 3) {
      let z = rand(2, 4)
      let x = rand(15, 45)
      while ((z * x) % 10 === 0) {
        z = rand(2, 4)
        x = rand(15, 45)
      }
      return `3:${x}:${z}`
    }
    if (L === 4) return `4:${rand(11, 39)}:${rand(1, 9)}`
    return decimalOpKey(L)
  },
  build: (key) => {
    const [L = 0, op = 0, x = 0, y = 0] = nums(key)
    if (L === 1 || L === 2) {
      const ansT = op === 0 ? x + y : op === 1 ? x - y : op === 2 ? x * y : x / y
      const ans = fmt1(ansT)
      const pool = [ansT + 1, ansT - 1, ansT + 10, ansT - 10, ansT + 2].filter((v) => v >= 0).map(fmt1)
      if (L === 1) {
        const sym = ['+', '−', '×', '÷'][op]!
        const left = op >= 2 ? `${fmt1(x)} ${sym} ${y}` : `${fmt1(x)} ${sym} ${fmt1(y)}`
        return choice(key, plain(`${left} = ?`), ans, pool)
      }
      const texts = [
        `Zoe walks ${fmt1(x)} km on Monday and ${fmt1(y)} km on Tuesday. How many kilometers does she walk in all?`,
        `Max has ${fmt1(x)} liters of juice and pours out ${fmt1(y)} liters. How many liters are left?`,
        `Lily runs ${fmt1(x)} km each day for ${y} days. How many kilometers does she run in all?`,
        `${y} friends share ${fmt1(x)} liters of juice equally. How many liters does each friend get?`,
      ]
      return choice(key, plain(texts[op]!), ans, pool)
    }
    if (L === 3) {
      // Key is "3:price:count" (price in tenths of a dollar).
      const price = op
      const count = x
      const ansT = 200 - count * price
      const pool = [ansT + 1, ansT - 1, ansT + 10, ansT - 10, count * price].filter((v) => v >= 0 && v !== ansT).map(fmt1)
      const text = `Ava cuts ${count} pieces of ribbon, each ${fmt1(price)} m long, from a 20 m roll. How many meters are left?`
      return choice(key, plain(text), fmt1(ansT), pool)
    }
    // Key is "4:a:b" (tenths): a and b are the two decimals.
    const a = op
    const b = x
    const right = `${fmt1(a)} + ${fmt1(b)} = ${fmt1(a + b)}`
    const wrongs = [
      `${fmt1(a)} + ${fmt1(b)} = ${fmt1(a + b + 1)}`,
      `${fmt1(a)} − ${fmt1(b)} = ${fmt1(a + b)}`,
      `${fmt1(a)} × 2 = ${fmt1(2 * a + 10)}`,
    ]
    return choice(key, plain('Which equation is true?'), right, wrongs)
  },
})

/**
 * IXL: "Money and time" (grade 5): add and subtract money, in word problems, in multi-step word problems, and
 * multiply money. Keys: "1:op:x:y" and "2:op:x:y" (cents), "3:p:q" (cents), "4:p:n" (cents, times n).
 */
const moneyTime5 = keyedSkill({
  id: 'moneyTime5',
  labels: ['Add and subtract money amounts', 'Add and subtract money: word problems', 'Add and subtract money: multi-step word problems', 'Multiply money amounts'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1 || L === 2) {
      const op = rand(0, 1)
      const x = 5 * rand(20, 300)
      const y = 5 * rand(20, 300)
      return op ? `${L}:1:${Math.max(x, y)}:${Math.min(x, y)}` : `${L}:0:${x}:${y}`
    }
    if (L === 3) return `3:${5 * rand(20, 60)}:${5 * rand(20, 60)}`
    return `4:${5 * rand(5, 99)}:${rand(2, 6)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0] = nums(key)
    if (L === 1 || L === 2) {
      const op = a
      const x = b
      const y = c
      const ans = op ? x - y : x + y
      const texts =
        L === 1
          ? [`Find the total: ${fmtM(x)} + ${fmtM(y)}`, `Find the difference: ${fmtM(x)} − ${fmtM(y)}`]
          : [`Max earns ${fmtM(x)} on Monday and ${fmtM(y)} on Tuesday. How much did he earn in all?`, `Lily has ${fmtM(x)} and spends ${fmtM(y)}. How much is left?`]
      const pool = [ans + 100, ans - 100, ans + 10, ans - 10, ans + 5, ans - 5].filter((v) => v >= 0).map(fmtM)
      return choice(key, plain(texts[op]!), fmtM(ans), pool)
    }
    if (L === 3) {
      const p = a
      const q = b
      const ans = 1000 - 2 * p - q
      const text = `Max buys 2 pens for ${fmtM(p)} each and a notebook for ${fmtM(q)}. He pays with a $10 bill. How much change does he get?`
      const pool = [ans + 100, ans - 100, ans + 10, ans - 10, 2 * p + q].filter((v) => v >= 0 && v !== ans).map(fmtM)
      return choice(key, plain(text), fmtM(ans), pool)
    }
    const ans = a * b
    const pool = [ans + 100, ans - 100, ans + 10, ans - 10, ans + 5, ans - 5].filter((v) => v >= 0).map(fmtM)
    return choice(key, plain(`One item costs ${fmtM(a)}. How much do ${b} items cost?`), fmtM(ans), pool)
  },
})

/**
 * IXL: "Triangles" (grade 5): right, acute, and obtuse triangles, equilateral and isosceles, and scalene.
 * Each level shows four labeled triangles and asks for the letter of the right one. Keys: "L:r".
 */
const TRI_LEVELS: { ask: string; right: string; others: string[] }[] = [
  { ask: 'Which triangle is a right triangle?', right: 'right', others: ['acute', 'obtuse', 'scalene'] },
  { ask: 'Which triangle is equilateral?', right: 'equilateral', others: ['acute', 'scalene', 'right'] },
  { ask: 'Which triangle is obtuse?', right: 'obtuse', others: ['acute', 'right', 'scalene'] },
]
const triangles5 = keyedSkill({
  id: 'triangles5',
  labels: ['Acute, obtuse, and right triangles', 'Scalene, isosceles, and equilateral triangles', 'Classify triangles by angles'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, 3)}`,
  build: (key) => {
    const [L = 1, r = 0] = nums(key)
    const level = TRI_LEVELS[L - 1]
    if (!level || r < 0 || r > 3) return null
    const names = [...level.others]
    names.splice(r, 0, level.right)
    const elems = names.map((n) => polyEl(TRI[n]!))
    return choice(key, { text: level.ask, say: level.ask, svg: figuresSVG(elems, level.ask) }, 'ABCD'[r]!, 'ABCD'.split('').filter((c) => c !== 'ABCD'[r]))
  },
})

/**
 * IXL: "Perimeter" (grade 5), whole-number sides and figures on grids. Answers are whole numbers.
 * Keys: "1:W:H:w:h" (an L-shape: the top right corner is cut out), "2:a:b:c" (a rectangle with one extra square on top).
 */
const perimeterWhole5 = keyedSkill({
  id: 'perimeterWhole5',
  labels: ['Perimeter with whole number side lengths', 'Perimeter of figures on grids'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const W = rand(4, 9)
      const H = rand(4, 9)
      return `1:${W}:${H}:${rand(1, W - 2)}:${rand(1, H - 2)}`
    }
    return `2:${rand(3, 6)}:${rand(2, 4)}:${rand(0, 2)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0, d = 0] = nums(key)
    if (L === 1) {
      const W = a
      const H = b
      const w = c
      const h = d
      const ans = 2 * (W + H)
      const s = 12
      const X = (x: number) => 20 + x * s
      const Y = (y: number) => 20 + (H - y) * s
      const pts: [number, number][] = [[0, 0], [W, 0], [W, H - h], [W - w, H - h], [W - w, H], [0, H]]
      const poly = `<polygon points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="3"/>`
      const labels =
        `<text x="${X(W / 2)}" y="${Y(0) + 22}" font-size="18">${W}</text>` +
        `<text x="${X(W) + 16}" y="${Y((H - h) / 2)}" font-size="18">${H - h}</text>` +
        `<text x="${X(W - w / 2)}" y="${Y(H - h) + 20}" font-size="18">${w}</text>` +
        `<text x="${X(W - w) - 14}" y="${Y(H - h / 2)}" font-size="18">${h}</text>` +
        `<text x="${X((W - w) / 2)}" y="${Y(H) - 8}" font-size="18">${W - w}</text>` +
        `<text x="${X(0) - 14}" y="${Y(H / 2)}" font-size="18">${H}</text>`
      const svg = svgWrap(X(W) + 60, Y(0) + 40, poly + labels, `L-shape with sides ${W}, ${H - h}, ${w}, ${h}, ${W - w}, and ${H}`)
      return numeric(key, { text: 'What is the perimeter of this shape, in units? Add all six sides.', say: 'What is the perimeter of this shape, in units? Add all six sides.', svg }, ans, [ans - 2, ans + 2, W * H, W + H])
    }
    const [aw, bh, extra] = [a, b, c]
    const cell = 36
    const rows = bh + 1
    let body = ''
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < aw; x++) body += `<rect x="${20 + x * cell}" y="${20 + (bh - y) * cell}" width="${cell}" height="${cell}" fill="#fde68a" stroke="#92400e" stroke-width="2"/>`
    }
    body += `<rect x="${20 + extra * cell}" y="20" width="${cell}" height="${cell}" fill="#fde68a" stroke="#92400e" stroke-width="2"/>`
    const ans = 2 * (aw + bh) + 2
    const svg = svgWrap(40 + aw * cell, 40 + rows * cell, body, `A figure of ${aw * bh + 1} squares on a grid`)
    return numeric(key, { text: 'Each square is 1 unit on a side. What is the perimeter of the shape, in units?', say: 'Each square is 1 unit on a side. What is the perimeter of the shape, in units?', svg }, ans, [ans - 2, ans + 2, aw * bh + 1, ans + 4])
  },
})

/**
 * IXL: "Perimeter" (grade 5), decimal and fractional side lengths. Answers are decimals or fractions, so choice only.
 * Keys: "1:a:b:c" (tenths), "2:d:a:b:c" (sides are fractions with denominator d).
 */
const perimeterDecimal5 = keyedSkill({
  id: 'perimeterDecimal5',
  labels: ['Perimeter with decimal side lengths', 'Perimeter with fractional side lengths'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(11, 49)}:${rand(11, 49)}:${rand(11, 49)}`
    const d = pick([2, 3, 4, 5, 6, 8])!
    for (;;) {
      const a = rand(1, d - 1)
      const b = rand(1, d - 1)
      const c = rand(1, d - 1)
      const s = a + b + c
      if (s > d && s % d !== 0) return `2:${d}:${a}:${b}:${c}`
    }
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0, c = 0, d = 0] = nums(key)
    if (L === 1) {
      const s = a + b + c
      const pool = [s + 1, s - 1, s + 10, s - 10, s + 2].filter((v) => v >= 0).map(fmt1)
      return choice(key, plain(`A shape has sides of ${fmt1(a)}, ${fmt1(b)}, and ${fmt1(c)} units. What is its perimeter, in units?`), fmt1(s), pool)
    }
    // Key is "2:den:n1:n2:n3", so the denominator is the first field.
    const den = a
    const [n1, n2, n3] = [b, c, d]
    const s = n1 + n2 + n3
    return choice(key, plain(`A shape has sides of ${n1}/${den}, ${n2}/${den}, and ${n3}/${den} inch. What is its perimeter, in inches?`), `${s}/${den}`, [`${s + 1}/${den}`, `${s - 1}/${den}`, `${s}/${den + 1}`, `${s + 2}/${den}`])
  },
})

/**
 * IXL: "Polygons" (grade 5): is it a polygon, count the sides, regular and irregular polygons, and sort into
 * Venn diagrams. Each level shows four labeled shapes. Keys: "L:r" (r is the position of the right shape).
 */
const POLYGON_LEVELS: { ask: string; right: () => string; others: (() => string)[] }[] = [
  { ask: 'Which shape is a polygon?', right: () => polyEl(regularPts(5)), others: [() => `<circle cx="60" cy="60" r="45" fill="#c4b5fd" stroke="#4c1d95" stroke-width="3"/>`, () => `<path d="M 15 60 C 15 15, 105 15, 105 60 C 105 105, 15 105, 15 60 Z" fill="#c4b5fd" stroke="#4c1d95" stroke-width="3"/>`, () => `<path d="M 60 15 Q 110 60 60 105 Q 10 60 60 15 Z" fill="#c4b5fd" stroke="#4c1d95" stroke-width="3"/>`] },
  { ask: 'Which shape has exactly 6 sides?', right: () => polyEl(regularPts(6)), others: [() => polyEl(regularPts(5)), () => polyEl(regularPts(8)), () => polyEl(irregularPts(4))] },
  { ask: 'Which shape is a regular polygon?', right: () => polyEl(regularPts(5)), others: [() => polyEl(irregularPts(4)), () => polyEl(irregularPts(3)), () => polyEl(irregularPts(6))] },
  { ask: 'Which shape has 4 sides but no right angles?', right: () => polyEl([[30, 35], [100, 35], [80, 90], [10, 90]]), others: [() => polyEl([[30, 30], [90, 30], [90, 90], [30, 90]]), () => polyEl([[20, 40], [100, 40], [100, 90], [20, 90]]), () => polyEl(regularPts(5))] },
]
const polygonTypes5 = keyedSkill({
  id: 'polygonTypes5',
  labels: ['Is it a polygon?', 'Number of sides in polygons', 'Regular and irregular polygons', 'Sort polygons into Venn diagrams'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, 3)}`,
  build: (key) => {
    const [L = 1, r = 0] = nums(key)
    const level = POLYGON_LEVELS[L - 1]
    if (!level || r < 0 || r > 3) return null
    const elems = level.others.map((f) => f())
    elems.splice(r, 0, level.right())
    return choice(key, { text: level.ask, say: level.ask, svg: figuresSVG(elems, level.ask) }, 'ABCD'[r]!, 'ABCD'.split('').filter((c) => c !== 'ABCD'[r]))
  },
})

/**
 * IXL: "Financial literacy" (grade 5): pay stubs, payroll taxes, sales taxes, and types of taxes.
 * Numbers are whole dollars. Keys: "1:g" (pay stub), "2:g:p" (payroll tax), "3:c" (sales tax), "4:i" (types of taxes).
 */
const TAX_NAMES = ['Sales tax', 'Income tax', 'Property tax', 'Payroll tax']
const TAX_ITEMS: { text: string; answer: string }[] = [
  { text: 'Which tax is paid when you buy a toy at a store?', answer: 'Sales tax' },
  { text: 'Which tax is taken out of each paycheck to pay for Social Security and Medicare?', answer: 'Payroll tax' },
  { text: 'Which tax is paid on the money you earn from a job?', answer: 'Income tax' },
  { text: 'Which tax is paid each year on the value of a house or land?', answer: 'Property tax' },
]
const finance5 = keyedSkill({
  id: 'finance5',
  labels: ['Income and payroll taxes: understanding pay stubs', 'Income and payroll taxes: word problems', 'Sales and property taxes: word problems'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${10 * rand(30, 90)}`
    if (L === 2) return `2:${100 * rand(1, 5)}:${pick([10, 20, 25])!}`
    return `3:${10 * rand(2, 30)}`
  },
  build: (key) => {
    const [L = 0, a = 0, b = 0] = nums(key)
    if (L === 1) {
      const tax = a / 10
      const ans = a - tax
      const text = `Ava's pay stub shows $${a} earned this week. Taxes take out 10%, which is $${tax}. How many dollars does she take home?`
      return numeric(key, { text, say: `Ava's pay stub shows ${a} dollars earned this week. Taxes take out 10 percent. How many dollars does she take home?` }, ans, [ans + 1, ans - 1, tax, a])
    }
    if (L === 2) {
      const ans = (a * b) / 100
      const text = `Leo earns $${a} this week. Payroll taxes are ${b}% of his pay. How many dollars go to payroll taxes?`
      return numeric(key, { text, say: `Leo earns ${a} dollars this week. Payroll taxes are ${b} percent of his pay. How many dollars go to payroll taxes?` }, ans, [ans + 1, ans - 1, ans + 5, a - ans])
    }
    if (L === 3) {
      const ans = a + a / 10
      const text = `A toy costs $${a}. The sales tax is 10%. What is the total price, in dollars?`
      return numeric(key, { text, say: `A toy costs ${a} dollars. The sales tax is 10 percent. What is the total price, in dollars?` }, ans, [a, ans + 1, ans - 1, a / 10])
    }
    return null
  },
})

/**
 * IXL: "Financial literacy" (grade 5), "Identify types of taxes". Answers are tax names, so these are choice only.
 * Keys: "L:i" where i is an index into TAX_ITEMS.
 */
const taxTypes5 = keyedSkill({
  id: 'taxTypes5',
  labels: ['Identify types of taxes', 'Identify types of taxes: more examples'],
  formats: CHOICE,
  key: (L) => `${L}:${(L - 1) * 2 + rand(0, 1)}`,
  build: (key) => {
    const [, i = 0] = nums(key)
    const item = TAX_ITEMS[i]
    if (!item) return null
    return choice(key, plain(item.text), item.answer, TAX_NAMES)
  },
})

/** Unlock gates. Grade 1-2 skills open early (after the first grade 1 addition or subtraction skill reaches level 2). Grade 3+ skills wait for a solid level of an existing grade 3-4 skill. */
const GATES: Record<string, { skill: string; level: number }[]> = {
  addStrategies2: [{ skill: 'add', level: 2 }],
  subStrategies2: [{ skill: 'sub', level: 2 }],
  addStrategies3: [{ skill: 'add', level: 2 }],
  subStrategies3: [{ skill: 'sub', level: 2 }],
  addProperties: [{ skill: 'add', level: 7 }],
  oddSums: [{ skill: 'add', level: 7 }],
  skipCount3: [{ skill: 'mul', level: 3 }],
  mulBuilders: [{ skill: 'mul', level: 3 }],
  mulProperties: [{ skill: 'mul', level: 4 }],
  divBuilders: [{ skill: 'mul', level: 6 }],
  mixedOps3: [{ skill: 'mul', level: 3 }],
  fracWordProblems3: [{ skill: 'fractions', level: 3 }],
  fracWhole3: [{ skill: 'fractions', level: 3 }],
  orderFractions3: [{ skill: 'fractions', level: 3 }],
  financeG3: [{ skill: 'add', level: 7 }],
  customaryUnits: [{ skill: 'area', level: 2 }],
  metricUnits: [{ skill: 'area', level: 2 }],
  areaPerim3: [{ skill: 'perimeter', level: 2 }],
  addMulti4: [{ skill: 'add', level: 12 }],
  subMulti4: [{ skill: 'sub', level: 12 }],
  equivFractions4: [{ skill: 'fractions', level: 3 }],
  fracOfGroup4: [{ skill: 'fractions', level: 3 }],
  decompFractions4: [{ skill: 'fractions', level: 4 }],
  timeUnits4: [{ skill: 'elapsed', level: 2 }],
  areaPerim4: [{ skill: 'perimeter', level: 2 }],
  quads4: [{ skill: 'perimeter', level: 3 }],
  financeG4: [{ skill: 'mul', level: 8 }],
  fracMixed5: [{ skill: 'fractions', level: 4 }],
  fracMultiply5: [{ skill: 'fractions', level: 4 }],
  mixedMultiply5: [{ skill: 'fractions', level: 4 }, { skill: 'multiply', level: 3 }],
  mixedOpsFrac5: [{ skill: 'fractions', level: 4 }],
  decimalsAddSub5: [{ skill: 'decimals', level: 3 }],
  mixedOpsDec5: [{ skill: 'decimals', level: 3 }],
  moneyTime5: [{ skill: 'decimals', level: 3 }],
  dataPlots5: [{ skill: 'fractions', level: 4 }],
  triangles5: [{ skill: 'perimeter', level: 3 }],
  polygonTypes5: [{ skill: 'perimeter', level: 3 }],
  perimeterWhole5: [{ skill: 'perimeter', level: 3 }],
  perimeterDecimal5: [{ skill: 'perimeter', level: 3 }],
  finance5: [{ skill: 'decimals', level: 3 }],
  taxTypes5: [{ skill: 'decimals', level: 3 }],
}

const withGates = (s: Skill): Skill => (GATES[s.id] ? { ...s, unlocksAfter: GATES[s.id] } : s)

/** Every skill in this file, in IXL order. Registration happens elsewhere. */
export const MATH_FINAL: Skill[] = [
  numbersTo10,
  addStrategies2,
  subStrategies2,
  addStrategies3,
  subStrategies3,
  addProperties,
  oddSums,
  skipCount3,
  mulBuilders,
  mulProperties,
  divBuilders,
  mixedOps3,
  fracWordProblems3,
  fracWhole3,
  orderFractions3,
  financeG3,
  customaryUnits,
  metricUnits,
  areaPerim3,
  addMulti4,
  subMulti4,
  equivFractions4,
  fracOfGroup4,
  decompFractions4,
  timeUnits4,
  areaPerim4,
  quads4,
  financeG4,
  fracMixed5,
  fracMultiply5,
  mixedMultiply5,
  mixedOpsFrac5,
  decimalsAddSub5,
  mixedOpsDec5,
  moneyTime5,
  dataPlots5,
  triangles5,
  polygonTypes5,
  perimeterWhole5,
  perimeterDecimal5,
  finance5,
  taxTypes5,
].map(withGates)

const im = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })
const same = (n: number, ref: IxlRef): IxlRef[] => Array.from({ length: n }, () => ref)

/** IXL topic for each level of each skill (index 0 = level 1). Categories are IXL's names from skills.json. */
export const MATH_FINAL_IXL: Record<string, IxlRef[]> = {
  'math.numbersTo10': same(3, im(0, 'Numbers to 10')),
  'math.addStrategies2': same(4, im(2, 'Addition strategies: two digits')),
  'math.subStrategies2': same(4, im(2, 'Subtraction strategies: two digits')),
  'math.addStrategies3': same(4, im(2, 'Addition strategies: three digits')),
  'math.subStrategies3': same(4, im(2, 'Subtraction strategies: three digits')),
  'math.addProperties': same(3, im(3, 'Addition properties')),
  'math.oddSums': same(2, im(3, 'Addition properties')),
  'math.skipCount3': same(3, im(3, 'Skip-counting')),
  'math.mulBuilders': [...same(3, im(3, 'Multiplication skill builders up to 10')), im(3, 'Multiplication skill builders up to 12')],
  'math.mulProperties': same(3, im(3, 'Multiplication properties')),
  'math.divBuilders': [...same(3, im(3, 'Division skill builders up to 10')), im(3, 'Division skill builders up to 12')],
  'math.mixedOps3': same(3, im(3, 'Mixed operations')),
  'math.fracWordProblems3': same(4, im(3, 'Fraction word problems')),
  'math.fracWhole3': same(3, im(3, 'Fractions equivalent to whole numbers')),
  'math.orderFractions3': same(3, im(3, 'Order fractions')),
  'math.financeG3': same(4, im(3, 'Financial literacy')),
  'math.customaryUnits': same(3, im(3, 'Customary units of measurement')),
  'math.metricUnits': same(3, im(3, 'Metric units of measurement')),
  'math.areaPerim3': same(3, im(3, 'Area and perimeter')),
  'math.addMulti4': same(4, im(4, 'Addition')),
  'math.subMulti4': same(4, im(4, 'Subtraction')),
  'math.equivFractions4': same(2, im(4, 'Equivalent fractions')),
  'math.fracOfGroup4': same(2, im(4, 'Equivalent fractions')),
  'math.decompFractions4': same(4, im(4, 'Understand fraction addition and subtraction')),
  'math.timeUnits4': same(4, im(4, 'Time')),
  'math.areaPerim4': same(4, im(4, 'Area and perimeter')),
  'math.quads4': same(4, im(4, 'Quadrilaterals')),
  'math.financeG4': same(4, im(4, 'Financial literacy')),
  'math.fracMixed5': same(4, im(5, 'Fractions and mixed numbers')),
  'math.fracMultiply5': same(4, im(5, 'Understand fraction multiplication')),
  'math.mixedMultiply5': same(3, im(5, 'Understand multiplication with mixed numbers')),
  'math.mixedOpsFrac5': same(3, im(5, 'Mixed operations: fractions')),
  'math.decimalsAddSub5': same(4, im(5, 'Add and subtract decimals')),
  'math.mixedOpsDec5': same(4, im(5, 'Mixed operations: decimals')),
  'math.moneyTime5': same(4, im(5, 'Money and time')),
  'math.dataPlots5': same(4, im(5, 'Data and graphs')),
  'math.triangles5': same(3, im(5, 'Triangles')),
  'math.polygonTypes5': same(4, im(5, 'Polygons')),
  'math.perimeterWhole5': same(2, im(5, 'Perimeter')),
  'math.perimeterDecimal5': same(2, im(5, 'Perimeter')),
  'math.finance5': same(3, im(5, 'Financial literacy')),
  'math.taxTypes5': same(2, im(5, 'Financial literacy')),
}
