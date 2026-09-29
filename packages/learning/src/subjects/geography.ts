import type { ItemSpec, Subject } from '../core/types'
import { upToLevel, wrongFrom } from './util'

/**
 * Geography: continents and oceans first, then US states and their capitals.
 */

export const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Antarctica'] as const
export const OCEANS = ['Pacific', 'Atlantic', 'Indian', 'Arctic', 'Southern'] as const

interface Fact {
  level: number
  q: string
  a: string
  pool: readonly string[]
  emoji?: string
}

const WORLD: Fact[] = [
  // 1
  { level: 1, q: 'How many continents are there?', a: '7', pool: ['5', '6', '8', '9'], emoji: '🌍' },
  { level: 1, q: 'Which continent do we live on?', a: 'North America', pool: CONTINENTS, emoji: '🏡' },
  { level: 1, q: 'Which continent is covered in ice?', a: 'Antarctica', pool: CONTINENTS, emoji: '🧊' },
  { level: 1, q: 'How many oceans are there?', a: '5', pool: ['3', '4', '6', '7'], emoji: '🌊' },
  { level: 1, q: 'Which is the biggest ocean?', a: 'Pacific', pool: OCEANS, emoji: '🐋' },
  // 2
  { level: 2, q: 'Which is the biggest continent?', a: 'Asia', pool: CONTINENTS, emoji: '🗺️' },
  { level: 2, q: 'Which continent do kangaroos come from?', a: 'Australia', pool: CONTINENTS, emoji: '🦘' },
  { level: 2, q: 'Which continent has the Sahara, a giant desert?', a: 'Africa', pool: CONTINENTS, emoji: '🐪' },
  { level: 2, q: 'Which continent is right below North America?', a: 'South America', pool: CONTINENTS, emoji: '⬇️' },
  { level: 2, q: 'Which ocean is between America and Europe?', a: 'Atlantic', pool: OCEANS, emoji: '🚢' },
  { level: 2, q: 'Which ocean is at the North Pole?', a: 'Arctic', pool: OCEANS, emoji: '🐻‍❄️' },
  { level: 2, q: 'Where do penguins live in the wild, far in the south?', a: 'Antarctica', pool: CONTINENTS, emoji: '🐧' },
  // 3 — countries
  { level: 3, q: 'Which continent is Brazil in?', a: 'South America', pool: CONTINENTS, emoji: '🇧🇷' },
  { level: 3, q: 'Which continent is France in?', a: 'Europe', pool: CONTINENTS, emoji: '🇫🇷' },
  { level: 3, q: 'Which continent is China in?', a: 'Asia', pool: CONTINENTS, emoji: '🇨🇳' },
  { level: 3, q: 'Which continent is Egypt in?', a: 'Africa', pool: CONTINENTS, emoji: '🇪🇬' },
  { level: 3, q: 'Which continent is Canada in?', a: 'North America', pool: CONTINENTS, emoji: '🇨🇦' },
  { level: 3, q: 'Which continent is Mexico in?', a: 'North America', pool: CONTINENTS, emoji: '🇲🇽' },
  { level: 3, q: 'Which continent is Japan in?', a: 'Asia', pool: CONTINENTS, emoji: '🇯🇵' },
  { level: 3, q: 'Which continent is Kenya in?', a: 'Africa', pool: CONTINENTS, emoji: '🇰🇪' },
  { level: 3, q: 'Which ocean is around Antarctica?', a: 'Southern', pool: OCEANS, emoji: '🧊' },
  { level: 3, q: 'Which ocean is below India?', a: 'Indian', pool: OCEANS, emoji: '🐘' },
]

