import { START_SKILLS, START_STATS, type Skills, type Stats } from './math'

export type Save = {
  cheese: number
  skills: Skills
  stats: Stats
  mazes: number
  realmMax: number
  realmPick: number
  perfect: number
  stickers: string[]
  ownedColors: string[]
  ownedHats: string[]
  color: string
  hat: string
  muted: boolean
}

const KEY = 'mouse-maze-math:v1'
const fresh = (): Save => ({
  cheese: 0,
  skills: { ...START_SKILLS },
  stats: START_STATS(),
  mazes: 0,
  realmMax: 0,
  realmPick: -1,
  perfect: 0,
  stickers: [],
  ownedColors: ['gray'],
  ownedHats: ['none'],
  color: 'gray',
  hat: 'none',
  muted: false,
})

const load = (): Save => {
  try {
    const d = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
    d.skills = { ...START_SKILLS, ...d.skills }
    d.stats = { ...START_STATS(), ...d.stats }
    return d
  } catch {
    return fresh()
  }
}

export const save = load()
export const commit = () => localStorage.setItem(KEY, JSON.stringify(save))
