import type { ItemSpec, Subject } from '../core/types'
import { pick, rand, upToLevel, wrongFrom } from './util'

/**
 * Space: the planets — their names, their order from the Sun, and what makes each one special.
 * Memory trick for the order: "My Very Excellent Mother Just Served Us Nachos".
 */

export const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const

interface Fact {
  level: number
  q: string
  a: string
  /** Wrong answers. Default: other planets. */
  wrong?: string[]
  emoji?: string
}

// Checked against NASA's solar system facts. Keep answers true for kids *and* grown-ups.
const FACTS: Fact[] = [
  // 1 — the basics
  { level: 1, q: 'Which planet do we live on?', a: 'Earth', emoji: '🏡' },
  { level: 1, q: 'Which planet is called the Red Planet?', a: 'Mars', emoji: '🔴' },
  { level: 1, q: 'Which planet has big, bright rings?', a: 'Saturn', emoji: '💍' },
  { level: 1, q: 'Which is the biggest planet?', a: 'Jupiter', emoji: '🐘' },
  { level: 1, q: 'What is the Sun?', a: 'a star', wrong: ['a planet', 'a moon', 'a cloud'], emoji: '☀️' },
  { level: 1, q: 'What goes around the Earth?', a: 'the Moon', wrong: ['the Sun', 'Mars', 'Jupiter'], emoji: '🌍' },
  { level: 1, q: 'How many planets are in our solar system?', a: '8', wrong: ['7', '9', '10'], emoji: '🪐' },
  // 2 — what makes each one special
  { level: 2, q: 'Which planet is the smallest?', a: 'Mercury', emoji: '🐜' },
  { level: 2, q: 'Which planet is the hottest?', a: 'Venus', emoji: '🔥' },
  { level: 2, q: 'Which planet has a giant storm called the Great Red Spot?', a: 'Jupiter', emoji: '🌀' },
  { level: 2, q: 'Which is the only planet we know has living things?', a: 'Earth', emoji: '🌳' },
  { level: 2, q: 'Which planet spins tipped over on its side?', a: 'Uranus', emoji: '🎳' },
  { level: 2, q: 'Which planet has the fastest winds?', a: 'Neptune', emoji: '💨' },
  { level: 2, q: 'Which planet is covered with oceans of water?', a: 'Earth', emoji: '🌊' },
  // 3 — amazing details
  { level: 3, q: 'Which planet has two tiny moons named Phobos and Deimos?', a: 'Mars', emoji: '🌑' },
  { level: 3, q: 'Which planet has the tallest volcano, Olympus Mons?', a: 'Mars', emoji: '🌋' },
  { level: 3, q: 'Which two planets have no moons at all?', a: 'Mercury and Venus', wrong: ['Earth and Mars', 'Jupiter and Saturn', 'Uranus and Neptune'] },
  { level: 3, q: 'Which planet is so light it would float in a giant bathtub?', a: 'Saturn', emoji: '🛁' },
  { level: 3, q: 'On which planet does the Sun rise in the west?', a: 'Venus', wrong: ['Earth', 'Mars', 'Mercury', 'Jupiter'], emoji: '🌅' },
  { level: 3, q: 'Which planet has thick clouds that trap heat like a blanket?', a: 'Venus', emoji: '☁️' },
  { level: 3, q: 'Which planet looks deep blue and is farthest from the Sun?', a: 'Neptune', emoji: '🔵' },
  // 4 — groups and big ideas
  { level: 4, q: 'Which planets are giant balls of gas?', a: 'Jupiter and Saturn', wrong: ['Mars and Venus', 'Earth and Mercury', 'Mercury and Mars'] },
  { level: 4, q: 'Which planets are called ice giants?', a: 'Uranus and Neptune', wrong: ['Jupiter and Saturn', 'Mars and Venus', 'Earth and Mars'] },
  { level: 4, q: 'Which planets are small and rocky?', a: 'Mercury, Venus, Earth and Mars', wrong: ['Jupiter, Saturn, Uranus and Neptune', 'Earth, Jupiter, Saturn and Neptune', 'Venus, Mars, Uranus and Neptune'] },
  { level: 4, q: 'Pluto used to be called a planet. What is it now?', a: 'a dwarf planet', wrong: ['a star', 'a moon', 'a comet'] },
  { level: 4, q: 'How long is one year on Mercury?', a: '88 days', wrong: ['365 days', '10 years', '1 day'] },
  { level: 4, q: 'What is between Mars and Jupiter?', a: 'the asteroid belt', wrong: ['the Moon', 'the Sun', "Saturn's rings"] },
  { level: 4, q: 'How long does it take Earth to go around the Sun?', a: 'one year', wrong: ['one day', 'one month', 'one hour'] },
  { level: 4, q: 'What makes day and night on Earth?', a: 'Earth spinning', wrong: ['the Sun moving', 'the Moon hiding', 'clouds'] },
]

