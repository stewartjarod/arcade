import type { Format, ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { coinsSVG } from './clocksCoins'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

/**
 * More math for kindergarten through grade 2, plus a few grade 3–4 word-problem skills.
 * Names and levels follow IXL's category names (see MORE_MATH_IXL at the bottom).
 *
 * How a question is made: each level has a short key like "2:4:7" (level first, then the numbers).
 * All the randomness happens when the key is made. The same key always rebuilds the same
 * question, so a missed one can come back later (fromKey).
 */

const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']
const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-weight="700">${body}</svg>`
const txt = (x: number, y: number, t: string | number, size = 16, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#333">${t}</text>`

const nums = (key: string) => key.split(':').map(Number)
/** A row of n pictures with spaces between, so a phone can wrap it. */
const row = (emoji: string, n: number) => Array(n).fill(emoji).join(' ')
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const reduced = (p: number, q: number) => p >= 1 && p < q && gcd(p, q) === 1

/** A skill from a key maker (random, once) and a key → question builder (no randomness). */
function keyedSkill(o: {
  id: string
  label: (L: number) => string
  maxLevel: number
  formats: Format[]
  unlocksAfter?: { skill: string; level: number }[]
  key: (L: number) => string
  build: (key: string) => ItemSpec | null
}): Skill {
  return {
    id: o.id,
    label: o.label,
    maxLevel: o.maxLevel,
    formats: o.formats,
    ...(o.unlocksAfter ? { unlocksAfter: o.unlocksAfter } : {}),
    generate: (L) => o.build(o.key(L))!,
    fromKey: (key, L) => (key.split(':')[0] === String(L) ? o.build(key) : null),
  }
}

const NUMBER_CHOICE: Format[] = ['number', 'choice']
const CHOICE: Format[] = ['choice']

// --- Stories: "Zoe has 3 apples. She gets 2 more..." -----------------------------------------

const NAMES = ['Zoe', 'Mia', 'Sam', 'Leo', 'Ava', 'Max']
const THINGS: [string, string][] = [['🍎', 'apples'], ['🐟', 'fish'], ['⭐', 'stars'], ['🍪', 'cookies'], ['🎈', 'balloons'], ['🐸', 'frogs']]
const STORY_TOP = [5, 10, 20]

function storyKey(L: number, sub: boolean) {
  const top = STORY_TOP[L - 1]!
  // Subtraction: the kid starts with a and gives away b (so b < a). Addition: the total stays within the top.
  const a = sub ? rand(2, top) : rand(2, top - 1)
  const b = sub ? rand(1, a - 1) : rand(1, top - a)
  return [L, rand(0, NAMES.length - 1), rand(0, THINGS.length - 1), a, b].join(':')
}

function storyBuild(sub: boolean) {
  return (key: string): ItemSpec | null => {
    const [, ni, ti, a, b] = nums(key)
    const name = NAMES[ni!]
    const thing = THINGS[ti!]
    if (!name || !thing || !a || !b) return null
    const [emoji, noun] = thing
    const ans = sub ? a - b : a + b
    const text = sub
      ? `${name} has ${a} ${noun}. ${name} gives ${b} to a friend. How many ${noun} does ${name} have now?`
      : `${name} has ${a} ${noun}. ${name} gets ${b} more. How many ${noun} does ${name} have now?`
    const picture = sub ? row(emoji!, a) : `${row(emoji!, a)} + ${row(emoji!, b)}`
    return {
      key,
      prompt: { text, say: text, ...(Number(key.split(':')[0]) <= 2 ? { emoji: picture } : {}) },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [a, b, ans + 1, ans - 1, ans + 2]),
    }
  }
}

