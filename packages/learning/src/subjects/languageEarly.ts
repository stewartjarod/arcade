import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * Early reading and writing for grades 1–2 (with a little kindergarten): sounds and letters, short
 * and long vowels, digraphs, diphthongs, syllables, main idea, first grammar, and capitalization.
 * Each skill is named like an IXL category.
 *
 * Each skill is a hand-written bank per level, like languageMore.ts. A row is one question, one
 * right answer, and three wrong answers, and every wrong answer was checked by hand to be clearly
 * wrong. Keys are "<skill>:<level>:<row>", so a missed question can be rebuilt exactly.
 */

interface Row {
  /** A big picture shown with the question. */
  pic?: string
  /** The question (may include a short passage). "___" marks a blank. */
  q: string
  /** What to read aloud, when the text reads badly as written. */
  say?: string
  a: string
  w: string[]
}

/** A plain row: question, right answer, three wrong answers. */
const r = (q: string, a: string, ...w: string[]): Row => ({ q, a, w })
/** A row with a picture. */
const p = (pic: string, q: string, a: string, ...w: string[]): Row => ({ pic, q, a, w })

/**
 * One skill from its banks. With `exact`, the answer must match letter for letter, capitals
 * included (capitalization questions).
 */
function rowSkill(id: string, labels: string[], banks: Row[][], exact = false): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.say ?? row.q.replace(/___/g, 'blank'), ...(row.pic ? { emoji: row.pic } : {}) },
      answer: row.a,
      wrong: (n) => wrongFrom(row.a, n, row.w),
      ...(exact ? { check: (resp: string) => (resp.trim() === row.a ? 1 : 0) } : {}),
    }
  }
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: banks.length,
    formats: ['choice'],
    generate: (L) => {
      // Mostly this level's questions; sometimes an easier level's, so older ones still come back.
      const level = L > 1 && Math.random() < 0.3 ? 1 + Math.floor(Math.random() * (L - 1)) : L
      return itemAt(level, Math.floor(Math.random() * banks[level - 1]!.length))
    },
    fromKey: (key, L) => {
      const [k, lv, idx] = key.split(':')
      const level = Number(lv)
      const i = Number(idx)
      if (k !== id || !Number.isInteger(level) || level < 1 || level > L) return null
      if (!Number.isInteger(i) || !banks[level - 1]?.[i]) return null
      return itemAt(level, i)
    },
  }
}

const PIC_Q = 'Which word matches the picture?'

// --- Reading: short vowels ----------------------------------------------------------------------

const shortVowels = rowSkill(
  'shortVowels',
  ['Short a words', 'Short e words', 'Mixed short vowels'],
  [
    [
      p('🐱', PIC_Q, 'cat', 'cut', 'cot', 'cup'),
      p('🎩', PIC_Q, 'hat', 'hot', 'hit', 'hut'),
      p('🦇', PIC_Q, 'bat', 'bit', 'bet', 'bug'),
      p('🗺️', PIC_Q, 'map', 'mop', 'mud', 'mug'),
      p('👜', PIC_Q, 'bag', 'big', 'bug', 'beg'),
      p('🍳', PIC_Q, 'pan', 'pen', 'pin', 'pun'),
      p('🚐', PIC_Q, 'van', 'ten', 'vet', 'fun'),
      p('🐀', PIC_Q, 'rat', 'rot', 'rut', 'rip'),
      p('🐜', PIC_Q, 'ant', 'end', 'ink', 'owl'),
      p('🥫', PIC_Q, 'can', 'cone', 'cane', 'coin'),
      p('🧢', PIC_Q, 'cap', 'cup', 'top', 'cop'),
    ],
    [
      p('🛏️', PIC_Q, 'bed', 'bid', 'bud', 'bad'),
      p('🖊️', PIC_Q, 'pen', 'pan', 'pin', 'pun'),
      p('🦵', PIC_Q, 'leg', 'log', 'lag', 'lug'),
      p('🥚', PIC_Q, 'egg', 'bug', 'dog', 'bag'),
      p('🥅', PIC_Q, 'net', 'nut', 'not', 'nit'),
      p('🔔', PIC_Q, 'bell', 'ball', 'bill', 'bull'),
      p('🛷', PIC_Q, 'sled', 'slid', 'slam', 'slip'),
      p('🕸️', PIC_Q, 'web', 'wig', 'wit', 'wag'),
      p('🔟', PIC_Q, 'ten', 'tan', 'tin', 'tun'),
      p('🟥', PIC_Q, 'red', 'rod', 'rid', 'rag'),
    ],
    [
      p('🐷', PIC_Q, 'pig', 'peg', 'pug', 'pad'),
      p('🐶', PIC_Q, 'dog', 'dig', 'dug', 'dam'),
      p('🐛', PIC_Q, 'bug', 'bag', 'big', 'beg'),
      p('☀️', PIC_Q, 'sun', 'sin', 'son', 'sat'),
      p('🦊', PIC_Q, 'fox', 'fix', 'fax', 'fog'),
      p('🧦', PIC_Q, 'sock', 'sack', 'sick', 'suck'),
      p('🥤', PIC_Q, 'cup', 'cap', 'cop', 'cut'),
      p('🚌', PIC_Q, 'bus', 'bat', 'bet', 'bit'),
      p('🪵', PIC_Q, 'log', 'lag', 'leg', 'lug'),
      p('🥁', PIC_Q, 'drum', 'drip', 'drag', 'drop'),
    ],
  ],
)

const shortVowelsMore = rowSkill(
  'shortVowelsMore',
  ['Short i words', 'Short o words', 'Short u words'],
  [
    [
      p('📌', PIC_Q, 'pin', 'pan', 'pen', 'pun'),
      p('🧒', PIC_Q, 'kid', 'bed', 'cod', 'lad'),
      p('6️⃣', PIC_Q, 'six', 'sit', 'sip', 'sun'),
      p('🥛', PIC_Q, 'milk', 'mask', 'mock', 'melt'),
      p('🧱', PIC_Q, 'brick', 'brock', 'brack', 'brush'),
      p('🐷', PIC_Q, 'pig', 'peg', 'pug', 'pad'),
      p('💍', PIC_Q, 'ring', 'rang', 'rung', 'rink'),
    ],
    [
      p('🐶', PIC_Q, 'dog', 'dig', 'dug', 'dad'),
      p('📦', PIC_Q, 'box', 'bag', 'bus', 'bib'),
      p('🦊', PIC_Q, 'fox', 'fix', 'fax', 'fig'),
      p('🪨', PIC_Q, 'rock', 'rack', 'rink', 'rake'),
      p('🍲', PIC_Q, 'pot', 'pit', 'pet', 'pat'),
      p('🪵', PIC_Q, 'log', 'lag', 'leg', 'lug'),
      p('🧦', PIC_Q, 'sock', 'sack', 'sick', 'suck'),
      p('🕰️', PIC_Q, 'clock', 'clack', 'click', 'cluck'),
      p('🐸', PIC_Q, 'frog', 'flag', 'from', 'fret'),
      p('🛑', PIC_Q, 'stop', 'step', 'stump', 'stamp'),
    ],
    [
      p('🐛', PIC_Q, 'bug', 'big', 'bag', 'beg'),
      p('☀️', PIC_Q, 'sun', 'sin', 'son', 'sat'),
      p('🥁', PIC_Q, 'drum', 'drip', 'drag', 'drop'),
      p('🚌', PIC_Q, 'bus', 'bat', 'bet', 'bit'),
      p('🦆', PIC_Q, 'duck', 'dock', 'deck', 'dark'),
      p('🚚', PIC_Q, 'truck', 'track', 'trick', 'trek'),
      p('🥜', PIC_Q, 'nut', 'net', 'not', 'nit'),
      p('🛖', PIC_Q, 'hut', 'hat', 'hot', 'hit'),
      p('🥤', PIC_Q, 'cup', 'cap', 'cop', 'cut'),
    ],
  ],
)

// --- Reading: digraphs --------------------------------------------------------------------------

const digraphs = rowSkill(
  'digraphs',
  ['Sounds: sh, ch, th, wh', 'Spelling: ph, ch, tch', 'Silent letters'],
  [
    [
      p('🚢', 'Which word matches the picture?', 'ship', 'sip', 'slip', 'skip'),
      p('🐟', 'Which word matches the picture?', 'fish', 'fist', 'dish', 'wish'),
      p('🐚', 'Which word matches the picture?', 'shell', 'sell', 'smell', 'shelf'),
      p('🪑', 'Which word matches the picture?', 'chair', 'hair', 'chain', 'pair'),
      p('🧀', 'Which word matches the picture?', 'cheese', 'cheek', 'chess', 'sheet'),
      p('🦷', 'Which word matches the picture?', 'tooth', 'toot', 'tool', 'tote'),
      p('🐋', 'Which word matches the picture?', 'whale', 'wail', 'wall', 'wheel'),
      p('🛞', 'Which word matches the picture?', 'wheel', 'whale', 'wheat', 'weed'),
      p('👟', 'Which word matches the picture?', 'shoe', 'show', 'shop', 'shot'),
      p('🐑', 'Which word matches the picture?', 'sheep', 'sleep', 'sheet', 'shelf'),
      p('🐥', 'Which word matches the picture?', 'chick', 'click', 'chin', 'thick'),
      p('🦈', 'Which word matches the picture?', 'shark', 'sharp', 'share', 'shade'),
    ],
    [
      p('📞', 'Which spelling matches the picture?', 'phone', 'fone', 'phon', 'foan'),
      p('🐬', 'Which spelling matches the picture?', 'dolphin', 'dolfin', 'dolpin', 'dolfen'),
      p('🐘', 'Which spelling matches the picture?', 'elephant', 'elefant', 'elefent', 'elephan'),
      p('🏆', 'Which spelling matches the picture?', 'trophy', 'trofy', 'trophey', 'trofee'),
      p('⌚', 'Which spelling matches the picture?', 'watch', 'wach', 'wotch', 'watsh'),
      p('🍑', 'Which spelling matches the picture?', 'peach', 'peech', 'peetch', 'pech'),
      p('🎤', 'Which spelling matches the picture?', 'microphone', 'microfone', 'microfon', 'microphon'),
    ],
    [
      p('🔪', 'Which spelling matches the picture?', 'knife', 'nife', 'kife', 'nyfe'),
      p('🔧', 'Which spelling matches the picture?', 'wrench', 'rench', 'wrentch', 'wrenc'),
      p('🏰', 'Which spelling matches the picture?', 'castle', 'casle', 'cassle', 'castel'),
      p('🏝️', 'Which spelling matches the picture?', 'island', 'iland', 'ilsand', 'islend'),
      p('🧗', 'Which spelling matches the picture?', 'climb', 'clim', 'klimb', 'clymb'),
      p('👻', 'Which spelling matches the picture?', 'ghost', 'gost', 'goast', 'gohst'),
      p('💡', 'Which spelling matches the picture?', 'light', 'ligt', 'litt', 'lyght'),
      p('🌙', 'Which spelling matches the picture?', 'night', 'nihgt', 'nigt', 'nyght'),
      p('✍️', 'Which spelling matches the picture?', 'write', 'rite', 'rote', 'wrot'),
    ],
  ],
)

