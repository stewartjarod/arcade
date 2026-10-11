import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * The last early English topics (K–2) that IXL covers: phonemes and short vowels, digraphs and
 * blends, main idea and inference, author's purpose and point of view, read-along stories and
 * facts, decodable stories, compare and contrast, text features, idioms, shades of meaning,
 * sentence combining, and putting sentences in order.
 *
 * Each skill is a hand-written bank per level, like languageEarly.ts. A row is one question, one
 * right answer, and three wrong answers, and every wrong answer was checked by hand to be clearly
 * wrong. Keys are "<skill>:<level>:<row>", so a missed question can be rebuilt exactly.
 */

export interface Row {
  /** A big picture shown with the question. */
  pic?: string
  /** The question (may include a short passage). "___" marks a blank. */
  q: string
  /** What to read aloud, when the text reads badly as written. */
  say?: string
  a: string
  w: [string, string, string]
}

/** A plain row: question, right answer, three wrong answers. */
export const r = (q: string, a: string, w1: string, w2: string, w3: string): Row => ({ q, a, w: [w1, w2, w3] })
/** A row with a picture. */
export const p = (pic: string, q: string, a: string, w1: string, w2: string, w3: string): Row => ({ pic, q, a, w: [w1, w2, w3] })

/** One skill from its banks, one choice format, one bank per level. */
export function rowSkill(id: string, labels: string[], banks: Row[][]): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.say ?? row.q.replace(/___/g, 'blank'), ...(row.pic ? { emoji: row.pic } : {}) },
      answer: row.a,
      wrong: (n) => wrongFrom(row.a, n, row.w),
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

// --- Reading: sounds and short vowels ------------------------------------------------------------

// Left out of the export: sounds are quoted as letters, which the voice would read as letter names. These need real sound audio.
const phonemeChange = rowSkill(
  'phonemeChange',
  ['Change the first sound', 'Change the last sound', 'Change the vowel sound'],
  [
    [
      r('Change the first sound in "cat" to "h". What word do you get?', 'hat', 'bat', 'mat', 'sat'),
      r('Change the first sound in "pig" to "b". What word do you get?', 'big', 'dig', 'wig', 'fig'),
      r('Change the first sound in "dog" to "f". What word do you get?', 'fog', 'log', 'hog', 'dig'),
      r('Change the first sound in "sun" to "r". What word do you get?', 'run', 'bun', 'fun', 'gun'),
      r('Change the first sound in "map" to "n". What word do you get?', 'nap', 'cap', 'tap', 'mop'),
      r('Change the first sound in "bed" to "r". What word do you get?', 'red', 'bad', 'bud', 'fed'),
      r('Change the first sound in "lip" to "s". What word do you get?', 'sip', 'hip', 'tip', 'lid'),
      r('Change the first sound in "hat" to "m". What word do you get?', 'mat', 'bat', 'cat', 'hit'),
      r('Change the first sound in "ten" to "p". What word do you get?', 'pen', 'hen', 'men', 'den'),
      r('Change the first sound in "rug" to "b". What word do you get?', 'bug', 'dug', 'hug', 'mug'),
      r('Change the first sound in "fin" to "p". What word do you get?', 'pin', 'tin', 'kin', 'fan'),
      r('Change the first sound in "cup" to "p". What word do you get?', 'pup', 'cut', 'cap', 'pop'),
    ],
    [
      r('Change the last sound in "pig" to "n". What word do you get?', 'pin', 'pit', 'pet', 'pot'),
      r('Change the last sound in "bat" to "g". What word do you get?', 'bag', 'bad', 'ban', 'bet'),
      r('Change the last sound in "cab" to "t". What word do you get?', 'cat', 'can', 'cap', 'cub'),
      r('Change the last sound in "hop" to "t". What word do you get?', 'hot', 'hog', 'hip', 'hum'),
      r('Change the last sound in "bus" to "n". What word do you get?', 'bun', 'bug', 'but', 'bud'),
      r('Change the last sound in "dog" to "t". What word do you get?', 'dot', 'dig', 'dug', 'dim'),
      r('Change the last sound in "bed" to "g". What word do you get?', 'beg', 'bet', 'bug', 'bud'),
      r('Change the last sound in "hid" to "p". What word do you get?', 'hip', 'hit', 'him', 'hum'),
      r('Change the last sound in "dim" to "p". What word do you get?', 'dip', 'dig', 'dad', 'dam'),
      r('Change the last sound in "lip" to "d". What word do you get?', 'lid', 'lap', 'lit', 'lie'),
      r('Change the last sound in "run" to "g". What word do you get?', 'rug', 'rub', 'ran', 'rut'),
      r('Change the last sound in "sit" to "p". What word do you get?', 'sip', 'sit', 'set', 'sin'),
    ],
    [
      r('Change the vowel sound in "cat" to "o". What word do you get?', 'cot', 'cut', 'cap', 'cab'),
      r('Change the vowel sound in "big" to "a". What word do you get?', 'bag', 'bog', 'bug', 'beg'),
      r('Change the vowel sound in "dog" to "i". What word do you get?', 'dig', 'dug', 'dam', 'dot'),
      r('Change the vowel sound in "hat" to "u". What word do you get?', 'hut', 'hit', 'hot', 'hunt'),
      r('Change the vowel sound in "bed" to "a". What word do you get?', 'bad', 'bid', 'bud', 'bell'),
      r('Change the vowel sound in "run" to "a". What word do you get?', 'ran', 'ron', 'rin', 'rain'),
      r('Change the vowel sound in "bug" to "e". What word do you get?', 'beg', 'big', 'bag', 'bog'),
      r('Change the vowel sound in "sit" to "e". What word do you get?', 'set', 'sun', 'sip', 'sat'),
      r('Change the vowel sound in "tap" to "i". What word do you get?', 'tip', 'tup', 'top', 'tab'),
      r('Change the vowel sound in "pen" to "u". What word do you get?', 'pun', 'pan', 'pin', 'pet'),
      r('Change the vowel sound in "lid" to "a". What word do you get?', 'lad', 'led', 'lud', 'lit'),
      r('Change the vowel sound in "mop" to "a". What word do you get?', 'map', 'mat', 'mud', 'mug'),
    ],
  ],
)

const shortVowelPics = rowSkill(
  'shortVowelPics',
  ['Short a words', 'Short e words', 'Short i words', 'Short o words', 'Short u words'],
  [
    [
      p('🐱', 'Which word names the picture?', 'cat', 'cot', 'cut', 'kit'),
      p('🎩', 'Which word names the picture?', 'hat', 'hot', 'hit', 'hut'),
      p('🧢', 'Which word names the picture?', 'cap', 'cup', 'cop', 'cab'),
      p('🗺️', 'Which word names the picture?', 'map', 'mop', 'mud', 'mat'),
      p('🐜', 'Which word names the picture?', 'ant', 'ink', 'end', 'ill'),
      p('🍎', 'Which word names the picture?', 'apple', 'pebble', 'pickle', 'puddle'),
      p('🐀', 'Which word names the picture?', 'rat', 'rot', 'rut', 'rip'),
      r('Which word has the short a sound?', 'bag', 'big', 'beg', 'bug'),
      r('Which word has the short a sound?', 'sad', 'seed', 'side', 'sled'),
      r('Which word has the short a sound?', 'van', 'vine', 'vet', 'vote'),
      r('Which word has the short a sound?', 'jam', 'jeep', 'joke', 'jug'),
    ],
    [
      p('🛏️', 'Which word names the picture?', 'bed', 'bad', 'bid', 'bud'),
      p('🥚', 'Which word names the picture?', 'egg', 'ant', 'ink', 'owl'),
      p('🔔', 'Which word names the picture?', 'bell', 'ball', 'bill', 'bull'),
      p('🦵', 'Which word names the picture?', 'leg', 'log', 'lag', 'leaf'),
      p('🪺', 'Which word names the picture?', 'nest', 'nut', 'nail', 'nap'),
      p('🛷', 'Which word names the picture?', 'sled', 'slid', 'slide', 'slow'),
      p('🕸️', 'Which word names the picture?', 'web', 'wig', 'wag', 'wall'),
      r('Which word has the short e sound?', 'pen', 'pan', 'pin', 'pain'),
      r('Which word has the short e sound?', 'red', 'road', 'ride', 'rain'),
      r('Which word has the short e sound?', 'jet', 'jeep', 'joke', 'jut'),
      r('Which word has the short e sound?', 'net', 'nap', 'nine', 'note'),
    ],
    [
      p('🐷', 'Which word names the picture?', 'pig', 'peg', 'pet', 'pot'),
      p('💍', 'Which word names the picture?', 'ring', 'rung', 'rang', 'rain'),
      p('6️⃣', 'Which word names the picture?', 'six', 'sox', 'sax', 'sit'),
      r('Which word has the short i sound?', 'big', 'bag', 'bog', 'beg'),
      r('Which word has the short i sound?', 'hill', 'hall', 'hole', 'hail'),
      r('Which word has the short i sound?', 'fish', 'face', 'foam', 'fast'),
      r('Which word has the short i sound?', 'lid', 'lad', 'load', 'lead'),
      r('Which word has the short i sound?', 'win', 'wine', 'wet', 'wag'),
      r('Which word has the short i sound?', 'pin', 'pan', 'pen', 'pain'),
      r('Which word has the short i sound?', 'zip', 'zap', 'zoo', 'zero'),
      r('Which word has the short i sound?', 'sit', 'seat', 'set', 'site'),
      r('Which word has the short i sound?', 'kit', 'kite', 'cot', 'coat'),
      r('Which word has the short i sound?', 'hid', 'hide', 'had', 'hard'),
    ],
    [
      p('🐸', 'Which word names the picture?', 'frog', 'fig', 'flag', 'fork'),
      p('🐶', 'Which word names the picture?', 'dog', 'dig', 'dug', 'dim'),
      p('🧦', 'Which word names the picture?', 'sock', 'sack', 'suck', 'sick'),
      p('🦊', 'Which word names the picture?', 'fox', 'fix', 'fig', 'six'),
      p('🪵', 'Which word names the picture?', 'log', 'leg', 'lag', 'lug'),
      p('🔒', 'Which word names the picture?', 'lock', 'luck', 'lack', 'leak'),
      r('Which word has the short o sound?', 'top', 'tape', 'type', 'tip'),
      r('Which word has the short o sound?', 'hop', 'hope', 'heap', 'hip'),
      r('Which word has the short o sound?', 'job', 'jab', 'jeep', 'joke'),
      r('Which word has the short o sound?', 'mom', 'mail', 'meat', 'mine'),
      r('Which word has the short o sound?', 'dot', 'date', 'dime', 'dune'),
    ],
    [
      p('🚌', 'Which word names the picture?', 'bus', 'bass', 'boss', 'bib'),
      p('☀️', 'Which word names the picture?', 'sun', 'sin', 'sunn', 'sen'),
      p('🦆', 'Which word names the picture?', 'duck', 'dock', 'deck', 'dark'),
      p('🚚', 'Which word names the picture?', 'truck', 'track', 'trick', 'trip'),
      p('🥁', 'Which word names the picture?', 'drum', 'dream', 'drink', 'drop'),
      p('🛖', 'Which word names the picture?', 'hut', 'hot', 'hat', 'hit'),
      r('Which word has the short u sound?', 'cup', 'cape', 'cute', 'coat'),
      r('Which word has the short u sound?', 'run', 'rain', 'rope', 'rode'),
      r('Which word has the short u sound?', 'mud', 'made', 'mood', 'mode'),
      r('Which word has the short u sound?', 'gum', 'gate', 'game', 'goat'),
      r('Which word has the short u sound?', 'nut', 'note', 'nail', 'neat'),
    ],
  ],
)

