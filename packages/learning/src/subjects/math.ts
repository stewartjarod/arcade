import type { ItemSpec, Skill, Subject, Teach } from '../core/types'
import { GRADE5_MATH } from './mathGrade5'
import { MATH_345 } from './mathGrades345'
import { MATH_EARLY, teachFrom } from './mathEarly'
import { MATH_FINAL } from './mathFinal'
import { MATH_LAST } from './mathLast'
import { MORE_MATH } from './mathMore'
import { UPPER_MATH } from './mathUpper'
import { shapes, sides } from './shapes'
import { numberWrongs, pick, rand, shuffle, wrongFrom } from './util'

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

function opSkill(op: Op, o: Pick<Skill, 'label' | 'unlocksAfter' | 'teach'> & { max: number }): Skill {
  return {
    id: op,
    label: o.label,
    maxLevel: o.max,
    formats: ['number', 'choice'],
    unlocksAfter: o.unlocksAfter,
    teach: o.teach,
    generate: (L) => problemItem(build(op, L)),
    fromKey: (key, L) => {
      const p = fromText(key, L)
      return p ? problemItem(p) : null
    },
  }
}

// --- Place value: tens and ones, hundreds, expanded form, 10 more / 100 less ---

// Keys: "place:L:numbers..." (the same key always rebuilds the same question, so a missed one can come back).
const cnt = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function placeKey(L: number): string {
  if (L === 1) return `place:1:${rand(1, 9)}:${rand(0, 9)}`
  if (L === 2) return `place:2:${rand(11, 99)}:${rand(0, 1)}` // last: 1 = tens digit, 0 = ones digit
  if (L === 3) return `place:3:${rand(1, 9)}:${rand(0, 9)}:${rand(0, 9)}`
  if (L === 4) return `place:4:${rand(1, 9)}:${rand(1, 9)}:${rand(0, 9)}`
  if (L === 5) return `place:5:${rand(101, 899)}:${pick([10, 100])}:${rand(0, 1)}` // last: 1 = more, 0 = less
  return `place:6:${rand(1, 9)}:${rand(0, 9)}:${rand(0, 9)}:${rand(0, 9)}`
}

function placeBuild(key: string): ItemSpec | null {
  const parts = key.split(':')
  if (parts[0] !== 'place' || parts.length < 3) return null
  const L = Number(parts[1])
  const v = parts.slice(2).map(Number)
  let text: string
  let answer: number
  let wrong: (n: number) => string[]
  if (L === 1 && v.length === 2) {
    const [t, o] = v as [number, number]
    text = `${cnt(t, 'ten', 'tens')} and ${cnt(o, 'one', 'ones')}`
    answer = t * 10 + o
    wrong = (n) => numberWrongs(answer, n, [o * 10 + t, t + o, t * 10])
  } else if (L === 2 && v.length === 2) {
    const [n, tens] = v as [number, number]
    const digit = tens ? Math.floor(n / 10) : n % 10
    const other = tens ? n % 10 : Math.floor(n / 10)
    text = `What digit is in the ${tens ? 'tens' : 'ones'} place of ${n}?`
    answer = digit
    // Wrong answers are other digits (a digit is never 10 or more).
    wrong = (k) => wrongFrom(String(digit), k, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], [String(other)])
  } else if (L === 3 && v.length === 3) {
    const [h, t, o] = v as [number, number, number]
    text = `${cnt(h, 'hundred', 'hundreds')}, ${cnt(t, 'ten', 'tens')} and ${cnt(o, 'one', 'ones')}`
    answer = h * 100 + t * 10 + o
    wrong = (n) => numberWrongs(answer, n, [h * 100 + o * 10 + t, t * 100 + h * 10 + o, h + t + o])
  } else if (L === 4 && v.length === 3) {
    const [h, t, o] = v as [number, number, number]
    text = `${h * 100} + ${t * 10} + ${o}`
    answer = h * 100 + t * 10 + o
    wrong = (n) => numberWrongs(answer, n, [h * 100 + o * 10 + t, h + t + o, h * 10 + t + o])
  } else if (L === 5 && v.length === 3) {
    const [n, d, more] = v as [number, number, number]
    text = `What is ${d} ${more ? 'more' : 'less'} than ${n}?`
    answer = more ? n + d : n - d
    wrong = (k) => numberWrongs(answer, k, [more ? n - d : n + d, n + (d === 10 ? 100 : 10), n + 1])
  } else if (L === 6 && v.length === 4) {
    const [th, h, t, o] = v as [number, number, number, number]
    text = `${cnt(th, 'thousand', 'thousands')}, ${cnt(h, 'hundred', 'hundreds')}, ${cnt(t, 'ten', 'tens')} and ${cnt(o, 'one', 'ones')}`
    answer = th * 1000 + h * 100 + t * 10 + o
    wrong = (n) => numberWrongs(answer, n, [th * 1000 + t * 100 + h * 10 + o, th * 100 + h * 10 + t + o])
  } else {
    return null
  }
  return {
    key,
    prompt: { text, sum: L === 1 || L === 3 || L === 4 || L === 6 },
    answer: String(answer),
    wrong,
    seconds: 6 + L,
  }
}

