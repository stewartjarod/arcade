import type { Format, ItemSpec, Prompt, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { numberWrongs, pick, rand, shuffle } from './util'

/**
 * Early math (kindergarten to grade 2), named like IXL's categories (see MATH_EARLY_IXL at the bottom).
 * Each skill has three levels that climb in IXL grade and never go back down.
 *
 * Little readers need short prompts, so every prompt has a `say` for reading aloud, and pictures are
 * emoji rows or a small SVG grid. Each level's key is made with randomness once ("2:4:7" = level, then
 * the numbers). The same key always rebuilds the same question, so a missed one can come back (fromKey).
 */

const nums = (key: string) => key.split(':').map(Number)
const row = (emoji: string, n: number) => Array(n).fill(emoji).join(' ')
const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })
const NUMBER_CHOICE: Format[] = ['number', 'choice']
const CHOICE: Format[] = ['choice']
const plain = (text: string): Prompt => ({ text, say: text })

const NAMES = ['Zoe', 'Mia', 'Sam', 'Leo', 'Ava', 'Max']
const THINGS: [string, string][] = [['🍎', 'apples'], ['🐸', 'frogs'], ['⭐', 'stars'], ['🎈', 'balloons'], ['🐟', 'fish'], ['🍪', 'cookies']]
/** Ones digits that never land on a tie when rounding to the nearest ten. */
const DIGITS = [1, 2, 3, 4, 6, 7, 8, 9]

const thing = (i: number) => THINGS[i % THINGS.length]!
const name = (i: number) => NAMES[i % NAMES.length]!

/** A skill from a key maker (random, once) and a key → question builder (no randomness). */
function keyedSkill(o: {
  id: string
  label: (L: number) => string
  formats: Format[]
  key: (L: number) => string
  /** Old keys whose fields changed meaning return null here, instead of a different question. */
  valid?: (key: string) => boolean
  build: (key: string) => ItemSpec
}): Skill {
  return {
    id: o.id,
    label: o.label,
    maxLevel: 3,
    formats: o.formats,
    generate: (L) => o.build(o.key(L)),
    fromKey: (key, L) => (key.split(':')[0] === String(L) && (o.valid?.(key) ?? true) ? o.build(key) : null),
  }
}