// --- Reading: digraphs, blends, and short vowels in words (K–2) ----------------------------------

const digraphPick = rowSkill(
  'digraphPick',
  ['Digraphs at the start', 'Digraphs at the end', 'Words that start with a digraph'],
  [
    [
      p('🚢', 'Which two letters start this word?', 'sh', 'ch', 'th', 'wh'),
      p('🧀', 'Which two letters start this word?', 'ch', 'sh', 'th', 'wh'),
      p('🦈', 'Which two letters start this word?', 'sh', 'ch', 'th', 'wh'),
      p('🪑', 'Which two letters start this word?', 'ch', 'sh', 'th', 'wh'),
      p('🦷', 'Which two letters start this word?', 'th', 'sh', 'ch', 'wh'),
      p('🐋', 'Which two letters start this word?', 'wh', 'sh', 'ch', 'th'),
      p('🛞', 'Which two letters start this word?', 'wh', 'sh', 'ch', 'th'),
      p('🐑', 'Which two letters start this word?', 'sh', 'ch', 'th', 'wh'),
      p('🍫', 'Which two letters start this word?', 'ch', 'sh', 'th', 'wh'),
      p('🐚', 'Which two letters start this word?', 'sh', 'ch', 'th', 'wh'),
      p('🧵', 'Which two letters start this word?', 'th', 'sh', 'ch', 'wh'),
    ],
    [
      r('Which two letters end the word "fish"?', 'sh', 'ch', 'th', 'wh'),
      r('Which two letters end the word "bench"?', 'ch', 'sh', 'th', 'wh'),
      r('Which two letters end the word "moth"?', 'th', 'sh', 'ch', 'wh'),
      r('Which two letters end the word "wish"?', 'sh', 'ch', 'th', 'wh'),
      r('Which two letters end the word "rich"?', 'ch', 'sh', 'th', 'wh'),
      r('Which two letters end the word "math"?', 'th', 'sh', 'ch', 'wh'),
      r('Which two letters end the word "lunch"?', 'ch', 'sh', 'th', 'wh'),
      r('Which two letters end the word "brush"?', 'sh', 'ch', 'th', 'wh'),
      r('Which two letters end the word "path"?', 'th', 'sh', 'ch', 'wh'),
      r('Which two letters end the word "dish"?', 'sh', 'ch', 'th', 'wh'),
      r('Which two letters end the word "bath"?', 'th', 'sh', 'ch', 'wh'),
    ],
    [
      r('Which word starts with "sh"?', 'shop', 'chop', 'stop', 'mop'),
      r('Which word starts with "ch"?', 'chip', 'ship', 'trip', 'lip'),
      r('Which word starts with "th"?', 'thin', 'tin', 'chin', 'shin'),
      r('Which word starts with "wh"?', 'whip', 'hip', 'chip', 'wet'),
      r('Which word starts with "sh"?', 'shell', 'sell', 'spell', 'bell'),
      r('Which word starts with "th"?', 'this', 'kiss', 'miss', 'his'),
      r('Which word starts with "ch"?', 'cheek', 'seek', 'speak', 'peek'),
      r('Which word starts with "wh"?', 'when', 'went', 'then', 'wet'),
      r('Which word starts with "sh"?', 'shed', 'red', 'bed', 'sled'),
      r('Which word starts with "th"?', 'thumb', 'dumb', 'numb', 'chum'),
    ],
  ],
)

const vowelFind = rowSkill(
  'vowelFind',
  ['Find the vowel letter', 'Find the word with two vowel letters'],
  [
    [
      r('Which letter in "dog" is a vowel?', 'o', 'd', 'g', 'b'),
      r('Which letter in "cat" is a vowel?', 'a', 'c', 't', 'b'),
      r('Which letter in "pig" is a vowel?', 'i', 'p', 'g', 'm'),
      r('Which letter in "sun" is a vowel?', 'u', 's', 'n', 'd'),
      r('Which letter in "hen" is a vowel?', 'e', 'h', 'n', 'p'),
      r('Which letter in "map" is a vowel?', 'a', 'm', 'p', 't'),
      r('Which letter in "cup" is a vowel?', 'u', 'c', 'p', 'b'),
      r('Which letter in "hop" is a vowel?', 'o', 'h', 'p', 't'),
      r('Which letter in "fox" is a vowel?', 'o', 'f', 'x', 'k'),
      r('Which letter in "mud" is a vowel?', 'u', 'm', 'd', 'b'),
      r('Which letter in "bed" is a vowel?', 'e', 'b', 'd', 'g'),
    ],
    [
      r('Which word has TWO vowel letters?', 'boat', 'cat', 'dog', 'pig'),
      r('Which word has TWO vowel letters?', 'rain', 'map', 'sun', 'bed'),
      r('Which word has TWO vowel letters?', 'seed', 'hat', 'hop', 'bus'),
      r('Which word has TWO vowel letters?', 'bead', 'cut', 'pig', 'fox'),
      r('Which word has TWO vowel letters?', 'tree', 'run', 'leg', 'jam'),
      r('Which word has TWO vowel letters?', 'coat', 'pot', 'bag', 'cup'),
      r('Which word has TWO vowel letters?', 'sail', 'sit', 'top', 'bed'),
      r('Which word has TWO vowel letters?', 'mail', 'dig', 'mop', 'hut'),
      r('Which word has TWO vowel letters?', 'nail', 'pen', 'rug', 'fox'),
      r('Which word has TWO vowel letters?', 'meat', 'pig', 'cap', 'hot'),
      r('Which word has TWO vowel letters?', 'boot', 'tip', 'mud', 'pan'),
      r('Which word has TWO vowel letters?', 'road', 'pin', 'fog', 'bus'),
    ],
  ],
)

const blendsG2 = rowSkill(
  'blendsG2',
  ['Blends at the start', 'Blends at the end', 'Blends and digraphs at the start'],
  [
    [
      r('Which two letters start the word "frog"?', 'fr', 'fl', 'br', 'gr'),
      r('Which two letters start the word "stop"?', 'st', 'sp', 'sk', 'sn'),
      r('Which two letters start the word "clap"?', 'cl', 'cr', 'sl', 'gl'),
      r('Which two letters start the word "drum"?', 'dr', 'tr', 'bl', 'gr'),
      r('Which two letters start the word "plum"?', 'pl', 'pr', 'fl', 'bl'),
      r('Which two letters start the word "snack"?', 'sn', 'sm', 'sc', 'st'),
      r('Which two letters start the word "swim"?', 'sw', 'sn', 'sm', 'sp'),
      r('Which two letters start the word "truck"?', 'tr', 'dr', 'cr', 'fr'),
      r('Which two letters start the word "grape"?', 'gr', 'gl', 'br', 'pr'),
      r('Which two letters start the word "blue"?', 'bl', 'br', 'pl', 'fl'),
      r('Which two letters start the word "flag"?', 'fl', 'fr', 'sl', 'cl'),
      r('Which two letters start the word "crab"?', 'cr', 'cl', 'gr', 'br'),
    ],
    [
      r('Which two letters END the word "jump"?', 'mp', 'nt', 'nk', 'lt'),
      r('Which two letters END the word "hand"?', 'nd', 'nt', 'ng', 'mp'),
      r('Which two letters END the word "fast"?', 'st', 'sk', 'ft', 'nt'),
      r('Which two letters END the word "milk"?', 'lk', 'lt', 'lp', 'nk'),
      r('Which two letters END the word "belt"?', 'lt', 'lp', 'ld', 'nt'),
      r('Which two letters END the word "desk"?', 'sk', 'st', 'sp', 'nk'),
      r('Which two letters END the word "nest"?', 'st', 'nd', 'sk', 'mp'),
      r('Which two letters END the word "wind"?', 'nd', 'nk', 'nt', 'lt'),
      r('Which two letters END the word "help"?', 'lp', 'lt', 'lk', 'mp'),
      r('Which two letters END the word "gift"?', 'ft', 'st', 'sk', 'lt'),
      r('Which two letters END the word "tent"?', 'nt', 'nd', 'nk', 'st'),
      r('Which two letters END the word "bank"?', 'nk', 'nd', 'nt', 'mp'),
    ],
    [
      r('Which word starts with a blend?', 'trip', 'ship', 'chin', 'thin'),
      r('Which word starts with a digraph?', 'chop', 'grass', 'flip', 'slip'),
      r('Which word starts with a blend?', 'plant', 'shark', 'chair', 'whale'),
      r('Which word starts with a digraph?', 'whale', 'blue', 'clip', 'flag'),
      r('Which word starts with a blend?', 'stamp', 'shell', 'thumb', 'chin'),
      r('Which word starts with a digraph?', 'this', 'drip', 'slide', 'crab'),
      r('Which word starts with a blend?', 'brick', 'phone', 'shoe', 'cheek'),
      r('Which word starts with a digraph?', 'chest', 'swing', 'bread', 'clock'),
      r('Which word starts with a blend?', 'green', 'shell', 'thing', 'chair'),
      r('Which word starts with a digraph?', 'sheep', 'sled', 'plum', 'grip'),
      r('Which word starts with a blend?', 'skin', 'shop', 'chop', 'when'),
      r('Which word starts with a digraph?', 'wheel', 'twig', 'frog', 'drop'),
    ],
  ],
)

const shortVowelFix = rowSkill(
  'shortVowelFix',
  ['Fill in the short vowel', 'Change the vowel', 'Spell the short vowel word'],
  [
    [
      r('Which vowel fills the blank to spell "cat"? c_t', 'a', 'e', 'i', 'u'),
      r('Which vowel fills the blank to spell "pen"? p_n', 'e', 'a', 'i', 'u'),
      r('Which vowel fills the blank to spell "bug"? b_g', 'u', 'a', 'e', 'o'),
      r('Which vowel fills the blank to spell "dog"? d_g', 'o', 'a', 'i', 'u'),
      r('Which vowel fills the blank to spell "hit"? h_t', 'i', 'a', 'e', 'o'),
      r('Which vowel fills the blank to spell "mop"? m_p', 'o', 'a', 'u', 'i'),
      r('Which vowel fills the blank to spell "bed"? b_d', 'e', 'a', 'i', 'u'),
      r('Which vowel fills the blank to spell "sun"? s_n', 'u', 'a', 'e', 'i'),
      r('Which vowel fills the blank to spell "fan"? f_n', 'a', 'e', 'i', 'o'),
      r('Which vowel fills the blank to spell "zip"? z_p', 'i', 'a', 'o', 'u'),
      r('Which vowel fills the blank to spell "top"? t_p', 'o', 'a', 'e', 'u'),
      r('Which vowel fills the blank to spell "rug"? r_g', 'u', 'e', 'i', 'o'),
    ],
    [
      r('Change the vowel in "pin" to "a". What word do you get?', 'pan', 'pen', 'pun', 'pot'),
      r('Change the vowel in "bed" to "i". What word do you get?', 'bid', 'bad', 'bud', 'bog'),
      r('Change the vowel in "cut" to "a". What word do you get?', 'cat', 'cot', 'cup', 'cub'),
      r('Change the vowel in "hop" to "i". What word do you get?', 'hip', 'hug', 'hem', 'hat'),
      r('Change the vowel in "bag" to "e". What word do you get?', 'beg', 'big', 'bug', 'bog'),
      r('Change the vowel in "sit" to "a". What word do you get?', 'sat', 'set', 'sun', 'sip'),
      r('Change the vowel in "mud" to "a". What word do you get?', 'mad', 'mid', 'mop', 'mood'),
      r('Change the vowel in "tip" to "o". What word do you get?', 'top', 'tap', 'tub', 'tug'),
      r('Change the vowel in "bun" to "i". What word do you get?', 'bin', 'ban', 'bang', 'bog'),
      r('Change the vowel in "log" to "u". What word do you get?', 'lug', 'leg', 'lag', 'lid'),
      r('Change the vowel in "rug" to "a". What word do you get?', 'rag', 'rig', 'rot', 'rim'),
      r('Change the vowel in "hit" to "u". What word do you get?', 'hut', 'hot', 'hat', 'hug'),
    ],
    [
      p('🐱', 'Which spelling is right for this picture?', 'cat', 'kat', 'catt', 'caat'),
      p('🛏️', 'Which spelling is right for this picture?', 'bed', 'bedd', 'beed', 'bedde'),
      p('🐶', 'Which spelling is right for this picture?', 'dog', 'dogg', 'dohg', 'dgog'),
      p('🍎', 'Which spelling is right for this picture?', 'apple', 'aple', 'appel', 'applle'),
      p('🧦', 'Which spelling is right for this picture?', 'sock', 'sok', 'sockk', 'socc'),
      p('🐷', 'Which spelling is right for this picture?', 'pig', 'pigg', 'pyg', 'pgi'),
      p('🥚', 'Which spelling is right for this picture?', 'egg', 'eg', 'egge', 'ehg'),
      p('🚌', 'Which spelling is right for this picture?', 'bus', 'bas', 'buss', 'bsu'),
      p('☀️', 'Which spelling is right for this picture?', 'sun', 'sunn', 'snu', 'sen'),
      p('🦊', 'Which spelling is right for this picture?', 'fox', 'foks', 'foxx', 'fokz'),
      p('🧢', 'Which spelling is right for this picture?', 'cap', 'kap', 'capp', 'caap'),
      p('🎩', 'Which spelling is right for this picture?', 'hat', 'hatt', 'haat', 'hta'),
    ],
  ],
)