// --- Counting objects (Kindergarten): "How many?" with dots in rows of five, so they can count by fives later ---

const COUNT_COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']
const COUNT_LABELS = ['Counting to 5', 'Counting to 10', 'Counting to 20', 'Numbers and counting to 30']
const COUNT_RANGES: [number, number][] = [[1, 5], [1, 10], [6, 20], [11, 30]]

function dotsSVG(n: number, color: string) {
  const rows = Math.ceil(n / 5)
  const dots = Array.from({ length: n }, (_, i) => `<circle cx="${22 + (i % 5) * 36}" cy="${22 + Math.floor(i / 5) * 36}" r="14" fill="${color}"/>`)
  return `<svg viewBox="0 0 196 ${rows * 36 + 8}" xmlns="http://www.w3.org/2000/svg">${dots.join('')}</svg>`
}

function countItems(L: number): ItemSpec {
  const [lo, hi] = COUNT_RANGES[L - 1]!
  return countItem(rand(lo, hi))
}

function countItem(n: number): ItemSpec {
  return {
    key: `count:${n}`,
    prompt: { text: 'How many?', say: 'How many?', svg: dotsSVG(n, pick(COUNT_COLORS)) },
    answer: String(n),
    wrong: (k) => numberWrongs(n, k, [n + 1, n - 1, n + 2, n - 2]),
    seconds: 4 + Math.ceil(n / 3),
  }
}

// --- Comparing numbers: which of three is the greatest (or the least)? Kindergarten → grade 2 ---

const COMPARE_MAX = [5, 10, 20, 100, 1000]
const COMPARE_LABELS = ['Comparing up to 5', 'Comparing up to 10', 'Comparing up to 20', 'Comparing up to 100', 'Comparing numbers up to 1,000']

// Four numbers are shown, so the wrong choices can always come from the list itself (the answer's rivals).
function compareItem(L: number): ItemSpec {
  const hi = COMPARE_MAX[L - 1]!
  const nums = new Set<number>()
  while (nums.size < 4) nums.add(rand(L <= 3 ? 0 : Math.floor(hi / 10), hi))
  return compareFrom([...nums], Math.random() < 0.5, L)
}

// Keys: "cmp:max|min:n,n,n,n". Old keys with three numbers no longer rebuild (they give null).
function compareFrom(nums: number[], greatest: boolean, L: number): ItemSpec {
  const answer = greatest ? Math.max(...nums) : Math.min(...nums)
  const text = `Which is ${greatest ? 'greatest' : 'least'}? ${nums.join(', ')}`
  // The other listed numbers come first (picking the greatest when asked for the least is the classic slip), then numbers a little off.
  const rivals = nums.filter((v) => v !== answer).map(String)
  const nearby = [answer + 1, answer - 1, answer + 10, answer - 10].filter((v) => v >= 0).map(String)
  return {
    key: `cmp:${greatest ? 'max' : 'min'}:${nums.join(',')}`,
    prompt: { text, say: text.replace(/, /g, ' or ') },
    answer: String(answer),
    wrong: (n) => wrongFrom(String(answer), n, nearby, rivals),
    seconds: 4 + L,
  }
}

