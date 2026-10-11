import type { Format, ItemSpec, Prompt, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { countRowsSVG } from './mathEarly'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * The last math skills: IXL topics no other math file covers yet. Positions, same and different,
 * Venn diagrams, money sense, word problems, two- and three-digit strategies, and a few more.
 * Same shape as mathEarly.ts: three levels that climb in IXL grade and never go back down.
 *
 * Each level's key is made with randomness once ("1:4:2" = level, then the numbers). The same key
 * always rebuilds the same question, so a missed one can come back (fromKey).
 */

const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })
const NUMBER_CHOICE: Format[] = ['number', 'choice']
const CHOICE: Format[] = ['choice']
const plain = (text: string): Prompt => ({ text, say: text })
const row = (emoji: string, n: number) => Array(n).fill(emoji).join(' ')
const nums = (key: string) => key.split(':').map(Number)
const NAMES = ['Zoe', 'Mia', 'Sam', 'Leo', 'Ava']
const STORY_ITEMS: [string, string][] = [['🍎', 'apples'], ['🐸', 'frogs'], ['⭐', 'stars'], ['🎈', 'balloons'], ['🐟', 'fish'], ['🍪', 'cookies']]

/** A skill whose key is made once (randomly) and rebuilt the same way later. Keys start with the level. */
function keyedSkill(o: {
  id: string
  labels: string[]
  formats: Format[]
  key: (L: number) => string
  /** Old keys whose fields changed meaning return null here, instead of a different question. */
  valid?: (key: string) => boolean
  build: (key: string) => ItemSpec
  unlocksAfter?: { skill: string; level: number }[]
}): Skill {
  return {
    id: o.id,
    label: (L) => o.labels[L - 1]!,
    maxLevel: o.labels.length,
    formats: o.formats,
    ...(o.unlocksAfter ? { unlocksAfter: o.unlocksAfter } : {}),
    generate: (L) => o.build(o.key(L)),
    fromKey: (key, L) => (key.split(':')[0] === String(L) && (o.valid?.(key) ?? true) ? o.build(key) : null),
  }
}

/** A whole-number answer. The wrong options are slips near the answer, first. */
function numeric(key: string, prompt: Prompt, answer: number, near: number[]): ItemSpec {
  return { key, prompt, answer: String(answer), wrong: (k) => numberWrongs(answer, k, near) }
}

/** A word or picture answer. The wrong options come from `pool`; any in `near` go first. */
function choice(key: string, prompt: Prompt, answer: string, pool: readonly string[], near: readonly string[] = []): ItemSpec {
  return { key, prompt, answer, wrong: (k) => wrongFrom(answer, k, pool, near) }
}

// --- Positions: "Is the red ball above or below the box?" -------------------------------------------

const BALL_AT: Record<string, [number, number]> = {
  above: [100, 34],
  below: [100, 166],
  left: [34, 100],
  right: [166, 100],
  inside: [100, 100],
  outside: [166, 100],
}
// Each level's question names its four choices, and each picture has exactly one right one.
// Level 2 is inside, or outside on the right: a ball above or below the box would be outside too, so those are never drawn.
const POSITION_WORDS = [['above', 'below', 'left', 'right'], ['inside', 'outside', 'above', 'below'], ['left', 'right', 'inside', 'above']]
const POSITION_ANSWERS = [POSITION_WORDS[0]!, ['inside', 'outside'], ['left', 'right']]
const POSITION_ASK = [
  'Where is the red ball? Above, below, left, or right of the box?',
  'Where is the red ball? Inside, outside, above, or below the box?',
  'Where is the red ball? Left, right, inside, or above the box?',
]

const positionPic = (where: string) => {
  const [x, y] = BALL_AT[where]!
  return `<svg viewBox="0 0 200 200" role="img" aria-label="A red ball ${where} the box"><rect x="70" y="70" width="60" height="60" rx="6" fill="#b45309"/><circle cx="${x}" cy="${y}" r="16" fill="#ef4444"/></svg>`
}