// --- Reading: long and short vowels -------------------------------------------------------------

const shortLong = rowSkill(
  'shortLong',
  ['Long vowel sounds', 'Silent e makes it long', 'Short or long?'],
  [
    [
      r('Which word has the long a sound?', 'cake', 'cap', 'can', 'cat'),
      r('Which word has the long e sound?', 'tree', 'tent', 'ten', 'tin'),
      r('Which word has the long i sound?', 'kite', 'kit', 'kid', 'kin'),
      r('Which word has the long o sound?', 'bone', 'bond', 'bin', 'ban'),
      r('Which word has the long u sound?', 'cube', 'cub', 'cup', 'cut'),
      r('Which word has the long a sound?', 'tape', 'tap', 'tan', 'tip'),
      r('Which word has the long e sound?', 'feet', 'fit', 'fat', 'fan'),
      r('Which word has the long o sound?', 'boat', 'bat', 'bit', 'but'),
      r('Which word has the long i sound?', 'bike', 'bib', 'bus', 'back'),
      r('Which word has the long e sound?', 'sheep', 'ship', 'shop', 'shot'),
      r('Which word has the long a sound?', 'rain', 'ran', 'rag', 'rat'),
      r('Which word has the long o sound?', 'snow', 'snap', 'snip', 'snug'),
      r('Which word has the long i sound?', 'pie', 'pit', 'pat', 'pot'),
      r('Which word has the long u sound?', 'tube', 'tub', 'tug', 'tab'),
    ],
    [
      r('Which word has a long vowel because of a silent e?', 'made', 'mad', 'mat', 'map'),
      r('Which word has a long vowel because of a silent e?', 'bike', 'bit', 'bib', 'big'),
      r('Which word has a long vowel because of a silent e?', 'rope', 'rod', 'rob', 'rot'),
      r('Which word has a long vowel because of a silent e?', 'cube', 'cub', 'cup', 'cut'),
      r('Which word has a long vowel because of a silent e?', 'hope', 'hop', 'hot', 'hog'),
      r('Which word has a long vowel because of a silent e?', 'tape', 'tap', 'tip', 'top'),
      r('Which word has a long vowel because of a silent e?', 'name', 'nap', 'nab', 'nut'),
      r('Which word has a long vowel because of a silent e?', 'pine', 'pin', 'pen', 'pan'),
      r('Which word has a long vowel because of a silent e?', 'cute', 'cut', 'cub', 'cup'),
      r('Which word has a long vowel because of a silent e?', 'home', 'hum', 'him', 'hot'),
      r('Which word has a long vowel because of a silent e?', 'gate', 'gap', 'gas', 'get'),
      r('Which word has a long vowel because of a silent e?', 'nose', 'nod', 'not', 'nut'),
      r('Which word has a long vowel because of a silent e?', 'lane', 'lap', 'lag', 'lid'),
      r('Which word has a long vowel because of a silent e?', 'slide', 'slid', 'slap', 'slim'),
    ],
    [
      r('Which word has a short vowel sound?', 'hat', 'hate', 'hay', 'heat'),
      r('Which word has a short vowel sound?', 'bed', 'bee', 'bead', 'bake'),
      r('Which word has a short vowel sound?', 'pin', 'pine', 'pain', 'pie'),
      r('Which word has a short vowel sound?', 'cup', 'cute', 'cape', 'cube'),
      r('Which word has a short vowel sound?', 'hop', 'hope', 'home', 'hose'),
      r('Which word has a short vowel sound?', 'fin', 'fine', 'five', 'fight'),
      r('Which word has a short vowel sound?', 'bus', 'base', 'bite', 'beat'),
      r('Which word has a short vowel sound?', 'mop', 'mope', 'moan', 'mole'),
      r('Which word has a short vowel sound?', 'sit', 'site', 'seat', 'slide'),
      r('Which word has a short vowel sound?', 'rug', 'rude', 'rode', 'rain'),
      r('Which word has a short vowel sound?', 'ten', 'tea', 'team', 'teen'),
      r('Which word has a short vowel sound?', 'gap', 'gape', 'gate', 'gain'),
      r('Which word has a short vowel sound?', 'nod', 'note', 'node', 'nose'),
    ],
  ],
)

// --- Reading: diphthongs ------------------------------------------------------------------------

const diphthongs = rowSkill(
  'diphthongs',
  ['Pictures: oi, oy, ou, ow', 'Spelling: oi, oy, ou, ow', 'Same vowel sound'],
  [
    [
      p('🪙', 'Which word matches the picture?', 'coin', 'cone', 'coat', 'can'),
      p('🧸', 'Which word matches the picture?', 'toy', 'tie', 'toe', 'tea'),
      p('👦', 'Which word matches the picture?', 'boy', 'bay', 'bee', 'bow'),
      p('☁️', 'Which word matches the picture?', 'cloud', 'clay', 'claw', 'clam'),
      p('🐮', 'Which word matches the picture?', 'cow', 'cot', 'cab', 'cat'),
      p('🦉', 'Which word matches the picture?', 'owl', 'oil', 'eel', 'ant'),
      p('🏠', 'Which word matches the picture?', 'house', 'horse', 'hose', 'hoes'),
      p('👑', 'Which word matches the picture?', 'crown', 'crow', 'crane', 'cream'),
      p('🐭', 'Which word matches the picture?', 'mouse', 'moose', 'mouth', 'mess'),
      p('🚿', 'Which word matches the picture?', 'shower', 'shovel', 'shoot', 'sharp'),
      p('👉', 'Which word matches the picture?', 'point', 'paint', 'pint', 'pond'),
    ],
    [
      p('🪙', 'Finish the word: c___n', 'oi', 'oy', 'ou', 'ow'),
      p('🧸', 'Finish the word: t___', 'oy', 'oi', 'ou', 'ow'),
      p('👦', 'Finish the word: b___', 'oy', 'oi', 'ou', 'ow'),
      p('☁️', 'Finish the word: cl___d', 'ou', 'oi', 'oy', 'ow'),
      p('🏠', 'Finish the word: h___se', 'ou', 'ow', 'oi', 'oy'),
      p('🐮', 'Finish the word: c___', 'ow', 'ou', 'oi', 'oy'),
      p('👑', 'Finish the word: cr___n', 'ow', 'ou', 'oi', 'oy'),
      p('🐭', 'Finish the word: m___se', 'ou', 'ow', 'oi', 'oy'),
      p('🚿', 'Finish the word: sh___er', 'ow', 'ou', 'oi', 'oy'),
      p('👉', 'Finish the word: p___nt', 'oi', 'oy', 'ou', 'ow'),
    ],
    [
      r('Which word has the same vowel sound as "out"?', 'down', 'dome', 'dune', 'day'),
      r('Which word has the same vowel sound as "boy"?', 'oil', 'bee', 'cat', 'out'),
      r('Which word has the same vowel sound as "coin"?', 'toy', 'tie', 'two', 'toe'),
      r('Which word has the same vowel sound as "house"?', 'mouse', 'horse', 'home', 'hose'),
      r('Which word has the same vowel sound as "cloud"?', 'shout', 'shoe', 'shut', 'shot'),
      r('Which word has the same vowel sound as "cow"?', 'now', 'new', 'know', 'nod'),
      r('Which word has the same vowel sound as "owl"?', 'how', 'hoe', 'hue', 'hip'),
      r('Which word has the same vowel sound as "crown"?', 'brown', 'brain', 'bread', 'burn'),
      r('Which word has the same vowel sound as "point"?', 'joint', 'paint', 'pint', 'pond'),
      r('Which word has the same vowel sound as "mouth"?', 'south', 'math', 'moth', 'mess'),
      r('Which word has the same vowel sound as "toy"?', 'boil', 'bowl', 'bell', 'ball'),
    ],
  ],
)

// --- Reading: syllables -------------------------------------------------------------------------

const OPEN_Q = "Which word's first part ends in a vowel?"
const CLOSED_Q = "Which word's first part ends in a consonant?"
const COUNT_Q = (word: string) => `How many syllables are in "${word}"?`