// --- Skip counting: 10s, 5s, 2s, from any start, 100s and 3s, backwards ---

// Keys: "skip:start:step:direction" (direction 1 counts up, -1 counts back).
function skipKey(L: number): string {
  let step: number
  let start: number
  let dir = 1
  if (L === 1) (step = 10), (start = 10 * rand(1, 5))
  else if (L === 2) (step = 5), (start = 5 * rand(1, 8))
  else if (L === 3) (step = 2), (start = 2 * rand(1, 10))
  else if (L === 4) (step = pick([10, 5])), (start = step * rand(1, 10) + (step === 10 ? rand(1, 9) : 0))
  else if (L === 5) (step = pick([100, 5])), (start = step * rand(1, 20))
  else (step = pick([2, 5, 10])), (dir = -1), (start = step * rand(6, 15))
  return `skip:${start}:${step}:${dir}`
}

function skipBuild(key: string): ItemSpec | null {
  const parts = key.split(':')
  if (parts[0] !== 'skip' || parts.length !== 4) return null
  const [start, step, dir] = parts.slice(1).map(Number) as [number, number, number]
  const seq = [0, 1, 2].map((i) => start + dir * step * i)
  const answer = start + dir * step * 3
  // Wrong answers are the next jump, or one off. Numbers already shown in the sequence are never offered.
  return {
    key,
    prompt: { text: `${seq.join(', ')}, __` },
    answer: String(answer),
    wrong: (n) => numberWrongs(answer, n, [answer + step * dir, answer + dir, answer - dir]),
    seconds: 7,
  }
}


const SKIP_LABELS = ['Skip-count by tens', 'Skip-count by fives', 'Skip-count by twos', 'Count on from any number', 'Skip-count by hundreds and fives', 'Count backwards']
const PLACE_LABELS = ['Tens and ones', 'Tens place and ones place', 'Hundreds, tens and ones', 'Adding up place values', '10 more, 100 less', 'Thousands']

// --- Teach cards: a short "here's how it works" for a level the kid hasn't tried yet ---
// Each list has one card per level; a skill with fewer cards than levels reuses its last card (see teachFrom).

const ADD_TEACH: Teach[] = [
  { text: 'The plus sign means put together. Start with the bigger number and count on: 4 + 3 is 7.', say: 'The plus sign means put together. Start with the bigger number and count on. Four plus three is seven.' },
  { text: 'For sums past 10, make a ten first. 8 + 5: take 2 from the 5 to make 10, then add the 3 left: 13.', say: 'For sums past ten, make a ten first. Eight plus five: take two from the five to make ten, then add the three left. That is thirteen.' },
  { text: 'Add the ones first. If they make 10 or more, trade 10 ones for 1 ten. 27 + 15: 12 ones is 1 ten and 2 ones, so 42.', say: 'Add the ones first. If they make ten or more, trade ten ones for one ten. Twenty-seven plus fifteen: twelve ones is one ten and two ones, so forty-two.' },
  { text: 'Add the ones, then the tens. Ten or more ones make a new ten. 48 + 37: 15 ones is 1 ten and 5 ones, so 85.', say: 'Add the ones, then the tens. Ten or more ones make a new ten. Forty-eight plus thirty-seven: fifteen ones is one ten and five ones, so eighty-five.' },
  { text: 'Add the ones, then the tens, then the hundreds. Ten tens make 1 hundred: 136 + 78 is 214.', say: 'Add the ones, then the tens, then the hundreds. Ten tens make one hundred. One hundred thirty-six plus seventy-eight is two hundred fourteen.' },
  { text: 'Same steps, bigger numbers. 245 + 180: 12 tens is 1 hundred and 2 tens, so the answer is 425.', say: 'Same steps, bigger numbers. Two hundred forty-five plus one hundred eighty: twelve tens is one more hundred and two tens, so the answer is four hundred twenty-five.' },
  { text: 'Line up the ones, tens and hundreds. Add each column, and trade 10 of one place for 1 of the next when needed.', say: 'Line up the ones, tens and hundreds. Add each column. Trade ten of one place for one of the next place when you need to.' },
]