const addStories = keyedSkill({
  id: 'addStories',
  label: (L) => ['Adding stories up to 5', 'Adding stories up to 10', 'Adding stories up to 20'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => storyKey(L, false),
  build: storyBuild(false),
})

const subStories = keyedSkill({
  id: 'subStories',
  label: (L) => ['Taking away stories up to 5', 'Taking away stories up to 10', 'Taking away stories up to 20'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => storyKey(L, true),
  build: storyBuild(true),
})

// --- Missing numbers: "3 + ? = 7", "? + 2 = 9", "7 − ? = 3" -----------------------------------

function missingBuild(key: string): ItemSpec | null {
  const [, form, a, b] = nums(key)
  if (form === undefined || !a || !b) return null
  const t = a + b
  const [text, say, ans]: [string, string, number] =
    form === 0 ? [`${a} + ? = ${t}`, `${a} plus what equals ${t}?`, b]
    : form === 1 ? [`? + ${b} = ${t}`, `What plus ${b} equals ${t}?`, a]
    : [`${t} − ? = ${a}`, `${t} minus what equals ${a}?`, b]
  return { key, prompt: { text, say }, answer: String(ans), wrong: (k) => numberWrongs(ans, k, [t, a, b, ans + 1, ans - 1]) }
}

const missingPart = keyedSkill({
  id: 'missingPart',
  label: (L) => ['Find the missing number up to 5', 'Find the missing number up to 10', 'Find the missing number up to 20'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const top = [5, 10, 20][L - 1]!
    const a = rand(1, top - 1)
    const b = rand(1, top - a)
    // Level 1 only has the adding forms; subtracting comes in at level 2.
    const form = L === 1 ? rand(0, 1) : rand(0, 2)
    return [L, form, a, b].join(':')
  },
  build: missingBuild,
})

// --- Addition strategies: make 10, doubles, three numbers -----------------------------------

function tenFrame(n: number) {
  const cells = Array.from({ length: 10 }, (_, i) => {
    const x = 6 + (i % 5) * 42
    const y = 6 + Math.floor(i / 5) * 42
    return `<rect x="${x}" y="${y}" width="40" height="40" fill="#fff" stroke="#495057" stroke-width="2"/>` + (i < n ? `<circle cx="${x + 20}" cy="${y + 20}" r="14" fill="#ff6b6b"/>` : '')
  })
  return svg(218, 90, cells.join(''))
}

function strategyBuild(key: string): ItemSpec | null {
  const [L, x, y, z] = nums(key)
  if (L === 1) {
    // Ten frame: the dots shown are the first part of making 10.
    const n = x!
    const ans = 10 - n
    return {
      key,
      prompt: { text: 'How many more to make 10?', say: 'How many more to make 10?', svg: tenFrame(n) },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [n, ans + 1, ans - 1, n + 1]),
    }
  }
  if (L === 2) {
    // Doubles (y = 0) and near doubles (y = 1: one more than a double).
    const a = x!
    const b = a + y!
    const ans = a + b
    const y2 = y!
    return {
      key,
      prompt: { text: `${a} + ${b} = ?`, say: `${a} plus ${b}. ${y2 === 0 ? `Think: double ${a}.` : `Think: double ${a}, then add 1.`}` },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [2 * a, ans + 1, ans - 1, ans + 2]),
    }
  }
  const [a, b, c] = [x!, y!, z!]
  const ans = a + b + c
  return {
    key,
    prompt: { text: `${a} + ${b} + ${c} = ?`, say: `${a} plus ${b} plus ${c}?` },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [a + b, b + c, a + c, ans + 1, ans - 1]),
  }
}

const strategies = keyedSkill({
  id: 'strategies',
  label: (L) => ['Make 10 with ten frames', 'Doubles and near doubles', 'Add three numbers'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 9)}`
    if (L === 2) return `2:${rand(2, 9)}:${rand(0, 1)}`
    let a = 0, b = 0, c = 0
    do {
      a = rand(1, 9)
      b = rand(1, 9)
      c = rand(1, 9)
    } while (a + b + c > 20)
    return `3:${a}:${b}:${c}`
  },
  build: strategyBuild,
})

// --- One more and one less ------------------------------------------------------------------

function oneMoreBuild(key: string): ItemSpec | null {
  const [L, form, n] = nums(key)
  if (form === undefined || !n) return null
  const ans = form === 0 ? n + 1 : n - 1
  const text = form === 0 ? `What is one more than ${n}?` : `What is one less than ${n}?`
  return {
    key,
    prompt: { text, say: text, ...(L! <= 2 ? { emoji: row('🍎', n) } : {}) },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [n, n + 1, n - 1, n + 2, n - 2]),
  }
}

const oneMoreLess = keyedSkill({
  id: 'oneMoreLess',
  label: (L) => ['One more and one less to 5', 'One more and one less to 10', 'One more and one less to 20'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const top = [5, 10, 20][L - 1]!
    const form = rand(0, 1)
    // "One more than" needs a number below the top; "one less than" needs one above 1.
    const n = form === 0 ? rand(1, top - 1) : rand(2, top)
    return [L, form, n].join(':')
  },
  build: oneMoreBuild,
})

// --- Even and odd ---------------------------------------------------------------------------

const nextEven = (n: number) => (n % 2 === 0 ? n + 2 : n + 1)
const nextOdd = (n: number) => (n % 2 === 1 ? n + 2 : n + 1)

function evenBuild(key: string): ItemSpec | null {
  const [L, a, b] = nums(key)
  if (L === 1) {
    const n = a!
    const ans = nextEven(n)
    return {
      key,
      prompt: { text: `What is the next even number after ${n}?`, say: `What is the next even number after ${n}?` },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [n, n + 1, n + 2, ans + 2, ans - 2]),
    }
  }
  if (L === 2) {
    const n = a!
    const ans = nextOdd(n)
    return {
      key,
      prompt: { text: `What is the next odd number after ${n}?`, say: `What is the next odd number after ${n}?` },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [n, n + 1, n + 2, ans + 2, ans - 2]),
    }
  }
  // Level 3: one even number, and three odd numbers as the wrong choices.
  const odds = key.split(':')[2]!.split(',').map(Number)
  if (!a || odds.length !== 3) return null
  return {
    key,
    prompt: { text: 'Which number is even?', say: 'Which number is even?' },
    answer: String(a),
    wrong: (k) => shuffle([...odds]).slice(0, k).map(String),
  }
}

const evenOdd = keyedSkill({
  id: 'evenOdd',
  label: (L) => ['Next even number', 'Next odd number', 'Which number is even?'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(1, 19)}`
    if (L === 2) return `2:${rand(1, 49)}`
    const e = rand(1, 25) * 2
    const odds = new Set<number>()
    while (odds.size < 3) odds.add(rand(0, 24) * 2 + 1)
    return `3:${e}:${[...odds].join(',')}`
  },
  build: evenBuild,
})