const syllableWords = rowSkill(
  'syllableWords',
  ['Split a word ending in -le', 'Pick the two-syllable word'],
  [
    [
      r('Which is the correct way to split "table" into two syllables?', 'ta-ble', 'tab-le', 'tabl-e', 't-able'),
      r('Which is the correct way to split "little" into two syllables?', 'lit-tle', 'li-ttle', 'litt-le', 'lit-tl-e'),
      r('Which is the correct way to split "bubble" into two syllables?', 'bub-ble', 'bu-bble', 'bubb-le', 'bub-bl-e'),
      r('Which is the correct way to split "apple" into two syllables?', 'ap-ple', 'a-pple', 'app-le', 'ap-pl-e'),
      r('Which is the correct way to split "puzzle" into two syllables?', 'puz-zle', 'pu-zzle', 'puzz-le', 'puz-zl-e'),
      r('Which is the correct way to split "turtle" into two syllables?', 'tur-tle', 'tu-rtle', 'turt-le', 'tur-tl-e'),
      r('Which is the correct way to split "candle" into two syllables?', 'can-dle', 'ca-ndle', 'cand-le', 'can-dl-e'),
      r('Which is the correct way to split "jungle" into two syllables?', 'jun-gle', 'ju-ngle', 'jung-le', 'jun-gl-e'),
      r('Which is the correct way to split "bottle" into two syllables?', 'bot-tle', 'bo-ttle', 'bott-le', 'bot-tl-e'),
      r('Which is the correct way to split "gentle" into two syllables?', 'gen-tle', 'ge-ntle', 'gent-le', 'gen-tl-e'),
      r('Which is the correct way to split "maple" into two syllables?', 'ma-ple', 'map-le', 'mapl-e', 'm-aple'),
    ],
    [
      r('Which word has TWO syllables?', 'rainbow', 'boat', 'tree', 'lamp'),
      r('Which word has TWO syllables?', 'corner', 'stair', 'floor', 'bird'),
      r('Which word has TWO syllables?', 'monkey', 'frog', 'snake', 'cat'),
      r('Which word has TWO syllables?', 'pancake', 'pie', 'milk', 'jam'),
      r('Which word has TWO syllables?', 'hammer', 'nail', 'saw', 'drill'),
      r('Which word has TWO syllables?', 'sunshine', 'moon', 'star', 'storm'),
      r('Which word has TWO syllables?', 'tiger', 'bear', 'cat', 'dog'),
      r('Which word has TWO syllables?', 'window', 'door', 'wall', 'roof'),
      r('Which word has TWO syllables?', 'basket', 'box', 'bag', 'cup'),
      r('Which word has TWO syllables?', 'number', 'six', 'ten', 'one'),
      r('Which word has TWO syllables?', 'thunder', 'storm', 'rain', 'snow'),
      r('Which word has TWO syllables?', 'puppet', 'doll', 'toy', 'ball'),
    ],
  ],
)

// --- Reading: stories and facts (read alone, then read along) ------------------------------------

const decodableG2 = rowSkill(
  'decodableG2',
  ['Short vowel stories', 'Silent e stories', 'Long vowel stories'],
  [
    [
      r('Ben has a red hat. He puts it on his head. Ben is glad. What color is Ben’s hat?', 'red', 'blue', 'green', 'yellow'),
      r('Tim and Pam fed the pig. The pig got wet and muddy. Who did Tim and Pam feed?', 'the pig', 'the cat', 'the hen', 'the duck'),
      r('Jen went to the shop. She got milk and jam. She got a bun too. What else did Jen get?', 'a bun', 'a fish', 'a rock', 'a hat'),
      r('The cat sat on a mat. The mat was in the sun. Where was the mat?', 'in the sun', 'in the rain', 'in the snow', 'in the mud'),
      r('Gus ran up the hill. He got to the top and sat down. Where did Gus sit?', 'at the top', 'at the bottom', 'in a pond', 'in a hut'),
      r('Bev had ten red pens. She lost two pens. How many pens does Bev have now?', 'eight', 'six', 'nine', 'ten'),
      r('Dad put a log in the fire. It made a big flame. What did Dad put in the fire?', 'a log', 'a rug', 'a cup', 'a bag'),
      r('Mac and Kim sat on a bench. A duck came up to them. The duck had a red bill. What color was the duck’s bill?', 'red', 'black', 'yellow', 'white'),
      r('The fox ran past a box. It hid in a hut. Where did the fox hide?', 'in a hut', 'in a cup', 'in a bag', 'in a bed'),
      r('Jack has a big bag. He puts his lunch in it. What did Jack put in the bag?', 'his lunch', 'his cat', 'his bike', 'his hat'),
      r('Nell and Jeff win a race. They get a gold cup. What did they win?', 'a gold cup', 'a bike', 'a kite', 'a hat'),
      r('Tom got a pup. The pup likes to nap in the sun. What does the pup like to do?', 'nap in the sun', 'swim in the lake', 'run to school', 'read books'),
    ],
    [
      r('Jake made a cake. He put white frosting on it. What color was the frosting?', 'white', 'red', 'green', 'blue'),
      r('Kate rode her bike to the lake. She saw a large fish. What did Kate see?', 'a large fish', 'a big bear', 'a flock of geese', 'a huge snake'),
      r('Pete wrote a note to his mom. It said, "Please come home at five." What time did Pete ask Mom to come home?', 'five', 'three', 'seven', 'nine'),
      r('Jane hid a gift in a case. The case was made of wood. Where did Jane hide the gift?', 'in a case', 'in a sack', 'under a rug', 'behind a door'),
      r('Mike gave a snack to a seal at the lake. The seal ate it fast. What did Mike give the seal?', 'a snack', 'a kite', 'a bike', 'a rope'),
      r('Our home has a big yard. We have a tree with a swing. What is in our yard?', 'a tree with a swing', 'a pool', 'a boat', 'a shed'),
      r('Nine ducks made a line on the lake. They swam in a row. How many ducks were there?', 'nine', 'five', 'seven', 'twelve'),
      r('Lane got a cute pet mouse. It likes to nibble on grapes. What does the mouse like to nibble on?', 'grapes', 'bricks', 'shoes', 'sand'),
      r('Dave made a kite with a long tail. He flew it at the lake. What did Dave fly at the lake?', 'a kite', 'a ball', 'a boat', 'a bike'),
      r('Rose made a wish on a star. Then she rode home on a bike. What did Rose ride home on?', 'a bike', 'a bus', 'a horse', 'a train'),
      r('Mom gave me a pine cone. It came from a tree in the hills. Where did the pine cone come from?', 'a tree in the hills', 'a store', 'the sea', 'the sky'),
      r('Cole has bees near his yard. The bees make sweet honey. What do the bees make?', 'honey', 'milk', 'juice', 'bread'),
    ],
    [
      r('The rain made a big puddle. Ray and Kay splashed in it. Their boots got wet. What did Ray and Kay splash in?', 'a big puddle', 'a pond', 'a lake', 'a sink'),
      r('Pete likes to eat cheese and peas. He eats them each day. What does Pete like to eat?', 'cheese and peas', 'pizza and corn', 'grapes and pears', 'soup and rice'),
      r('The boat floats on the lake. Joe steers it with a long pole. Where is the boat?', 'on the lake', 'in a cave', 'on a hill', 'in a tree'),
      r('Lee has a blue kite. It flies high in the sky. What color is Lee’s kite?', 'blue', 'red', 'green', 'black'),
      r('Nina wrote a note to her pal. The note said, "Let’s play at noon." When will they play?', 'at noon', 'at dawn', 'at dusk', 'at midnight'),
      r('A goat ate the rope. Now the goat is out of the pen. Where is the goat?', 'out of the pen', 'in the barn', 'in the house', 'in the pond'),
      r('Jim has a mule. It likes to nap in the sun. What does the mule like to do?', 'nap in the sun', 'run races', 'eat pizza', 'swim in the lake'),
      r('The pilot flies a plane to Maine. The plane flies over the ice. Where does the plane fly?', 'to Maine', 'to Texas', 'to Florida', 'to Ohio'),
      r('June found a cute new cube. The cube was blue. What color was the cube?', 'blue', 'red', 'green', 'white'),
      r('Ivy got a tube of glue. She used it to fix a toy. What did Ivy fix?', 'a toy', 'a bike', 'a window', 'a chair'),
      r('The hikers went up a steep trail. At the top, they ate lunch. What did they do at the top?', 'ate lunch', 'went to sleep', 'swam in a pool', 'played cards'),
      r('Tony had a bowl of oats and milk. The oats were hot. What did Tony have for breakfast?', 'oats and milk', 'toast and jam', 'eggs and bacon', 'a bagel'),
    ],
  ],
)

