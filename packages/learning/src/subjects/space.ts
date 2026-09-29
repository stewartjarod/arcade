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
const idx = (name: string) => PLANETS.indexOf(name as (typeof PLANETS)[number])

/** Work out the answer from the question's own words, so any order question can be rebuilt from its key. */
function orderSpec(q: string): ItemSpec | null {
  let a: string
  let near: string[] = []
  let pool: readonly string[] = PLANETS
  let m: RegExpMatchArray | null
  if (q === 'Which planet is closest to the Sun?') (a = 'Mercury'), (near = ['Venus', 'Earth'])
  else if (q === 'Which planet is farthest from the Sun?') (a = 'Neptune'), (near = ['Uranus', 'Saturn'])
  else if ((m = q.match(/^Which planet comes right after (\w+)\?$/)) && idx(m[1]!) >= 0 && idx(m[1]!) < 7) {
    const i = idx(m[1]!) + 1
    ;(a = PLANETS[i]!), (near = [PLANETS[i - 2]!, ...neighbors(i)].filter((p) => p !== m![1]))
  } else if ((m = q.match(/^Which planet comes right before (\w+)\?$/)) && idx(m[1]!) > 0) {
    const i = idx(m[1]!) - 1
    ;(a = PLANETS[i]!), (near = [PLANETS[i + 2]!, ...neighbors(i)].filter((p) => p && p !== m![1]))
  } else if ((m = q.match(/^Which planet is (\d)(?:st|nd|rd|th) from the Sun\?$/))) {
    const i = Number(m[1]) - 1
    ;(a = PLANETS[i]!), (near = neighbors(i))
  } else if ((m = q.match(/^Which planet is between (\w+) and (\w+)\?$/))) {
    const i = idx(m[1]!) + 1
    const [before, after] = [m[1]!, m[2]!]
    ;(a = PLANETS[i]!), (near = neighbors(i).filter((p) => p !== before && p !== after))
    pool = PLANETS.filter((p) => p !== before && p !== after)
  } else if ((m = q.match(/^How many planets are closer to the Sun than (\w+)\?$/))) {
    const i = idx(m[1]!)
    ;(a = String(i)), (pool = ['0', '1', '2', '3', '4', '5', '6', '7'])
    near = [String(i + 1), String(i - 1)].filter((x) => x !== '-1' && x !== '8')
  } else return null
  return { key: q, prompt: { text: q, emoji: '☀️' }, answer: a, wrong: (n) => wrongFrom(a, n, pool, near) }
}

function orderQuestion(level: number): string {
  if (level === 1) {
    return pick(['Which planet is closest to the Sun?', 'Which planet is farthest from the Sun?', 'Which planet is 3rd from the Sun?', 'Which planet comes right after Earth?'])
  }
  if (level === 2 || level === 3) {
    // Level 2: the inner planets; level 3: all of them, and "which is 5th?"
    if (level === 3 && Math.random() < 0.4) return `Which planet is ${ORDINAL[rand(0, 7)]} from the Sun?`
    const i = level === 2 ? rand(1, 4) : rand(1, 6)
    return Math.random() < 0.5 ? `Which planet comes right after ${PLANETS[i]}?` : `Which planet comes right before ${PLANETS[i]}?`
  }
  if (Math.random() < 0.5) {
    const k = rand(1, 6)
    return `Which planet is between ${PLANETS[k - 1]} and ${PLANETS[k + 1]}?`
  }
  return `How many planets are closer to the Sun than ${PLANETS[rand(0, 7)]}?`
}

// --- Planet cards: what games show when you visit a planet ---

export interface PlanetCard {
  name: string
  /** 1 = closest to the Sun (the Sun itself is 0). */
  order: number
  nickname: string
  kind: 'star' | 'rocky planet' | 'gas giant' | 'ice giant'
  /** Short, true, kid-sized facts — the first is the most important. */
  facts: string[]
}

// Checked against NASA's solar system pages. Avoid facts that change (like exact moon counts).
export const PLANET_CARDS: PlanetCard[] = [
  { name: 'Sun', order: 0, nickname: 'Our star', kind: 'star', facts: ['The Sun is a star — the closest star to us.', 'About a million Earths could fit inside it.', 'All the planets travel around it.'] },
  { name: 'Mercury', order: 1, nickname: 'The speedy little one', kind: 'rocky planet', facts: ['Mercury is the closest planet to the Sun.', 'It is the smallest planet.', 'A year on Mercury is only 88 days.', 'It has no moons, and lots of craters.'] },
  { name: 'Venus', order: 2, nickname: 'The hot, cloudy one', kind: 'rocky planet', facts: ['Venus is the hottest planet — even hotter than Mercury!', 'Thick clouds trap its heat like a blanket.', 'On Venus, the Sun rises in the west.', 'It is the brightest planet in our night sky.'] },
  { name: 'Earth', order: 3, nickname: 'Our home', kind: 'rocky planet', facts: ['Earth is our home — the only planet we know has living things.', 'Oceans of water cover most of it.', 'It has one Moon.', 'It takes one year to go around the Sun.'] },
  { name: 'Mars', order: 4, nickname: 'The Red Planet', kind: 'rocky planet', facts: ['Mars is the Red Planet — its dirt is rusty red.', 'It has the tallest volcano of any planet, Olympus Mons.', 'It has two tiny moons, Phobos and Deimos.', 'Robot rovers drive around on Mars.'] },
  { name: 'Jupiter', order: 5, nickname: 'The giant', kind: 'gas giant', facts: ['Jupiter is the biggest planet — over 1,000 Earths could fit inside!', 'Its Great Red Spot is a storm bigger than Earth.', 'It is made mostly of gas.'] },
  { name: 'Saturn', order: 6, nickname: 'The one with rings', kind: 'gas giant', facts: ['Saturn has the biggest, brightest rings, made of ice and rock.', 'It is so light it would float in a giant bathtub.', 'Its moon Titan is bigger than the planet Mercury.'] },
  { name: 'Uranus', order: 7, nickname: 'The sideways one', kind: 'ice giant', facts: ['Uranus spins tipped over on its side.', 'It is an icy, blue-green ice giant.', 'It was the first planet found with a telescope.'] },
  { name: 'Neptune', order: 8, nickname: 'The windy blue one', kind: 'ice giant', facts: ['Neptune is the farthest planet from the Sun.', 'It has the fastest winds in the solar system.', 'One year on Neptune is about 165 Earth years!'] },
]

/** The memory trick for the order of the planets. */
export const PLANET_MNEMONIC = 'My Very Excellent Mother Just Served Us Nachos'

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
      generate: (L) => orderSpec(orderQuestion(L))!,
      fromKey: (key) => orderSpec(key),
    },
  ],
}