// --- Patterns (emoji, choice only) ----------------------------------------------------------

const UNITS = ['🔴', '🔵', '🟢', '🟡', '⭐', '🌙', '🍎', '🐸', '🔺', '⬛']

function patternBuild(key: string): ItemSpec | null {
  const [L, i, j, k] = nums(key)
  if (L === undefined || i === undefined || j === undefined) return null
  // AB: i j i j i → j.  ABC: i j k i j → k.  AAB: i i j i i → j.
  const [seq, next]: [number[], number] =
    L === 1 ? [[i, j, i, j, i], j]
    : L === 2 ? [[i, j, k!, i, j], k!]
    : [[i, i, j, i, i], j]
  const shown = seq.map((u) => UNITS[u]!)
  const ans = UNITS[next]!
  return {
    key,
    prompt: { text: 'What comes next in the pattern?', say: 'What comes next in the pattern?', emoji: `${shown.join(' ')} ?` },
    answer: ans,
    formats: CHOICE,
    wrong: (n) => wrongFrom(ans, n, UNITS, shown),
  }
}

const patterns = keyedSkill({
  id: 'patterns',
  label: (L) => ['Repeating patterns: AB', 'Repeating patterns: ABC', 'Repeating patterns: AAB'][L - 1]!,
  maxLevel: 3,
  formats: CHOICE,
  key: (L) => {
    const n = L === 2 ? 3 : 2
    const [i, j, k] = shuffle(UNITS.map((_, u) => u)).slice(0, n)
    return [L, i, j, ...(L === 2 ? [k] : [])].join(':')
  },
  build: patternBuild,
})

// --- Picture graphs --------------------------------------------------------------------------

const CATS: [string, string][] = [['🍎', 'apples'], ['🍌', 'bananas'], ['🍇', 'grapes'], ['🥕', 'carrots'], ['🍪', 'cookies']]

function graphBuild(key: string): ItemSpec | null {
  const [L, catsS, countsS, a, b] = key.split(':')
  const cats = catsS!.split(',').map((c) => CATS[Number(c)]!)
  const counts = countsS!.split(',').map(Number)
  const ia = Number(a)
  const ib = Number(b)
  if (cats.length !== 3 || counts.length !== 3 || !cats.every(Boolean)) return null
  const rows = cats
    .map(([emoji, name], r) => {
      const y = 40 + r * 44
      return txt(6, y, name!, 14, 'start') + Array.from({ length: counts[r]! }, (_, c) => txt(110 + c * 26, y + 7, emoji!, 20, 'start')).join('')
    })
    .join('')
  const picture = svg(270, 184, rows + txt(135, 170, 'Each picture stands for 1.', 13))
  const A = cats[ia]![1]!
  const B = cats[ib]![1]!
  const [text, ans, wrongs] =
    L === '1'
      ? [`How many ${A} are there?`, counts[ia]!, [counts[(ia + 1) % 3]!, counts[(ia + 2) % 3]!]]
      : L === '2'
        ? [`How many more ${A} than ${B}?`, counts[ia]! - counts[ib]!, [counts[ia]! + counts[ib]!, counts[ia]!, counts[ib]!]]
        : [`How many ${A} and ${B} are there in all?`, counts[ia]! + counts[ib]!, [Math.abs(counts[ia]! - counts[ib]!), counts[ia]!, counts[ib]!]]
  return {
    key,
    prompt: { text, say: text, svg: picture },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [...wrongs, ans + 1, ans - 1]),
  }
}