const storyTexts = rowSkill(
  'storyTexts',
  ['Short stories to read alone', 'Stories to read along', 'Longer stories to read along'],
  [
    [
      r('Rex the dog digs in the yard. He finds a red ball. What did Rex find?', 'a red ball', 'a bone', 'a hat', 'a fish'),
      r('Mia has a red kite. She runs in the park, and the kite flies high. What color is the kite?', 'red', 'blue', 'green', 'yellow'),
      r('Ben got a pet fish. Its name is Bubbles. What is the fish’s name?', 'Bubbles', 'Spot', 'Max', 'Rosie'),
      r('The little bear was hungry. He found a jar of honey in a tree. What was in the jar?', 'honey', 'apples', 'milk', 'nuts'),
      r('Lulu the cat sat in a box. The box was too small. Where did Lulu sit?', 'in a box', 'on the roof', 'under the bed', 'in the bath'),
      r('A frog sat on a log. A fly came by. The frog ate the fly. What did the frog eat?', 'a fly', 'a worm', 'a leaf', 'a fish'),
      r('The bunny hopped to the garden. It ate a big carrot. Then it took a nap. What did the bunny eat?', 'a carrot', 'a cookie', 'a pizza', 'a banana'),
      r('It was a windy day. Jo’s hat blew away. Jo ran after it. What blew away?', 'Jo’s hat', 'her shoe', 'her kite', 'her bike'),
      r('The pig ran to the mud. He rolled and rolled. He was happy. Where did the pig go?', 'the mud', 'the school', 'the moon', 'the store'),
      r('Dan went to the store with his mom. He got milk and eggs. What did Dan get?', 'milk and eggs', 'bread and jam', 'apples and rice', 'candy and toys'),
      r('A little duck was lost. It looked for its mom. Then the duck found its mom by the pond. Who did the duck find?', 'its mom', 'a fox', 'a cat', 'a bear'),
      r('Nan has a blue bike. She rides it to the park with her dog. What does Nan ride?', 'a blue bike', 'a red bus', 'a green car', 'a big boat'),
    ],
    [
      r('Tina and her dad went to the beach. They built a big sand castle. Then a wave came and knocked it down. Tina laughed. What knocked down the sand castle?', 'a wave', 'a dog', 'a bird', 'a truck'),
      r('Owen had a sore foot, so he could not run. He sat in the shade and read a book. What did Owen do?', 'read a book', 'ran a race', 'swam in the lake', 'played ball'),
      r('A fox wanted grapes. They were high on a vine. The fox jumped and jumped but could not reach them. So the fox walked away. What did the fox do at the end?', 'walked away', 'ate the grapes', 'climbed the vine', 'took the grapes home'),
      r('Mel planted a seed in a pot. She gave it water every day. Soon a green sprout came up. What came up from the seed?', 'a green sprout', 'a red flower', 'a big rock', 'a toy'),
      r('Kai had a cold. His mom made him soup and tea. He rested on the couch all day. What did Mom make?', 'soup and tea', 'pancakes and juice', 'eggs and toast', 'pizza and milk'),
      r('The class went to the zoo. Jen saw a lion sleeping. She saw monkeys swinging on ropes. Her favorite was the monkeys. What did Jen like best?', 'the monkeys', 'the lion', 'the bears', 'the snakes'),
      r('Rain fell all day. Ana stayed in and made a puzzle. When the sun came out, she went to the park. Where did Ana go when the sun came out?', 'to the park', 'to the pool', 'to school', 'to the store'),
      r('Leo lost his blue mitten in the snow. He looked under the bench. Then he found it under a pile of leaves. Where did Leo find the mitten?', 'under a pile of leaves', 'in his backpack', 'on the bus', 'in the sink'),
      r('Grace baked cookies for the bake sale. She put them in a box with a red bow. She took the box to school. What did Grace take to school?', 'cookies', 'a cake', 'a sandwich', 'a pie'),
      r('A turtle and a hare had a race. The hare ran fast but took a nap. The turtle kept walking and won. Who won the race?', 'the turtle', 'the hare', 'a dog', 'a bird'),
      r('Tom saved his coins for a long time. At last he had enough money for a bike. He bought a red bike. What color was Tom’s bike?', 'red', 'green', 'blue', 'yellow'),
      r('Nina went on a hike with her dad. They saw a deer by the creek. The deer ran into the woods. What animal did they see?', 'a deer', 'a bear', 'a rabbit', 'a squirrel'),
    ],
    [
      r('A dragon named Pip lived in a cave. Pip was afraid of the dark. Every night, a girl named June left a candle at the cave door. Pip was not scared anymore. Who left the candle?', 'June', 'a king', 'a knight', 'Pip'),
      r('Ray’s team lost the game by one point. Ray felt sad. His coach said, "You played well." Ray smiled a little. What did his coach say?', 'You played well.', 'You lost the game.', 'Go home now.', 'Try harder next year.'),
      r('In 1900, Lena’s family moved to a farm with no electricity. At night, they read by the light of a lamp. Lena loved books. How did the family light the room at night?', 'With a lamp', 'With a flashlight', 'With a TV', 'With a computer'),
      r('The wizard Oru had a magic hat. When he tapped it, flowers grew. One day the hat fell into a pond. Oru had to fish it out. What happened when Oru tapped the hat?', 'Flowers grew', 'It started to rain', 'It began to sing', 'It turned into a bird'),
      r('Jamal wanted to join the school choir. He practiced his song every night. On the day of the try-outs, he sang loudly and clearly. What did Jamal practice every night?', 'his song', 'his spelling words', 'a new dance', 'a poem'),
      r('Priya’s kite got stuck in a tall tree. She tried to pull it down with a stick, but it did not work. Her older brother climbed up and freed the kite. Who freed the kite?', 'her older brother', 'Priya', 'the mail carrier', 'a dog'),
      r('Long ago, children carried water from the well every morning. Ana filled two buckets. They were heavy, so she walked slowly. What did Ana fill?', 'two buckets', 'two baskets', 'two bowls', 'two cups'),
      r('In the forest, a fox named Ru found a golden key. The key opened a little door in an old oak tree. Behind the door was a room full of books. What was behind the door?', 'a room full of books', 'a pile of gold', 'a pack of wolves', 'a bowl of soup'),
      r('Max’s grandma came to visit. She brought a box of homemade muffins. Max ate three muffins before lunch. What did Grandma bring?', 'homemade muffins', 'a new bike', 'a picnic basket', 'a bag of apples'),
      r('The moon looked like a silver coin tonight. Lee wished on it. Then he went inside to bed. What did Lee do to the moon?', 'He wished on it', 'He drew it', 'He ate it', 'He climbed it'),
      r('Oscar and his dad hiked up Pine Hill. At the top, they sat on a log and ate turkey sandwiches. The view was amazing. What did they eat at the top?', 'turkey sandwiches', 'pizza', 'fish sticks', 'apple pie'),
      r('The class grew bean plants in cups. Each day, Mr. Ruiz checked the beans. After two weeks, the beans had green sprouts. What did the beans have after two weeks?', 'green sprouts', 'red flowers', 'big rocks', 'shiny coins'),
    ],
  ],
)

const factTexts = rowSkill(
  'factTexts',
  ['Facts to read alone', 'Facts to read along', 'Longer facts to read along'],
  [
    [
      r('Bees make honey. Bees live in a hive. What do bees make?', 'honey', 'milk', 'bread', 'juice'),
      r('Cows live on farms. Cows give us milk. Where do cows live?', 'on farms', 'in ponds', 'in trees', 'in caves'),
      r('The sun is a star. It gives us light and heat. What gives us light and heat?', 'the sun', 'the rain', 'a rock', 'a tree'),
      r('Fish live in water. They breathe with gills. Where do fish live?', 'in water', 'in trees', 'on the moon', 'in a nest'),
      r('Ants live in big groups called colonies. What do ants live in?', 'colonies', 'castles', 'boxes', 'shells'),
      r('Polar bears live in the cold Arctic. They have thick white fur. Where do polar bears live?', 'in the Arctic', 'in the desert', 'in the jungle', 'at the beach'),
      r('Apples grow on trees. We pick them in the fall. Where do apples grow?', 'on trees', 'under the sea', 'in the sand', 'on the roof'),
      r('A turtle has a hard shell. The shell keeps the turtle safe. What is the shell for?', 'keeping the turtle safe', 'swimming fast', 'flying', 'singing'),
      r('The moon goes around the Earth. We can see it at night. What goes around the Earth?', 'the moon', 'the sun', 'a bus', 'a dog'),
      r('Dogs have a great sense of smell. They use their nose to find things. What do dogs use their nose for?', 'finding things', 'playing music', 'flying', 'cooking'),
      r('A giraffe is very tall. It eats leaves from tall trees. What does a giraffe eat?', 'leaves', 'fish', 'bread', 'cheese'),
      r('Snakes do not have legs. They move by sliding on the ground. How do snakes move?', 'by sliding', 'by flying', 'by hopping', 'by rolling'),
    ],
    [
      r('Butterflies start life as eggs. The eggs hatch into caterpillars. Later, the caterpillars turn into butterflies. What do caterpillars turn into?', 'butterflies', 'bees', 'frogs', 'birds'),
      r('George Washington was the first president of the United States. He lived in Virginia. Who was the first president?', 'George Washington', 'Abraham Lincoln', 'Benjamin Franklin', 'Thomas Jefferson'),
      r('Rosa Parks was a brave woman. In 1955, she refused to give up her seat on a bus. What did Rosa Parks refuse to give up?', 'her seat on a bus', 'her coat', 'her book', 'her bike'),
      r('Bread is made from flour. Flour is made from grain. What is bread made from?', 'flour', 'milk', 'grapes', 'pebbles'),
      r('Water freezes when it gets very cold. Frozen water is called ice. What is frozen water called?', 'ice', 'steam', 'mud', 'sand'),
      r('Pandas eat bamboo. They spend most of the day eating. What do pandas eat?', 'bamboo', 'fish', 'ants', 'carrots'),
      r('Honeybees dance to show other bees where the flowers are. What do honeybees do to show where flowers are?', 'dance', 'sing', 'sleep', 'hide'),
      r('Mount Everest is the tallest mountain on Earth. It is in Asia. Where is Mount Everest?', 'in Asia', 'in Africa', 'in Australia', 'in South America'),
      r('The Sahara is a hot desert. It gets very little rain. What kind of place is the Sahara?', 'a hot desert', 'a cold forest', 'a big lake', 'a snowy mountain'),
      r('Baseball players run around four bases. They run around them to score. How many bases do players run around?', 'four', 'three', 'five', 'six'),
      r('Penguins live in cold places. They swim very well. Where do penguins live?', 'in cold places', 'in hot deserts', 'in tall trees', 'in deep caves'),
      r('Sharks have many rows of teeth. Their teeth grow back when they fall out. What grows back when teeth fall out?', 'their teeth', 'their fins', 'their tails', 'their eyes'),
    ],
    [
      r('Sound travels in waves. When you clap, the air shakes. Those shakes carry the sound to your ears. What does sound travel in?', 'waves', 'bricks', 'candy', 'paper'),
      r('Drums make a loud beat. Drummers play them by hitting them with sticks. Many bands have drums. How are drums played?', 'by hitting them', 'by blowing into them', 'by plucking strings', 'by pressing keys'),
      r('Painters mix colors on a palette. Red and yellow make orange. Blue and yellow make green. What do painters mix colors on?', 'a palette', 'a sponge', 'a window', 'a pillow'),
      r('A bakery sells bread and cakes. It opens at seven every morning. Customers buy fresh goods there. What does the bakery sell?', 'bread and cakes', 'cars and boats', 'shoes and hats', 'computers and phones'),
      r('Robots can help people in factories. Some robots can paint cars. Others can carry heavy boxes. What can some robots do?', 'paint cars', 'bake bread', 'fly kites', 'sing songs'),
      r('On Thanksgiving, many families eat a big meal together. Many families share turkey and pie. What do many families share on Thanksgiving?', 'turkey and pie', 'fish and rice', 'tacos and beans', 'soup and salad'),
      r('Amelia Earhart was a famous pilot. She flew across the Atlantic Ocean. People admired her bravery. What did Amelia Earhart do?', 'flew across the Atlantic Ocean', 'sailed around the world', 'climbed Mount Everest', 'drove a race car'),
      r('Hawks have sharp eyes. They can see small mice from very high in the sky. What can hawks see from high in the sky?', 'small mice', 'the moon', 'big trucks', 'fish under the sea'),
      r('A sculpture is a three-dimensional artwork. Sculptors carve or shape clay, stone, or metal. What is a sculpture?', 'a three-dimensional artwork', 'a flat drawing', 'a song', 'a dance'),
      r('Plants need sunlight, water, and air to grow. Without sunlight, plants cannot make food. What do plants need to grow?', 'sunlight, water, and air', 'candy and soda', 'sand and rocks', 'paint and glue'),
      r('Bees gather nectar from flowers. Nectar helps bees make honey. What do bees gather from flowers?', 'nectar', 'mud', 'sand', 'rocks'),
      r('Maps use symbols to show places. A legend explains what each symbol means. What does a legend explain?', 'what each symbol means', 'where the sun rises', 'how to bake bread', 'how to play a game'),
    ],
  ],
)