const SUB_TEACH: Teach[] = [
  { text: 'Minus means take away. Start with 9 and take away 4: 5 are left.', say: 'Minus means take away. Start with nine and take away four. Five are left.' },
  { text: 'To subtract, count back, or think what plus 7 makes 15: 8, so 15 − 7 is 8.', say: 'To subtract, count back, or think what plus seven makes fifteen. That is eight, so fifteen minus seven is eight.' },
  { text: 'If the ones are not enough, trade 1 ten for 10 ones. 42 − 17: 12 − 7 is 5, and 3 tens − 1 ten is 2 tens, so 25.', say: 'If the ones are not enough, trade one ten for ten ones. Forty-two minus seventeen: twelve minus seven is five, and three tens minus one ten is two tens, so twenty-five.' },
  { text: 'Trade 1 ten for 10 ones when the ones are not enough. 73 − 38: 13 − 8 is 5, and 6 tens − 3 tens is 3 tens, so 35.', say: 'Trade one ten for ten ones when the ones are not enough. Seventy-three minus thirty-eight: thirteen minus eight is five, and six tens minus three tens is three tens, so thirty-five.' },
  { text: 'Work from the ones to the hundreds, and trade when a column is too small. 305 − 128 is 177.', say: 'Work from the ones to the hundreds. Trade when a column is too small. Three hundred five minus one hundred twenty-eight is one hundred seventy-seven.' },
  { text: 'Work column by column, from the ones to the hundreds. Trade one from the next place when a column is too small.', say: 'Work column by column, from the ones to the hundreds. Trade one from the next place when a column is too small.' },
]

// The times table that is new at level L is TABLE_ORDER[L] (levels 1 and 2 start with 2, 10 and 5).
function timesTeach(L: number): Teach {
  if (L === 1) {
    return {
      text: '× means equal groups. 2 × 4 means 2 groups of 4: 4 + 4 = 8.',
      say: 'Times means equal groups. Two times four means two groups of four. Four plus four is eight.',
      emoji: '🍪🍪🍪🍪 🍪🍪🍪🍪',
    }
  }
  if (L <= TABLE_LEVELS) {
    const n = TABLE_ORDER[L]!
    return {
      text: `The ${n}s: 3 × ${n} means 3 groups of ${n}. Count by ${n}s: ${n}, ${2 * n}, ${3 * n}.`,
      say: `The ${n}s. 3 times ${n} means 3 groups of ${n}. Count by ${n}s: ${n}, ${2 * n}, ${3 * n}.`,
    }
  }
  if (L === TABLE_LEVELS + 1) {
    return {
      text: '7 × 8 is 5 × 8 plus 2 × 8: 40 + 16 = 56. Break a hard fact into easy ones.',
      say: 'Break a hard fact into easy ones. Seven times eight is five times eight, plus two times eight. That is forty plus sixteen, which is fifty-six.',
    }
  }
  return {
    text: '9 × 12 is 9 × 10 plus 9 × 2: 90 + 18 = 108. Use the facts you know.',
    say: 'Use the facts you know. Nine times twelve is nine times ten, plus nine times two. That is ninety plus eighteen, which is one hundred eight.',
  }
}