const openSyllables = rowSkill(
  'openSyllables',
  ['Count the syllables', 'Open or closed first part', 'Put two parts together'],
  [
    [
      p('🐰', COUNT_Q('rabbit'), '2', '1', '3', '4'),
      r(COUNT_Q('puppy'), '2', '1', '3', '4'),
      p('✏️', COUNT_Q('pencil'), '2', '1', '3', '4'),
      p('🌅', COUNT_Q('sunset'), '2', '1', '3', '4'),
      p('🌈', COUNT_Q('rainbow'), '2', '1', '3', '4'),
      p('🧺', COUNT_Q('basket'), '2', '1', '3', '4'),
      p('🍌', COUNT_Q('banana'), '3', '1', '2', '4'),
      p('🐘', COUNT_Q('elephant'), '3', '1', '2', '4'),
      p('🦖', COUNT_Q('dinosaur'), '3', '1', '2', '4'),
      p('🚲', COUNT_Q('bicycle'), '3', '1', '2', '4'),
      p('🚁', COUNT_Q('helicopter'), '4', '2', '3', '5'),
      p('🐢', COUNT_Q('turtle'), '2', '1', '3', '4'),
      r(COUNT_Q('kitten'), '2', '1', '3', '4'),
      p('🍅', COUNT_Q('tomato'), '3', '1', '2', '4'),
    ],
    [
      r(OPEN_Q, 'paper', 'pencil', 'napkin', 'sunset'),
      r(OPEN_Q, 'tiger', 'basket', 'rabbit', 'mitten'),
      r(OPEN_Q, 'baby', 'puppy', 'window', 'kitten'),
      r(OPEN_Q, 'robot', 'happy', 'cactus', 'dinner'),
      r(OPEN_Q, 'music', 'winter', 'hammer', 'tennis'),
      r(OPEN_Q, 'lady', 'hundred', 'sunset', 'napkin'),
      r(OPEN_Q, 'hotel', 'rabbit', 'pencil', 'basket'),
      r(OPEN_Q, 'label', 'puppy', 'mitten', 'window'),
      r(OPEN_Q, 'pilot', 'kitten', 'happy', 'winter'),
      r(OPEN_Q, 'lemon', 'dinner', 'hammer', 'cactus'),
      r(OPEN_Q, 'radio', 'tennis', 'rabbit', 'napkin'),
      r(OPEN_Q, 'silent', 'sunset', 'hundred', 'pencil'),
      r(CLOSED_Q, 'rabbit', 'paper', 'tiger', 'baby'),
      r(CLOSED_Q, 'napkin', 'robot', 'music', 'lady'),
      r(CLOSED_Q, 'sunset', 'hotel', 'label', 'pilot'),
      r(CLOSED_Q, 'pencil', 'lemon', 'radio', 'silent'),
      r(CLOSED_Q, 'basket', 'tiger', 'robot', 'baby'),
      r(CLOSED_Q, 'happy', 'paper', 'music', 'lady'),
      r(CLOSED_Q, 'cactus', 'hotel', 'label', 'pilot'),
      r(CLOSED_Q, 'puppy', 'lemon', 'radio', 'silent'),
      r(CLOSED_Q, 'mitten', 'baby', 'robot', 'paper'),
      r(CLOSED_Q, 'window', 'music', 'tiger', 'lady'),
      r(CLOSED_Q, 'dinner', 'hotel', 'pilot', 'label'),
      r(CLOSED_Q, 'kitten', 'lemon', 'radio', 'silent'),
      r(CLOSED_Q, 'hammer', 'paper', 'robot', 'baby'),
      r(CLOSED_Q, 'winter', 'tiger', 'lady', 'music'),
    ],
    [
      p('🥞', 'Which part finishes the word? pan + ___', 'cake', 'cap', 'cape', 'call'),
      p('🌻', 'Which part finishes the word? sun + ___', 'flower', 'flag', 'fly', 'floor'),
      p('🛏️', 'Which part finishes the word? bed + ___', 'room', 'roof', 'rope', 'ring'),
      p('🍿', 'Which part finishes the word? pop + ___', 'corn', 'cone', 'card', 'coin'),
      p('🦋', 'Which part finishes the word? butter + ___', 'fly', 'flat', 'fan', 'fox'),
      p('⛵', 'Which part finishes the word? sail + ___', 'boat', 'bat', 'bell', 'ball'),
      p('⚽', 'Which part finishes the word? foot + ___', 'ball', 'bowl', 'bell', 'bag'),
      p('⛄', 'Which part finishes the word? snow + ___', 'man', 'mat', 'map', 'mop'),
      p('🐞', 'Which part finishes the word? lady + ___', 'bug', 'bag', 'big', 'beg'),
      p('🥜', 'Which part finishes the word? pea + ___', 'nut', 'net', 'not', 'nit'),
      p('🌈', 'Which part finishes the word? rain + ___', 'bow', 'bat', 'box', 'bee'),
      p('🧁', 'Which part finishes the word? cup + ___', 'cake', 'cape', 'cap', 'call'),
      p('🌅', 'Which part finishes the word? sun + ___', 'set', 'sit', 'sat', 'sin'),
      p('🐰', 'Which part finishes the word? rab + ___', 'bit', 'bat', 'bun', 'bag'),
    ],
  ],
)

// --- Reading: main idea and author's purpose ----------------------------------------------------

const mainTopic = rowSkill(
  'mainTopic',
  ['Main idea: what is it about?', 'Main idea of a short passage', 'Main idea and details'],
  [
    [
      r('What is this mostly about?\n\nDogs can run fast. Dogs can fetch a ball. Dogs are fun pets.', 'Dogs', 'Weather', 'Cars', 'Shoes'),
      r('What is this mostly about?\n\nBees make honey. Bees live in a hive. Bees help flowers grow.', 'Bees', 'Cats', 'Pizza', 'Snow'),
      r('What is this mostly about?\n\nThe sun is hot. The sun gives us light. Plants need the sun to grow.', 'The sun', 'Cookies', 'Trucks', 'Fish'),
      r('What is this mostly about?\n\nMia likes to paint. She paints flowers and birds. She uses lots of bright colors.', 'Painting', 'Swimming', 'Sleeping', 'Cooking'),
      r('What is this mostly about?\n\nIce cream is cold and sweet. Many kids love chocolate ice cream. You can eat it in a cone.', 'Ice cream', 'Soup', 'Shoes', 'Rain'),
      r('What is this mostly about?\n\nFrogs live near ponds. Frogs can jump far. Frogs eat many bugs.', 'Frogs', 'Cars', 'Hats', 'Rain'),
      r('What is this mostly about?\n\nSnow is cold and white. It falls from the clouds. We can build snowmen with snow.', 'Snow', 'Summer', 'Sand', 'Pancakes'),
      r('What is this mostly about?\n\nA kite needs wind to fly. You can fly a kite at the park. Kites come in many colors.', 'Kites', 'Boats', 'Socks', 'Trains'),
      r('What is this mostly about?\n\nOur school has a big library. Kids can borrow books there. The library is open every day.', 'The library', 'A farm', 'A swimming pool', 'A barn'),
      r('What is this mostly about?\n\nCows give us milk. Cows eat grass on the farm. Cows say moo.', 'Cows', 'Fish', 'Cars', 'Cakes'),
      r('What is this mostly about?\n\nTrees have leaves. Trees need water and sunlight. Some trees lose their leaves in fall.', 'Trees', 'Rocks', 'Socks', 'Stars'),
      r('What is this mostly about?\n\nPizza can have many toppings. Cheese and pepperoni are popular. Some people like mushrooms.', 'Pizza', 'Shoes', 'Rain', 'Bikes'),
    ],
    [
      r('What is this mostly about?\n\nPets need food every day. They need fresh water and fresh air too. A good owner keeps a pet clean and happy.', 'Caring for pets', 'Building boats', 'Growing corn', 'Playing soccer'),
      r('What is this mostly about?\n\nPlants need sunlight to grow. They also need water. Soil gives plants food to eat.', 'How plants grow', 'Making pizza', 'Flying kites', 'Riding trains'),
      r('What is this mostly about?\n\nWear a helmet when you ride a bike. Look both ways before you cross the street. Stay safe on the playground.', 'Ways to stay safe', 'Fixing a car', 'Baking bread', 'Counting coins'),
      r('What is this mostly about?\n\nRain fills rivers and lakes. Plants and animals drink the water. Rain helps everything live.', 'Why we need rain', 'Snowball fights', 'Summer camp', 'Painting a fence'),
      r('What is this mostly about?\n\nTurn off the faucet when you brush your teeth. Take short showers. Fix leaks so no water is wasted.', 'Saving water', 'Playing video games', 'Eating breakfast', 'Watching the stars'),
      r('What is this mostly about?\n\nEat fruits and vegetables every day. Drink water instead of soda. Get plenty of sleep.', 'Staying healthy', 'Going to the moon', 'Learning to swim', 'Buying new shoes'),
      r('What is this mostly about?\n\nFriends listen to each other. Friends share their toys. Friends stick up for one another.', 'Being a good friend', 'Driving a truck', 'Counting stars', 'Cooking eggs'),
      r('What is this mostly about?\n\nSnow covers the ground in winter. Kids build snowmen and go sledding. Winter is full of fun.', 'Winter fun', 'Summer swimming', 'Spring flowers', 'Fall leaves'),
      r('What is this mostly about?\n\nBats are animals that fly at night. They eat bugs. Some bats live in caves.', 'Bats', 'Trucks', 'Pancakes', 'Volcanoes'),
      r('What is this mostly about?\n\nA library has many books. You can borrow them for free. Libraries are good places to read.', 'Using the library', 'Making soup', 'Riding horses', 'Going to the beach'),
      r('What is this mostly about?\n\nBrush your teeth in the morning. Brush again before bed. Brushing keeps teeth clean and healthy.', 'Taking care of teeth', 'Growing a garden', 'Climbing trees', 'Reading maps'),
      r('What is this mostly about?\n\nA hungry cat meowed at the door. It wanted food. It rubbed against my legs.', 'A hungry cat', 'A rainy day', 'A school trip', 'A new bike'),
    ],
    [
      r('Which sentence tells the main idea?\n\nBees are very helpful insects. Bees make honey from flowers. Bees also help plants grow.', 'Bees are very helpful insects.', 'Bees make honey from flowers.', 'Bees also help plants grow.', 'Pancakes are my favorite breakfast.'),
      r('Which sentence tells the main idea?\n\nExercise is good for your body. Running makes your heart strong. Swimming helps you stretch and relax.', 'Exercise is good for your body.', 'Running makes your heart strong.', 'Swimming helps you stretch and relax.', 'Dinosaurs lived long ago.'),
      r('Which sentence tells the main idea?\n\nLibraries are special places. You can read books and borrow movies. Librarians help people find what they need.', 'Libraries are special places.', 'You can read books and borrow movies.', 'Librarians help people find what they need.', 'Trains go very fast.'),
      r('Which sentence tells the main idea?\n\nTrees are very useful. Trees give us shade. Trees give us fruit to eat. Trees give homes to birds.', 'Trees are very useful.', 'Trees give us shade.', 'Trees give homes to birds.', 'The moon is bright at night.'),
      r('Which sentence tells the main idea?\n\nKites can be many shapes. Some kites look like birds. Others look like long snakes.', 'Kites can be many shapes.', 'Some kites look like birds.', 'Others look like long snakes.', 'Bread is made from wheat.'),
      r('Which sentence tells the main idea?\n\nWinter brings cold weather. Snow often falls in winter. Many people wear warm coats in winter.', 'Winter brings cold weather.', 'Snow often falls in winter.', 'Many people wear warm coats.', 'Birthday parties are fun.'),
      r('Which sentence tells the main idea?\n\nHoneybees work very hard. They visit many flowers each day. They carry pollen back to the hive.', 'Honeybees work very hard.', 'They visit many flowers each day.', 'They carry pollen back to the hive.', 'Ships sail on the ocean.'),
      r('Which sentence tells the main idea?\n\nSharks are amazing fish. Some sharks can smell blood from far away. Sharks have many rows of teeth.', 'Sharks are amazing fish.', 'Some sharks can smell blood from far away.', 'Sharks have many rows of teeth.', 'Pancakes are my favorite breakfast.'),
      r('Which sentence tells the main idea?\n\nRecycling helps our planet. Paper and cans can be recycled. Recycling bins are often blue.', 'Recycling helps our planet.', 'Paper and cans can be recycled.', 'Recycling bins are often blue.', 'The school bus is yellow.'),
      r('Which sentence tells the main idea?\n\nDogs make wonderful pets. They are loyal and loving. Dogs also keep you active with walks.', 'Dogs make wonderful pets.', 'They are loyal and loving.', 'Dogs also keep you active with walks.', 'Goldfish are easy to feed.'),
      r('Which sentence tells the main idea?\n\nThe moon changes shape each month. First it looks like a thin crescent. Later it looks like a full circle.', 'The moon changes shape each month.', 'First it looks like a thin crescent.', 'Later it looks like a full circle.', 'Stars twinkle in the night sky.'),
      r('Which sentence tells the main idea?\n\nA rainbow forms after rain. Sunlight shines through raindrops. You can see many colors in a rainbow.', 'A rainbow forms after rain.', 'Sunlight shines through raindrops.', 'You can see many colors in a rainbow.', 'Snowflakes are made of ice.'),
    ],
  ],
)

