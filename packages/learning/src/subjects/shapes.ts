import type { ItemSpec, Skill } from '../core/types'
import { pick, wrongFrom } from './util'

/**
 * Shapes (IXL Kindergarten → grade 2): name the shape, then count its sides, then more kinds of polygons.
 * Each shape is drawn as a little SVG, so the picture does the asking.
 */

const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']

// Regular polygons have equal sides; the others are drawn by hand below.
const SIDES: Record<string, number> = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 }

function polygon(sides: number, color: string) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + (sides === 4 ? Math.PI / 4 : 0)
    return `${(60 + 50 * Math.cos(a)).toFixed(1)},${(60 + 50 * Math.sin(a)).toFixed(1)}`
  })
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`
}

function drawing(name: string, color: string) {
  let body: string
  if (name === 'circle') body = `<circle cx="60" cy="60" r="48" fill="${color}"/>`
  else if (name === 'rectangle') body = `<rect x="6" y="28" width="108" height="64" fill="${color}"/>`
  // A rhombus leans: its diagonals are clearly unequal, so it does not look like a tilted square.
  else if (name === 'rhombus') body = `<polygon points="60,20 112,60 60,100 8,60" fill="${color}"/>`
  else if (name === 'square') body = `<rect x="14" y="14" width="92" height="92" fill="${color}"/>`
  else body = polygon(SIDES[name]!, color)
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

// Which shapes can come up at each level of "name the shape" (a skill's levels all take the same kind of answer).
const NAMES: string[][] = [
  ['circle', 'triangle', 'square', 'rectangle', 'hexagon'], // Kindergarten
  ['circle', 'triangle', 'square', 'rectangle', 'rhombus', 'pentagon', 'hexagon'], // grade 1
  ['pentagon', 'hexagon', 'heptagon', 'octagon'], // grade 2
]
// ...and of "count the sides".
const SIDE_SHAPES: string[][] = [
  ['triangle', 'square', 'rectangle'],
  ['triangle', 'square', 'rectangle', 'rhombus', 'pentagon', 'hexagon'],
  ['pentagon', 'hexagon', 'heptagon', 'octagon'],
]
const sidesOf = (name: string) => (name === 'rectangle' || name === 'rhombus' ? 4 : SIDES[name]!)

// A square is also a rectangle and a rhombus, and a rectangle is not a square: never offer a name that is also true.
const ALSO_TRUE: Record<string, string[]> = { square: ['rectangle', 'rhombus'], rectangle: ['square'], rhombus: ['square'] }

function nameItem(name: string, level: number): ItemSpec {
  return {
    key: `shape:${name}`,
    prompt: { text: 'What shape is this?', say: 'What shape is this?', svg: drawing(name, pick(COLORS)) },
    answer: name,
    // Wrong answers come only from shapes this level teaches, so a kindergartner never sees "heptagon".
    wrong: (n) => wrongFrom(name, n, NAMES[level - 1]!.filter((s) => !(ALSO_TRUE[name] ?? []).includes(s))),
  }
}

function sidesItem(name: string): ItemSpec {
  const n = sidesOf(name)
  return {
    key: `sides:${name}`,
    prompt: { text: 'How many sides?', say: 'How many sides does it have?', svg: drawing(name, pick(COLORS)) },
    answer: String(n),
    wrong: (k) => wrongFrom(String(n), k, ['3', '4', '5', '6', '7', '8'], [String(n + 1), String(n - 1)]),
    seconds: 6,
  }
}

const NAME_LABELS = ['Two-dimensional shapes', 'Name the two-dimensional shape', 'Name polygons: up to 12 sides']
const SIDE_LABELS = ['Count sides', 'Count sides and corners', 'Count sides and vertices']

export const shapes: Skill = {
  id: 'shapes',
  label: (L) => NAME_LABELS[L - 1]!,
  maxLevel: NAME_LABELS.length,
  formats: ['choice'],
  generate: (L) => nameItem(pick(NAMES[L - 1]!), L),
  fromKey: (key, level) => {
    const name = key.startsWith('shape:') ? key.slice(6) : ''
    return NAMES.flat().includes(name) ? nameItem(name, NAMES[level - 1]!.includes(name) ? level : 2) : null
  },
}

export const sides: Skill = {
  id: 'sides',
  label: (L) => SIDE_LABELS[L - 1]!,
  maxLevel: SIDE_LABELS.length,
  formats: ['number', 'choice'],
  generate: (L) => sidesItem(pick(SIDE_SHAPES[L - 1]!)),
  fromKey: (key) => {
    const name = key.startsWith('sides:') ? key.slice(6) : ''
    return SIDE_SHAPES.flat().includes(name) ? sidesItem(name) : null
  },
}