function divideTeach(L: number): Teach {
  if (L === 1) {
    return {
      text: '÷ means share equally. 8 ÷ 2 means share 8 into 2 equal groups: 4 each.',
      say: 'Divide means share equally. Eight divided by two means share eight into two equal groups. That is four each.',
    }
  }
  if (L <= TABLE_LEVELS) {
    const n = TABLE_ORDER[L]!
    return {
      text: `${3 * n} ÷ ${n} asks how many ${n}s fit. Count by ${n}s: ${n}, ${2 * n}, ${3 * n}. That is 3.`,
      say: `${3 * n} divided by ${n} asks how many ${n}s fit. Count by ${n}s: ${n}, ${2 * n}, ${3 * n}. That is 3.`,
    }
  }
  if (L === TABLE_LEVELS + 1) {
    return {
      text: '56 ÷ 7 = 8, because 7 × 8 = 56. Division undoes multiplication.',
      say: 'Division undoes multiplication. Fifty-six divided by seven is eight, because seven times eight is fifty-six.',
    }
  }
  return {
    text: '96 ÷ 8 = 12, because 8 × 12 = 96. Think of the times fact.',
    say: 'Think of the times fact. Ninety-six divided by eight is twelve, because eight times twelve is ninety-six.',
  }
}

const COUNT_TEACH: Teach[] = [
  { text: 'Point to each dot as you count it. The last number you say is how many.', say: 'Point to each dot as you count it. The last number you say is how many.' },
  { text: 'The dots are in rows of five. Count row by row: 5, then 10, then 15. The last number is how many.', say: 'The dots are in rows of five. Count row by row: five, then ten, then fifteen. The last number is how many.' },
  { text: 'Count each full row of five, then count any dots left over. The last number you say is how many.', say: 'Count each full row of five, then count any dots left over. The last number you say is how many.' },
]

const COMPARE_TEACH: Teach[] = [
  { text: 'Greatest means the biggest number. Least means the smallest. Numbers that come later when you count are bigger.', say: 'Greatest means the biggest number. Least means the smallest. Numbers that come later when you count are bigger.' },
  { text: 'Numbers that come later when you count are bigger. 8 comes after 5, so 8 is greater.', say: 'Numbers that come later when you count are bigger. Eight comes after five, so eight is greater.' },
  { text: 'A number with a ten in it is bigger than any number with no tens. 14 is greater than 9.', say: 'A number with a ten in it is bigger than any number with no tens. Fourteen is greater than nine.' },
  { text: 'Compare the tens first. If the tens match, compare the ones. 52 is greater than 47.', say: 'Compare the tens first. If the tens match, compare the ones. Fifty-two is greater than forty-seven.' },
  { text: 'Compare the hundreds first, then the tens, then the ones. 512 is greater than 498.', say: 'Compare the hundreds first, then the tens, then the ones. Five hundred twelve is greater than four hundred ninety-eight.' },
]

const PLACE_TEACH: Teach[] = [
  { text: 'A ten is 10 ones. Count the tens first, then add the ones. 3 tens and 4 ones is 34.', say: 'A ten is ten ones. Count the tens first, then add the ones. Three tens and four ones is thirty-four.' },
  { text: 'The digit in the tens place tells how many tens. In 46, the 4 is 4 tens, or 40. The 6 is 6 ones.', say: 'The digit in the tens place tells how many tens. In forty-six, the 4 is four tens, or forty. The 6 is six ones.' },
  { text: 'A hundred is 10 tens. In 326, the 3 means 3 hundreds, the 2 means 2 tens, and the 6 means 6 ones.', say: 'A hundred is ten tens. In three hundred twenty-six, the 3 means 3 hundreds, the 2 means 2 tens, and the 6 means 6 ones.' },
  { text: 'Break a number into its places, then add: 300 + 20 + 5 is 325.', say: 'Break a number into its places, then add. Three hundred plus twenty plus five is three hundred twenty-five.' },
  { text: '10 more means one more ten. 100 less means one less hundred: 352 − 100 is 252.', say: 'Ten more means one more ten. A hundred less means one less hundred. Three hundred fifty-two minus a hundred is two hundred fifty-two.' },
  { text: 'A thousand is 10 hundreds. Each place is 10 times the place to its right.', say: 'A thousand is ten hundreds. Each place is ten times the place on its right.' },
]