/** Rows of pictures drawn as SVG, one row per group with its name at the left, so each row stays on its own line on a phone. */
export function countRowsSVG(rows: [label: string, emoji: string, n: number][]) {
  const W = 28
  const labelW = 74
  const width = labelW + Math.max(...rows.map((r) => r[2])) * W + 8
  const body = rows
    .map(([label, emoji, n], r) => {
      const y = 10 + r * 40
      const items = Array.from({ length: n }, (_, i) => `<text x="${labelW + i * W}" y="${y + 26}" font-size="24">${emoji}</text>`).join('')
      return `<text x="4" y="${y + 23}" font-size="15" font-weight="700" fill="#333" font-family="sans-serif">${label}</text>${items}`
    })
    .join('')
  return `<svg viewBox="0 0 ${width} ${rows.length * 40 + 10}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

/** A question whose answer is a whole number. The wrong options are slips near the answer, first. */
function numeric(key: string, prompt: Prompt, answer: number, near: number[]): ItemSpec {
  return { key, prompt, answer: String(answer), wrong: (k) => numberWrongs(answer, k, near) }
}

// --- Number words: "What number is 'three'?" ----------------------------------------------------

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
/** 23 → "twenty-three" */
const wordFor = (n: number) => (n < 20 ? ONES[n]! : `${TENS[Math.floor(n / 10)]!}${n % 10 ? `-${ONES[n % 10]!}` : ''}`)

const numberWords = keyedSkill({
  id: 'numberWords',
  label: (L) => ['Number words up to 3', 'Number words up to 5', 'Number words up to 100'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => `${L}:${L === 1 ? rand(1, 3) : L === 2 ? rand(0, 5) : rand(20, 99)}`,
  build: (key) => {
    const [, n = 0] = nums(key)
    const word = wordFor(n)
    return numeric(key, { text: `What number is "${word}"?`, say: `What number is ${word}?` }, n, [n + 1, n - 1, n + 2, n - 2])
  },
})

// --- Counting pictures: "How many apples?" -----------------------------------------------------

const countSmall = keyedSkill({
  id: 'countSmall',
  label: (L) => ['Count to 3', 'Count to 7', 'Count to 9'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => `${L}:${rand(0, THINGS.length - 1)}:${rand(1, [3, 7, 9][L - 1]!)}`,
  build: (key) => {
    const [, ti = 0, n = 0] = nums(key)
    const [emoji, noun] = thing(ti)
    return numeric(key, { text: `How many ${noun}?`, say: `How many ${noun}? Count them.`, emoji: row(emoji, n) }, n, [n + 1, n - 1, n + 2, n - 2])
  },
})

// --- Teen numbers: "10 + 4", "13 is 10 and what?", "What comes after 15?" ---------------------

const teenNumbers = keyedSkill({
  id: 'teenNumbers',
  label: (L) => ['Make teen numbers', 'Take apart teen numbers', 'Names of numbers up to 20'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => (L === 1 ? `1:${rand(1, 9)}` : L === 2 ? `2:${rand(11, 19)}` : `3:${rand(10, 19)}:w`),
  // Level 3 keys end in ":w" (the word form). Older level 3 keys asked "what comes after", so they give null.
  valid: (key) => key.split(':').length === (key.startsWith('3:') ? 3 : 2),
  build: (key) => {
    const [L = 1, x = 0] = nums(key)
    if (L === 1) return numeric(key, plain(`10 + ${x} = ?`), 10 + x, [x, 10 + x + 1, 10 + x - 1, 10 + x + 2])
    if (L === 2) return numeric(key, { text: `10 + ? = ${x}`, say: `10 plus what equals ${x}?` }, x - 10, [x, 10, x - 9, x - 11])
    const word = wordFor(x)
    return numeric(key, { text: `What number is "${word}"?`, say: `What number is ${word}?` }, x, [x + 1, x - 1, x + 2, x - 2])
  },
})

// --- Counting forward and back: "What comes after 14?" -----------------------------------------

const countForwardBack = keyedSkill({
  id: 'countForwardBack',
  label: (L) => ['Counting forward and back to 10', 'Counting forward and back to 20', 'Counting forward and back to 100'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const top = [10, 20, 100][L - 1]!
    const f = rand(0, 1)
    return `${L}:${f}:${f === 0 ? rand(1, top - 1) : rand(2, top)}`
  },
  build: (key) => {
    const [, f = 0, n = 0] = nums(key)
    const ans = f === 0 ? n + 1 : n - 1
    const text = f === 0 ? `What comes after ${n}?` : `What comes before ${n}?`
    return numeric(key, plain(text), ans, [n, ans + 1, ans - 1, ans + 2])
  },
})

// --- Counting by tens: "10, 20, 30, ?" and "3 tens?" and counting back from 100 ----------------

const tensCount = keyedSkill({
  id: 'tensCount',
  label: (L) => ['Count by tens', 'Groups of ten', 'Count back to 100'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => (L === 1 ? `1:${rand(1, 6)}` : L === 2 ? `2:${rand(2, 9)}` : `3:${rand(4, 100)}`),
  build: (key) => {
    const [L = 1, x = 0] = nums(key)
    if (L === 1) {
      const a = x * 10
      // Wrong answers are not already in the list: the next-but-one ten, one more, or the ten before the start.
      return numeric(key, plain(`Count by tens: ${a}, ${a + 10}, ${a + 20}, ?`), a + 30, [a + 40, a + 1, a - 10])
    }
    if (L === 2) return numeric(key, plain(`How many is ${x} tens?`), x * 10, [x, x * 10 + 10, x * 10 - 10, x * 10 + 1])
    return numeric(key, plain(`Count back: ${x}, ${x - 1}, ${x - 2}, ?`), x - 3, [x - 4, x + 1, x - 10])
  },
})

// --- Put together and take away with pictures ---------------------------------------------------

const addPictures = keyedSkill({
  id: 'addPictures',
  label: (L) => ['Put together up to 5', 'Add up to 5', 'Put together up to 10'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const top = L === 3 ? 10 : 5
    const a = rand(1, top - 1)
    return `${L}:${rand(0, THINGS.length - 1)}:${a}:${rand(1, top - a)}`
  },
  build: (key) => {
    const [L = 1, ti = 0, a = 0, b = 0] = nums(key)
    const [emoji, noun] = thing(ti)
    const prompt: Prompt =
      L === 2
        ? plain(`${a} + ${b} = ?`)
        : { text: `${a} + ${b} = ?`, say: `${a} plus ${b}. How many in all?`, emoji: `${row(emoji, a)} + ${row(emoji, b)}` }
    return numeric(key, prompt, a + b, [a, b, a + b + 1, a + b - 1])
  },
})

const subPictures = keyedSkill({
  id: 'subPictures',
  label: (L) => ['Take away with pictures up to 5', 'Subtract up to 5', 'Take away up to 10'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const a = rand(2, L === 3 ? 10 : 5)
    return `${L}:${rand(0, THINGS.length - 1)}:${a}:${rand(1, a - 1)}`
  },
  build: (key) => {
    const [L = 1, ti = 0, a = 0, b = 0] = nums(key)
    const [emoji, noun] = thing(ti)
    const ans = a - b
    const prompt: Prompt =
      L === 2
        ? plain(`${a} − ${b} = ?`)
        : { text: `Start with ${a}. Take away ${b}. How many are left?`, say: `Start with ${a} ${noun}. Take away ${b}. How many are left?`, emoji: row(emoji, a) }
    // A third near miss when the answer is small (ans + 2), kept at 10 or less.
    return numeric(key, prompt, ans, [a, b, ans + 1, ans - 1, ans < 9 ? ans + 2 : ans - 2])
  },
})

// --- Adding and taking away together ------------------------------------------------------------

/** A pair that fits: adding stays within `top`; taking away starts at 2 or more and takes less. */
function addSubPair(top: number, add: boolean): [number, number] {
  if (add) {
    const a = rand(1, top - 1)
    return [a, rand(1, top - a)]
  }
  const a = rand(2, top)
  return [a, rand(1, a - 1)]
}

const addOrSub = keyedSkill({
  id: 'addOrSub',
  label: (L) => ['Add or subtract up to 5', 'Add or subtract up to 10', 'Add or subtract stories up to 10'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const op = rand(0, 1)
    const [a, b] = addSubPair(L === 1 ? 5 : 10, op === 0)
    return `${L}:${op}:${rand(0, 5)}:${rand(0, THINGS.length - 1)}:${a}:${b}`
  },
  build: (key) => {
    const [L = 1, op = 0, ni = 0, ti = 0, a = 0, b = 0] = nums(key)
    const add = op === 0
    const ans = add ? a + b : a - b
    if (L !== 3) {
      return numeric(key, { text: `${a} ${add ? '+' : '−'} ${b} = ?`, say: `${a} ${add ? 'plus' : 'minus'} ${b}?` }, ans, [a, b, ans + 1, ans - 1])
    }
    const [emoji, noun] = thing(ti)
    const text = add
      ? `${name(ni)} has ${a} ${noun}. Then ${name(ni)} gets ${b} more. How many now?`
      : `${name(ni)} has ${a} ${noun}. ${name(ni)} gives ${b} away. How many are left?`
    const picture = add ? `${row(emoji, a)} + ${row(emoji, b)}` : row(emoji, a)
    return numeric(key, { text, say: text, emoji: picture }, ans, [a, b, ans + 1, ans - 1])
  },
})

// --- More and fewer: "How many more does Zoe have?" --------------------------------------------

const compareMore = keyedSkill({
  id: 'compareMore',
  label: (L) => ['Compare up to 10 with pictures', 'More stories up to 10', 'More stories up to 20'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const a = rand(2, L === 3 ? 20 : 10)
    return `${L}:${rand(0, NAMES.length - 1)}:${rand(0, THINGS.length - 1)}:${a}:${rand(1, a - 1)}`
  },
  build: (key) => {
    const [L = 1, ni = 0, ti = 0, a = 0, b = 0] = nums(key)
    const ans = a - b
    const near = [a, b, ans + 1, ans - 1]
    if (L === 1) {
      const text = 'How many more apples than pears?'
      return numeric(key, { text, say: text, svg: countRowsSVG([['Apples', '🍎', a], ['Pears', '🍐', b]]) }, ans, near)
    }
    const [emoji, noun] = thing(ti)
    const text = `${name(ni)} has ${a} ${noun}. ${name(ni + 1)} has ${b}. How many more does ${name(ni)} have?`
    const prompt: Prompt = L === 2 ? { text, say: text, svg: countRowsSVG([[name(ni), emoji, a], [name(ni + 1), emoji, b]]) } : plain(text)
    return numeric(key, prompt, ans, near)
  },
})

// --- Tens and ones: "40 + 7", "23 + 40" ---------------------------------------------------------

const tensAdd = keyedSkill({
  id: 'tensAdd',
  label: (L) => ['Add and subtract tens', 'Add tens to one-digit numbers', 'Add tens to two-digit numbers'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      if (rand(0, 1) === 0) {
        const a = 10 * rand(1, 8)
        return `1:0:${a}:${10 * rand(1, 9 - a / 10)}`
      }
      const a = 10 * rand(2, 9)
      return `1:1:${a}:${10 * rand(1, a / 10 - 1)}`
    }
    if (L === 2) return `2:${rand(1, 8)}:${rand(1, 9)}`
    const x = rand(11, 89)
    return `3:${x}:${rand(1, Math.floor((99 - x) / 10))}`
  },
  build: (key) => {
    const [L = 1, p = 0, q = 0, r = 0] = nums(key)
    if (L === 1) {
      // Key: 1:op:a:b, where op 0 is adding and 1 is taking away.
      const [, op = 0, a = 0, b = 0] = nums(key)
      const ans = op === 0 ? a + b : a - b
      return numeric(key, plain(`${a} ${op === 0 ? '+' : '−'} ${b} = ?`), ans, [ans + 10, ans - 10, a, b])
    }
    if (L === 2) {
      // Key: 2:tens:ones
      const a = 10 * p
      const ans = a + q
      return numeric(key, plain(`${a} + ${q} = ?`), ans, [p + q, ans + 10, ans - 10, ans + 1])
    }
    // Key: 3:twoDigit:tens
    const y = 10 * q
    const ans = p + y
    return numeric(key, plain(`${p} + ${y} = ?`), ans, [ans + 1, ans - 1, ans + 10, ans - 10])
  },
})

// --- Subtraction by counting back and using ten -------------------------------------------------

const subStrategy = keyedSkill({
  id: 'subStrategy',
  label: (L) => ['Count back up to 10', 'Count back up to 20', 'Use ten to subtract'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const a = rand(2, 10)
      return `1:${a}:${rand(1, a - 1)}`
    }
    if (L === 2) return `2:${rand(11, 20)}:${rand(1, 9)}`
    const a = rand(11, 18)
    // Crossing the ten: the second number is bigger than the ones digit of the first.
    return `3:${a}:${rand(a - 9, 9)}`
  },
  build: (key) => {
    const [L = 1, a = 0, b = 0] = nums(key)
    const ans = a - b
    const hint = L === 1 ? `${a} minus ${b}. Count back ${b}.` : L === 2 ? `${a} minus ${b}. Count back.` : `${a} minus ${b}. Use ten to help.`
    return numeric(key, { text: `${a} − ${b} = ?`, say: hint }, ans, [ans + 1, ans - 1, ans + 2, ans - 2])
  },
})

// --- Addition and subtraction facts -------------------------------------------------------------

const addFacts = keyedSkill({
  id: 'addFacts',
  label: (L) => ['Add facts up to 10', 'Add facts up to 20', 'Add facts that make 11 to 18'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const a = rand(1, 9)
      return `1:${a}:${rand(1, 10 - a)}`
    }
    if (L === 2) return `2:${rand(1, 9)}:${rand(1, 9)}`
    const a = rand(2, 9)
    return `3:${a}:${rand(11 - a, 9)}`
  },
  build: (key) => {
    const [, a = 0, b = 0] = nums(key)
    return numeric(key, plain(`${a} + ${b} = ?`), a + b, [a, b, a + b + 1, a + b - 1])
  },
})

const subFacts = keyedSkill({
  id: 'subFacts',
  label: (L) => ['Subtract facts up to 10', 'Subtract from two-digit numbers', 'Subtraction stories up to 20'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const a = rand(2, 10)
      return `1:0:${a}:${rand(1, a - 1)}`
    }
    if (L === 2) return `2:0:${rand(11, 20)}:${rand(1, 9)}`
    return `3:${rand(0, NAMES.length - 1)}:${rand(11, 20)}:${rand(1, 9)}`
  },
  build: (key) => {
    const [L = 1, ni = 0, a = 0, b = 0] = nums(key)
    const ans = a - b
    if (L === 3) {
      const text = `${name(ni)} has ${a} stickers. ${name(ni)} gives ${b} away. How many are left?`
      return numeric(key, { text, say: text }, ans, [ans + 1, ans - 1, a, b])
    }
    return numeric(key, plain(`${a} − ${b} = ?`), ans, [a, b, ans + 1, ans - 1])
  },
})

// --- Fact families and properties: "3 + 4 = 7, so 7 − 3 = ?" -----------------------------------

const factFamilies = keyedSkill({
  id: 'factFamilies',
  label: (L) => ['Fact families up to 10', 'Add in any order', 'Related subtraction facts'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) {
      const a = rand(1, 9)
      return `1:${rand(0, 2)}:${a}:${rand(1, 10 - a)}`
    }
    if (L === 2) return `2:${rand(0, 1)}:${rand(1, 9)}:${rand(1, 9)}`
    return `3:0:${rand(1, 9)}:${rand(1, 9)}`
  },
  build: (key) => {
    const [L = 1, f = 0, a = 0, b = 0] = nums(key)
    const s = a + b
    if (L === 1) {
      if (f === 0) return numeric(key, plain(`${a} + ${b} = ?`), s, [a, b, s + 1, s - 1])
      if (f === 1) return numeric(key, plain(`${s} − ${a} = ?`), b, [a, s, b + 1, b - 1])
      return numeric(key, plain(`${s} − ${b} = ?`), a, [b, s, a + 1, a - 1])
    }
    if (L === 2) {
      if (f === 0) return numeric(key, plain(`${a} + ${b} = ${b} + ?`), a, [b, s, a + 1, a - 1])
      return numeric(key, plain(`${a} + ${b} = ? + ${a}`), b, [a, s, b + 1, b - 1])
    }
    const text = `${a} + ${b} = ${s}. So ${s} − ${b} = ?`
    return numeric(key, { text, say: `${a} plus ${b} is ${s}. So ${s} minus ${b} is what?` }, a, [b, s, a + 1, a - 1])
  },
})

// --- True sentences: "Which number sentence is true?" -----------------------------------------

const trueSentence = keyedSkill({
  id: 'trueSentence',
  label: (L) => ['Which sentence is true? Up to 10', 'Add or subtract: which is true?', 'Which sentence is true? Up to 20'][L - 1]!,
  formats: CHOICE,
  key: (L) => {
    if (L === 1) {
      const a = rand(1, 9)
      return `1:0:${a}:${rand(1, 10 - a)}`
    }
    if (L === 2) {
      const a = rand(1, 9)
      return `2:${rand(0, 1)}:${a}:${rand(1, 10 - a)}`
    }
    return `3:0:${rand(1, 9)}:${rand(1, 9)}`
  },
  build: (key) => {
    const [L = 1, f = 0, a = 0, b = 0] = nums(key)
    // Addition: a + b = a+b. Subtraction: (a+b) − b = a. Each wrong sentence changes one number by one, so it is never true.
    const sub = L === 2 && f === 1
    const x = sub ? a + b : a
    const op = sub ? '−' : '+'
    const z = sub ? a : a + b
    const wrong = [`${x} ${op} ${b} = ${z + 1}`, `${x} ${op} ${b} = ${z - 1}`, `${x + 1} ${op} ${b} = ${z}`, `${x} ${op} ${b + 1} = ${z}`]
    return {
      key,
      prompt: plain('Which number sentence is true?'),
      answer: `${x} ${op} ${b} = ${z}`,
      wrong: (k) => shuffle([...wrong]).slice(0, k),
    }
  },
})

// --- Rounding: to the nearest ten, estimating sums, to the nearest hundred ----------------------

const nearestTen = keyedSkill({
  id: 'nearestTen',
  label: (L) => ['Round to the nearest ten', 'Estimate by rounding to tens', 'Round to the nearest hundred'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 9)}:${pick(DIGITS)}`
    if (L === 2) return `2:${rand(1, 8)}:${pick(DIGITS)}:${rand(1, 8)}:${pick(DIGITS)}`
    // Skip 50 itself, which would be a tie.
    const r = rand(1, 98)
    return `3:${rand(1, 9)}:${r >= 50 ? r + 1 : r}`
  },
  build: (key) => {
    const [L = 1, p = 0, q = 0, r = 0, s = 0] = nums(key)
    if (L === 1) {
      const n = 10 * p + q
      const down = 10 * p
      const up = down + 10
      const ans = q < 5 ? down : up
      return numeric(key, plain(`Round ${n} to the nearest ten.`), ans, [q < 5 ? up : down, ans + 10, ans - 10, n])
    }
    if (L === 2) {
      const a = 10 * p + q
      const b = 10 * r + s
      const ra = q < 5 ? 10 * p : 10 * p + 10
      const rb = s < 5 ? 10 * r : 10 * r + 10
      const ans = ra + rb
      const text = `Estimate ${a} + ${b}. Round each number to the nearest ten, then add.`
      return numeric(key, { text, say: text }, ans, [a + b, ans + 10, ans - 10, ans + 1])
    }
    const n = 100 * p + q
    const down = 100 * p
    const up = down + 100
    const ans = q < 50 ? down : up
    return numeric(key, plain(`Round ${n} to the nearest hundred.`), ans, [q < 50 ? up : down, ans + 100, ans - 100, n])
  },
})

