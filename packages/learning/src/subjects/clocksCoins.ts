import type { ItemSpec, Subject, Teach } from '../core/types'
import { pick, rand, wrongFrom } from './util'

/**
 * Clocks & Coins: telling time on a clock with hands, and counting money.
 */

// --- Clocks ---

const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
const wrapHour = (h: number) => ((h + 11) % 12) + 1

/** An analog clock face as SVG. */
export function clockSVG(h: number, m: number) {
  const hourAngle = ((h % 12) + m / 60) * 30
  const minuteAngle = m * 6
  const hand = (angle: number, len: number, width: number, color: string) => {
    const r = (angle - 90) * (Math.PI / 180)
    return `<line x1="50" y1="50" x2="${50 + Math.cos(r) * len}" y2="${50 + Math.sin(r) * len}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`
  }
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const r = ((i + 1) * 30 - 90) * (Math.PI / 180)
    return `<text x="${50 + Math.cos(r) * 37}" y="${50 + Math.sin(r) * 37}" font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#2a2150" font-family="Fredoka, system-ui, sans-serif">${i + 1}</text>`
  }).join('')
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const r = (i * 6 - 90) * (Math.PI / 180)
    const inner = i % 5 === 0 ? 43 : 45
    return `<line x1="${50 + Math.cos(r) * inner}" y1="${50 + Math.sin(r) * inner}" x2="${50 + Math.cos(r) * 47}" y2="${50 + Math.sin(r) * 47}" stroke="#2a2150" stroke-width="${i % 5 === 0 ? 1.4 : 0.6}"/>`
  }).join('')
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A clock">
    <circle cx="50" cy="50" r="48" fill="#fff" stroke="#2a2150" stroke-width="3"/>${ticks}${numbers}
    ${hand(hourAngle, 22, 5, '#2a2150')}${hand(minuteAngle, 34, 3, '#e8590c')}
    <circle cx="50" cy="50" r="3" fill="#2a2150"/></svg>`
}

// Level 1 o'clock · 2 half past · 3 quarter past/to · 4 five-minute steps · 5 any minute
function clockTime(level: number): [number, number] {
  const h = rand(1, 12)
  if (level === 1) return [h, 0]
  if (level === 2) return [h, pick([0, 30, 30])]
  if (level === 3) return [h, pick([15, 45, 30, 15, 45])]
  if (level === 4) return [h, 5 * rand(0, 11)]
  return [h, rand(0, 59)]
}

/** Seconds a fluent kid needs to read the clock: whole and half hours are quickest, any minute slowest. */
const clockSeconds = (m: number) => (m % 30 === 0 ? 8 : m % 15 === 0 ? 9 : m % 5 === 0 ? 10 : 12)

function clockItem(h: number, m: number): ItemSpec {
  const answer = fmt(h, m)
  // Classic mix-ups: hands swapped, the hour hand read as the next/last hour, 5 minutes off.
  const swapped = m % 5 === 0 && m > 0 ? fmt(m / 5 === 0 ? 12 : m / 5, (h % 12) * 5) : ''
  const near = [swapped, fmt(wrapHour(h + 1), m), fmt(wrapHour(h - 1), m), fmt(h, (m + 30) % 60)]
  const pool = [fmt(h, (m + 5) % 60), fmt(h, (m + 55) % 60), fmt(wrapHour(h + 2), m), fmt(h, (m + 15) % 60)]
  return {
    key: `clock:${answer}`,
    prompt: { text: 'What time is it?', svg: clockSVG(h, m) },
    answer,
    wrong: (n) => wrongFrom(answer, n, pool, near.filter(Boolean)),
    seconds: clockSeconds(m),
  }
}

// --- Coins ---

interface Coin {
  name: string
  cents: number
  /** Size in mm (real coins), and colors. */
  mm: number
  fill: string
  edge: string
}
export const COINS: Coin[] = [
  { name: 'penny', cents: 1, mm: 19, fill: '#c77b30', edge: '#8a4f1c' },
  { name: 'nickel', cents: 5, mm: 21, fill: '#c9ccd1', edge: '#8d9199' },
  { name: 'dime', cents: 10, mm: 17.9, fill: '#d6d9de', edge: '#8d9199' },
  { name: 'quarter', cents: 25, mm: 24.3, fill: '#cfd3d8', edge: '#868b93' },
]
const coin = (name: string) => COINS.find((c) => c.name === name)!

/** A row of coins as SVG, sized like the real ones. Each is labeled with its value ("5¢"), which fits on a phone. */
export function coinsSVG(names: string[]) {
  let x = 4
  const parts = names.map((n) => {
    const c = coin(n)
    const r = c.mm * 1.1
    const cx = x + r
    x += r * 2 + 6
    return `<g><circle cx="${cx}" cy="30" r="${r}" fill="${c.fill}" stroke="${c.edge}" stroke-width="2"/>
      <circle cx="${cx}" cy="30" r="${r - 4}" fill="none" stroke="${c.edge}" stroke-width="0.8" opacity=".6"/>
      <text x="${cx}" y="30" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${c.edge}" font-family="system-ui, sans-serif">${c.cents}¢</text></g>`
  })
  return `<svg viewBox="0 0 ${Math.max(x, 60)} 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Coins">${parts.join('')}</svg>`
}