const PURPOSES = ['To inform', 'To entertain', 'To persuade', 'To express feelings']
const WHY = 'Why did the author write this?\n\n'
/** A purpose question: the right purpose, and the other three as the wrong answers. */
const purpose = (text: string, a: string): Row => ({ q: WHY + text, a, w: PURPOSES.filter((x) => x !== a) })

const writerPurpose = rowSkill(
  'writerPurpose',
  ['Inform, entertain, or persuade', 'Purpose in a short text', 'Purpose in longer texts'],
  [
    [
      purpose('Bees make honey. Honey is sweet and sticky.', 'To inform'),
      purpose('Once upon a time, a fox met a goose. The fox told a silly joke!', 'To entertain'),
      purpose('Please recycle your cans! Recycling keeps our parks clean.', 'To persuade'),
      purpose('I miss my grandma so much. I wish she could visit me.', 'To express feelings'),
      purpose('Cats have sharp claws and soft fur. Cats also have long whiskers.', 'To inform'),
      purpose('The clown wore big shoes and fell into a pie. Everyone laughed!', 'To entertain'),
      purpose('You should wear a helmet when you ride your bike. Always wear one!', 'To persuade'),
      purpose('I love the rain. It makes me feel calm and cozy inside.', 'To express feelings'),
      purpose('Volcanoes are mountains that can erupt. Hot lava flows out of them.', 'To inform'),
      purpose('Once there was a little tree who wanted to fly. A bird helped it.', 'To entertain'),
      purpose('Eat more vegetables! They help you grow strong.', 'To persuade'),
      purpose('I am so proud of my team. We worked hard and we won!', 'To express feelings'),
      purpose('Frogs have long, sticky tongues. They use them to catch bugs.', 'To inform'),
    ],
    [
      purpose('Dear Grandpa, thank you for the sweater. I love the blue color!', 'To express feelings'),
      purpose('The ice cream truck came down our street playing its happy tune. Ben ran outside, giggling, to get a cone.', 'To entertain'),
      purpose('Buy a new bike today at Bike Town. Our bikes are the fastest in the state!', 'To persuade'),
      purpose('The moon is about 240,000 miles from Earth.', 'To inform'),
      purpose('The dragon sneezed, and a puff of smoke rose into the sky. The knight laughed and said, "Bless you!"', 'To entertain'),
      purpose('Vote for Ana for class president. She will make our school a better place.', 'To persuade'),
      purpose('Penguins live in cold places. Most penguins cannot fly.', 'To inform'),
      purpose('I was so scared when the lights went out. My heart was pounding.', 'To express feelings'),
      purpose('Once upon a time, a mouse found a giant cookie. What would it do next?', 'To entertain'),
      purpose('Turn off the lights when you leave a room. Saving energy helps everyone.', 'To persuade'),
      purpose('Rivers flow from mountains to the sea. Water moves downhill as it flows.', 'To inform'),
      purpose('The sunset was pink and gold, and it made me feel peaceful.', 'To express feelings'),
      purpose('Our class will visit the zoo on Friday. We will see lions, bears, and monkeys.', 'To inform'),
    ],
    [
      purpose('Many people think homework is bad. But homework helps students practice. Every student should do homework each night.', 'To persuade'),
      purpose('Mars is the fourth planet from the sun. It looks red because of iron in its soil.', 'To inform'),
      purpose('The little robot had a big dream: to paint a picture of the sea. He tried and tried, and at last his painting was done!', 'To entertain'),
      purpose('My heart jumped when I saw my name on the list. I could not stop smiling!', 'To express feelings'),
      purpose('Every child deserves a safe place to play. Join us at the park on Saturday to help build one!', 'To persuade'),
      purpose('Glaciers are huge rivers of ice. They move very slowly over many years.', 'To inform'),
      purpose('When the wind howled and the lights went out, Grandma lit a candle and told us a spooky story.', 'To entertain'),
      purpose('I feel so lonely since my best friend moved away. I miss her every single day.', 'To express feelings'),
      purpose('Wild rabbits can run very fast. They use their long back legs to hop quickly.', 'To inform'),
      purpose('Do not waste water! Turn off the tap while you brush your teeth.', 'To persuade'),
      purpose('The pirate hid his gold under a palm tree. But a parrot saw him do it!', 'To entertain'),
      purpose('Snow is made of tiny ice crystals. Each snowflake has six sides.', 'To inform'),
      purpose('I love the smell of the ocean. It reminds me of happy summers with my family.', 'To express feelings'),
    ],
  ],
)