// Keys: "L:where" (the word for the answer, so the same key always draws the same picture).
const positions = keyedSkill({
  id: 'positions',
  labels: ['Above, below, left, or right', 'Inside or outside', 'Left or right'],
  formats: CHOICE,
  key: (L) => `${L}:${pick(POSITION_ANSWERS[L - 1]!)}`,
  valid: (key) => POSITION_ANSWERS[Number(key.split(':')[0]) - 1]?.includes(key.split(':')[1] ?? '') ?? false,
  build: (key) => {
    const [l = '1', where = ''] = key.split(':')
    const L = Number(l)
    return choice(key, { text: POSITION_ASK[L - 1]!, say: POSITION_ASK[L - 1]!, svg: positionPic(where) }, where, POSITION_WORDS[L - 1]!)
  },
})

// --- Same and different: "Which one is the same as this?" (one picture, four choices, one match) ---

/**
 * [picture, same kind] pairs for each level. The picture is shown; its partner is the answer.
 * The other choices come from the other pairs, so none of them is the same kind as the picture.
 */
const SAME_PAIRS: [string, string][][] = [
  [['🍎', '🍏'], ['🐶', '🐕'], ['🐟', '🐠'], ['⭐', '🌟'], ['🚗', '🚕']],
  [['🟦', '🔵'], ['🟥', '🔴'], ['🟩', '🟢'], ['🟨', '🟡'], ['🟪', '🟣']],
  [['🟦', '⬛'], ['🔴', '⚫'], ['⭐', '🌟']],
]
const SAME_ASK = ['Which one is the same as this?', 'Which one is the same color as this?', 'Which one is the same shape as this?']

const sameDifferent = keyedSkill({
  id: 'sameDifferent',
  labels: ['Same thing', 'Same color', 'Same shape'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, SAME_PAIRS[L - 1]!.length - 1)}`,
  valid: (key) => {
    const [l = '0', p = ''] = key.split(':')
    const pairs = SAME_PAIRS[Number(l) - 1]
    return key.split(':').length === 2 && !!pairs && Number(p) < pairs.length
  },
  build: (key) => {
    const [L = 1, p = 0] = nums(key)
    const pairs = SAME_PAIRS[L - 1]!
    const [picture, same] = pairs[p]!
    const others = pairs.filter((_, i) => i !== p).flat()
    return choice(key, { text: SAME_ASK[L - 1]!, say: SAME_ASK[L - 1]!, emoji: picture }, same, others)
  },
})

// --- Real-world shapes: "Which one is shaped like a ball?" ----------------------------------------

const REAL_SHAPES = [
  { ask: 'Which one is shaped like a ball?', answers: ['⚽', '🏀', '🎾'], wrong: ['📦', '🥫', '🍦', '🎁'] },
  { ask: 'Which one is shaped like a box?', answers: ['📦', '🎁'], wrong: ['⚽', '🥫', '🍦', '🏀'] },
  { ask: 'Which one is shaped like a can?', answers: ['🥫'], wrong: ['⚽', '📦', '🍦', '🎁'] },
]

const realShapes = keyedSkill({
  id: 'realShapes',
  labels: ['Shaped like a ball', 'Shaped like a box', 'Shaped like a can'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, REAL_SHAPES[L - 1]!.answers.length - 1)}`,
  build: (key) => {
    const [L = 1, i = 0] = nums(key)
    const s = REAL_SHAPES[L - 1]!
    // min(): a saved key can point past the end of a list that got shorter.
    return choice(key, plain(s.ask), s.answers[Math.min(i, s.answers.length - 1)]!, s.wrong)
  },
})

// --- Classifying and sorting: "Which one is a fruit?" ----------------------------------------------

