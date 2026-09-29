import type { ItemSpec, Skill, Subject } from '../core/types'
import { pick, rand, shuffle } from './util'

/**
 * Math: + − × ÷ facts (from Mouse Maze Math), place value, and skip counting.
 * Levels for + and − climb 10 → 20 → 50 → 100 → 200...; × and ÷ follow the
 * times tables in the order schools teach them.
 */

type Op = 'add' | 'sub' | 'mul' | 'div'
type Problem = { text: string; answer: number; op: Op; tier: number; operands: [number, number] }

// 1 → 10, 2 → 20, 3 → 50, 4 → 100, 5 → 200, 6 → 500, 7 → 1000...
export const cap = (L: number) => [1, 2, 5][(L - 1) % 3]! * 10 ** (1 + Math.floor((L - 1) / 3))

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

const SIGN: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' }

function build(op: Op, L: number): Problem {
  let a: number
  let b: number
  switch (op) {
    case 'add':
      a = rand(Math.max(1, Math.floor(cap(L) / 4)), cap(L) - 1)
      b = rand(1, cap(L) - a)
      return { text: `${a} + ${b}`, answer: a + b, op, tier: L, operands: [a, b] }
    case 'sub':
      a = rand(Math.max(2, Math.floor(cap(L) / 4)), cap(L))
      b = rand(1, a - 1)
      return { text: `${a} − ${b}`, answer: a - b, op, tier: L, operands: [a, b] }
    case 'mul': {
      if (L <= TABLE_LEVELS) {
        a = pickTable(L)
        b = rand(2, 10)
      } else {
        a = rand(2, 12)
        b = rand(Math.floor(bigFactor(L) / 3), bigFactor(L))
      }
      const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a]
      return { text: `${x} × ${y}`, answer: a * b, op, tier: L, operands: [x, y] }
    }
    case 'div':
      if (L <= TABLE_LEVELS) {
        b = pickTable(L)
        a = rand(2, 10)
      } else {
        b = rand(2, 12)
        a = rand(Math.floor(bigFactor(L) / 3), bigFactor(L))
      }
      return { text: `${a * b} ÷ ${b}`, answer: a, op, tier: L, operands: [a * b, b] }
  }
}

function fromText(text: string, tier: number): Problem | null {
  const m = text.match(/^(\d+) ([+−×÷]) (\d+)$/)
  if (!m) return null
  const [x, y] = [Number(m[1]), Number(m[3])]
  const op = (Object.keys(SIGN) as Op[]).find((k) => SIGN[k] === m[2])!
  const answer = op === 'add' ? x + y : op === 'sub' ? x - y : op === 'mul' ? x * y : x / y
  return { text, answer, op, tier, operands: [x, y] }
}

// Wrong answers are common slips, and the correct one is equally likely to be the smallest, middle or
// largest, so "pick the middle one" is no better than chance. With two-digit numbers, add/sub slips are
// tens slips (a missed or extra carry/borrow) that share the ones digit, so checking only the last digit isn't enough.
function distractors(p: Problem, count: number): number[] {
  const a = p.answer
  const [x, y] = p.operands
  const pool = new Set<number>()
  if ((p.op === 'add' || p.op === 'sub') && a >= 10 && Math.max(x, y) >= 20) {
    for (const d of a >= 200 ? [10, 20, 100] : [10, 20, 30]) pool.add(a + d).add(a - d)
  } else {
    for (const d of [1, 2, 3]) pool.add(a + d).add(a - d)
    if (p.op === 'add') pool.add(Math.abs(x - y))
    if (p.op === 'sub') pool.add(x + y)
  }
  if (p.op === 'mul') pool.add((x + 1) * y).add((x - 1) * y).add(x * (y + 1)).add(x * (y - 1)).add(x + y)
  if (p.op === 'div') pool.add(y)
  const options = [...pool].filter((v) => v >= 0 && v !== a)
  const below = shuffle(options.filter((v) => v < a))
  const above = shuffle(options.filter((v) => v > a))
  if (count !== 2) return shuffle([...below, ...above]).slice(0, count)
  const rank = pick([0, 1, 2].filter((r) => below.length >= r && above.length >= 2 - r))
  return shuffle([...below.slice(0, rank), ...above.slice(0, 2 - rank)])
}