const SKIP_TEACH: Teach[] = [
  { text: 'Skip-count by tens: add 10 each time, like 30, 40, 50.', say: 'Skip-count by tens. Add ten each time, like thirty, forty, fifty.' },
  { text: 'Skip-count by fives: add 5 each time, like 35, 40, 45.', say: 'Skip-count by fives. Add five each time, like thirty-five, forty, forty-five.' },
  { text: 'Skip-count by twos: add 2 each time, like 14, 16, 18.', say: 'Skip-count by twos. Add two each time, like fourteen, sixteen, eighteen.' },
  { text: 'Start at any number, then add the same jump each time, like 57, 67, 77.', say: 'Start at any number, then add the same jump each time, like fifty-seven, sixty-seven, seventy-seven.' },
  { text: 'Hundreds jump by 100: 300, 400, 500. Fives jump by 5: 25, 30, 35.', say: 'Hundreds jump by one hundred, like three hundred, four hundred, five hundred. Fives jump by five, like twenty-five, thirty, thirty-five.' },
  { text: 'Count backwards by taking the same jump away each time: 50, 45, 40.', say: 'Count backwards by taking the same jump away each time. Fifty, forty-five, forty.' },
]

export const math: Subject = {
  id: 'math',
  name: 'Math',
  emoji: '🔢',
  skills: [
    opSkill('add', {
      label: (L) => `Addition up to ${cap(L)}`,
      max: 12,
      teach: teachFrom(ADD_TEACH),
    }),
    opSkill('sub', {
      label: (L) => `Subtraction up to ${cap(L)}`,
      max: 12,
      teach: teachFrom(SUB_TEACH),
    }),
    // Skills unlock in order: × once + and − are solid, ÷ once × is.
    opSkill('mul', {
      label: (L) => (L <= TABLE_LEVELS ? `Multiplication facts: ${runs(tables(L))}` : `Multiplication facts up to 12`),
      max: 16,
      unlocksAfter: [{ skill: 'add', level: 3 }, { skill: 'sub', level: 3 }],
      teach: timesTeach,
    }),
    opSkill('div', {
      label: (L) => (L <= TABLE_LEVELS ? `Division facts: ${runs(tables(L))}` : `Division facts up to 12`),
      max: 16,
      unlocksAfter: [{ skill: 'mul', level: 3 }],
      teach: divideTeach,
    }),
    {
      id: 'count',
      label: (L) => COUNT_LABELS[L - 1]!,
      maxLevel: COUNT_LABELS.length,
      formats: ['number', 'choice'],
      teach: teachFrom(COUNT_TEACH),
      generate: countItems,
      fromKey: (key) => {
        const m = key.match(/^count:(\d+)$/)
        return m ? countItem(Number(m[1])) : null
      },
    },
    {
      id: 'compare',
      label: (L) => COMPARE_LABELS[L - 1]!,
      maxLevel: COMPARE_LABELS.length,
      formats: ['number', 'choice'],
      teach: teachFrom(COMPARE_TEACH),
      generate: compareItem,
      fromKey: (key, level) => {
        const m = key.match(/^cmp:(max|min):([\d,]+)$/)
        const list = m ? m[2]!.split(',').map(Number) : []
        return m && list.length === 4 ? compareFrom(list, m[1] === 'max', level) : null
      },
    },
    shapes,
    sides,
    {
      id: 'place',
      label: (L) => PLACE_LABELS[L - 1]!,
      maxLevel: PLACE_LABELS.length,
      formats: ['number', 'choice'],
      teach: teachFrom(PLACE_TEACH),
      generate: (L) => placeBuild(placeKey(L))!,
      fromKey: (key, L) => (key.startsWith(`place:${L}:`) ? placeBuild(key) : null),
    },
    {
      id: 'skip',
      label: (L) => SKIP_LABELS[L - 1]!,
      maxLevel: SKIP_LABELS.length,
      formats: ['number', 'choice'],
      teach: teachFrom(SKIP_TEACH),
      generate: (L) => skipBuild(skipKey(L))!,
      fromKey: (key) => skipBuild(key),
    },
    ...UPPER_MATH,
    ...GRADE5_MATH,
    ...MORE_MATH,
    ...MATH_345,
    ...MATH_EARLY,
    ...MATH_LAST,
    ...MATH_FINAL,
  ],
}