// --- Reading: sounds into words ------------------------------------------------------------------

const phonemeBlend = rowSkill(
  'phonemeBlend',
  ['Blend the sounds', 'Name the sounds in a word', 'Build a word from its sounds'],
  [
    [
      r('Blend these sounds into a word: s - u - n. What word is it?', 'sun', 'son', 'sin', 'sad'),
      r('Blend these sounds into a word: c - a - p. What word is it?', 'cap', 'cup', 'cop', 'cab'),
      r('Blend these sounds into a word: m - o - p. What word is it?', 'mop', 'map', 'mud', 'mug'),
      r('Blend these sounds into a word: b - e - d. What word is it?', 'bed', 'bad', 'bid', 'bud'),
      r('Blend these sounds into a word: sh - i - p. What word is it?', 'ship', 'sip', 'chip', 'shop'),
      r('Blend these sounds into a word: h - o - p. What word is it?', 'hop', 'hip', 'hot', 'top'),
      r('Blend these sounds into a word: d - o - g. What word is it?', 'dog', 'dig', 'dug', 'log'),
      r('Blend these sounds into a word: r - a - t. What word is it?', 'rat', 'hat', 'rot', 'rag'),
      r('Blend these sounds into a word: s - t - o - p. What word is it?', 'stop', 'spot', 'shop', 'stomp'),
      r('Blend these sounds into a word: j - u - m - p. What word is it?', 'jump', 'bump', 'lump', 'jam'),
      r('Blend these sounds into a word: f - i - sh. What word is it?', 'fish', 'fist', 'dish', 'fin'),
    ],
    [
      r('Which sound is FIRST in "fish"?', 'f', 'i', 'sh', 'k'),
      r('Which sound is LAST in "cat"?', 't', 'c', 'a', 'k'),
      r('Which sound is in the MIDDLE of "map"?', 'a', 'm', 'p', 'o'),
      r('How many sounds are in "dog"?', 'three', 'two', 'four', 'five'),
      r('How many sounds are in "hat"?', 'three', 'two', 'four', 'one'),
      r('Which sound is LAST in "bug"?', 'g', 'b', 'u', 'k'),
      r('Which sound is FIRST in "sun"?', 's', 'u', 'n', 'z'),
      r('Which sound is in the MIDDLE of "bed"?', 'e', 'b', 'd', 'n'),
      r('Which sound is FIRST in "mop"?', 'm', 'o', 'p', 'n'),
      r('How many sounds are in "fox"?', 'three', 'two', 'four', 'one'),
      r('Which sound is LAST in "dim"?', 'm', 'd', 'i', 'n'),
      r('How many sounds are in "ten"?', 'three', 'two', 'four', 'one'),
    ],
    [
      r('The first sound is /f/. The middle sound is /i/. The last sound is /n/. What word is it?', 'fin', 'fan', 'fun', 'fine'),
      r('The first sound is /s/. The middle sound is /u/. The last sound is /n/. What word is it?', 'sun', 'son', 'sin', 'sad'),
      r('The first sound is /g/. The middle sound is /o/. The last sound is /t/. What word is it?', 'got', 'god', 'gut', 'get'),
      r('The first sound is /h/. The middle sound is /e/. The last sound is /n/. What word is it?', 'hen', 'hit', 'hat', 'hem'),
      r('The first sound is /c/. The middle sound is /u/. The last sound is /b/. What word is it?', 'cub', 'cup', 'cab', 'cut'),
      r('The first sound is /p/. The middle sound is /e/. The last sound is /g/. What word is it?', 'peg', 'pet', 'pen', 'pig'),
      r('The first sound is /w/. The middle sound is /e/. The last sound is /b/. What word is it?', 'web', 'wet', 'wig', 'bed'),
      r('The first sound is /b/. The middle sound is /u/. The last sound is /s/. What word is it?', 'bus', 'bun', 'bug', 'bud'),
      r('The first sound is /j/. The middle sound is /a/. The last sound is /m/. What word is it?', 'jam', 'jet', 'jog', 'jot'),
      r('The first sound is /d/. The middle sound is /i/. The last sound is /p/. What word is it?', 'dip', 'dim', 'dig', 'did'),
      r('The first sound is /r/. The middle sound is /u/. The last sound is /g/. What word is it?', 'rug', 'run', 'rag', 'rig'),
      r('The first sound is /l/. The middle sound is /i/. The last sound is /p/. What word is it?', 'lip', 'lap', 'lid', 'lit'),
    ],
  ],
)

// --- Reading: shades of meaning and idioms ------------------------------------------------------

const shadesMeaning = rowSkill(
  'shadesMeaning',
  ['The most extreme word', 'The mildest word'],
  [
    [
      r('Which word is the hottest: warm, hot, cool, or boiling?', 'boiling', 'warm', 'hot', 'cool'),
      r('Which word is the biggest: small, big, huge, or medium?', 'huge', 'small', 'big', 'medium'),
      r('Which word is the smallest: tiny, small, big, or large?', 'tiny', 'small', 'big', 'large'),
      r('Which word is the fastest: walk, jog, run, or crawl?', 'run', 'walk', 'jog', 'crawl'),
      r('Which word is the coldest: cool, cold, freezing, or chilly?', 'freezing', 'cool', 'cold', 'chilly'),
      r('Which word is the darkest: dim, dark, pitch-black, or gray?', 'pitch-black', 'dim', 'dark', 'gray'),
      r('Which word is the loudest: whisper, talk, shout, or scream?', 'scream', 'whisper', 'talk', 'shout'),
      r('Which word is the slowest: jog, crawl, run, or walk?', 'crawl', 'jog', 'run', 'walk'),
      r('Which word is the most tired: sleepy, tired, exhausted, or awake?', 'exhausted', 'sleepy', 'tired', 'awake'),
      r('Which word is the biggest: big, enormous, large, or little?', 'enormous', 'big', 'large', 'little'),
      r('Which word is the brightest: glow, shine, dim, or blaze?', 'blaze', 'glow', 'shine', 'dim'),
    ],
    [
      r('Which word is the mildest: angry, furious, annoyed, or mad?', 'annoyed', 'angry', 'furious', 'mad'),
      r('Which word is the weakest way to hit something: pound, smash, tap, or bang?', 'tap', 'pound', 'smash', 'bang'),
      r('Which word is the mildest way to say big: huge, enormous, large, or gigantic?', 'large', 'huge', 'enormous', 'gigantic'),
      r('Which word is the mildest: cold, freezing, icy, or cool?', 'cool', 'cold', 'freezing', 'icy'),
      r('Which word is the mildest: warm, hot, scorching, or boiling?', 'warm', 'hot', 'scorching', 'boiling'),
      r('Which word is the mildest: hate, despise, loathe, or dislike?', 'dislike', 'hate', 'despise', 'loathe'),
      r('Which word is the mildest: love, adore, worship, or like?', 'like', 'love', 'adore', 'worship'),
      r('Which word is the mildest way to laugh: howl, roar, laugh, or chuckle?', 'chuckle', 'laugh', 'howl', 'roar'),
      r('Which word is the mildest: very sad, heartbroken, devastated, or slightly sad?', 'slightly sad', 'very sad', 'heartbroken', 'devastated'),
      r('Which word is the mildest: soaked, drenched, dripping, or a little wet?', 'a little wet', 'soaked', 'drenched', 'dripping'),
    ],
  ],
)

const idiomPick = rowSkill(
  'idiomPick',
  ['What an idiom means', 'What an idiom means, in other words'],
  [
    [
      r('What does "It’s raining cats and dogs" mean?', 'It is raining very hard.', 'Animals are falling from the sky.', 'It is sunny and warm.', 'The pets are all wet.'),
      r('What does "That test was a piece of cake" mean?', 'The test was very easy.', 'The test was made of cake.', 'The test was very long.', 'The test was lost.'),
      r('What does "I’m under the weather today" mean?', 'I feel sick.', 'I am standing under a tree.', 'I am very happy.', 'I am late for school.'),
      r('What does "Hold your horses!" mean?', 'Wait a moment.', 'Ride a horse fast.', 'Feed the horses.', 'Count your horses.'),
      r('What does "Let the cat out of the bag" mean?', 'Tell a secret.', 'Put a cat in a bag.', 'Buy a new bag.', 'Get a new pet cat.'),
      r('What does "Once in a blue moon" mean?', 'Very rarely.', 'Every single night.', 'When the moon is blue.', 'At lunchtime.'),
      r('What does "Break a leg!" mean?', 'Good luck!', 'Hurt yourself.', 'Run away.', 'Sit down.'),
      r('What does "It costs an arm and a leg" mean?', 'It is very expensive.', 'It has an arm and a leg.', 'It is free.', 'It is very small.'),
      r('What does "Hit the hay" mean?', 'Go to bed.', 'Hit a pile of hay.', 'Eat breakfast.', 'Go swimming.'),
      r('What does "Let’s call it a day" mean?', 'Stop working for today.', 'Name the day.', 'Plan a party.', 'Take a long trip.'),
      r('What does "Keep your chin up" mean?', 'Stay hopeful.', 'Put your chin on the table.', 'Keep your mouth shut.', 'Eat your dinner.'),
      r('What does "I’m all ears" mean?', 'I am listening closely.', 'My ears are very big.', 'I can hear nothing.', 'I am very tired.'),
    ],
    [
      r('Which means the same as "over the moon"?', 'very happy', 'very tired', 'very quiet', 'very angry'),
      r('Which means the same as "butterflies in my stomach"?', 'feeling nervous', 'feeling hungry', 'feeling sleepy', 'feeling cold'),
      r('Which means the same as "in a pickle"?', 'in trouble', 'eating pickles', 'very hungry', 'very happy'),
      r('Which means the same as "hit the books"?', 'to study hard', 'to throw books', 'to go shopping', 'to take a nap'),
      r('Which means the same as "pull someone’s leg"?', 'to tease someone as a joke', 'to help someone walk', 'to pull a chair', 'to ask for money'),
      r('Which means the same as "as right as rain"?', 'perfectly fine', 'very wet', 'very cold', 'very late'),
      r('Which means the same as "the apple of my eye"?', 'someone I love very much', 'a red fruit', 'a kind of tree', 'a sweet snack'),
      r('Which means the same as "beat around the bush"?', 'avoid the main point', 'hit a bush', 'find a bird', 'walk a dog'),
      r('Which means the same as "cold feet"?', 'feeling too scared to start', 'feeling freezing', 'wearing socks', 'running very fast'),
      r('Which means the same as "make a long story short"?', 'say it briefly', 'write a long book', 'tell a long joke', 'make a short movie'),
    ],
  ],
)

// --- Reading: compare, contrast, and text features -----------------------------------------------