const plural = (n: number, name: string) => `${n} ${name === 'penny' ? (n === 1 ? 'penny' : 'pennies') : n === 1 ? name : `${name}s`}`

/** The coin is drawn and the kid names it ("What is this coin called?" → nickel), like IXL's coin pictures. */
function coinNameItem(c: Coin): ItemSpec {
  // The key keeps its old wording so facts a kid already missed still come back.
  const key = `Which coin is worth ${c.cents}¢?`
  return { key, prompt: { text: 'What is this coin called?', svg: coinsSVG([c.name]) }, answer: c.name, formats: ['choice'], wrong: (n) => wrongFrom(c.name, n, COINS.map((x) => x.name)), seconds: 10 }
}

/** "How many cents is a nickel worth?" with the coin drawn. */
function coinValueItem(c: Coin): ItemSpec {
  const text = `How many cents is a ${c.name} worth?`
  return {
    key: text,
    prompt: { text, svg: coinsSVG([c.name]) },
    answer: String(c.cents),
    wrong: (n) => wrongFrom(String(c.cents), n, COINS.map((x) => String(x.cents)), ['2', '50', '100']),
    seconds: 10,
  }
}

/** Making change: you have `total`, the toy costs `price`. */
function changeItem(total: number, price: number): ItemSpec {
  const left = total - price
  const text = `You have ${total}¢. You buy a toy for ${price}¢. How much is left?`
  return {
    key: text,
    prompt: { text },
    answer: String(left),
    wrong: (n) => wrongFrom(String(left), n, [left + 5, left - 5, total + price, price].filter((v) => v > 0 && v !== left).map(String), [String(left + 10), String(left - 10)].filter((v) => Number(v) > 0)),
    seconds: 20,
  }
}

/** Some coins to count (names in any order). The picture and the total come from the names. */
function groupItem(names: string[]): ItemSpec {
  const total = names.reduce((t, n) => t + coin(n).cents, 0)
  const counts = COINS.map((c) => [c.name, names.filter((n) => n === c.name).length] as const).filter(([, k]) => k > 0)
  const text = `${counts.map(([n, k]) => plural(k, n)).join(' and ')}: how many cents?`
  return {
    key: text,
    prompt: { text, svg: coinsSVG(names) },
    answer: String(total),
    // Common slips: counting every coin as 1¢ or 5¢, or being off by one coin.
    wrong: (n) => wrongFrom(String(total), n, [total + 1, total - 1, total + 10, total - 10, total + 25].filter((v) => v > 0).map(String), [String(names.length), String(total + 5), String(total - 5)].filter((v) => Number(v) > 0 && v !== String(total))),
    seconds: 6 + names.length * 2,
  }
}

function coinItem(level: number): ItemSpec {
  if (level === 1) {
    const c = pick(COINS)
    return Math.random() < 0.5 ? coinNameItem(c) : coinValueItem(c)
  }
  if (level === 5) {
    // Making change: you have 20¢–$1, the toy costs at least 5¢ less.
    const total = 5 * rand(4, 20)
    return changeItem(total, total - 5 * rand(1, total / 5 - 1))
  }
  // Level 2: same coins. 3: mixed up to 50¢. 4: mixed up to $1.
  let names: string[]
  if (level === 2) {
    const c = pick(COINS.filter((x) => x.name !== 'quarter' || Math.random() < 0.5))
    names = Array(rand(2, c.cents >= 10 ? 4 : 6)).fill(c.name)
  } else {
    const limit = level === 3 ? 50 : 100
    names = []
    let total = 0
    for (let i = 0; i < 7; i++) {
      const options = COINS.filter((c) => total + c.cents <= limit && (level > 3 || c.name !== 'quarter' || names.length === 0))
      if (!options.length || (names.length >= 2 && Math.random() < 0.3)) break
      const c = pick(options)
      names.push(c.name)
      total += c.cents
    }
  }
  names.sort((a, b) => coin(b).cents - coin(a).cents) // biggest first, like counting on
  return groupItem(names)
}