const inferring = rowSkill(
  'inferring',
  ['Clues in a sentence', 'Make an inference', 'Lessons from fables'],
  [
    [
      r('It is raining. Ben grabs his ___.', 'umbrella', 'sunscreen', 'sled', 'sandals'),
      r('The sky is gray and snow is falling. Mia puts on her ___.', 'mittens', 'swimsuit', 'sunglasses', 'kite'),
      r('Lily is hungry, and it is lunchtime. She opens her ___.', 'lunchbox', 'pillow', 'skates', 'paintbrush'),
      r('The baby rubs his eyes and yawns. He needs a ___.', 'nap', 'party', 'race', 'swim'),
      r('Tom is shivering, and his teeth are chattering. He feels ___.', 'cold', 'hot', 'sleepy', 'happy'),
      r('Sam has a big smile and a shiny new bike. Sam feels ___.', 'happy', 'angry', 'sad', 'tired'),
      r('The dog wags its tail and runs to the door. The dog is ___.', 'excited', 'asleep', 'angry', 'frozen'),
      r('Ella is crying and holding her knee. She fell off the swing. Ella is ___.', 'hurt', 'proud', 'bored', 'sleepy'),
      r('Something smells burnt in the kitchen. Dad says, "Oh no! The cookies are ___!"', 'burnt', 'frozen', 'wet', 'soft'),
      r('The stars are out and the sky is dark. Dad says it is time for ___.', 'bed', 'lunch', 'school', 'swimming'),
      r('Max grabs his soccer ball and cleats. He is going to play ___.', 'soccer', 'piano', 'chess', 'baking'),
    ],
    [
      r('Ana packs sunscreen, a towel, and a shovel. Where is she going?', 'The beach', 'The library', 'The dentist', 'The bakery'),
      r('Jay has a red nose and keeps sneezing. He has a tissue in each hand.', 'He is sick', 'He won a race', 'He is at the zoo', 'He is very hot'),
      r('The plate is empty, and Sam is smiling. He rubs his tummy.', 'He just finished eating', 'He is still hungry', 'He is playing outside', 'He is asleep'),
      r('Lily has wet hair and a towel on her shoulders. Her swimsuit is damp.', 'She just swam', 'She is baking a cake', 'She is at school', 'She is sleeping'),
      r('The leaves are red and gold. Kids pull on warm coats as they walk to school.', 'It is fall', 'It is summer', 'It is spring', 'It is the middle of July'),
      r('Jen wears a helmet and knee pads. She grabs her skateboard.', 'She is going skateboarding', 'She is going swimming', 'She is going to bed', 'She is going to a concert'),
      r('The fridge door is open. There is milk on the table and a bowl of cereal.', 'Someone is eating breakfast', 'Someone is going to bed', 'Someone is at the beach', 'Someone is going swimming'),
      r('Pedro is frowning. His paper has red marks all over it.', 'He got many answers wrong', 'He got a perfect score', 'He won a prize', 'He lost his lunch'),
      r('Max has a bandage on his knee and walks slowly with a limp.', 'He hurt his leg', 'He ran a race', 'He is sleeping', 'He is painting a wall'),
      r('Ben wears mittens and holds a sled. There is snow everywhere.', 'Ben is going sledding', 'Ben is going to the beach', 'Ben is making lunch', 'Ben is at the library'),
      r('The baby drank all of her milk. Now she is yawning and blinking.', 'She is ready for a nap', 'She is still hungry', 'She is going swimming', 'She is at school'),
    ],
    [
      r('The hare teased the tortoise. The tortoise kept walking, and slowly he won the race. What is the lesson?', 'Slow and steady wins', 'Hares always win races', 'Turtles should stay home', 'Races are very long'),
      r('A boy cried "Wolf!" for fun. When a real wolf came, no one believed him. What is the lesson?', 'Liars are not believed', 'Wolves are dangerous', 'Boys like to shout', 'Villages need guards'),
      r('The ant worked all summer to store food. The grasshopper played and saved none. In winter, only the ant had food. What is the lesson?', 'Plan ahead and work hard', 'Insects like to play', 'Grasshoppers can jump', 'Winter is very cold'),
      r('A lion let a mouse go. Later, the mouse chewed a net to free the lion. What is the lesson?', 'Kindness is often repaid', 'Lions are very strong', 'Mice can chew through nets', 'Nets are used by hunters'),
      r('A greedy dog saw its reflection in a pond. It dropped its meat to grab the reflection and lost both. What is the lesson?', 'Greed leaves you with less', 'Dogs love to swim', 'Ponds are shiny', 'Meat is tasty'),
      r('Four sons fought all the time. Their father tied sticks together and said, "Break this!" No one could. What is the lesson?', 'Teamwork makes you strong', 'Sticks are easy to break', 'Brothers should fight', 'Farmers grow corn'),
      r('A girl found a wallet full of money and returned it to its owner. He thanked her and gave her a reward. What is the lesson?', 'Honesty pays off', 'Wallets should be hidden', 'Never trust strangers', 'Money is made of paper'),
      r('A proud peacock showed off its feathers and never looked where it walked. It fell into the mud. What is the lesson?', 'Pride can lead to trouble', 'Peacocks have pretty feathers', 'Mud is slippery', 'Birds like to swim'),
      r('The wind and the sun argued about who was stronger. A traveler walked by, and the sun warmed him until he took off his coat. What is the lesson?', 'Gentle kindness works best', 'Winds blow very hard', 'Coats keep you warm', 'Travelers wear hats'),
      r('A town mouse visited a country mouse. The country mouse was happier with simple food at home. What is the lesson?', 'Home is where you are happy', 'Town life is always best', 'Mice love cheese', 'Cities are very loud'),
      r('A child played with fire near dry grass. The fire spread and burned the whole field. He learned to be careful. What is the lesson?', 'Be careful with fire', 'Grass is green in spring', 'Fields are big', 'Children like to play outside'),
    ],
  ],
)

const alphabetical = rowSkill(
  'alphabetical',
  ['Letters in ABC order', 'Words in ABC order', 'ABC order by two letters'],
  [
    [
      r('Which letter comes first in ABC order?', 'B', 'M', 'R', 'X'),
      r('Which letter comes first in ABC order?', 'C', 'G', 'P', 'T'),
      r('Which letter comes first in ABC order?', 'F', 'J', 'Q', 'W'),
      r('Which letter comes first in ABC order?', 'A', 'E', 'L', 'Z'),
      r('Which letter comes first in ABC order?', 'H', 'K', 'N', 'S'),
      r('Which letter comes first in ABC order?', 'E', 'G', 'O', 'U'),
      r('Which letter comes first in ABC order?', 'K', 'L', 'P', 'V'),
      r('Which letter comes first in ABC order?', 'M', 'N', 'R', 'Y'),
      r('Which letter comes first in ABC order?', 'R', 'S', 'T', 'W'),
      r('Which letter comes first in ABC order?', 'D', 'J', 'L', 'P'),
    ],
    [
      r('Which word comes first in ABC order?', 'apple', 'bear', 'cat', 'dog'),
      r('Which word comes first in ABC order?', 'bird', 'cake', 'fish', 'zoo'),
      r('Which word comes first in ABC order?', 'cat', 'dog', 'frog', 'tree'),
      r('Which word comes first in ABC order?', 'dog', 'frog', 'kite', 'sun'),
      r('Which word comes first in ABC order?', 'fish', 'goat', 'house', 'lamp'),
      r('Which word comes first in ABC order?', 'frog', 'girl', 'kite', 'moon'),
      r('Which word comes first in ABC order?', 'goat', 'hat', 'mouse', 'snow'),
      r('Which word comes first in ABC order?', 'hat', 'ice', 'kite', 'zebra'),
      r('Which word comes first in ABC order?', 'kite', 'lamp', 'moon', 'pig'),
      r('Which word comes first in ABC order?', 'lamp', 'mop', 'nest', 'sun'),
      r('Which word comes first in ABC order?', 'moon', 'nut', 'pig', 'tree'),
      r('Which word comes first in ABC order?', 'nest', 'owl', 'pen', 'sun'),
      r('Which word comes first in ABC order?', 'pig', 'rain', 'sock', 'tree'),
      r('Which word comes first in ABC order?', 'sun', 'tent', 'van', 'zoo'),
    ],
    [
      r('Which word comes first in ABC order?', 'can', 'cap', 'cat', 'cow'),
      r('Which word comes first in ABC order?', 'bat', 'bet', 'bit', 'boy'),
      r('Which word comes first in ABC order?', 'ship', 'shop', 'shot', 'sun'),
      r('Which word comes first in ABC order?', 'map', 'mop', 'mud', 'moon'),
      r('Which word comes first in ABC order?', 'fan', 'fast', 'fig', 'gum'),
      r('Which word comes first in ABC order?', 'bed', 'bee', 'bell', 'cow'),
      r('Which word comes first in ABC order?', 'tap', 'tin', 'tip', 'top'),
      r('Which word comes first in ABC order?', 'pan', 'pen', 'pet', 'pig'),
      r('Which word comes first in ABC order?', 'lab', 'lamp', 'lap', 'leg'),
      r('Which word comes first in ABC order?', 'sad', 'sail', 'sun', 'tree'),
      r('Which word comes first in ABC order?', 'dig', 'dog', 'duck', 'dome'),
      r('Which word comes first in ABC order?', 'hop', 'horse', 'hot', 'hug'),
    ],
  ],
)

// --- Writing: a or an, verb tense, agreement ----------------------------------------------------