// Seconds a fluent kid needs: reading three signs plus working it out, growing gently with difficulty.
const nominalSeconds = (tier: number) => 4 + 2 * tier ** 0.8

function problemItem(p: Problem): ItemSpec {
  return {
    key: p.text,
    prompt: { text: p.text, sum: true },
    answer: String(p.answer),
    wrong: (n) => distractors(p, n).map(String),
    seconds: nominalSeconds(p.tier),
  }
}

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

function opSkill(op: Op, o: Pick<Skill, 'label' | 'unlocksAfter' | 'startByGrade'> & { max: number }): Skill {
  return {
    id: op,
    label: o.label,
    maxLevel: o.max,
    formats: ['number', 'choice'],
    unlocksAfter: o.unlocksAfter,
    startByGrade: o.startByGrade,
    generate: (L) => problemItem(build(op, L)),
    fromKey: (key, L) => {
      const p = fromText(key, L)
      return p ? problemItem(p) : null
    },
  }
}

// --- Place value: tens and ones, hundreds, expanded form, 10 more / 100 less ---

function placeValue(L: number): ItemSpec {
  let text: string
  let answer: number
  let near: number[] = []
  if (L === 1) {
    const [t, o] = [rand(1, 9), rand(0, 9)]
    text = `${t} tens and ${o} ones`
    answer = t * 10 + o
    near = [o * 10 + t, t + o, t * 10]
  } else if (L === 2) {
    const n = rand(11, 99)
    const tens = Math.random() < 0.5
    text = `What digit is in the ${tens ? 'tens' : 'ones'} place of ${n}?`
    answer = tens ? Math.floor(n / 10) : n % 10
    near = [tens ? n % 10 : Math.floor(n / 10), n]
  } else if (L === 3) {
    const [h, t, o] = [rand(1, 9), rand(0, 9), rand(0, 9)]
    text = `${h} hundreds, ${t} tens and ${o} ones`
    answer = h * 100 + t * 10 + o
    near = [h * 100 + o * 10 + t, t * 100 + h * 10 + o, h + t + o]
  } else if (L === 4) {
    const [h, t, o] = [rand(1, 9), rand(1, 9), rand(0, 9)]
    text = `${h * 100} + ${t * 10} + ${o}`
    answer = h * 100 + t * 10 + o
    near = [h * 100 + o * 10 + t, h + t + o, h * 10 + t + o]
  } else if (L === 5) {
    const n = rand(101, 899)
    const [d, word] = pick([[10, 'more'], [10, 'less'], [100, 'more'], [100, 'less']] as const)
    text = `What is ${d} ${word} than ${n}?`
    answer = word === 'more' ? n + d : n - d
    near = [word === 'more' ? n - d : n + d, n + (d === 10 ? 100 : 10), n + 1]
  } else {
    const [th, h, t, o] = [rand(1, 9), rand(0, 9), rand(0, 9), rand(0, 9)]
    text = `${th} thousands, ${h} hundreds, ${t} tens and ${o} ones`
    answer = th * 1000 + h * 100 + t * 10 + o
    near = [th * 1000 + t * 100 + h * 10 + o, th * 100 + h * 10 + t + o]
  }
  const sum = L === 1 || L === 3 || L === 4 || L === 6
  return {
    key: text,
    prompt: { text, sum },
    answer: String(answer),
    wrong: (n) => numberWrongs(answer, n, near),
    seconds: 6 + L,
  }
}

// --- Skip counting: 10s, 5s, 2s, from any start, 100s and 3s, backwards ---