const GROUPS = [
  { ask: 'Which one is a fruit?', yes: ['🍎', '🍌', '🍇', '🍓'], no: ['🐶', '🚗', '🧸', '⚽'] },
  { ask: 'Which one is an animal?', yes: ['🐸', '🐶', '🐟', '🐥'], no: ['🍎', '🚗', '🏠', '⭐'] },
  { ask: 'Which one is a vehicle?', yes: ['🚗', '🚌', '🚲', '🚂'], no: ['🍎', '🐶', '🧸', '⭐'] },
]

const classifying = keyedSkill({
  id: 'classifying',
  labels: ['Sort into fruits', 'Sort into animals', 'Sort into vehicles'],
  formats: CHOICE,
  key: (L) => `${L}:${rand(0, 3)}`,
  build: (key) => {
    const [L = 1, i = 0] = nums(key)
    const g = GROUPS[L - 1]!
    return choice(key, plain(g.ask), g.yes[i]!, g.no)
  },
})

// --- Financial literacy: needs, saving, and making money last --------------------------------------

const NEEDS = ['🍞', '💧', '🧦', '🧼']
const WANTS = ['🍭', '🎮', '🧸', '🎈']

const financeBasics = keyedSkill({
  id: 'financeBasics',
  labels: ['Needs and wants', 'Saving up for something', 'Money left after buying'],
  formats: CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(0, NEEDS.length - 1)}`
    if (L === 2) {
      const price = rand(4, 20)
      return `2:${price}:${rand(1, price - 2)}`
    }
    const start = rand(5, 20)
    return `3:${start}:${rand(1, start - 1)}`
  },
  build: (key) => {
    const [L = 1, a = 0, b = 0] = nums(key)
    if (L === 1) return choice(key, { text: 'Which one do you need?', say: 'Which one do you need to stay healthy?' }, NEEDS[a]!, WANTS)
    if (L === 2) {
      // Saving up for a toy: how much more is needed? (one clear answer, no opinions)
      const more = a - b
      return {
        key,
        prompt: plain(`${NAMES[a % NAMES.length]} wants a toy that costs $${a}. ${NAMES[a % NAMES.length]} has saved $${b}. How much more does ${NAMES[a % NAMES.length]} need to save?`),
        answer: `$${more}`,
        wrong: (k) => numberWrongs(more, k, [a, b, a + b, more + 1, more - 1]).map((v) => `$${v}`),
      }
    }
    // Dollars: start with $a, spend $b, and see what is left. Wrong answers are the price, the start, or near misses.
    const left = a - b
    return {
      key,
      prompt: plain(`Zoe has $${a}. She buys a toy for $${b}. How much money is left?`),
      answer: `$${left}`,
      wrong: (k) => numberWrongs(left, k, [b, a, left + 1, left - 1]).map((v) => `$${v}`),
    }
  },
})

// --- Venn diagrams: "How many are in both circles?" ------------------------------------------------

// Five spots inside a region: the middle, then four around it (a region shows at most five shapes).
const VENN_OFFS: [number, number][] = [[0, 0], [-12, -11], [12, -11], [-12, 11], [12, 11]]

/**
 * Two circles, labeled "Circles" and "Blue", with real shapes inside: red circles only in the first circle,
 * blue circles in both, and blue squares only in the second. Shapes are as big as a child's finger on a phone.
 */
const vennPic = (circlesOnly: number, both: number, blueOnly: number) => {
  const at = (cx: number, n: number, draw: (x: number, y: number) => string) =>
    VENN_OFFS.slice(0, n)
      .map(([dx, dy]) => draw(cx + dx, 80 + dy))
      .join('')
  const redCircle = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="8" fill="#ef4444"/>`
  const blueCircle = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="8" fill="#2563eb"/>`
  const blueSquare = (x: number, y: number) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#2563eb"/>`
  return (
    `<svg viewBox="0 0 240 160" role="img" aria-label="A Venn diagram with circles on the left and blue shapes on the right">` +
    `<circle cx="90" cy="80" r="56" fill="none" stroke="#475569" stroke-width="3"/>` +
    `<circle cx="150" cy="80" r="56" fill="none" stroke="#2563eb" stroke-width="3"/>` +
    `<text x="48" y="16" font-size="14" font-weight="700" text-anchor="middle" fill="#334155" font-family="sans-serif">Circles</text>` +
    `<text x="192" y="16" font-size="14" font-weight="700" text-anchor="middle" fill="#2563eb" font-family="sans-serif">Blue</text>` +
    at(62, circlesOnly, redCircle) +
    at(120, both, blueCircle) +
    at(178, blueOnly, blueSquare) +
    `</svg>`
  )
}