const articleAn = rowSkill(
  'articleAn',
  ['A or an: one word', 'A or an: in sentences', 'A or an: longer sentences'],
  [
    [
      r('Which word fits? ___ apple', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ egg', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ owl', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ umbrella', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ ant', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ elephant', 'an', 'a', 'two', 'some'),
      r('Which word fits? ___ dog', 'a', 'an', 'two', 'some'),
      r('Which word fits? ___ cat', 'a', 'an', 'two', 'some'),
      r('Which word fits? ___ hat', 'a', 'an', 'two', 'some'),
      r('Which word fits? ___ bike', 'a', 'an', 'two', 'some'),
      r('Which word fits? ___ tree', 'a', 'an', 'two', 'some'),
      r('Which word fits? ___ kite', 'a', 'an', 'two', 'some'),
    ],
    [
      r('I see ___ owl in the tree.', 'an', 'a', 'two', 'some'),
      r('Dad has ___ red car.', 'a', 'an', 'two', 'some'),
      r('We ate ___ orange after lunch.', 'an', 'a', 'two', 'some'),
      r('She has ___ ice cream cone.', 'an', 'a', 'two', 'some'),
      r('He wants ___ puppy for his birthday.', 'a', 'an', 'two', 'some'),
      r('Can you find ___ umbrella?', 'an', 'a', 'two', 'some'),
      r('I want ___ banana, please.', 'a', 'an', 'two', 'some'),
      r('This is ___ itchy sweater.', 'an', 'a', 'two', 'some'),
      r('Mom made ___ egg for breakfast.', 'an', 'a', 'two', 'some'),
      r('There is ___ frog in the pond.', 'a', 'an', 'two', 'some'),
      r('I have ___ new book.', 'a', 'an', 'two', 'some'),
      r('Sam saw ___ elephant at the zoo.', 'an', 'a', 'two', 'some'),
    ],
    [
      r('Tom wants ___ new bike.', 'a', 'an', 'two', 'some'),
      r('She is ___ honest girl.', 'an', 'a', 'two', 'some'),
      r('We saw ___ eagle on the hill.', 'an', 'a', 'two', 'some'),
      r('Ben found ___ old coin in the sand.', 'an', 'a', 'two', 'some'),
      r('The cat jumped on ___ open box.', 'an', 'a', 'two', 'some'),
      r('My sister has ___ hamster named Pip.', 'a', 'an', 'two', 'some'),
      r('We live in ___ house near the park.', 'a', 'an', 'two', 'some'),
      r('Grandma baked ___ enormous pie.', 'an', 'a', 'two', 'some'),
      r('The bus is ___ yellow school bus.', 'a', 'an', 'two', 'some'),
      r('She sang ___ song for us.', 'a', 'an', 'two', 'some'),
      r('He is ___ inventor who loves robots.', 'an', 'a', 'two', 'some'),
    ],
  ],
)

const simpleTense = rowSkill(
  'simpleTense',
  ['Past tense', 'Future tense', 'Irregular past tense'],
  [
    [
      r('Yesterday I ___ a cake with Mom. (bake)', 'baked', 'bake', 'bakes', 'baking'),
      r('Last night we ___ a movie. (watch)', 'watched', 'watch', 'watches', 'watching'),
      r('Yesterday the dog ___ in the yard. (play)', 'played', 'play', 'plays', 'playing'),
      r('Last week we ___ to the beach. (walk)', 'walked', 'walk', 'walks', 'walking'),
      r('Yesterday Mom ___ pancakes for us. (cook)', 'cooked', 'cook', 'cooks', 'cooking'),
      r('Last summer I ___ at camp. (talk)', 'talked', 'talk', 'talks', 'talking'),
      r('Yesterday the cat ___ on my bed. (jump)', 'jumped', 'jump', 'jumps', 'jumping'),
      r('Last night the kids ___ their teeth. (brush)', 'brushed', 'brush', 'brushes', 'brushing'),
      r('Last weekend Dad ___ the garage. (clean)', 'cleaned', 'clean', 'cleans', 'cleaning'),
      r('Yesterday I ___ my homework early. (finish)', 'finished', 'finish', 'finishes', 'finishing'),
      r('Yesterday my sister ___ her room. (paint)', 'painted', 'paint', 'paints', 'painting'),
      r('Last night it ___ hard. (rain)', 'rained', 'rain', 'rains', 'raining'),
    ],
    [
      r('Tomorrow we ___ to the park. (go)', 'will go', 'went', 'goes', 'going'),
      r('Next week I ___ a new book. (read)', 'will read', 'read', 'reads', 'reading'),
      r('Later today Grandma ___ us a story. (tell)', 'will tell', 'told', 'tells', 'telling'),
      r('Tomorrow it ___ rain. (rain)', 'will rain', 'rained', 'rains', 'raining'),
      r('Next summer we ___ in the lake. (swim)', 'will swim', 'swam', 'swims', 'swimming'),
      r('Soon the baby ___ to walk. (learn)', 'will learn', 'learned', 'learns', 'learning'),
      r('Tonight I ___ my teeth. (brush)', 'will brush', 'brushed', 'brushes', 'brushing'),
      r('Next year Ana ___ taller. (grow)', 'will grow', 'grew', 'grows', 'growing'),
      r('Tomorrow Dad ___ pizza. (cook)', 'will cook', 'cooked', 'cooks', 'cooking'),
      r('Later I ___ my homework. (finish)', 'will finish', 'finished', 'finishes', 'finishing'),
      r('Tomorrow we ___ a picnic. (have)', 'will have', 'had', 'has', 'having'),
      r('Next week the class ___ a play. (perform)', 'will perform', 'performed', 'performs', 'performing'),
    ],
    [
      r('Yesterday the bird ___ into the sky. (fly)', 'flew', 'fly', 'flies', 'flying'),
      r('Last night Dad ___ a short nap. (take)', 'took', 'take', 'takes', 'taking'),
      r('Yesterday I ___ my friend at the park. (see)', 'saw', 'see', 'sees', 'seeing'),
      r('Yesterday she ___ her favorite hat. (lose)', 'lost', 'lose', 'loses', 'losing'),
      r('Yesterday he ___ a cake for Mom. (make)', 'made', 'make', 'makes', 'making'),
      r('Last week I ___ a letter to Grandma. (write)', 'wrote', 'write', 'writes', 'writing'),
      r('Yesterday she ___ up very early. (get)', 'got', 'get', 'gets', 'getting'),
      r('Last year I ___ taller. (grow)', 'grew', 'grow', 'grows', 'growing'),
      r('Yesterday we ___ to the store. (go)', 'went', 'go', 'goes', 'going'),
      r('Last night I ___ a funny dream. (have)', 'had', 'have', 'has', 'having'),
      r('Last week she ___ a new puppy. (buy)', 'bought', 'buy', 'buys', 'buying'),
      r('Yesterday the kids ___ in the snow. (run)', 'ran', 'run', 'runs', 'running'),
    ],
  ],
)

const subjectVerbEarly = rowSkill(
  'subjectVerbEarly',
  ['One: the verb with -s', 'More than one: the verb', 'Is, am, are, has, have'],
  [
    [
      r('The cat ___ on the rug.', 'sleeps', 'sleep', 'sleeping', 'to sleep'),
      r('My dad ___ the car.', 'washes', 'wash', 'washing', 'to wash'),
      r('The bird ___ a song.', 'sings', 'sing', 'singing', 'to sing'),
      r('Mom ___ dinner at six.', 'cooks', 'cook', 'cooking', 'to cook'),
      r('The dog ___ the ball.', 'fetches', 'fetch', 'fetching', 'to fetch'),
      r('Ben ___ to school by bus.', 'rides', 'ride', 'riding', 'to ride'),
      r('The baby ___ and smiles.', 'laughs', 'laugh', 'laughing', 'to laugh'),
      r('The fish ___ in the pond.', 'swims', 'swim', 'swimming', 'to swim'),
      r('Grandma ___ a red hat.', 'wears', 'wear', 'wearing', 'to wear'),
      r('My friend ___ soccer.', 'plays', 'play', 'playing', 'to play'),
      r('The frog ___ into the water.', 'jumps', 'jump', 'jumping', 'to jump'),
      r('The sun ___ bright.', 'shines', 'shine', 'shining', 'to shine'),
    ],
    [
      r('The dogs ___ in the park.', 'run', 'runs', 'running', 'to run'),
      r('We ___ lunch together.', 'eat', 'eats', 'eating', 'to eat'),
      r('The kids ___ the blocks.', 'stack', 'stacks', 'stacking', 'to stack'),
      r('My brothers ___ soccer.', 'play', 'plays', 'playing', 'to play'),
      r('They ___ to school.', 'walk', 'walks', 'walking', 'to walk'),
      r('The birds ___ in the trees.', 'sing', 'sings', 'singing', 'to sing'),
      r('Cats ___ fish.', 'like', 'likes', 'liking', 'to like'),
      r('The ants ___ the food.', 'carry', 'carries', 'carrying', 'to carry'),
      r('Kids ___ to the park.', 'go', 'goes', 'going', 'to go'),
      r('The bees ___ honey.', 'make', 'makes', 'making', 'to make'),
      r('We ___ the game.', 'win', 'wins', 'winning', 'to win'),
      r('The boys ___ their bikes.', 'ride', 'rides', 'riding', 'to ride'),
    ],
    [
      r('The cat ___ black.', 'is', 'are', 'am', 'be'),
      r('Dad ___ at work.', 'is', 'are', 'am', 'be'),
      r('I ___ happy today.', 'am', 'is', 'are', 'be'),
      r('She ___ a good reader.', 'is', 'are', 'am', 'be'),
      r('The kids ___ hungry.', 'are', 'is', 'am', 'be'),
      r('We ___ ready to go.', 'are', 'is', 'am', 'be'),
      r('It ___ very cold outside.', 'is', 'are', 'am', 'be'),
      r('Ben and I ___ friends.', 'are', 'is', 'am', 'be'),
      r('My shoes ___ new.', 'are', 'is', 'am', 'be'),
      r('The box ___ empty.', 'is', 'are', 'am', 'be'),
      r('The bird ___ a nest.', 'has', 'have', 'having', 'to have'),
      r('We ___ two dogs.', 'have', 'has', 'having', 'to have'),
      r('She ___ a red bike.', 'has', 'have', 'having', 'to have'),
    ],
  ],
)

// --- Writing: pronouns, contractions, prepositions ----------------------------------------------

const pronounsEarly = rowSkill(
  'pronounsEarly',
  ['Pronouns for people and things', 'Possessive pronouns', 'Object pronouns'],
  [
    [
      r('Mia is my friend. ___ likes to draw.', 'She', 'Her', 'Hers', 'Him'),
      r('Ben and I went to the park. ___ had fun.', 'We', 'Us', 'Our', 'Ours'),
      r('The dog is wet. ___ needs a bath.', 'It', 'Its', 'Him', 'Them'),
      r('Sam and Lily are twins. ___ are in second grade.', 'They', 'Them', 'Their', 'Theirs'),
      r('Grandma is here. ___ brought cookies.', 'She', 'Her', 'Hers', 'Him'),
      r('Tom and I like cats. ___ have two cats.', 'We', 'Us', 'Our', 'Ours'),
      r('I have a new bike. ___ is red.', 'It', 'Its', 'Him', 'Them'),
      r('Kim and Joe are my cousins. ___ live near me.', 'They', 'Them', 'Their', 'Theirs'),
      r('The boy is tall. ___ plays basketball.', 'He', 'Him', 'His', 'Hers'),
      r('The girl is funny. ___ makes us laugh.', 'She', 'Her', 'Hers', 'Him'),
      r('Mom and Dad are home. ___ are watching TV.', 'They', 'Them', 'Their', 'Theirs'),
      r('Dad made pancakes. ___ were tasty.', 'They', 'Them', 'Their', 'Theirs'),
    ],
    [
      r('The dog wagged ___ tail.', 'its', "it's", 'it', 'their'),
      r('Lily lost ___ hat.', 'her', 'hers', 'she', 'his'),
      r('Ben and Sam washed ___ bikes.', 'their', 'they', 'them', 'there'),
      r('We ate ___ lunch in the park.', 'our', 'ours', 'we', 'us'),
      r('I love ___ new shoes.', 'my', 'mine', 'me', 'I'),
      r('You can keep ___ pencil.', 'your', 'yours', 'you', "you're"),
      r('The cat cleaned ___ paws.', 'its', "it's", 'it', 'their'),
      r('The kids brushed ___ teeth.', 'their', 'they', 'them', 'there'),
      r('Grandpa read ___ newspaper.', 'his', 'he', 'him', 'hers'),
      r('Grandma fixed ___ garden gate.', 'her', 'hers', 'she', 'his'),
      r('The bird flapped ___ wings.', 'its', "it's", 'it', 'their'),
      r('We found ___ dog in the yard.', 'our', 'ours', 'we', 'us'),
    ],
    [
      r('Please give the book to ___.', 'me', 'I', 'my', 'mine'),
      r('Mom called ___ for dinner.', 'us', 'we', 'our', 'ours'),
      r('Sam is my friend. I play with ___ every day.', 'him', 'he', 'his', 'himself'),
      r('I have a cat. I love ___.', 'it', "it's", 'its', 'they'),
      r('The ball rolled away. Ben chased ___.', 'it', "it's", 'its', 'them'),
      r('Grandpa has two cats. He feeds ___ every day.', 'them', 'they', 'their', 'theirs'),
      r('Ana and Joe are at the park. I can see ___.', 'them', 'they', 'their', 'theirs'),
      r('Ella has a new bike. Dad helped ___ fix a flat tire.', 'her', 'she', 'hers', 'herself'),
      r('The girls had a race. The coach cheered for ___.', 'them', 'they', 'their', 'theirs'),
      r('Dad took ___ to the zoo.', 'you', 'your', 'yours', "you're"),
      r('Dad and I went fishing. Mom came with ___.', 'us', 'we', 'our', 'ours'),
      r('The teacher smiled at Ana and ___.', 'me', 'I', 'my', 'mine'),
    ],
  ],
)

const contractionsEarly = rowSkill(
  'contractionsEarly',
  ['Short forms: is and are', 'Short forms with not', 'Short forms with will and have'],
  [
    [
      r("What is the short form of 'it is'?", "it's", 'its', "it'll", 'itis'),
      r("What is the short form of 'they are'?", "they're", 'their', 'there', 'theyre'),
      r("What is the short form of 'we are'?", "we're", 'were', "we'll", 'weare'),
      r("What is the short form of 'you are'?", "you're", 'your', 'youre', "you'll"),
      r("What is the short form of 'I am'?", "I'm", 'Im', "I'll", "I'am"),
      r("What is the short form of 'he is'?", "he's", 'hes', "he'll", "he'd"),
      r("What is the short form of 'she is'?", "she's", 'shes', "she'll", "she'd"),
      r("What is the short form of 'that is'?", "that's", 'thats', "that'll", "that'd"),
      r("What is the short form of 'what is'?", "what's", 'whats', "what'll", "what'd"),
      r("What is the short form of 'there is'?", "there's", 'theres', "there'll", "there'd"),
      r("What is the short form of 'here is'?", "here's", 'heres', "here'll", 'hears'),
      r("What is the short form of 'who is'?", "who's", 'whos', "who'll", "who'd"),
    ],
    [
      r("What is the short form of 'do not'?", "don't", "doesn't", "didn't", "won't"),
      r("What is the short form of 'does not'?", "doesn't", "don't", "didn't", "isn't"),
      r("What is the short form of 'did not'?", "didn't", "don't", "doesn't", "wasn't"),
      r("What is the short form of 'is not'?", "isn't", "aren't", "wasn't", "doesn't"),
      r("What is the short form of 'are not'?", "aren't", "isn't", "weren't", "don't"),
      r("What is the short form of 'was not'?", "wasn't", "isn't", "weren't", "didn't"),
      r("What is the short form of 'were not'?", "weren't", "wasn't", "aren't", "didn't"),
      r("What is the short form of 'cannot'?", "can't", "won't", "couldn't", "shouldn't"),
      r("What is the short form of 'will not'?", "won't", "wouldn't", "can't", "don't"),
      r("What is the short form of 'should not'?", "shouldn't", "couldn't", "wouldn't", "didn't"),
      r("What is the short form of 'could not'?", "couldn't", "can't", "shouldn't", "wouldn't"),
      r("What is the short form of 'has not'?", "hasn't", "haven't", "hadn't", "isn't"),
    ],
    [
      r("What is the short form of 'I will'?", "I'll", "I'm", "I've", "I'd"),
      r("What is the short form of 'we will'?", "we'll", "we're", "we've", "we'd"),
      r("What is the short form of 'she will'?", "she'll", "she's", "she'd", "shell"),
      r("What is the short form of 'you will'?", "you'll", "you're", "you've", "you'd"),
      r("What is the short form of 'I have'?", "I've", "I'm", "I'll", "I'd"),
      r("What is the short form of 'we have'?", "we've", "we're", "we'll", "we'd"),
      r("What is the short form of 'they have'?", "they've", "they're", "they'll", "they'd"),
      r("What is the short form of 'you have'?", "you've", "you're", "you'll", "you'd"),
      r("What is the short form of 'I would'?", "I'd", "I'm", "I've", "I'll"),
      r("What is the short form of 'they will'?", "they'll", "they're", "they've", "they'd"),
      r("What is the short form of 'it will'?", "it'll", "it's", "its", "it'd"),
    ],
  ],
)

const prepositionsEarly = rowSkill(
  'prepositionsEarly',
  ['Where: in, on, under', 'Where: more position words', 'Time words: at, on, in'],
  [
    [
      r('The ball is ___ the bag. (inside)', 'in', 'on', 'under', 'behind'),
      r('The cat is ___ the table. (below it)', 'under', 'in', 'on', 'behind'),
      r('The book is ___ the desk. (on top)', 'on', 'under', 'behind', 'in'),
      r('The shoe is ___ the bed. (below it)', 'under', 'on', 'in', 'behind'),
      r('The toy is ___ the basket. (inside)', 'in', 'on', 'under', 'behind'),
      r('The hat is ___ the chair. (on top)', 'on', 'under', 'in', 'behind'),
      r('The fish swims ___ the water. (inside the water)', 'in', 'on', 'under', 'behind'),
      r('The dog hides ___ the table. (below it)', 'under', 'on', 'in', 'behind'),
      r('The cup is ___ the shelf. (on top)', 'on', 'under', 'in', 'behind'),
      r('The mouse is ___ the box. (inside)', 'in', 'on', 'under', 'behind'),
      r('The cat is ___ the chair. (below it)', 'under', 'on', 'in', 'behind'),
      r('The socks are ___ the drawer. (inside)', 'in', 'on', 'under', 'behind'),
    ],
    [
      r('The dog jumped ___ the fence. (up and over the top)', 'over', 'under', 'through', 'behind'),
      r('The kids ran ___ the park. (from one side to the other)', 'across', 'under', 'inside', 'behind'),
      r('We walked ___ the tunnel. (went through the hole)', 'through', 'over', 'under', 'behind'),
      r('Please sit ___ me. (at my side)', 'beside', 'under', 'inside', 'behind'),
      r('The bird flew ___ the tree. (above it)', 'above', 'under', 'inside', 'beside'),
      r('The water came ___ the pipe. (out of the pipe)', 'from', 'to', 'with', 'for'),
      r('We went ___ the store. (toward the store)', 'to', 'from', 'with', 'for'),
      r('I played ___ my friend. (together)', 'with', 'from', 'about', 'under'),
      r('He jumped ___ the pool. (into the water)', 'into', 'onto', 'under', 'away'),
      r('The sun shines ___ the window. (through the glass)', 'through', 'under', 'behind', 'above'),
    ],
    [
      r("We eat dinner ___ six o'clock.", 'at', 'on', 'in', 'to'),
      r('The party is ___ Monday.', 'on', 'at', 'in', 'to'),
      r('We visit Grandma ___ June.', 'in', 'on', 'at', 'to'),
      r('I wake up ___ seven in the morning.', 'at', 'on', 'in', 'to'),
      r('School starts ___ September.', 'in', 'on', 'at', 'to'),
      r("Let's meet ___ Saturday.", 'on', 'at', 'in', 'to'),
      r('The baby was born ___ winter.', 'in', 'on', 'at', 'to'),
      r('Our trip is ___ Friday.', 'on', 'at', 'in', 'to'),
      r('She goes to bed ___ night.', 'at', 'in', 'on', 'to'),
      r('We ate lunch ___ noon.', 'at', 'in', 'on', 'to'),
      r("The store opens ___ nine o'clock.", 'at', 'in', 'on', 'to'),
      r('We have art class ___ the morning.', 'in', 'on', 'at', 'to'),
    ],
  ],
)

// --- Writing: capitalization and sense words ----------------------------------------------------

const capNames = rowSkill(
  'capNames',
  ['Names of people and pets', 'Days and months', 'Capital letters in sentences'],
  [
    [
      r('Which spelling of the name is right?', 'Mia', 'mia', 'MIA', 'mIa'),
      r('Which spelling of the name is right?', 'Ben', 'ben', 'BEN', 'bEn'),
      r('Which spelling of the name is right?', 'Rex', 'rex', 'REX', 'rEx'),
      r('Which spelling of the name is right?', 'Luna', 'luna', 'LUNA', 'lUna'),
      r('Which spelling of the name is right?', 'Sam', 'sam', 'SAM', 'sAm'),
      r('Which spelling of the name is right?', 'Lily', 'lily', 'LILY', 'lIly'),
      r('Which spelling of the name is right?', 'Coco', 'coco', 'COCO', 'cOco'),
      r('Which spelling of the name is right?', 'Ava', 'ava', 'AVA', 'aVa'),
      r('Which spelling of the name is right?', 'Max', 'max', 'MAX', 'mAx'),
      r('Which spelling of the name is right?', 'Zoe', 'zoe', 'ZOE', 'zOe'),
      r('Which spelling of the name is right?', 'Buddy', 'buddy', 'BUDDY', 'buDdy'),
      r('Which spelling of the name is right?', 'Ruby', 'ruby', 'RUBY', 'rUby'),
    ],
    [
      r('Which spelling of the day or month is right?', 'Monday', 'monday', 'MONDAY', 'MonDay'),
      r('Which spelling of the day or month is right?', 'Tuesday', 'tuesday', 'TUESDAY', 'TUesday'),
      r('Which spelling of the day or month is right?', 'Wednesday', 'wednesday', 'WEDNESDAY', 'WEDnesday'),
      r('Which spelling of the day or month is right?', 'Thursday', 'thursday', 'THURSDAY', 'THursday'),
      r('Which spelling of the day or month is right?', 'Friday', 'friday', 'FRIDAY', 'FRiday'),
      r('Which spelling of the day or month is right?', 'Saturday', 'saturday', 'SATURDAY', 'SATurday'),
      r('Which spelling of the day or month is right?', 'Sunday', 'sunday', 'SUNDAY', 'SUnday'),
      r('Which spelling of the day or month is right?', 'January', 'january', 'JANUARY', 'JANuary'),
      r('Which spelling of the day or month is right?', 'March', 'march', 'MARCH', 'MARch'),
      r('Which spelling of the day or month is right?', 'June', 'june', 'JUNE', 'JUne'),
      r('Which spelling of the day or month is right?', 'October', 'october', 'OCTOBER', 'OCTober'),
      r('Which spelling of the day or month is right?', 'December', 'december', 'DECEMBER', 'DECember'),
    ],
    [
      r('Which sentence is written right?', 'Dad and I went to Lake Erie.', 'dad and I went to Lake Erie.', 'Dad and I went to lake Erie.', 'Dad and i went to Lake Erie.'),
      r('Which sentence is written right?', 'My teacher is Mrs. Lopez.', 'my teacher is Mrs. Lopez.', 'My teacher is mrs. Lopez.', 'My teacher is Mrs. lopez.'),
      r('Which sentence is written right?', 'Can you see the Statue of Liberty?', 'can you see the Statue of Liberty?', 'Can you see the statue of Liberty?', 'Can you see the Statue of liberty?'),
      r('Which sentence is written right?', 'Yesterday I saw a movie with Sam.', 'yesterday I saw a movie with Sam.', 'Yesterday i saw a movie with Sam.', 'Yesterday I saw a movie with sam.'),
      r('Which sentence is written right?', 'Grandma lives in Texas.', 'grandma lives in Texas.', 'Grandma lives in texas.', 'Grandma Lives in Texas.'),
      r('Which sentence is written right?', 'Did you see the moon tonight?', 'Did you see the Moon tonight?', 'did you see the moon tonight?', 'Did you see the moon Tonight?'),
      r('Which sentence is written right?', 'I like pizza, and Ben likes tacos.', 'i like pizza, and Ben likes tacos.', 'I like pizza, and ben likes tacos.', 'I like pizza, and Ben Likes tacos.'),
      r('Which sentence is written right?', 'We went to the zoo on Saturday.', 'We went to the Zoo on Saturday.', 'we went to the zoo on Saturday.', 'We went to the zoo on saturday.'),
      r('Which sentence is written right?', 'Our class read a book about Dr. Seuss.', 'our class read a book about Dr. Seuss.', 'Our class read a book about dr. Seuss.', 'Our class read a book about Dr. seuss.'),
      r('Which sentence is written right?', 'Will you come to my party, Aunt Jo?', 'will you come to my party, Aunt Jo?', 'Will you come to my party, aunt Jo?', 'Will you come to my Party, Aunt Jo?'),
      r('Which sentence is written right?', 'Ana lives on Main Street.', 'ana lives on Main Street.', 'Ana lives on main street.', 'Ana lives on Main street.'),
      r('Which sentence is written right?', 'The bus goes to Chicago every day.', 'the bus goes to Chicago every day.', 'The bus goes to chicago every day.', 'The Bus goes to Chicago every day.'),
    ],
  ],
  true,
)

const senseWords = rowSkill(
  'senseWords',
  ['Smell words', 'Sound words', 'Touch and taste words'],
  [
    [
      r('The flowers smelled ___.', 'sweet', 'loud', 'soft', 'bright'),
      r('The garbage smelled ___.', 'stinky', 'quiet', 'smooth', 'shiny'),
      r('The cinnamon rolls smelled ___.', 'spicy', 'loud', 'rough', 'bright'),
      r('The air smelled ___ after the rain.', 'fresh', 'loud', 'rough', 'bright'),
      r('The smoke smelled ___.', 'smoky', 'quiet', 'round', 'green'),
      r('The candles smelled ___.', 'sweet', 'soft', 'loud', 'bright'),
      r('The wet dog smelled ___.', 'stinky', 'smooth', 'loud', 'bright'),
      r('The cut grass smelled ___.', 'fresh', 'soft', 'loud', 'bright'),
      r('The lilacs smelled ___.', 'sweet', 'rough', 'loud', 'shiny'),
      r('The pine tree smelled ___.', 'fresh', 'bright', 'loud', 'smooth'),
    ],
    [
      r('The thunder was very ___.', 'loud', 'bitter', 'shiny', 'sour'),
      r("The baby's whisper was very ___.", 'soft', 'loud', 'bitter', 'shiny'),
      r('The fireworks went ___!', 'boom', 'sweet', 'rough', 'sour'),
      r('The drum was very ___.', 'loud', 'smooth', 'bitter', 'shiny'),
      r('The room was ___ before the test.', 'quiet', 'bright', 'sweet', 'rough'),
      r('The crowd was ___ at the game.', 'noisy', 'smooth', 'sour', 'bright'),
      r('The wind was ___ last night.', 'loud', 'sweet', 'bright', 'sour'),
      r('The alarm clock was very ___.', 'loud', 'smooth', 'sweet', 'shiny'),
      r('The bell went ___!', 'ding', 'sweet', 'sour', 'fuzzy'),
      r('The library was ___ and calm.', 'quiet', 'bright', 'sweet', 'rough'),
    ],
    [
      r('The ice was very ___ to touch.', 'cold', 'loud', 'bright', 'sweet'),
      r('The sandpaper felt ___.', 'rough', 'sweet', 'loud', 'shiny'),
      r('The lemon tasted very ___.', 'sour', 'soft', 'loud', 'bright'),
      r('The chocolate cake tasted ___.', 'sweet', 'loud', 'bright', 'rough'),
      r("The kitten's fur felt ___.", 'soft', 'sour', 'loud', 'bright'),
      r('The popcorn tasted very ___.', 'salty', 'loud', 'bright', 'smooth'),
      r('The bark on the tree felt ___.', 'rough', 'sour', 'loud', 'sweet'),
      r('The snow felt ___ on my hands.', 'cold', 'sweet', 'loud', 'bright'),
      r('The medicine tasted very ___.', 'bitter', 'soft', 'loud', 'shiny'),
      r('The sand felt ___ under my feet.', 'warm', 'sweet', 'loud', 'bright'),
    ],
  ],
)

// --- Skills so far -----------------------------------------------------------------------------

export const READING_EARLY: Skill[] = [shortVowels, shortVowelsMore, digraphs, shortLong, diphthongs, openSyllables, mainTopic, writerPurpose, inferring, alphabetical]
export const WRITING_EARLY: Skill[] = [articleAn, simpleTense, subjectVerbEarly, pronounsEarly, contractionsEarly, prepositionsEarly, capNames, senseWords]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". Grades never go down by level. */
export const LANGUAGE_EARLY_IXL: Record<string, IxlRef[]> = {
  'reading.shortVowels': [e(1, 'Short a'), e(1, 'Short e'), e(1, 'Short vowels: mixed')],
  'reading.shortVowelsMore': [e(1, 'Short i'), e(1, 'Short o'), e(1, 'Short u')],
  'reading.digraphs': [e(1, 'Consonant digraphs'), e(2, 'Consonant digraphs, trigraphs, and silent letters'), e(2, 'Consonant digraphs, trigraphs, and silent letters')],
  'reading.shortLong': [e(1, 'Short and long vowel sounds'), e(1, 'Short and long vowel patterns'), e(2, 'Short and long vowel patterns')],
  'reading.diphthongs': [e(1, 'Diphthongs: oi, oy, ou, ow'), e(1, 'Diphthongs: oi, oy, ou, ow'), e(2, 'Diphthongs: oi, oy, ou, ow')],
  'reading.openSyllables': [e(1, 'Two-syllable words'), e(2, 'Open and closed syllables'), e(2, 'Multisyllabic words')],
  'reading.mainTopic': [e(1, 'Main idea'), e(1, 'Main idea'), e(2, 'Main idea')],
  'reading.writerPurpose': [e(1, "Author's purpose"), e(1, "Author's purpose"), e(2, "Author's purpose")],
  'reading.inferring': [e(1, 'Inference and theme'), e(1, 'Inference and theme'), e(2, 'Inference and theme')],
  'reading.alphabetical': [e(1, 'Reference skills'), e(1, 'Reference skills'), e(2, 'Reference skills')],
  'writing.articleAn': [e(1, 'Articles'), e(1, 'Articles'), e(2, 'Articles')],
  'writing.simpleTense': [e(1, 'Verb tense'), e(1, 'Verb tense'), e(1, 'Verb tense')],
  'writing.subjectVerbEarly': [e(1, 'Subject-verb agreement'), e(1, 'Subject-verb agreement'), e(1, 'Subject-verb agreement')],
  'writing.pronounsEarly': [e(1, 'Pronouns'), e(1, 'Pronouns'), e(1, 'Pronouns')],
  'writing.contractionsEarly': [e(1, 'Contractions'), e(1, 'Contractions'), e(1, 'Contractions')],
  'writing.prepositionsEarly': [e(1, 'Prepositions'), e(1, 'Prepositions'), e(1, 'Prepositions')],
  'writing.capNames': [e(1, 'Capitalization'), e(1, 'Capitalization'), e(2, 'Capitalization')],
  'writing.senseWords': [e(2, 'Descriptive details'), e(2, 'Descriptive details'), e(2, 'Descriptive details')],
}