function factItem(f: Fact): ItemSpec {
  return {
    key: f.q,
    prompt: { text: f.q, emoji: f.emoji },
    answer: f.a,
    wrong: (n) => wrongFrom(f.a, n, f.wrong ?? [...PLANETS]),
  }
}

// --- Order from the Sun ---

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
/** Planets next to this one in the list — the most believable wrong answers. */
const neighbors = (i: number) => [PLANETS[i - 1], PLANETS[i + 1], PLANETS[i - 2], PLANETS[i + 2]].filter(Boolean) as string[]

function orderItem(level: number): ItemSpec {
  let q: string
  let a: string
  let near: string[] = []
  let pool: readonly string[] = PLANETS
  if (level === 1) {
    ;[q, a] = pick([
      ['Which planet is closest to the Sun?', 'Mercury'],
      ['Which planet is farthest from the Sun?', 'Neptune'],
      ['Which planet is 3rd from the Sun?', 'Earth'],
      ['Which planet comes right after Earth?', 'Mars'],
    ])
  } else if (level === 2 || level === 3) {
    // Level 2: the inner planets; level 3: any of them.
    const i = level === 2 ? rand(1, 4) : rand(1, 6)
    if (Math.random() < 0.5) {
      q = `Which planet comes right after ${PLANETS[i]}?`
      a = PLANETS[i + 1]!
      near = [PLANETS[i - 1]!, ...neighbors(i + 1)]
    } else {
      q = `Which planet comes right before ${PLANETS[i]}?`
      a = PLANETS[i - 1]!
      near = [PLANETS[i + 1]!, ...neighbors(i - 1)]
    }
    if (level === 3 && Math.random() < 0.4) {
      const k = rand(0, 7)
      q = `Which planet is ${ORDINAL[k]} from the Sun?`
      a = PLANETS[k]!
      near = neighbors(k)
    }
  } else {
    const i = rand(0, 7)
    if (Math.random() < 0.5) {
      const k = rand(1, 6)
      q = `Which planet is between ${PLANETS[k - 1]} and ${PLANETS[k + 1]}?`
      a = PLANETS[k]!
      near = neighbors(k).filter((p) => p !== PLANETS[k - 1] && p !== PLANETS[k + 1])
      pool = PLANETS.filter((p) => p !== PLANETS[k - 1] && p !== PLANETS[k + 1])
    } else {
      q = `How many planets are closer to the Sun than ${PLANETS[i]}?`
      a = String(i)
      pool = ['0', '1', '2', '3', '4', '5', '6', '7']
      near = [String(i + 1), String(i - 1)].filter((x) => x !== '-1' && x !== '8')
    }
  }
  return { key: q, prompt: { text: q, emoji: '☀️' }, answer: a, wrong: (n) => wrongFrom(a, n, pool, near) }
}

export const space: Subject = {
  id: 'space',
  name: 'Space',
  emoji: '🪐',
  skills: [
    {
      id: 'planets',
      label: (L) => ['Planet names', 'What makes each planet special', 'Amazing planet facts', 'Planet groups and big ideas'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      generate: (L) => factItem(upToLevel(FACTS, L)),
      fromKey: (key) => {
        const f = FACTS.find((x) => x.q === key)
        return f ? factItem(f) : null
      },
    },
    {
      id: 'order',
      label: (L) => ['First and last planets', 'Order of the inner planets', 'Order of all eight planets', 'Between and counting'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      unlocksAfter: [{ skill: 'planets', level: 1 }],
      generate: orderItem,
    },
  ],
}