function skipCount(L: number): ItemSpec {
  let step: number
  let start: number
  let dir = 1
  if (L === 1) (step = 10), (start = 10 * rand(1, 5))
  else if (L === 2) (step = 5), (start = 5 * rand(1, 8))
  else if (L === 3) (step = 2), (start = 2 * rand(1, 10))
  else if (L === 4) (step = pick([10, 5])), (start = step * rand(1, 10) + (step === 10 ? rand(1, 9) : 0))
  else if (L === 5) (step = pick([100, 3, 4])), (start = step * rand(1, 6))
  else (step = pick([2, 5, 10])), (dir = -1), (start = step * rand(6, 15))
  const seq = [0, 1, 2].map((i) => start + dir * step * i)
  const answer = start + dir * step * 3
  const text = `${seq.join(', ')}, __`
  return {
    key: text,
    prompt: { text },
    answer: String(answer),
    wrong: (n) => numberWrongs(answer, n, [answer + step * dir, answer + dir, answer - dir, seq[2]!]),
    seconds: 5 + L,
  }
}

function numberWrongs(answer: number, count: number, near: number[]) {
  const pool = new Set(near.filter((v) => v >= 0 && v !== answer))
  for (const d of [1, 2, 10, 3]) for (const v of [answer + d, answer - d]) if (v >= 0 && v !== answer) pool.add(v)
  const first = shuffle(near.filter((v) => pool.has(v)))
  const rest = shuffle([...pool].filter((v) => !first.includes(v)))
  return [...new Set([...first, ...rest])].slice(0, count).map(String)
}

const SKIP_LABELS = ['Counting by 10s', 'Counting by 5s', 'Counting by 2s', 'Counting on from any number', 'Counting by 100s, 3s and 4s', 'Counting backwards']
const PLACE_LABELS = ['Tens and ones', 'Tens place and ones place', 'Hundreds, tens and ones', 'Adding up place values', '10 more, 100 less', 'Thousands']

export const math: Subject = {
  id: 'math',
  name: 'Math',
  emoji: '🔢',
  skills: [
    opSkill('add', {
      label: (L) => `Adding up to ${cap(L)}`,
      max: 12,
      startByGrade: { 0: 1, 1: 2, 2: 3.5, 3: 4.5, 4: 5 },
    }),
    opSkill('sub', {
      label: (L) => `Subtracting from ${cap(L)}`,
      max: 12,
      startByGrade: { 0: 1, 1: 1.5, 2: 3, 3: 4, 4: 5 },
    }),
    // Skills unlock in order: × once + and − are solid, ÷ once × is.
    opSkill('mul', {
      label: (L) => (L <= TABLE_LEVELS ? `Times tables: ${runs(tables(L))}` : `Big times tables`),
      max: 16,
      unlocksAfter: [{ skill: 'add', level: 3 }, { skill: 'sub', level: 3 }],
      startByGrade: { 3: 4, 4: 8 },
    }),
    opSkill('div', {
      label: (L) => (L <= TABLE_LEVELS ? `Dividing by ${runs(tables(L))}` : `Big division`),
      max: 16,
      unlocksAfter: [{ skill: 'mul', level: 3 }],
      startByGrade: { 4: 4 },
    }),
    {
      id: 'place',
      label: (L) => PLACE_LABELS[L - 1]!,
      maxLevel: PLACE_LABELS.length,
      formats: ['number', 'choice'],
      startByGrade: { 0: 1, 1: 1, 2: 3, 3: 5 },
      generate: placeValue,
    },
    {
      id: 'skip',
      label: (L) => SKIP_LABELS[L - 1]!,
      maxLevel: SKIP_LABELS.length,
      formats: ['number', 'choice'],
      startByGrade: { 0: 1, 1: 2, 2: 3, 3: 4 },
      generate: skipCount,
    },
  ],
}