// Capitals, grouped by region. The Mountain West comes first because it's closest to home —
// move a region to level 1 to start somewhere else.
const REGIONS: [string, string][][] = [
  [['Colorado', 'Denver'], ['Utah', 'Salt Lake City'], ['Arizona', 'Phoenix'], ['New Mexico', 'Santa Fe'], ['Wyoming', 'Cheyenne'], ['Montana', 'Helena'], ['Idaho', 'Boise'], ['Nevada', 'Carson City']],
  [['California', 'Sacramento'], ['Oregon', 'Salem'], ['Washington', 'Olympia'], ['Alaska', 'Juneau'], ['Hawaii', 'Honolulu'], ['Texas', 'Austin'], ['Oklahoma', 'Oklahoma City'], ['Kansas', 'Topeka'], ['Nebraska', 'Lincoln']],
  [['North Dakota', 'Bismarck'], ['South Dakota', 'Pierre'], ['Minnesota', 'Saint Paul'], ['Iowa', 'Des Moines'], ['Missouri', 'Jefferson City'], ['Wisconsin', 'Madison'], ['Illinois', 'Springfield'], ['Michigan', 'Lansing'], ['Indiana', 'Indianapolis'], ['Ohio', 'Columbus']],
  [['Arkansas', 'Little Rock'], ['Louisiana', 'Baton Rouge'], ['Mississippi', 'Jackson'], ['Alabama', 'Montgomery'], ['Tennessee', 'Nashville'], ['Kentucky', 'Frankfort'], ['Georgia', 'Atlanta'], ['Florida', 'Tallahassee'], ['South Carolina', 'Columbia'], ['North Carolina', 'Raleigh'], ['Virginia', 'Richmond'], ['West Virginia', 'Charleston']],
  [['Maryland', 'Annapolis'], ['Delaware', 'Dover'], ['Pennsylvania', 'Harrisburg'], ['New Jersey', 'Trenton'], ['New York', 'Albany'], ['Connecticut', 'Hartford'], ['Rhode Island', 'Providence'], ['Massachusetts', 'Boston'], ['Vermont', 'Montpelier'], ['New Hampshire', 'Concord'], ['Maine', 'Augusta']],
]
const REGION_NAMES = ['the Mountain West', 'the West Coast and Plains', 'the Midwest', 'the South', 'the Northeast']
const STATES = REGIONS.flatMap((r, i) => r.map(([state, capital]) => ({ state, capital, level: i + 1 })))

function worldItem(f: Fact): ItemSpec {
  return { key: f.q, prompt: { text: f.q, emoji: f.emoji }, answer: f.a, wrong: (n) => wrongFrom(f.a, n, f.pool) }
}

function capitalItem(state: string, reverse = Math.random() < 0.3): ItemSpec {
  const s = STATES.find((x) => x.state === state)!
  const sameRegion = STATES.filter((x) => x.level === s.level)
  if (reverse) {
    const q = `${s.capital} is the capital of which state?`
    return { key: q, prompt: { text: q, emoji: '🏛️' }, answer: s.state, wrong: (n) => wrongFrom(s.state, n, STATES.map((x) => x.state), sameRegion.map((x) => x.state)) }
  }
  const q = `What is the capital of ${s.state}?`
  return { key: q, prompt: { text: q, emoji: '🏛️' }, answer: s.capital, wrong: (n) => wrongFrom(s.capital, n, STATES.map((x) => x.capital), sameRegion.map((x) => x.capital)) }
}

export const geography: Subject = {
  id: 'geography',
  name: 'Geography',
  emoji: '🌎',
  skills: [
    {
      id: 'world',
      label: (L) => ['Continents and oceans', 'Where things are in the world', 'Countries and continents'][L - 1]!,
      maxLevel: 3,
      formats: ['choice'],
      generate: (L) => worldItem(upToLevel(WORLD, L)),
      fromKey: (key) => {
        const f = WORLD.find((x) => x.q === key)
        return f ? worldItem(f) : null
      },
    },
    {
      id: 'capitals',
      label: (L) => `State capitals: ${REGION_NAMES[L - 1]}`,
      maxLevel: REGIONS.length,
      formats: ['choice'],
      unlocksAfter: [{ skill: 'world', level: 2 }],
      generate: (L) => capitalItem(upToLevel(STATES, L).state),
      fromKey: (key) => {
        const forward = key.match(/^What is the capital of (.+)\?$/)?.[1]
        const reverse = key.match(/^(.+) is the capital of which state\?$/)?.[1]
        const s = STATES.find((x) => x.state === forward || x.capital === reverse)
        return s ? capitalItem(s.state, !!reverse) : null
      },
    },
  ],
}