const graphs = keyedSkill({
  id: 'graphs',
  label: (L) => ['Picture graphs: count one row', 'Picture graphs: how many more?', 'Picture graphs: how many in all?'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: (L) => {
    const cats = shuffle([0, 1, 2, 3, 4]).slice(0, 3)
    let counts = [rand(1, 6), rand(1, 6), rand(1, 6)]
    let a = rand(0, 2)
    let b = (a + rand(1, 2)) % 3
    if (L === 1) b = 0
    if (L === 2) {
      // "How many more A than B" needs A to have more: pick counts that differ, then order them.
      while (counts[a] === counts[b]) counts = [rand(1, 6), rand(1, 6), rand(1, 6)]
      if (counts[a]! < counts[b]!) [a, b] = [b, a]
    }
    return [L, cats.join(','), counts.join(','), a, b].join(':')
  },
  build: graphBuild,
})

// --- Measurement: blocks, then rulers ---------------------------------------------------------

const blocks = (n: number, y: number, color: string) =>
  Array.from({ length: n }, (_, i) => `<rect x="${10 + i * 24}" y="${y}" width="24" height="24" fill="${color}" stroke="#495057" stroke-width="2"/>`).join('')

function ruler(n: number, unit: string) {
  const x0 = 12
  const s = 24
  const marks = Array.from({ length: 13 }, (_, k) => `<line x1="${x0 + k * s}" y1="62" x2="${x0 + k * s}" y2="72" stroke="#495057" stroke-width="2"/>${txt(x0 + k * s, 90, k, 12)}`).join('')
  return svg(x0 * 2 + 12 * s, 100, `<rect x="${x0}" y="28" width="${n * s}" height="22" fill="#ff6b6b" opacity=".85"/><rect x="${x0}" y="62" width="${12 * s}" height="10" fill="#fff8e1" stroke="#495057" stroke-width="2"/>${marks}${txt(x0 + 6 * s, 16, unit, 13)}`)
}

function measureBuild(key: string): ItemSpec | null {
  const [L, x, y] = nums(key)
  if (L === 1) {
    const n = x!
    return {
      key,
      prompt: { text: 'How many blocks long is this?', say: 'How many blocks long is this?', svg: svg(220, 50, blocks(n, 14, '#ffa94d')) },
      answer: String(n),
      wrong: (k) => numberWrongs(n, k, [n + 1, n - 1, n + 2, n - 2]),
    }
  }
  if (L === 2) {
    const a = x!
    const b = y!
    const d = a - b
    const text = 'How many more blocks is the top line than the bottom line?'
    return {
      key,
      prompt: { text, say: text, svg: svg(240, 100, blocks(a, 14, '#ffa94d') + blocks(b, 60, '#4dabf7')) },
      answer: String(d),
      wrong: (k) => numberWrongs(d, k, [a, b, a + b, d + 1, d - 1]),
    }
  }
  // Levels 3 and 4: a bar measured against a ruler that starts at 0.
  const n = x!
  const unit = L === 3 ? 'inches' : 'centimeters'
  const text = `How many ${unit} long is this bar?`
  return {
    key,
    prompt: { text, say: text, svg: ruler(n, unit) },
    answer: String(n),
    wrong: (k) => numberWrongs(n, k, [n + 1, n - 1, n + 2, n - 2]),
  }
}

const measure = keyedSkill({
  id: 'measure',
  label: (L) => ['Measure with blocks', 'How many more blocks?', 'Measure in inches', 'Measure in centimeters'][L - 1]!,
  maxLevel: 4,
  formats: NUMBER_CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 8)}`
    if (L === 2) {
      const a = rand(3, 9)
      return `2:${a}:${rand(1, a - 1)}`
    }
    return `${L}:${rand(2, 12)}`
  },
  build: measureBuild,
})

// --- Three-dimensional shapes (names only) --------------------------------------------------

// Keys name the object ("1:ball"), so an old key made with a different list gives null.
// The box is a tall cereal box, drawn: the 📦 emoji looks like a cube, and a box can be one, so "a box" had two right answers.
const CEREAL_BOX = svg(
  130,
  170,
  `<path d="M20 30 L45 10 L115 10 L90 30 Z" fill="#ffd8a8" stroke="#495057" stroke-width="3" stroke-linejoin="round"/>
  <path d="M90 30 L115 10 L115 140 L90 160 Z" fill="#e8590c" stroke="#495057" stroke-width="3" stroke-linejoin="round"/>
  <rect x="20" y="30" width="70" height="130" fill="${COLORS[1]}" stroke="#495057" stroke-width="3"/>
  <ellipse cx="55" cy="95" rx="24" ry="30" fill="#fff"/>
  <text x="55" y="103" font-size="22" text-anchor="middle" fill="#e8590c">O O</text>`,
)
// The cone is drawn too: 🍦 is mostly a swirl of ice cream, with only a little cone showing.
const CONE = svg(
  120,
  170,
  `<path d="M14 40 L60 162 L106 40 Z" fill="#e9b872" stroke="#495057" stroke-width="3" stroke-linejoin="round"/>
  <path d="M34 92 L78 46 M46 124 L98 62 M86 92 L42 46 M74 124 L22 62" stroke="#b07a3a" stroke-width="2.5"/>
  <ellipse cx="60" cy="40" rx="46" ry="14" fill="#f3d19c" stroke="#495057" stroke-width="3"/>`,
)
const OBJECTS: { word: string; emoji: string; svg?: string; phrase: string; shape: string }[] = [
  { word: 'ball', emoji: '⚽', phrase: 'a ball', shape: 'sphere' },
  { word: 'die', emoji: '🎲', phrase: 'a die', shape: 'cube' },
  { word: 'can', emoji: '🥫', phrase: 'a soup can', shape: 'cylinder' },
  { word: 'cone', emoji: '', svg: CONE, phrase: 'an ice cream cone', shape: 'cone' },
  { word: 'box', emoji: '', svg: CEREAL_BOX, phrase: 'a cereal box', shape: 'rectangular prism' },
]
// A cube is also a rectangular prism, so the two are never offered as wrong answers to each other. Level 1 has no box.
const SOLID_ALSO_TRUE: Record<string, string[]> = { cube: ['rectangular prism'], 'rectangular prism': ['cube'] }
const SOLID_CLUES: Record<string, [string, string]> = {
  nofaces: ['Which 3D shape has no flat faces?', 'sphere'],
  point: ['Which 3D shape has just one point?', 'cone'],
}

function solidBuild(key: string): ItemSpec | null {
  const [L = '', word = ''] = key.split(':')
  if (L === '3') {
    const clue = SOLID_CLUES[word]
    if (!clue) return null
    // Only one 3D shape fits each clue, so the answer is always clear.
    const [text, ans] = clue
    return { key, prompt: { text, say: text }, answer: ans, formats: CHOICE, wrong: (n) => wrongFrom(ans, n, OBJECTS.map((o) => o.shape)) }
  }
  const level = Number(L)
  const usable = level === 1 ? OBJECTS.slice(0, 4) : level === 2 ? OBJECTS : []
  const obj = usable.find((o) => o.word === word)
  if (!obj) return null
  const text = `What 3D shape is ${obj.phrase}?`
  return {
    key,
    prompt: obj.svg ? { text, say: text, svg: obj.svg } : { text, say: text, emoji: obj.emoji },
    answer: obj.shape,
    formats: CHOICE,
    wrong: (n) => wrongFrom(obj.shape, n, usable.map((o) => o.shape).filter((s) => !(SOLID_ALSO_TRUE[obj.shape] ?? []).includes(s))),
  }
}

const solids = keyedSkill({
  id: 'solids',
  label: (L) => ['Name the three-dimensional shape', 'Name the three-dimensional shape', 'Attributes of three-dimensional shapes'][L - 1]!,
  maxLevel: 3,
  formats: CHOICE,
  key: (L) => (L === 1 ? `1:${pick(['ball', 'die', 'can', 'cone'])}` : L === 2 ? `2:${pick(OBJECTS.map((o) => o.word))}` : `3:${pick(['nofaces', 'point'])}`),
  build: solidBuild,
})

// --- Fractions of shapes ----------------------------------------------------------------------

// Halves, thirds and fourths only: the answers and the wrong choices stay in grade 1–2 range.
const FRACTIONS: string[] = []
for (let q = 2; q <= 4; q++) for (let p = 1; p < q; p++) if (reduced(p, q)) FRACTIONS.push(`${p}/${q}`)

/** A bar cut into d equal parts, with the first n shaded. */
function strip(d: number, n: number) {
  const W = 200
  const w = W / d
  const rects = Array.from({ length: d }, (_, i) => `<rect x="${4 + i * w}" y="4" width="${w}" height="56" fill="${i < n ? COLORS[2] : '#fff'}" stroke="#495057" stroke-width="2"/>`).join('')
  return svg(208, 64, rects)
}

function partBuild(key: string): ItemSpec | null {
  const [L, p, q] = nums(key)
  if (L === 1) {
    const k = p!
    const ans = String(k)
    return {
      key,
      prompt: { text: 'How many equal parts is this shape split into?', say: 'How many equal parts is this shape split into?', svg: strip(k, 0) },
      answer: ans,
      formats: CHOICE,
      wrong: (n) => wrongFrom(ans, n, ['1', '2', '3', '4', '5', '6']),
    }
  }
  if (!p || !q) return null
  // Level 2: what part is green. Level 3: what part is NOT green (the other part).
  // 1st and 2nd graders learn these as words ("one third"), not as "1/3" or the word "fraction": that's 3rd grade.
  const green = `${p}/${q}`
  const ans = fractionWords(L === 3 ? `${q - p}/${q}` : green)
  const near = [green, `${q - p}/${q}`, `${p + 1}/${q}`].filter((f) => FRACTIONS.includes(f)).map(fractionWords)
  const text = `This shape has ${q} equal parts. How much of it is ${L === 3 ? 'NOT green' : 'green'}?`
  return {
    key,
    prompt: { text, say: text, svg: strip(q, p) },
    answer: ans,
    formats: CHOICE,
    wrong: (n) => wrongFrom(ans, n, FRACTIONS.map(fractionWords), near),
  }
}

/** "2/3" → "two thirds", the way 1st and 2nd grade say it. */
function fractionWords(f: string) {
  const [p, q] = f.split('/').map(Number) as [number, number]
  const part = ['', '', 'half', 'third', 'fourth'][q]!
  return `${['', 'one', 'two', 'three'][p]} ${p === 1 ? part : part === 'half' ? 'halves' : `${part}s`}`
}

const equalParts = keyedSkill({
  id: 'equalParts',
  label: (L) => ['Count the equal parts', 'Identify halves, thirds, and fourths', 'Halves, thirds, and fourths: the part not colored'][L - 1]!,
  maxLevel: 3,
  formats: CHOICE,
  key: (L) => {
    if (L === 1) return `1:${rand(2, 4)}`
    let d = 0
    let n = 0
    do {
      d = rand(2, 4)
      n = rand(1, d - 1)
    } while (!reduced(n, d))
    return `${L}:${n}:${d}`
  },
  build: partBuild,
})

// --- Calendar: days and months -----------------------------------------------------------------

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Two weeks of days from today (shaded), so "in 4 days" can be counted along the picture. */
function twoWeeksPic(today: number) {
  const cells = Array.from({ length: 14 }, (_, i) => {
    const x = 4 + (i % 7) * 40
    const y = 4 + Math.floor(i / 7) * 38
    return (
      `<rect x="${x}" y="${y}" width="36" height="34" rx="5" fill="${i === 0 ? '#ffe066' : '#f8f9fa'}" stroke="#868e96"/>` +
      `<text x="${x + 18}" y="${y + 22}" font-size="12" font-weight="700" text-anchor="middle" fill="#212529" font-family="sans-serif">${DAYS[(today + i) % 7]!.slice(0, 3)}</text>`
    )
  }).join('')
  return `<svg viewBox="0 0 288 80" role="img" aria-label="Two weeks of days, starting with today">${cells}</svg>`
}

function calendarBuild(key: string): ItemSpec | null {
  const [L, x, y] = nums(key)
  if (L === 3) {
    // x = today's day, y = how many days later.
    const today = DAYS[x!]
    if (!today) return null
    const ans = DAYS[(x! + y!) % 7]!
    const text = `Today is ${today}. What day will it be in ${y} days?`
    return {
      key,
      prompt: { text, say: text, svg: twoWeeksPic(x!) },
      answer: ans,
      formats: CHOICE,
      wrong: (n) => wrongFrom(ans, n, DAYS, [today, DAYS[(x! + y! + 1) % 7]!, DAYS[(x! + y! + 6) % 7]!]),
    }
  }
  const list = L === 1 ? DAYS : MONTHS
  const word = L === 1 ? 'day' : 'month'
  const i = x!
  const after = y === 0
  const ans = after ? list[(i + 1) % list.length]! : list[(i - 1 + list.length) % list.length]!
  const text = `What ${word} comes ${after ? 'after' : 'before'} ${list[i]}?`
  return {
    key,
    prompt: { text, say: text },
    answer: ans,
    formats: CHOICE,
    wrong: (n) => wrongFrom(ans, n, list, [list[i]!, list[(i + 2) % list.length]!, list[(i - 2 + list.length) % list.length]!]),
  }
}

const calendar = keyedSkill({
  id: 'calendar',
  label: (L) => ['The day before or after', 'The month before or after', 'Days later on a calendar'][L - 1]!,
  maxLevel: 3,
  formats: CHOICE,
  key: (L) => {
    if (L === 3) return `3:${rand(0, 6)}:${rand(2, 6)}`
    return `${L}:${rand(0, L === 1 ? 6 : 11)}:${rand(0, 1)}`
  },
  build: calendarBuild,
})

// --- Equal groups and arrays ------------------------------------------------------------------

function groupBuild(key: string): ItemSpec | null {
  const [L, x, y] = nums(key)
  if (L === 1) {
    // g bags with s apples each.
    const g = x!
    const s = y!
    const ans = g * s
    const bags = Array.from({ length: g }, (_, i) => {
      const x0 = 4 + i * 68
      const dots = Array.from({ length: s }, (_, j) => `<circle cx="${x0 + 10 + j * 10}" cy="34" r="4.5" fill="#ff6b6b"/>`).join('')
      return `<rect x="${x0}" y="4" width="60" height="60" rx="10" fill="#e7f5ff" stroke="#4dabf7" stroke-width="2"/>${dots}`
    }).join('')
    const text = `Each bag has ${s} apples. There are ${g} bags. How many apples in all?`
    return {
      key,
      prompt: { text, say: text, svg: svg(g * 68 + 4, 68, bags) },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [g + s, ans + s, ans - s, s, g]),
    }
  }
  if (L === 2) {
    // An array: r rows of c dots.
    const r = x!
    const c = y!
    const ans = r * c
    const dots = Array.from({ length: r * c }, (_, i) => `<circle cx="${14 + (i % c) * 26}" cy="${14 + Math.floor(i / c) * 26}" r="10" fill="${COLORS[(Math.floor(i / c)) % COLORS.length]}"/>`).join('')
    const text = 'How many dots are in this array?'
    return {
      key,
      prompt: { text, say: 'How many dots are there?', svg: svg(28 + (c - 1) * 26, 28 + (r - 1) * 26, dots) },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [r + c, ans + c, ans - c, ans + r, ans - r]),
    }
  }
  // Level 3: total shared equally among g friends.
  const g = x!
  const q = y!
  const total = g * q
  const text = `${total} cookies are shared equally by ${g} friends. How many cookies does each friend get?`
  return {
    key,
    prompt: { text, say: text },
    answer: String(q),
    wrong: (k) => numberWrongs(q, k, [g, q + 1, q - 1, total, q + 2]),
  }
}

const equalGroups = keyedSkill({
  id: 'equalGroups',
  label: (L) => ['Equal groups: repeated adding', 'Arrays: rows of dots', 'Sharing equally'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'add', level: 2 }],
  key: (L) => {
    if (L === 1) return `1:${rand(2, 4)}:${rand(2, 5)}`
    if (L === 2) return `2:${rand(2, 6)}:${rand(2, 6)}`
    return `3:${rand(2, 5)}:${rand(2, 6)}`
  },
  build: groupBuild,
})

// --- Money word problems ----------------------------------------------------------------------

const COINS = [
  { one: 'penny', many: 'pennies', cents: 1 },
  { one: 'nickel', many: 'nickels', cents: 5 },
  { one: 'dime', many: 'dimes', cents: 10 },
  { one: 'quarter', many: 'quarters', cents: 25 },
]
const coinNoun = (c: number, n: number) => (n === 1 ? COINS[c]!.one : COINS[c]!.many)

// Keys: level 1 is "1:name:coinA:countA:coinB:countB"; levels 2-3 are "L:name:form:a:b".
function moneyBuild(key: string): ItemSpec | null {
  const [L, ni, x1, x2, x3, x4] = nums(key)
  const name = NAMES[ni!]
  if (!name) return null
  if (L === 1) {
    // Coins: x2 coins of kind x1, and x4 coins of kind x3. Answer is cents.
    const c1 = COINS[x1!]
    const c2 = COINS[x3!]
    if (!c1 || !c2) return null
    const n1 = x2!
    const n2 = x4!
    const ans = n1 * c1.cents + n2 * c2.cents
    const text = `${name} has ${n1} ${coinNoun(x1!, n1)} and ${n2} ${coinNoun(x3!, n2)}. How many cents does ${name} have in all?`
    return {
      key,
      prompt: { text, say: text, svg: coinsSVG([...Array<string>(n1).fill(c1.one), ...Array<string>(n2).fill(c2.one)]) },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [n1 + n2, n1 * c1.cents, n2 * c2.cents, ans + 5, ans - 5, ans + 10, ans - 10]),
    }
  }
  // Levels 2 and 3: x1 = form (0 gets more, 1 spends), x2 and x3 = the two amounts.
  const a = x2!
  const b = x3!
  const dollars = L === 3
  const fmt = (v: number) => (dollars ? `$${v}` : `${v} cents`)
  const unit = dollars ? 'dollars' : 'cents'
  const ans = x1 === 0 ? a + b : a - b
  const text =
    x1 === 0
      ? `${name} has ${fmt(a)}. ${name} gets ${fmt(b)} more. How many ${unit} does ${name} have now?`
      : `${name} has ${fmt(a)}. ${name} spends ${fmt(b)} on a toy. How many ${unit} are left?`
  return {
    key,
    prompt: { text, say: text },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [a, b, ans + 10, ans - 10, ans + 1, ans - 1]),
  }
}

function moneyKey(L: number): string {
  const ni = rand(0, NAMES.length - 1)
  if (L === 1) {
    let c1 = 0, c2 = 0, n1 = 0, n2 = 0
    do {
      c1 = rand(0, 3)
      c2 = rand(0, 3)
      n1 = rand(1, 4)
      n2 = rand(1, 4)
    } while (c1 === c2 || n1 * COINS[c1]!.cents + n2 * COINS[c2]!.cents > 99)
    return [L, ni, c1, n1, c2, n2].join(':')
  }
  const form = rand(0, 1)
  if (L === 2) {
    // Cents: add up to 99, or take a smaller amount from a bigger one.
    const a = form === 0 ? rand(10, 70) : rand(20, 99)
    const b = form === 0 ? rand(5, 99 - a) : rand(1, a - 1)
    return [L, ni, form, a, b].join(':')
  }
  // Dollars: add up to 100, or take a smaller amount from a bigger one.
  const a = form === 0 ? rand(10, 80) : rand(20, 99)
  const b = form === 0 ? rand(1, 100 - a) : rand(1, a - 1)
  return [L, ni, form, a, b].join(':')
}

const moneyWords = keyedSkill({
  id: 'moneyWords',
  label: (L) => ['Coins: how many cents?', 'Add and take away cents', 'Add and take away dollars'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  key: moneyKey,
  build: moneyBuild,
})

// --- Two-step word problems -------------------------------------------------------------------

function twoStepBuild(key: string): ItemSpec | null {
  const [L, ni, oi, a, b, c] = nums(key)
  const name = NAMES[ni!]
  const thing = THINGS[oi!]
  if (!name || !thing || !a || !b || !c) return null
  const noun = thing[1]
  if (L === 3) {
    // a = bags, b = apples in each bag, c = how many taken out.
    const ans = a * b - c
    const text = `There are ${a} bags with ${b} ${noun} in each bag. Then ${c} ${noun} are taken out. How many ${noun} are left?`
    return {
      key,
      prompt: { text, say: text },
      answer: String(ans),
      wrong: (k) => numberWrongs(ans, k, [a * b, a + b, ans + c, ans + 1, ans - 1]),
    }
  }
  const ans = a + b - c
  const text = `${name} has ${a} ${noun}. ${name} gets ${b} more. Then ${name} gives ${c} away. How many ${noun} does ${name} have now?`
  return {
    key,
    prompt: { text, say: text },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [a + b, a - c, a + b + c, ans + 1, ans - 1]),
  }
}

const twoStep = keyedSkill({
  id: 'twoStep',
  label: (L) => ['Two steps with small numbers', 'Two steps with bigger numbers', 'Two steps: groups, then take away'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'add', level: 2 }],
  key: (L) => {
    const ni = rand(0, NAMES.length - 1)
    const oi = rand(0, THINGS.length - 1)
    if (L === 1) {
      const a = rand(2, 9)
      const b = rand(1, 9)
      return [L, ni, oi, a, b, rand(1, Math.min(9, a + b - 1))].join(':')
    }
    if (L === 2) {
      const a = rand(12, 60)
      const b = rand(10, 40)
      return [L, ni, oi, a, b, rand(5, Math.min(40, a + b - 1))].join(':')
    }
    const a = rand(2, 6)
    const b = rand(2, 9)
    return [L, ni, oi, a, b, rand(1, a * b - 1)].join(':')
  },
  build: twoStepBuild,
})

// --- Multiplication word problems ------------------------------------------------------------

// [plural, singular, items, preposition]: "on each plate" but "in each bag".
const GROUPS: [string, string, string, string][] = [
  ['bags', 'bag', 'apples', 'in'],
  ['boxes', 'box', 'crayons', 'in'],
  ['plates', 'plate', 'cookies', 'on'],
  ['jars', 'jar', 'marbles', 'in'],
  ['rows', 'row', 'chairs', 'in'],
]

function mulStoryBuild(key: string): ItemSpec | null {
  const [, gi, g, s] = nums(key)
  const group = GROUPS[gi!]
  if (!group || !g || !s) return null
  const [plural, single, items, prep] = group
  const ans = g * s
  const text = `There are ${g} ${plural} with ${s} ${items} ${prep} each ${single}. How many ${items} are there in all?`
  return {
    key,
    prompt: { text, say: text },
    answer: String(ans),
    wrong: (k) => numberWrongs(ans, k, [g + s, ans + g, ans - g, ans + s, ans - s]),
  }
}

const mulStories = keyedSkill({
  id: 'mulStories',
  label: (L) => ['Equal groups, small numbers', 'Equal groups, bigger numbers', 'Equal groups, two-digit numbers'][L - 1]!,
  maxLevel: 3,
  formats: NUMBER_CHOICE,
  unlocksAfter: [{ skill: 'mul', level: 6 }],
  key: (L) => {
    const gi = rand(0, GROUPS.length - 1)
    if (L === 1) return `1:${gi}:${rand(2, 6)}:${rand(2, 9)}`
    if (L === 2) return `2:${gi}:${rand(3, 9)}:${rand(6, 12)}`
    return `3:${gi}:${rand(11, 24)}:${rand(11, 19)}`
  },
  build: mulStoryBuild,
})

// --- Skills and their IXL topics ----------------------------------------------------------------

export const MORE_MATH: Skill[] = [
  addStories,
  subStories,
  missingPart,
  strategies,
  oneMoreLess,
  evenOdd,
  patterns,
  graphs,
  measure,
  solids,
  equalParts,
  calendar,
  equalGroups,
  moneyWords,
  twoStep,
  mulStories,
]

const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })
const rep = (n: number, ref: IxlRef): IxlRef[] => Array.from({ length: n }, () => ref)

/** One IXL topic per level (index 0 = level 1), keyed by skill id. Grades never go down by level. */
export const MORE_MATH_IXL: Record<string, IxlRef[]> = {
  'math.addStories': [m(0, 'Addition word problems up to 5'), m(0, 'Addition word problems up to 10'), m(1, 'Addition word problems up to 20')],
  'math.subStories': [m(0, 'Subtraction word problems up to 5'), m(0, 'Subtraction word problems up to 10'), m(1, 'Subtraction word problems up to 20')],
  'math.missingPart': [m(0, 'Take apart numbers up to 5'), m(0, 'Take apart numbers up to 10'), m(1, 'Complete the equation')],
  'math.strategies': [m(1, 'Addition strategies up to 10'), m(1, 'Addition strategies up to 20'), m(2, 'Addition strategies: one digit')],
  'math.oneMoreLess': [m(0, 'One more and one less to 5'), m(0, 'One more and one less to 10'), m(0, 'One more and one less to 20')],
  'math.evenOdd': rep(3, m(2, 'Even and odd')),
  'math.patterns': [m(0, 'Patterns'), m(0, 'Patterns'), m(1, 'Patterns')],
  'math.graphs': [m(0, 'Data and graphs'), m(1, 'Data and graphs'), m(2, 'Data and graphs')],
  'math.measure': [m(0, 'Measurement'), m(1, 'Measurement'), m(2, 'Customary units of length'), m(2, 'Metric units of length')],
  'math.solids': [m(0, 'Three-dimensional shapes'), m(1, 'Three-dimensional shapes'), m(2, 'Three-dimensional shapes')],
  'math.equalParts': [m(0, 'Fractions of shapes'), m(1, 'Fractions'), m(2, 'Fractions')],
  'math.calendar': [m(1, 'Days, months, and seasons'), m(1, 'Days, months, and seasons'), m(2, 'Calendars')],
  'math.equalGroups': [m(2, 'Repeated addition'), m(3, 'Understand multiplication'), m(3, 'Understand division')],
  'math.moneyWords': [m(1, 'Money'), m(2, 'Add and subtract money up to $1'), m(2, 'Money up to $100')],
  'math.twoStep': [m(2, 'Mixed operations word problems: one digit'), m(2, 'Mixed operations word problems: two digits'), m(3, 'Two-step word problems')],
  'math.mulStories': [m(3, 'Multiplication word problems'), m(3, 'Multiplication word problems'), m(4, 'Multiply by two-digit numbers: applications')],
}