// --- Counting on a hundred chart and past 100: "10 more", "100 more" ----------------------------

/**
 * The whole hundred chart (1 to 100) as it looks in IXL: n is shaded, and the cell right below n is the ? box.
 * The chart is padded sideways so it draws wide enough to read on a phone.
 */
function hundredChartPic(n: number): string {
  const W = 30
  const H = 26
  const pad = 48
  const cells: string[] = []
  for (let i = 1; i <= 100; i++) {
    const x = pad + ((i - 1) % 10) * W
    const y = Math.floor((i - 1) / 10) * H
    const fill = i === n ? '#a5d8ff' : i === n + 10 ? '#ffe066' : '#f8f9fa'
    const label = i === n + 10 ? '?' : String(i)
    cells.push(
      `<rect x="${x + 1}" y="${y + 1}" width="${W - 2}" height="${H - 2}" fill="${fill}" stroke="#868e96" stroke-width="1"/>` +
        `<text x="${x + W / 2}" y="${y + H / 2 + 5}" font-size="13" font-weight="700" text-anchor="middle" fill="#212529">${label}</text>`,
    )
  }
  return `<svg viewBox="0 0 ${10 * W + 2 * pad} ${10 * H}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">${cells.join('')}</svg>`
}

const bigCount = keyedSkill({
  id: 'bigCount',
  label: (L) => ['Hundred chart: directly below', 'Count forward up to 1,000', '10 or 100 more'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:0:${rand(1, 89)}`
    if (L === 2) return `2:0:${rand(100, 998)}`
    const f = rand(0, 1)
    return `3:${f}:${rand(100, f === 0 ? 989 : 899)}`
  },
  build: (key) => {
    const [L = 1, f = 0, n = 0] = nums(key)
    if (L === 1) {
      // A hundred chart has 10 numbers in every row, so the number directly below is 10 more. The chart is drawn so nobody has to imagine it.
      const text = `What number is right below ${n} on the hundred chart?`
      return numeric(key, { text, say: text, svg: hundredChartPic(n) }, n + 10, [n, n + 1, n - 1, n + 9, n + 11])
    }
    if (L === 2) return numeric(key, plain(`What number comes after ${n}?`), n + 1, [n, n + 2, n + 10, n - 10])
    const step = f === 1 ? 100 : 10
    const ans = n + step
    return numeric(key, plain(`What is ${step} more than ${n}?`), ans, [n, ans + 1, ans - 1, n + (f === 1 ? 10 : 100)])
  },
})

// --- Squares in a rectangle: count, area, and walking around the edge --------------------------

const CELL = 28

/** A rectangle drawn as a grid of squares: w across, h down. */
function gridPic(w: number, h: number): string {
  const squares = Array.from(
    { length: w * h },
    (_, i) => `<rect x="${(i % w) * CELL + 4}" y="${Math.floor(i / w) * CELL + 4}" width="${CELL}" height="${CELL}" fill="#4dabf7" stroke="#fff" stroke-width="2"/>`,
  )
  return `<svg viewBox="0 0 ${w * CELL + 8} ${h * CELL + 8}" xmlns="http://www.w3.org/2000/svg">${squares.join('')}</svg>`
}

const gridSquares = keyedSkill({
  id: 'gridSquares',
  label: (L) => ['Count squares in a rectangle', 'Area: how many squares', 'Walk around the edge'][L - 1]!,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 5)}:${rand(2, 4)}`
    if (L === 2) return `2:${rand(3, 7)}:${rand(2, 6)}`
    return `3:${rand(2, 7)}:${rand(2, 5)}`
  },
  build: (key) => {
    const [L = 1, w = 0, h = 0] = nums(key)
    if (L === 3) {
      const ans = 2 * (w + h)
      // Each step is one side of a square. Counting the squares along the edge gives 4 fewer, the classic slip (offered as a wrong answer).
      const text = 'Walk all the way around the outside edge. Each step is one side of a square. How many steps?'
      return numeric(key, { text, say: text, svg: gridPic(w, h) }, ans, [ans - 4, w * h, ans + 2, ans - 2])
    }
    const ans = w * h
    const text = L === 1 ? 'How many squares are in this rectangle?' : 'How many squares cover this rectangle?'
    return numeric(key, { text, say: text, svg: gridPic(w, h) }, ans, [w + h, ans + w, ans - h, ans + 1])
  },
})