const compareContrast = rowSkill(
  'compareContrast',
  ['How things are alike', 'How things are different'],
  [
    [
      r('Apples and pears are both fruits. Apples are red. Pears are green. How are apples and pears alike?', 'They are both fruits.', 'They are both green.', 'They are both vegetables.', 'They both grow underground.'),
      r('Frogs and toads both live near water. Frogs have smooth skin. Toads have bumpy skin. How are frogs and toads alike?', 'They both live near water.', 'They both have bumpy skin.', 'They both live in trees.', 'They both have smooth skin.'),
      r('Lions and tigers are both big cats. Lions live in Africa. Tigers have stripes. How are lions and tigers alike?', 'They are both big cats.', 'They both have stripes.', 'They both live in the sea.', 'They both live in Africa.'),
      r('Boats and planes both carry people. Boats float on water. Planes fly in the sky. How are boats and planes alike?', 'They both carry people.', 'They both fly in the sky.', 'They both float on water.', 'They are both made of gold.'),
      r('Snow and rain both come from clouds. Snow is white. Rain is wet. How are snow and rain alike?', 'They both come from clouds.', 'They are both white.', 'They are both hot.', 'They both grow on trees.'),
      r('Bees and wasps both have wings. Bees make honey. How are bees and wasps alike?', 'They both have wings.', 'They both make honey.', 'They both have fur.', 'They both swim.'),
      r('Oaks and maples are both trees. Oaks make acorns. Maples make seeds with wings. How are oaks and maples alike?', 'They are both trees.', 'They are both animals.', 'They both grow in the sea.', 'They both make milk.'),
      r('Rabbits and mice are both small. Rabbits have long ears. Mice have small ears. How are rabbits and mice alike?', 'They are both small.', 'They both have long ears.', 'They both live in the sea.', 'They both have wings.'),
      r('A pen and a pencil both help you write. A pen uses ink. How are a pen and a pencil alike?', 'They both help you write.', 'They both use ink.', 'They both cook food.', 'They are both made of wood.'),
      r('Milk and juice are both drinks. Milk is white. Juice can be orange. How are milk and juice alike?', 'They are both drinks.', 'They are both white.', 'They are both made of wood.', 'They both grow on trees.'),
    ],
    [
      r('Cats and dogs both have fur. Cats purr. Dogs bark. How are cats and dogs different?', 'Cats purr, and dogs bark.', 'They both have fur.', 'They both have four legs.', 'They both bark.'),
      r('Apples and pears are both fruits. Apples are red. Pears are green. How are apples and pears different?', 'Apples are red, and pears are green.', 'They are both fruits.', 'They are both red.', 'They are both big.'),
      r('Lions and tigers are both big cats. Tigers have stripes. Lions have manes. How are lions and tigers different?', 'Tigers have stripes, and lions have manes.', 'They are both big cats.', 'They both have stripes.', 'They both have manes.'),
      r('Boats float on water. Planes fly in the sky. Which is true about boats only?', 'They float on water.', 'They carry people.', 'They fly.', 'They go fast.'),
      r('Bees make honey. Wasps do not make honey. Which is true about bees only?', 'They make honey.', 'They have wings.', 'They are insects.', 'They fly.'),
      r('Oaks make acorns. Maples make seeds with wings. Which is true about oaks only?', 'They make acorns.', 'They are trees.', 'They have roots.', 'They are green.'),
      r('Rabbits have long ears. Mice have small ears. What is different about rabbits?', 'They have long ears.', 'They are small.', 'They have tails.', 'They eat plants.'),
      r('A pencil can be erased. A pen cannot be erased easily. Which is true about pencils only?', 'They can be erased.', 'They help you write.', 'They are used in school.', 'They are sold in packs.'),
      r('Milk is white. Juice can be orange. Which is true about juice only?', 'It can be orange.', 'It is a drink.', 'It is cold.', 'It comes in a cup.'),
      r('Frogs have smooth skin. Toads have bumpy skin. Which is true about toads only?', 'They have bumpy skin.', 'They live near water.', 'They have no tails.', 'They hop.'),
    ],
  ],
)

const textFeatures2 = rowSkill(
  'textFeatures2',
  ['Name the text feature', 'Choose the text feature to use'],
  [
    [
      r('A labeled picture shows the parts of a flower. Which text feature is this?', 'diagram', 'glossary', 'index', 'caption'),
      r('A list at the back shows topics and page numbers. Which text feature is this?', 'index', 'glossary', 'heading', 'table of contents'),
      r('Words printed in dark, thick letters to show they are important. Which text feature is this?', 'bold print', 'caption', 'heading', 'index'),
      r('A list at the front shows each chapter and its page. Which text feature is this?', 'table of contents', 'index', 'glossary', 'caption'),
      r('A list at the back explains hard words in ABC order. Which text feature is this?', 'glossary', 'index', 'caption', 'heading'),
      r('A title above part of a page tells what that part is about. Which text feature is this?', 'heading', 'caption', 'glossary', 'diagram'),
      r('A short sentence under a photo tells about the photo. Which text feature is this?', 'caption', 'heading', 'index', 'bold print'),
      r('A box that explains the symbols on a map. Which text feature is this?', 'legend', 'glossary', 'caption', 'heading'),
      r('Tiny numbers at the top or bottom of each page. Which text feature is this?', 'page number', 'heading', 'caption', 'title'),
      r('The first page of a book with the title and author names. Which text feature is this?', 'title page', 'index', 'glossary', 'caption'),
    ],
    [
      r('Which text feature would help you find the page about volcanoes?', 'index', 'glossary', 'caption', 'bold print'),
      r('Which text feature tells you what the word habitat means?', 'glossary', 'index', 'table of contents', 'diagram'),
      r('Which text feature shows you the chapter names and their pages?', 'table of contents', 'glossary', 'legend', 'caption'),
      r('Which text feature explains the symbols on a map?', 'legend', 'index', 'heading', 'diagram'),
      r('Which text feature would show you how the parts of a bike fit together?', 'diagram', 'glossary', 'index', 'bold print'),
      r('Which text feature tells you what a photo shows?', 'caption', 'table of contents', 'glossary', 'index'),
      r('Which text feature helps you spot the most important words on a page?', 'bold print', 'caption', 'index', 'glossary'),
      r('Which text feature gives the main point of a part of the page in big letters?', 'heading', 'caption', 'index', 'legend'),
      r('Which text feature shows important dates in order on a line?', 'timeline', 'glossary', 'index', 'caption'),
      r('Which text feature tells the book’s title and author on its first page?', 'title page', 'table of contents', 'glossary', 'diagram'),
    ],
  ],
)

// --- Reading: stories with a narrator --------------------------------------------------------------