const venn = keyedSkill({
  id: 'venn',
  labels: ['Venn diagrams: in both circles', 'Venn diagrams: all of them', 'Venn diagrams: only one circle'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    const [lo, hi] = L === 1 ? [0, 3] : L === 2 ? [0, 4] : [1, 5]
    return `${L}:${rand(lo, hi)}:${rand(lo, hi)}:${rand(lo, hi)}`
  },
  build: (key) => {
    const [L = 1, circlesOnly = 0, both = 0, blueOnly = 0] = nums(key)
    // Say "rings", not "circles": one group IS circles, so "in the two circles" could mean the circle shapes.
    const ask = L === 1 ? 'How many shapes are inside both rings?' : L === 2 ? 'How many shapes are inside the rings altogether?' : 'How many are circles, but not blue?'
    const ans = L === 1 ? both : L === 2 ? circlesOnly + both + blueOnly : circlesOnly
    return numeric(key, { text: ask, say: ask, svg: vennPic(circlesOnly, both, blueOnly) }, ans, [circlesOnly, both, blueOnly, circlesOnly + both, both + blueOnly, ans + 1, ans - 1])
  },
})

// --- Understanding addition and subtraction (grade 1) ----------------------------------------------

const understandAdd = keyedSkill({
  id: 'understandAdd',
  labels: ['Putting groups together', 'Groups up to 10', 'Counting on up to 20'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 4)}:${rand(1, 5)}:${rand(0, 5)}`
    if (L === 2) {
      const a = rand(4, 9)
      return `2:${a}:${rand(1, 10 - a)}:${rand(0, 5)}`
    }
    // Counting on a small number (1 to 3) from a start up to 17, so the sum stays within 20.
    return `3:${rand(5, 17)}:${rand(1, 3)}:0`
  },
  build: (key) => {
    const [L = 1, a = 0, b = 0, t = 0] = nums(key)
    const ans = a + b
    if (L === 3) return numeric(key, plain(`Start at ${a}. Count on ${b}. What number do you get?`), ans, [ans + 1, ans - 1, a, b])
    const [e1] = STORY_ITEMS[t % STORY_ITEMS.length]!
    // Same picture on both sides, so "in all" counts one kind of thing (like IXL's picture sums).
    return numeric(key, { text: 'How many in all?', say: `${a} plus ${b}. How many in all?`, emoji: `${row(e1, a)} + ${row(e1, b)}` }, ans, [ans + 1, ans - 1, a, b])
  },
})

const understandSub = keyedSkill({
  id: 'understandSub',
  labels: ['Taking away', 'How many went away?', 'How many more?'],
  formats: NUMBER_CHOICE,
  key: (L) => {
    const a = rand(3, 10)
    // Level 2 always leaves at least two, so the story can say "are left".
    const b = rand(1, L === 2 ? a - 2 : a - 1)
    return `${L}:${a}:${b}:${rand(0, STORY_ITEMS.length - 1)}`
  },
  build: (key) => {
    const [L = 1, a = 0, b = 0, t = 0] = nums(key)
    // The same thing in every story (apples, frogs, ...), so the picture and the words match.
    const [e1, noun] = STORY_ITEMS[t % STORY_ITEMS.length]!
    // Enough near misses that no wrong answer is pulled in from far away (a small answer would otherwise get "12").
    if (L === 1) {
      const text = `Zoe has ${a} ${noun}. She gives ${b} away. How many are left?`
      return numeric(key, { text, say: text, emoji: row(e1, a) }, a - b, [a, b, a - b + 1, a - b - 1, a - b + 2 <= 10 ? a - b + 2 : a - b - 2])
    }
    if (L === 2) {
      const text = `Zoe had ${a} ${noun}. Now ${a - b} are left. How many went away?`
      return numeric(key, { text, say: text, emoji: row(e1, a - b) }, b, [a - b, a, b + 1, b - 1, b + 2 <= 10 ? b + 2 : b - 2])
    }
    const text = `Zoe has ${a} ${noun}. Mia has ${b} ${noun}. How many more does Zoe have?`
    return numeric(key, { text, say: text, svg: countRowsSVG([['Zoe', e1, a], ['Mia', e1, b]]) }, a - b, [a, b, a - b + 1, a - b - 1])
  },
})

// --- Story problems up to 10 and 20 (grade 1) -------------------------------------------------------

type Op = 'a' | 's'

/** "L:a:x:y" = x and y are put together. "L:s:x:y" = y is taken away from x. Names and things are picked once. */
const storyKey = (L: number, op: Op, cap: number) => {
  const who = rand(0, NAMES.length - 1)
  const what = rand(0, STORY_ITEMS.length - 1)
  if (op === 'a') {
    const total = rand(4, cap)
    const a = rand(2, total - 2)
    return `${L}:a:${a}:${total - a}:${who}:${what}`
  }
  const start = rand(4, cap)
  return `${L}:s:${start}:${rand(2, start - 2)}:${who}:${what}`
}

const storyBuild = (key: string): ItemSpec => {
  const [, op = 'a', xs = '0', ys = '0', ws = '0', ts = '0'] = key.split(':')
  const x = Number(xs)
  const y = Number(ys)
  const name = NAMES[Number(ws)]!
  const [emoji, noun] = STORY_ITEMS[Number(ts)]!
  if (op === 'a') {
    const ans = x + y
    const text = `${name} has ${x} ${noun}. A friend gives ${name} ${y} more. How many ${noun} now?`
    return numeric(key, { text, say: text, emoji: row(emoji, x) }, ans, [x, y, ans + 1, ans - 1])
  }
  const text = `${name} has ${x} ${noun}. ${name} gives ${y} to a friend. How many are left?`
  return numeric(key, { text, say: text, emoji: row(emoji, x) }, x - y, [x, y, x - y + 1, x - y - 1])
}

const storySkill = (id: string, cap: number, labels: string[], unlocksAfter?: { skill: string; level: number }[]) =>
  keyedSkill({
    id,
    labels,
    formats: NUMBER_CHOICE,
    unlocksAfter,
    // Level 1 adds, level 2 takes away, level 3 mixes both.
    key: (L) => storyKey(L, L === 1 ? 'a' : L === 2 ? 's' : pick(['a', 's'] as const), cap),
    build: storyBuild,
  })

const story10 = storySkill('story10', 10, ['Adding word problems up to 10', 'Taking away word problems up to 10', 'Adding and taking away up to 10'])
const story20 = storySkill('story20', 20, ['Adding word problems up to 20', 'Taking away word problems up to 20', 'Adding and taking away up to 20'], [{ skill: 'story10', level: 2 }])

// --- Adding and taking away up to 20, within one picture of each other (grade 1) -------------------

/** "L:a:x:y" = x + y. "L:s:x:y" = x − y. Used by the plain fact skills. */
const sumDiff = (key: string): ItemSpec => {
  const [, op = 'a', xs = '0', ys = '0'] = key.split(':')
  const x = Number(xs)
  const y = Number(ys)
  const ans = op === 'a' ? x + y : x - y
  // Near misses: one off, the numbers in the sum, and a ten off (only when the answer is 10 or more, so no "14" for 2 + 2).
  const tens = ans >= 10 ? [ans + 10, ans - 10] : []
  return numeric(key, plain(`${x} ${op === 'a' ? '+' : '−'} ${y} = ?`), ans, [ans + 1, ans - 1, x, y, ...tens])
}

const addSubTwenty = keyedSkill({
  id: 'addSubTwenty',
  labels: ['Adding and taking away up to 10', 'Adding and taking away up to 15', 'Adding and taking away up to 20'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'add', level: 2 }],
  key: (L) => {
    const cap = [10, 15, 20][L - 1]!
    if (Math.random() < 0.5) {
      const total = rand(2, cap)
      const a = rand(1, total - 1)
      return `${L}:a:${a}:${total - a}`
    }
    const start = rand(2, cap)
    return `${L}:s:${start}:${rand(1, start - 1)}`
  },
  build: sumDiff,
})

// --- Mixed operations with one-digit numbers (grade 2) ---------------------------------------------

const mixedOneDigit = keyedSkill({
  id: 'mixedOneDigit',
  labels: ['Add, then take away (one digit)', 'Take away, then add (one digit)', 'Add, then take away (bigger)'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'add', level: 2 }],
  key: (L) => {
    if (L === 1) {
      const a = rand(1, 8)
      const b = rand(1, 9 - a)
      return `1:${a}:${b}:${rand(1, a + b - 1)}`
    }
    if (L === 2) {
      const a = rand(2, 9)
      return `2:${a}:${rand(1, a - 1)}:${rand(1, 9)}`
    }
    const a = rand(1, 9)
    const b = rand(1, 9)
    return `3:${a}:${b}:${rand(1, Math.min(9, a + b - 1))}`
  },
  build: (key) => {
    const [L = 1, a = 0, b = 0, c = 0] = nums(key)
    if (L === 2) {
      const ans = a - b + c
      return numeric(key, plain(`${a} − ${b} + ${c} = ?`), ans, [a + c, a - b, ans + 1, ans - 1])
    }
    const ans = a + b - c
    return numeric(key, plain(`${a} + ${b} − ${c} = ?`), ans, [a + b, ans + 1, ans - 1, c])
  },
})

// --- Two- and three-digit addition and subtraction strategies (grade 2) ----------------------------

/** Two numbers with `digits` digits. Adding stays at most the top; taking away stays positive. */
const digitsKey = (L: number, op: Op, digits: 2 | 3) => {
  const lo = digits === 2 ? 10 : 100
  const top = digits === 2 ? 99 : 999
  if (op === 'a') {
    const a = rand(lo, top - lo)
    return `${L}:a:${a}:${rand(lo, top - a)}`
  }
  const a = rand(lo * 2, top)
  return `${L}:s:${a}:${rand(lo, a - 1)}`
}

const twoDigitStrategy = keyedSkill({
  id: 'twoDigitStrategy',
  labels: ['Adding two-digit numbers', 'Taking away two-digit numbers', 'Adding and taking away two-digit numbers'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'add', level: 2 }],
  key: (L) => digitsKey(L, L === 1 ? 'a' : L === 2 ? 's' : pick(['a', 's'] as const), 2),
  build: sumDiff,
})

const threeDigitStrategy = keyedSkill({
  id: 'threeDigitStrategy',
  labels: ['Adding three-digit numbers', 'Taking away three-digit numbers', 'Adding and taking away three-digit numbers'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'twoDigitStrategy', level: 1 }],
  key: (L) => digitsKey(L, L === 1 ? 'a' : L === 2 ? 's' : pick(['a', 's'] as const), 3),
  build: sumDiff,
})

// --- Units: feet, meters, and yards (grade 3) ------------------------------------------------------

const customaryMetric = keyedSkill({
  id: 'customaryMetric',
  labels: ['Feet to inches', 'Meters to centimeters', 'Yards to feet'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'round', level: 2 }],
  key: (L) => `${L}:${L === 1 ? rand(2, 6) : rand(2, 9)}`,
  build: (key) => {
    const [L = 1, n = 0] = nums(key)
    const [text, ans] = L === 1 ? [`How many inches are in ${n} feet?`, 12 * n] : L === 2 ? [`How many centimeters are in ${n} meters?`, 100 * n] : [`How many feet are in ${n} yards?`, 3 * n]
    return numeric(key, plain(text), ans, [n, ans + 1, ans - 1, 10 * n])
  },
})

// --- Ordering four numbers (grade 3) ---------------------------------------------------------------

const orderNumbers = keyedSkill({
  id: 'orderNumbers',
  labels: ['Greatest of four', 'Least of four', 'Second greatest of four'],
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'round', level: 2 }],
  key: (L) => {
    const set = new Set<number>()
    while (set.size < 4) set.add(rand(100, 999))
    return [L, ...set].join(':')
  },
  build: (key) => {
    const [L = 1, ...list] = nums(key)
    const desc = [...list].sort((x, y) => y - x)
    const word = L === 1 ? 'greatest' : L === 2 ? 'least' : 'second greatest'
    const ans = L === 1 ? desc[0]! : L === 2 ? desc[3]! : desc[1]!
    const others = list.filter((v) => v !== ans).map(String)
    return choice(key, { text: `Which is the ${word}: ${list.join(', ')}?`, say: `Which is the ${word}?` }, String(ans), others)
  },
})

// --- Fractions and decimals (grades 4 and 5) -------------------------------------------------------

const relateFracDec = keyedSkill({
  id: 'relateFracDec',
  labels: ['Tenths as decimals', 'Decimals as fractions', 'Compare decimals and fractions'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'decimals', level: 2 }],
  key: (L) => (L === 3 ? `3:${rand(0, 3)}` : `${L}:${rand(1, 9)}`),
  build: (key) => {
    const [L = 1, n = 0] = nums(key)
    if (L === 1) {
      const word = n === 1 ? 'tenth' : 'tenths'
      return choice(key, { text: `What is ${n}/10 as a decimal?`, say: `What is ${n} ${word} as a decimal?` }, `0.${n}`, [`0.0${n}`, `${n}`, `0.${(n % 9) + 1}`])
    }
    if (L === 2) {
      return choice(key, { text: `Which fraction is 0.${n}?`, say: `Which fraction is 0.${n}?` }, `${n}/10`, [`${n}/100`, `${n}/9`, `${n}/1`, `${n}/20`])
    }
    const big = ['0.6', '0.7', '0.8', '0.9']
    return choice(key, { text: 'Which one is more than one half?', say: 'Which one is more than one half?' }, big[n]!, ['0.1', '0.2', '0.3', '0.4', '1/2'])
  },
})

// --- Shape and item patterns (grade 4) -------------------------------------------------------------

// Every item is a different shape AND color, so a pattern can't be read two ways (three squares made 🟦🟥🟦🟥 → 🟦 or ⬛?).
const PATTERN_ITEMS = ['🔺', '⭐', '🟦', '🔴', '🔶', '🌙']

const shapePattern = keyedSkill({
  id: 'shapePattern',
  labels: ['Two-item patterns', 'Three-item patterns', 'Patterns with a repeat'],
  formats: CHOICE,
  unlocksAfter: [{ skill: 'round', level: 2 }],
  key: (L) => {
    const [i = 0, j = 0, k = 0] = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3)
    return `${L}:${i}:${j}:${k}`
  },
  build: (key) => {
    const [L = 1, i = 0, j = 0, k = 0] = nums(key)
    const unit = L === 1 ? [i, j] : L === 2 ? [i, j, k] : [i, i, j]
    const seq = Array.from({ length: 7 }, (_, t) => PATTERN_ITEMS[unit[t % unit.length]!]!)
    const shown = seq.slice(0, 6)
    return choice(
      key,
      { text: 'What comes next?', say: 'What comes next in the pattern?', emoji: [...shown, '❓'].join(' ') },
      seq[6]!,
      PATTERN_ITEMS,
      [shown[5]!],
    )
  },
})

/** Math skills that cover IXL topics no other math file touches. Not yet registered in SUBJECTS. */
export const MATH_LAST: Skill[] = [
  positions,
  sameDifferent,
  realShapes,
  classifying,
  financeBasics,
  venn,
  understandAdd,
  understandSub,
  story10,
  story20,
  addSubTwenty,
  mixedOneDigit,
  twoDigitStrategy,
  threeDigitStrategy,
  customaryMetric,
  orderNumbers,
  relateFracDec,
  shapePattern,
]

/** One IXL topic per level, keyed by our skill id. Grades never go down by level. */
export const MATH_LAST_IXL: Record<string, IxlRef[]> = {
  'math.positions': [m(0, 'Positions'), m(0, 'Positions'), m(0, 'Positions')],
  'math.sameDifferent': [m(0, 'Same and different'), m(0, 'Same and different'), m(0, 'Same and different')],
  'math.realShapes': [m(0, 'Shapes in the real world'), m(0, 'Shapes in the real world'), m(0, 'Shapes in the real world')],
  'math.classifying': [m(0, 'Classifying and sorting'), m(0, 'Classifying and sorting'), m(0, 'Classifying and sorting')],
  'math.financeBasics': [m(0, 'Financial literacy'), m(1, 'Financial literacy'), m(2, 'Financial literacy')],
  'math.venn': [m(1, 'Venn diagrams'), m(1, 'Venn diagrams'), m(1, 'Venn diagrams')],
  'math.understandAdd': [m(1, 'Understand addition'), m(1, 'Understand addition'), m(1, 'Addition up to 20')],
  'math.understandSub': [m(1, 'Understand subtraction'), m(1, 'Understand subtraction'), m(1, 'Comparison word problems up to 10')],
  'math.story10': [m(1, 'Addition word problems up to 10'), m(1, 'Subtraction word problems up to 10'), m(1, 'Addition and subtraction word problems up to 10')],
  'math.story20': [m(1, 'Addition and subtraction word problems up to 20'), m(1, 'Addition and subtraction word problems up to 20'), m(1, 'Addition and subtraction word problems up to 20')],
  'math.addSubTwenty': [m(1, 'Addition and subtraction up to 20'), m(1, 'Addition and subtraction up to 20'), m(1, 'Addition and subtraction up to 20')],
  'math.mixedOneDigit': [m(2, 'Mixed operations: one digit'), m(2, 'Mixed operations: one digit'), m(2, 'Mixed operations: one digit')],
  'math.twoDigitStrategy': [m(2, 'Addition: two digits'), m(2, 'Subtraction: two digits'), m(2, 'Mixed operations: two digits')],
  'math.threeDigitStrategy': [m(2, 'Addition: three digits'), m(2, 'Subtraction: three digits'), m(2, 'Mixed operations: three digits')],
  // Unit conversions are IXL grade 4 (its "Convert and compare" skills), not grade 3.
  'math.customaryMetric': [m(4, 'Customary units of measurement'), m(4, 'Metric units of measurement'), m(4, 'Customary units of measurement')],
  'math.orderNumbers': [m(3, 'Comparing and ordering'), m(3, 'Comparing and ordering'), m(3, 'Comparing and ordering')],
  'math.relateFracDec': [m(4, 'Relate fractions and decimals'), m(5, 'Convert between decimals and fractions'), m(5, 'Compare decimals and fractions')],
  'math.shapePattern': [m(4, 'Shape patterns'), m(4, 'Shape patterns'), m(4, 'Shape patterns')],
}