/** Early math skills (K–2). Not yet registered in SUBJECTS; the math subject adds them. */
export const MATH_EARLY: Skill[] = [
  numberWords,
  countSmall,
  teenNumbers,
  countForwardBack,
  tensCount,
  addPictures,
  subPictures,
  addOrSub,
  compareMore,
  tensAdd,
  subStrategy,
  addFacts,
  subFacts,
  factFamilies,
  trueSentence,
  nearestTen,
  bigCount,
  gridSquares,
]

/** One IXL topic per level, keyed by our skill id. Grades never go down by level. */
export const MATH_EARLY_IXL: Record<string, IxlRef[]> = {
  'math.numberWords': [m(0, 'Numbers to 3'), m(0, 'Numbers to 5'), m(2, 'Names of numbers')],
  'math.countSmall': [m(0, 'Counting to 3'), m(0, 'Numbers and counting to 7'), m(0, 'Numbers and counting to 9')],
  'math.teenNumbers': [m(0, 'Teen numbers'), m(0, 'Teen numbers'), m(0, 'Numbers to 20')],
  'math.countForwardBack': [m(0, 'Counting forward and back to 10'), m(0, 'Counting forward and back to 20'), m(0, 'Numbers and counting to 100')],
  'math.tensCount': [m(0, 'Counting by tens'), m(0, 'Counting by tens'), m(1, 'Counting to 100')],
  'math.addPictures': [m(0, 'Understand addition up to 5'), m(0, 'Addition up to 5'), m(0, 'Understand addition up to 10')],
  'math.subPictures': [m(0, 'Understand subtraction up to 5'), m(0, 'Subtraction up to 5'), m(0, 'Understand subtraction up to 10')],
  'math.addOrSub': [m(0, 'Mixed operations'), m(0, 'Mixed operations'), m(0, 'Mixed operation word problems')],
  'math.compareMore': [m(1, 'Comparing up to 10'), m(1, 'Comparison word problems up to 10'), m(1, 'Comparison word problems up to 20')],
  'math.tensAdd': [m(1, 'Addition and subtraction: multiples of ten'), m(1, 'Addition: two digits'), m(1, 'Addition: two digits')],
  'math.subStrategy': [m(1, 'Subtraction strategies up to 10'), m(1, 'Subtraction strategies up to 20'), m(2, 'Subtraction strategies: one digit')],
  'math.addFacts': [m(1, 'Addition up to 10'), m(2, 'Addition: one digit'), m(2, 'Addition: one digit')],
  'math.subFacts': [m(1, 'Subtraction up to 10'), m(2, 'Subtraction: one digit'), m(2, 'Subtraction: one digit')],
  'math.factFamilies': [m(1, 'Addition and subtraction up to 10'), m(2, 'Properties'), m(2, 'Properties')],
  'math.trueSentence': [m(1, 'True or false equations'), m(1, 'True or false equations'), m(1, 'True or false equations')],
  'math.nearestTen': [m(2, 'Estimation and rounding'), m(2, 'Estimation and rounding'), m(2, 'Estimation and rounding')],
  'math.bigCount': [m(2, 'Counting'), m(2, 'Counting'), m(2, 'Addition: three digits')],
  'math.gridSquares': [m(2, 'Area and perimeter'), m(2, 'Area and perimeter'), m(2, 'Area and perimeter')],
}