const povEarly = rowSkill(
  'povEarly',
  ['A story told with I', 'A story told with he or she'],
  [
    [
      r('I have a dog named Max. I walk him every day. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I went to the zoo with my mom. I saw a big lion. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('My cat Pip likes to sleep in the sun. I like to watch him. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I baked cookies with my dad. They were warm and gooey. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I lost my blue mitten at the park. I looked under the bench. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('Today I learned to ride my bike. I fell once, but I got up. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I can run very fast. I won the race at school. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('My friend and I built a sandcastle. I put the flag on top. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I like to read books at night. My favorite is about dragons. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I helped my grandpa plant tomatoes. I gave them water every day. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I saw a rainbow after the rain. It had red and blue stripes. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
      r('I found a shiny rock by the creek. I put it in my pocket. Who is telling the story?', 'a character in the story', 'the reader', 'a bird in the tree', 'the sun'),
    ],
    [
      r('Ben has a dog named Max. He walks him every day. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Lily went to the zoo with her mom. She saw a big lion. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Sam likes to read at night. His favorite book is about dragons. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Mia and her dad baked cookies. They were warm and gooey. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Jay lost a blue mitten at the park. He looked under the bench. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Ava rode her bike for the first time. She fell once, but she got up. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Tom can run very fast. He won the race at school. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Priya and her friend built a sandcastle. She put a flag on top. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Leo helped his grandpa plant tomatoes. He gave them water every day. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Rosa saw a rainbow after the rain. It had red and blue stripes. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Kim found a shiny rock by the creek. She put it in her pocket. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
      r('Owen has a pet fish. He feeds it every morning. Who is telling the story?', 'someone outside the story', 'a character in the story', 'a bird in the tree', 'the sun'),
    ],
  ],
)

const authorPurposeEarly = rowSkill(
  'authorPurposeEarly',
  ['Why the writer wrote it'],
  [
    [
      r('Ants have six legs. Ants live in big groups. Why did the writer write this?', 'to teach you facts', 'to make you laugh', 'to convince you', 'to give directions'),
      r('Penguins cannot fly. They are very good swimmers. Why did the writer write this?', 'to teach you facts', 'to make you laugh', 'to convince you', 'to give directions'),
      r('What do you call a sleeping bull? A bulldozer! Why did the writer write this?', 'to make you laugh', 'to teach you facts', 'to convince you', 'to give directions'),
      r('Vote for Mia for class president! She will fix the playground. Why did the writer write this?', 'to convince you', 'to teach you facts', 'to make you laugh', 'to give directions'),
      r('Buy our lemonade! It is cold and sweet, and it costs only one dollar. Why did the writer write this?', 'to convince you', 'to teach you facts', 'to make you laugh', 'to give directions'),
      r('Go down the hall, turn left at the big tree, and walk to the blue door. Why did the writer write this?', 'to give directions', 'to teach you facts', 'to make you laugh', 'to convince you'),
      r('Volcanoes are mountains that can erupt with hot lava. Why did the writer write this?', 'to teach you facts', 'to make you laugh', 'to convince you', 'to give directions'),
      r('Recycle your cans and bottles. Our planet needs your help! Why did the writer write this?', 'to convince you', 'to teach you facts', 'to make you laugh', 'to give directions'),
      r('Why did the teacher wear sunglasses? Because her students were so bright! Why did the writer write this?', 'to make you laugh', 'to teach you facts', 'to convince you', 'to give directions'),
      r('Turn right at the gas station, then walk two blocks. The park is on the corner. Why did the writer write this?', 'to give directions', 'to teach you facts', 'to make you laugh', 'to convince you'),
      r('Pandas eat bamboo for most of the day. Why did the writer write this?', 'to teach you facts', 'to make you laugh', 'to convince you', 'to give directions'),
      r('What do you call a fish with no eyes? A fsh! Why did the writer write this?', 'to make you laugh', 'to teach you facts', 'to convince you', 'to give directions'),
    ],
  ],
)

// --- Writing: sentences ----------------------------------------------------------------------------

const sentenceCombine = rowSkill(
  'sentenceCombine',
  ['Combine the subjects', 'Combine the predicates', 'Combine the subjects and predicates'],
  [
    [
      r('Combine into one sentence: "Mia likes cats. Leo likes cats."', 'Mia and Leo like cats.', 'Mia likes Leo cats.', 'Mia and Leo likes cats.', 'Mia likes cats. Leo likes cats.'),
      r('Combine into one sentence: "Dogs can run. Cats can run."', 'Dogs and cats can run.', 'Dogs and cats can runs.', 'Dogs can run cats.', 'Dogs can run. Cats can run.'),
      r('Combine into one sentence: "Tom ate apples. Sue ate apples."', 'Tom and Sue ate apples.', 'Tom ate Sue apples.', 'Tom and Sue eats apples.', 'Tom ate apples. Sue ate apples.'),
      r('Combine into one sentence: "The bus is late. The train is late."', 'The bus and the train are late.', 'The bus is train late.', 'The bus and the train is late.', 'The bus is late. The train is late.'),
      r('Combine into one sentence: "Kim has a red ball. Jay has a red ball."', 'Kim and Jay have a red ball.', 'Kim has a Jay red ball.', 'Kim and Jay has a red ball.', 'Kim has a red ball. Jay has a red ball.'),
      r('Combine into one sentence: "Rain fell on the farm. Snow fell on the farm."', 'Rain and snow fell on the farm.', 'Rain fell snow on the farm.', 'Rain and snow falls on the farm.', 'Rain fell on the farm. Snow fell on the farm.'),
      r('Combine into one sentence: "The cat is black. The dog is black."', 'The cat and the dog are black.', 'The cat and the dog is black.', 'The cat is the dog black.', 'The cat is black. The dog is black.'),
      r('Combine into one sentence: "Lucy plays soccer. Max plays soccer."', 'Lucy and Max play soccer.', 'Lucy and Max plays soccer.', 'Lucy plays Max soccer.', 'Lucy plays soccer. Max plays soccer.'),
      r('Combine into one sentence: "Owls hunt at night. Foxes hunt at night."', 'Owls and foxes hunt at night.', 'Owls and foxes hunts at night.', 'Owls hunt foxes at night.', 'Owls hunt at night. Foxes hunt at night.'),
      r('Combine into one sentence: "Ben has a dog. Ana has a dog."', 'Ben and Ana have a dog.', 'Ben has Ana dog.', 'Ben and Ana has a dog.', 'Ben has a dog. Ana has a dog.'),
    ],
    [
      r('Combine into one sentence: "Jo sings. Jo dances."', 'Jo sings and dances.', 'Jo sing and dances.', 'Jo dances sings.', 'Jo sings. Jo dances.'),
      r('Combine into one sentence: "The boy ran home. The boy got a snack."', 'The boy ran home and got a snack.', 'The boy ran and got home a snack.', 'The boy ran home. Got a snack.', 'The boy ran home and got a dog.'),
      r('Combine into one sentence: "Ana will paint. Ana will draw."', 'Ana will paint and draw.', 'Ana will paints and draw.', 'Ana paint will and draw.', 'Ana will paint. Ana will draw.'),
      r('Combine into one sentence: "We swim in the pool. We play in the pool."', 'We swim and play in the pool.', 'We swim in and play the pool.', 'We swims and plays in the pool.', 'We swim. We play in the pool.'),
      r('Combine into one sentence: "Max hopped. Max skipped."', 'Max hopped and skipped.', 'Max hop and skipped.', 'Max hopped skipped.', 'Max hopped. And skipped.'),
      r('Combine into one sentence: "Lily reads books. Lily writes stories."', 'Lily reads books and writes stories.', 'Lily reads and writes books stories.', 'Lily reads stories and writes books.', 'Lily reads books. Lily writes stories.'),
      r('Combine into one sentence: "The puppy wags its tail. The puppy barks loudly."', 'The puppy wags its tail and barks loudly.', 'The puppy wags its tail barks loudly.', 'The puppy wag its tail and barks loudly.', 'The puppy wags its tail. Barks loudly.'),
      r('Combine into one sentence: "Sam climbed the tree. Sam fell down."', 'Sam climbed the tree and fell down.', 'Sam climbed the and fell down tree.', 'Sam climbed the tree. Fell down.', 'Sam fell the tree and climbed down.'),
      r('Combine into one sentence: "Kids play outside. Kids ride bikes."', 'Kids play outside and ride bikes.', 'Kids plays outside and ride bikes.', 'Kids play bikes and ride outside.', 'Kids play outside. Ride bikes.'),
      r('Combine into one sentence: "Dan cooks dinner. Dan cleans the kitchen."', 'Dan cooks dinner and cleans the kitchen.', 'Dan cook dinner and cleans the kitchen.', 'Dan cooks cleans dinner the kitchen.', 'Dan cooks dinner. Cleans the kitchen.'),
    ],
    [
      r('Combine into one sentence: "Lee sings. Kim sings. Lee dances. Kim dances."', 'Lee and Kim sing and dance.', 'Lee and Kim sings and dance.', 'Lee sings and Kim dances.', 'Lee and Kim sing. Lee and Kim dance.'),
      r('Combine into one sentence: "Jay runs. Ann runs. Jay jumps. Ann jumps."', 'Jay and Ann run and jump.', 'Jay and Ann runs and jump.', 'Jay runs and Ann jumps.', 'Jay and Ann run. Jay and Ann jump.'),
      r('Combine into one sentence: "Ted reads. Pam reads. Ted writes. Pam writes."', 'Ted and Pam read and write.', 'Ted and Pam reads and write.', 'Ted reads and Pam writes.', 'Ted and Pam read. Ted and Pam write.'),
      r('Combine into one sentence: "The cat naps. The dog naps. The cat eats. The dog eats."', 'The cat and the dog nap and eat.', 'The cat and the dog naps and eat.', 'The cat naps and the dog eats.', 'The cat and the dog nap. The cat and the dog eat.'),
      r('Combine into one sentence: "Max hops. Eli hops. Max skips. Eli skips."', 'Max and Eli hop and skip.', 'Max and Eli hops and skip.', 'Max hops and Eli skips.', 'Max and Eli hop. Max and Eli skip.'),
      r('Combine into one sentence: "Rosa paints. Ned paints. Rosa sings. Ned sings."', 'Rosa and Ned paint and sing.', 'Rosa and Ned paints and sing.', 'Rosa paints and Ned sings.', 'Rosa and Ned paint. Rosa and Ned sing.'),
      r('Combine into one sentence: "Ben swims. Dan swims. Ben dives. Dan dives."', 'Ben and Dan swim and dive.', 'Ben and Dan swims and dive.', 'Ben swims and Dan dives.', 'Ben and Dan swim. Ben and Dan dive.'),
      r('Combine into one sentence: "Ava cooks. Ivy cooks. Ava cleans. Ivy cleans."', 'Ava and Ivy cook and clean.', 'Ava and Ivy cooks and clean.', 'Ava cooks and Ivy cleans.', 'Ava and Ivy cook. Ava and Ivy clean.'),
      r('Combine into one sentence: "Ruth knits. Bo knits. Ruth reads. Bo reads."', 'Ruth and Bo knit and read.', 'Ruth and Bo knits and read.', 'Ruth knits and Bo reads.', 'Ruth and Bo knit. Ruth and Bo read.'),
      r('Combine into one sentence: "Gus hums. Lea hums. Gus whistles. Lea whistles."', 'Gus and Lea hum and whistle.', 'Gus and Lea hums and whistle.', 'Gus hums and Lea whistles.', 'Gus and Lea hum. Gus and Lea whistle.'),
    ],
  ],
)

const orderSentences = rowSkill(
  'orderSentences',
  ['Put 3 sentences in order', 'Put 4 sentences in order'],
  [
    [
      r('Put these sentences in order. A. Then, we ate lunch. B. First, we walked to the park. C. Last, we played on the swings. Which order makes sense?', 'B, A, C', 'A, B, C', 'C, A, B', 'B, C, A'),
      r('Put these sentences in order. A. Next, she put on her shoes. B. First, Lily woke up. C. Last, she went out to play. Which order makes sense?', 'B, A, C', 'A, B, C', 'C, B, A', 'A, C, B'),
      r('Put these sentences in order. A. Finally, the cake was ready to eat. B. First, Mom mixed the batter. C. Then, she baked the cake. Which order makes sense?', 'B, C, A', 'A, C, B', 'C, B, A', 'B, A, C'),
      r('Put these sentences in order. A. Then, he watered it. B. Last, a little plant grew. C. First, Sam put a seed in the dirt. Which order makes sense?', 'C, A, B', 'A, B, C', 'B, C, A', 'C, B, A'),
      r('Put these sentences in order. A. Last, we got home. B. First, we got in the car. C. Then, we drove to the store. Which order makes sense?', 'B, C, A', 'A, B, C', 'C, B, A', 'A, C, B'),
      r('Put these sentences in order. A. Then, he ate breakfast. B. First, he woke up. C. Last, he brushed his teeth. Which order makes sense?', 'B, A, C', 'A, B, C', 'C, A, B', 'B, C, A'),
      r('Put these sentences in order. A. Last, the puppy fell asleep. B. First, the puppy ate dinner. C. Then, the puppy played with a ball. Which order makes sense?', 'B, C, A', 'C, B, A', 'A, C, B', 'B, A, C'),
      r('Put these sentences in order. A. Finally, we ate the cookies. B. First, we mixed the flour and sugar. C. Next, we rolled the dough into balls. Which order makes sense?', 'B, C, A', 'A, B, C', 'C, A, B', 'C, B, A'),
      r('Put these sentences in order. A. Next, she dried the dishes. B. First, she washed the dishes. C. Last, she put them away. Which order makes sense?', 'B, A, C', 'A, C, B', 'C, A, B', 'A, B, C'),
      r('Put these sentences in order. A. Then, I closed the book. B. First, I opened the book. C. Last, I turned off the light. Which order makes sense?', 'B, A, C', 'A, B, C', 'C, A, B', 'B, C, A'),
      r('Put these sentences in order. A. Last, the seed grew into a tree. B. First, Ana planted a seed. C. Next, she watered it every day. Which order makes sense?', 'B, C, A', 'A, C, B', 'C, B, A', 'B, A, C'),
      r('Put these sentences in order. A. Last, we took the picture. B. First, we set up the tent. C. Then, we ate dinner. Which order makes sense?', 'B, C, A', 'A, B, C', 'C, A, B', 'A, C, B'),
    ],
    [
      r('Put these sentences in order. A. Finally, we ate the muffins. B. First, we mixed the batter. C. Next, we poured it into cups. D. Then, we baked them in the oven. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'B, D, C, A', 'C, B, D, A'),
      r('Put these sentences in order. A. Finally, a flower bloomed. B. First, Ana dug a hole. C. Next, she put the seed in. D. Then, she watered the seed. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'C, B, D, A', 'B, D, C, A'),
      r('Put these sentences in order. A. Last, he brushed his teeth. B. First, he woke up. C. Next, he got dressed. D. Then, he ate breakfast. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'B, D, C, A', 'D, B, C, A'),
      r('Put these sentences in order. A. Last, she let it dry. B. First, she got a brush. C. Next, she mixed the paint. D. Then, she painted a picture. Which order makes sense?', 'B, C, D, A', 'A, C, B, D', 'B, D, C, A', 'C, B, D, A'),
      r('Put these sentences in order. A. Finally, we ate our sandwich. B. First, we got two slices of bread. C. Next, we spread peanut butter on one slice. D. Then, we put the slices together. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'C, B, D, A', 'B, D, C, A'),
      r('Put these sentences in order. A. Last, it fell asleep. B. First, the puppy ate its food. C. Next, it played with a ball. D. Then, it took a bath. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'B, D, C, A', 'D, B, C, A'),
      r('Put these sentences in order. A. Finally, we cheered for the winner. B. First, we chose teams. C. Next, we started the game. D. Then, we scored many goals. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'C, B, D, A', 'B, D, C, A'),
      r('Put these sentences in order. A. Last, the seed grew into a tree. B. First, Ana planted a seed. C. Next, she watered it every day. D. Then, the sprout came up. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'B, D, C, A', 'C, B, D, A'),
      r('Put these sentences in order. A. Finally, the bread cooled. B. First, Dad mixed the dough. C. Next, he let the dough rise. D. Then, he baked the bread. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'D, B, C, A', 'B, D, C, A'),
      r('Put these sentences in order. A. Finally, she rode to school. B. First, Maya pumped up the tires. C. Next, she put on her helmet. D. Then, she got on the bike. Which order makes sense?', 'B, C, D, A', 'A, B, C, D', 'C, B, D, A', 'B, D, C, A'),
    ],
  ],
)

// --- Reading: main idea and inference (K) ---------------------------------------------------------

const mainTopicEarly = rowSkill(
  'mainTopicEarly',
  ['Topic of a short passage', 'Main idea of a passage'],
  [
    [
      r('Bees make honey. Bees buzz around flowers. What is this passage mostly about?', 'bees', 'cars', 'snow', 'pizza'),
      r('Dogs can run fast. Dogs can fetch a ball. What is this passage mostly about?', 'dogs', 'fish', 'trains', 'rain'),
      r('Snow is cold and white. Kids like to make snowmen. What is this passage mostly about?', 'snow', 'summer', 'bread', 'boats'),
      r('A tree has roots. A tree has leaves. A tree has a trunk. What is this passage mostly about?', 'trees', 'the sea', 'shoes', 'pencils'),
      r('Fish live in water. Fish swim with fins. What is this passage mostly about?', 'fish', 'birds', 'cakes', 'hats'),
      r('The sun is very hot. The sun gives us light. What is this passage mostly about?', 'the sun', 'shoes', 'sandwiches', 'trucks'),
      r('We wear coats when it is cold. Coats keep us warm. What is this passage mostly about?', 'coats', 'lunch', 'the beach', 'bikes'),
      r('Apples grow on trees. Apples can be red or green. What is this passage mostly about?', 'apples', 'buses', 'rocks', 'doors'),
      r('Trucks carry big loads. Trucks have many wheels. What is this passage mostly about?', 'trucks', 'flowers', 'socks', 'candles'),
      r('Ants are very small. Ants live in big groups. What is this passage mostly about?', 'ants', 'bread', 'hats', 'lamps'),
      r('Rain falls from clouds. Rain helps plants grow. What is this passage mostly about?', 'rain', 'buttons', 'bananas', 'beds'),
      r('Cows give us milk. Cows eat grass on farms. What is this passage mostly about?', 'cows', 'trains', 'hats', 'pizza'),
    ],
    [
      r('Pets need food and water. Pets need a warm bed. Pets need love. What is the main idea?', 'Pets need care', 'Cars need gas', 'Snow is cold', 'Fish swim fast'),
      r('Plants need sunlight to grow. Plants need water. Plants need good soil. What is the main idea?', 'Plants need certain things to grow', 'Birds sing in trees', 'Trucks are big', 'Pizza is good'),
      r('Ice cream comes in many flavors. Vanilla and chocolate are popular. Some people like mint. What is the main idea?', 'Ice cream comes in many flavors', 'Trains run on tracks', 'Birds build nests', 'Shoes keep feet warm'),
      r('Trees give us shade. Trees give us fruit. Trees give us wood. What is the main idea?', 'Trees help people', 'Fish live in water', 'Cars have wheels', 'Rain is wet'),
      r('Firefighters help people. They put out fires. They rescue people from danger. What is the main idea?', 'Firefighters help people', 'Trucks are red', 'Bread is baked', 'Dogs run fast'),
      r('Bees make honey. Bees help flowers grow. Bees live in busy hives. What is the main idea?', 'Bees do important work', 'Cats like milk', 'Winter is cold', 'Kites fly high'),
      r('Winter is a cold season. Many people wear coats. Snow may fall. What is the main idea?', 'Winter is cold', 'Bananas are yellow', 'Cars need gas', 'Books have pages'),
      r('Rabbits have long ears. Rabbits hop. Rabbits eat carrots and grass. What is the main idea?', 'All about rabbits', 'All about rockets', 'All about boats', 'All about pizza'),
      r('The library has many books. You can borrow books for free. Kids can read there. What is the main idea?', 'All about the library', 'All about the zoo', 'All about the moon', 'All about the pool'),
      r('Dogs can sit. Dogs can roll over. Dogs can fetch balls. What is the main idea?', 'Tricks dogs can do', 'Clouds that rain', 'Shoes for kids', 'Ships at sea'),
      r('Lemons are yellow and sour. Lemons grow on trees. Lemonade is made from lemons. What is the main idea?', 'All about lemons', 'All about snow', 'All about bikes', 'All about ponds'),
      r('Parents take care of kids. They cook food. They read books at night. What is the main idea?', 'Parents take care of kids', 'Cars take people far', 'Frogs can jump', 'Stars shine at night'),
    ],
  ],
)

const inferEarly = rowSkill(
  'inferEarly',
  ['Feelings in pictures and stories', 'What am I? riddles', 'What will happen next?'],
  [
    [
      p('😢', 'Which feeling matches this face?', 'sad', 'happy', 'sleepy', 'angry'),
      p('😴', 'Which feeling matches this face?', 'sleepy', 'happy', 'angry', 'scared'),
      p('😠', 'Which feeling matches this face?', 'angry', 'happy', 'sleepy', 'sad'),
      p('😨', 'Which feeling matches this face?', 'scared', 'happy', 'sleepy', 'angry'),
      p('😲', 'Which feeling matches this face?', 'surprised', 'sad', 'sleepy', 'angry'),
      p('🤒', 'Which feeling matches this face?', 'sick', 'happy', 'angry', 'sleepy'),
      p('😊', 'Which feeling matches this face?', 'happy', 'sad', 'angry', 'sleepy'),
      r('Sam dropped his ice cream on the sidewalk. How does Sam feel?', 'sad', 'happy', 'sleepy', 'proud'),
      r('Max woke up early and yawned all morning. How does Max feel?', 'sleepy', 'angry', 'scared', 'proud'),
      r('Tim fell down and cut his knee. He is crying. How does Tim feel?', 'hurt', 'sleepy', 'proud', 'silly'),
      r('Ana got a card from her best friend and smiled all day. How does Ana feel?', 'happy', 'sad', 'angry', 'sleepy'),
    ],
    [
      r('I have a long neck and brown spots. What am I?', 'giraffe', 'zebra', 'horse', 'lion'),
      r('I have a long trunk and big ears. What am I?', 'elephant', 'mouse', 'bear', 'duck'),
      r('I say moo, and I give milk. What am I?', 'cow', 'pig', 'sheep', 'hen'),
      r('I say quack, and I can swim. What am I?', 'duck', 'hen', 'cat', 'cow'),
      r('I hang on a wall. I have hands and a face. What am I?', 'clock', 'rug', 'bed', 'sock'),
      r('I am a big cat with orange fur and black stripes. What am I?', 'tiger', 'lion', 'zebra', 'bear'),
      r('I live in water. I have fins and gills. What am I?', 'fish', 'bird', 'horse', 'bear'),
      r('I can hop, and I love carrots. What am I?', 'rabbit', 'bear', 'fish', 'cow'),
      r('I have feathers, and I say hoot. What am I?', 'owl', 'duck', 'hen', 'cow'),
      r('I buzz, and I make honey. What am I?', 'bee', 'ant', 'cat', 'pig'),
      r('I wag my tail, and I bark at the mail carrier. What am I?', 'dog', 'cat', 'cow', 'fox'),
    ],
    [
      r('Tom plants a bean seed in soil and waters it every day. What will happen next?', 'A plant will start to grow', 'The soil will turn to ice', 'The seed will shrink to nothing', 'A big tree will appear at once'),
      r('The water is boiling on the stove. What will happen next?', 'Steam will rise from the pot', 'The water will turn to ice', 'The pot will get cold', 'The water will turn to sand'),
      r('Eggs are in a nest, and a hen sits on them. What will happen next?', 'Baby chicks will hatch', 'The eggs will freeze', 'The eggs will melt away', 'The nest will float down a river'),
      r('A ball rolls down a hill. What will happen next?', 'The ball will keep rolling', 'The ball will roll back up the hill', 'The ball will get smaller', 'The ball will stop at once'),
      r('Mom puts a cake in the oven and sets the timer. What will happen next?', 'The cake will bake', 'The cake will freeze', 'The cake will melt into water', 'The cake will get colder'),
      r('A baby bird opens its mouth wide and chirps. What will the mother bird do next?', 'Bring food to the baby bird', 'Fly far away from the nest', 'Take a nap on the ground', 'Dig a hole in the dirt'),
      r('The snowman is out in the sun all day. What will happen next?', 'The snowman will start to melt', 'The snowman will get bigger', 'The snowman will turn to sand', 'The snowman will freeze harder'),
      r('Jen blows up a balloon and pokes it with a pin. What will happen next?', 'The balloon will pop', 'The balloon will get bigger', 'The balloon will turn to water', 'The balloon will stay just the same'),
      r('Ben jumps into a big puddle in his shoes. What will happen next?', 'His shoes will get wet', 'His shoes will stay dry', 'His shoes will get warm', 'His shoes will get smaller'),
      r('Lily turns on the faucet and holds a cup under it. What will happen next?', 'Water will fill the cup', 'The cup will stay empty', 'The cup will fill with sand', 'The cup will get hot'),
    ],
  ],
)

/** The skills in each subject. */
export const READING_FE: Skill[] = [
  shortVowelPics,
  digraphPick,
  vowelFind,
  blendsG2,
  shortVowelFix,
  syllableWords,
  mainTopicEarly,
  inferEarly,
  decodableG2,
  storyTexts,
  factTexts,
  shadesMeaning,
  idiomPick,
  compareContrast,
  textFeatures2,
  povEarly,
  authorPurposeEarly,
]

export const WRITING_FE: Skill[] = [sentenceCombine, orderSentences]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })
const rep = (n: number, ref: IxlRef): IxlRef[] => Array.from({ length: n }, () => ref)

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". Grades never go down by level. */
export const LANGUAGE_FE_IXL: Record<string, IxlRef[]> = {
  'reading.shortVowelPics': [e(0, 'Short a'), e(0, 'Short e'), e(0, 'Short i'), e(0, 'Short o'), e(0, 'Short u')],
  'reading.digraphPick': rep(3, e(0, 'Consonant digraphs')),
  'reading.vowelFind': [e(1, 'Consonants and vowels'), e(1, 'Consonants and vowels')],
  'reading.mainTopicEarly': [e(0, 'Main idea'), e(0, 'Main idea')],
  'reading.inferEarly': rep(3, e(0, 'Inference and theme')),
  'reading.blendsG2': rep(3, e(2, 'Consonant digraphs and blends')),
  'reading.shortVowelFix': rep(3, e(2, 'Short vowels')),
  'reading.syllableWords': [e(2, 'Advanced syllables'), e(2, 'Advanced syllables')],
  'reading.decodableG2': rep(3, e(2, 'Decodable texts')),
  'reading.storyTexts': [e(0, 'Read-alone literary texts'), e(1, 'Read-along literary texts'), e(2, 'Read-along literary texts')],
  'reading.factTexts': [e(0, 'Read-alone informational texts'), e(1, 'Read-along informational texts'), e(2, 'Read-along informational texts')],
  'reading.shadesMeaning': rep(2, e(1, 'Shades of meaning')),
  'reading.idiomPick': rep(2, e(2, 'Idioms')),
  'reading.compareContrast': rep(2, e(2, 'Compare and contrast')),
  'reading.textFeatures2': rep(2, e(2, 'Text features')),
  'reading.povEarly': rep(2, e(0, 'Point of view')),
  'reading.authorPurposeEarly': [e(0, "Author's purpose")],
  'writing.sentenceCombine': rep(3, e(2, 'Sentence variety')),
  'writing.orderSentences': rep(2, e(2, 'Organizing writing')),
}