/** Rebuild a coin question from its text (the text is its key). Returns null for text it does not know. */
function coinFromKey(key: string): ItemSpec | null {
  const name = key.match(/^Which coin is worth (\d+)¢\?$/)
  if (name) {
    const c = COINS.find((x) => x.cents === Number(name[1]))
    return c ? coinNameItem(c) : null
  }
  const value = key.match(/^How many cents is a (\w+) worth\?$/)
  if (value) {
    const c = COINS.find((x) => x.name === value[1])
    return c ? coinValueItem(c) : null
  }
  const change = key.match(/^You have (\d+)¢\. You buy a toy for (\d+)¢\. How much is left\?$/)
  if (change) return changeItem(Number(change[1]), Number(change[2]))
  const group = key.match(/^(.+): how many cents\?$/)
  if (group) {
    const names: string[] = []
    for (const part of group[1]!.split(' and ')) {
      const m = part.match(/^(\d+) (\w+)$/)
      const c = m && COINS.find((x) => [x.name, x.name === 'penny' ? 'pennies' : `${x.name}s`].includes(m[2]!))
      if (!m || !c) return null
      names.push(...Array(Number(m[1])).fill(c.name))
    }
    names.sort((a, b) => coin(b).cents - coin(a).cents)
    return groupItem(names)
  }
  return null
}

// Teach cards: shown before a kid's first question on a new idea. Clock cards are one per level.
const CLOCK_TEACH: Teach[] = [
  { text: "The short hand shows the hour. When the long hand points up at the 12, it is o'clock.", say: "The short hand shows the hour. When the long hand points up at the twelve, it is o'clock." },
  { text: 'When the long hand points down at the 6, it is half past. The short hand has passed the hour, so 3:30 is half past 3.', say: 'When the long hand points down at the six, it is half past. The short hand has passed the hour, so three thirty is half past three.' },
  { text: 'Long hand on the 3 means quarter past: 2:15 is quarter past 2. Long hand on the 9 means quarter to: 3:45 is quarter to 4.', say: 'The long hand on the three means quarter past: two fifteen is quarter past two. The long hand on the nine means quarter to: three forty-five is quarter to four.' },
  { text: 'Each number on the clock is 5 minutes. Long hand on the 1 is 5 minutes, on the 2 is 10, and so on.', say: 'Each number on the clock is 5 minutes. The long hand on the one is 5 minutes, on the two is 10, and so on.' },
  { text: 'Count by fives to the last number the long hand passed, then add 1 for each little tick after it.', say: 'Count by fives to the last number the long hand passed, then add one for each little tick after it.' },
]

// Coin cards, one per level.
const COIN_TEACH: Teach[] = [
  { text: 'A penny is worth 1¢, a nickel 5¢, a dime 10¢, and a quarter 25¢.', say: 'A penny is worth 1 cent, a nickel 5 cents, a dime 10 cents, and a quarter 25 cents.', svg: coinsSVG(['penny', 'nickel', 'dime', 'quarter']) },
  { text: 'To count the same coins, skip-count by their value. Dimes go 10, 20, 30. Nickels go 5, 10, 15.', say: 'To count the same coins, skip-count by their value. Dimes go ten, twenty, thirty. Nickels go five, ten, fifteen.' },
  { text: 'Start with the biggest coin, then count on. A quarter, then a dime: 25, then 35 cents.', say: 'Start with the biggest coin, then count on. A quarter, then a dime: twenty-five, then thirty-five cents.' },
  { text: 'Count the quarters first, then dimes, nickels, and pennies. 100 cents makes 1 dollar.', say: 'Count the quarters first, then dimes, nickels, and pennies. One hundred cents makes one dollar.' },
  { text: 'To make change, take the price away from the money you have. Then check: change plus price makes what you had.', say: 'To make change, take the price away from the money you have. Then check: change plus price makes what you had.' },
]

export const clocksCoins: Subject = {
  id: 'clocks',
  name: 'Clocks & Coins',
  emoji: '⏰',
  skills: [
    {
      id: 'time',
      label: (L) => ["Time: o'clock", 'Time: half past', 'Time: quarter past and to', 'Time: every 5 minutes', 'Time: any minute'][L - 1]!,
      maxLevel: 5,
      formats: ['choice'],
      generate: (L) => clockItem(...clockTime(L)),
      teach: (L) => CLOCK_TEACH[L - 1]!,
      fromKey: (key) => {
        const m = key.match(/^clock:(\d+):(\d\d)$/)
        return m ? clockItem(Number(m[1]), Number(m[2])) : null
      },
    },
    {
      id: 'coins',
      label: (L) => ['Identify coins and their values', 'Count the same coins', 'Count coins up to 50¢', 'Count coins up to $1', 'Make change'][L - 1]!,
      maxLevel: 5,
      formats: ['number', 'choice'],
      generate: coinItem,
      fromKey: (key) => coinFromKey(key),
      teach: (L) => COIN_TEACH[L - 1]!,
    },
  ],
}
