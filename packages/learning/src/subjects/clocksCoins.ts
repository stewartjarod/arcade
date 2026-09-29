import type { ItemSpec, Subject } from '../core/types'
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
  label: string
}
export const COINS: Coin[] = [
  { name: 'penny', cents: 1, mm: 19, fill: '#c77b30', edge: '#8a4f1c', label: 'ONE CENT' },
  { name: 'nickel', cents: 5, mm: 21, fill: '#c9ccd1', edge: '#8d9199', label: 'FIVE CENTS' },
  { name: 'dime', cents: 10, mm: 17.9, fill: '#d6d9de', edge: '#8d9199', label: 'ONE DIME' },
  { name: 'quarter', cents: 25, mm: 24.3, fill: '#cfd3d8', edge: '#868b93', label: 'QUARTER' },
]
const coin = (name: string) => COINS.find((c) => c.name === name)!

/** A row of coins as SVG, sized like the real ones. */
export function coinsSVG(names: string[]) {
  let x = 4
  const parts = names.map((n) => {
    const c = coin(n)
    const r = c.mm * 1.1
    const cx = x + r
    x += r * 2 + 6
    return `<g><circle cx="${cx}" cy="30" r="${r}" fill="${c.fill}" stroke="${c.edge}" stroke-width="2"/>
      <circle cx="${cx}" cy="30" r="${r - 4}" fill="none" stroke="${c.edge}" stroke-width="0.8" opacity=".6"/>
      <text x="${cx}" y="30" font-size="${c.label.length > 8 ? 5.2 : 6}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${c.edge}" font-family="system-ui, sans-serif">${c.label}</text></g>`
  })
  return `<svg viewBox="0 0 ${Math.max(x, 60)} 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Coins">${parts.join('')}</svg>`
}

const plural = (n: number, name: string) => `${n} ${name === 'penny' ? (n === 1 ? 'penny' : 'pennies') : n === 1 ? name : `${name}s`}`

function coinItem(level: number): ItemSpec {
  if (level === 1) {
    const c = pick(COINS)
    if (Math.random() < 0.5) {
      const text = `Which coin is worth ${c.cents}¢?`
      return { key: text, prompt: { text }, answer: c.name, formats: ['choice'], wrong: (n) => wrongFrom(c.name, n, COINS.map((x) => x.name)) }
    }
    const text = `How many cents is a ${c.name} worth?`
    return {
      key: text,
      prompt: { text, svg: coinsSVG([c.name]) },
      answer: String(c.cents),
      wrong: (n) => wrongFrom(String(c.cents), n, COINS.map((x) => String(x.cents)), ['2', '50', '100']),
    }
  }
  if (level === 5) {
    // Making change: you have 20¢–$1, the toy costs at least 5¢ less.
    const total = 5 * rand(4, 20)
    const price = total - 5 * rand(1, total / 5 - 1)
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
    names.sort((a, b) => coin(b).cents - coin(a).cents) // biggest first, like counting on
  }
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

export const clocksCoins: Subject = {
  id: 'clocks',
  name: 'Clocks & Coins',
  emoji: '⏰',
  skills: [
    {
      id: 'time',
      label: (L) => ["Telling time: o'clock", 'Telling time: half past', 'Telling time: quarter past and to', 'Telling time: every 5 minutes', 'Telling time: any minute'][L - 1]!,
      maxLevel: 5,
      formats: ['choice'],
      generate: (L) => clockItem(...clockTime(L)),
      fromKey: (key) => {
        const m = key.match(/^clock:(\d+):(\d\d)$/)
        return m ? clockItem(Number(m[1]), Number(m[2])) : null
      },
    },
    {
      id: 'coins',
      label: (L) => ['What coins are worth', 'Counting the same coins', 'Counting coins up to 50¢', 'Counting coins up to $1', 'Making change'][L - 1]!,
      maxLevel: 5,
      formats: ['number', 'choice'],
      generate: coinItem,
    },
  ],
}
