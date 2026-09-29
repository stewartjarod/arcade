import type { ItemSpec, Subject } from '../core/types'
import { editDistance, pick, upToLevel, wrongFrom } from './util'
import { PICTURE_WORDS, SIGHT_WORDS } from './words'

/**
 * Writing: spelling words they hear, spotting the right spelling, and capitals & punctuation.
 */

// Words that sound like other words get a sentence, so they know which one to spell.
const IN_A_SENTENCE: Record<string, string> = {
  to: 'I go to school.', two: 'I have two hands.', too: 'Can I come too?', their: 'They love their dog.',
  there: 'Put it over there.', one: 'I have one nose.', know: 'I know the answer.', no: 'No, thank you.',
  right: 'Turn right.', write: 'I can write my name.', buy: 'We buy apples.', by: 'Sit by me.',
  read: 'I like to read.', for: 'This is for you.', four: 'I am four feet tall.', its: 'The dog wags its tail.',
  red: 'The apple is red.', ate: 'I ate lunch.', eat: 'We eat dinner.', new: 'I have new shoes.',
}

const say = (word: string) => (IN_A_SENTENCE[word] ? `${word}. ${IN_A_SENTENCE[word]} ${word}.` : word)

// Level 1–3 spell picture words (cat → frog → cake); 4–5 spell sight words; 5 adds star/house words.
function spellWord(level: number): { word: string; emoji?: string } {
  if (level <= 3) {
    const w = upToLevel(PICTURE_WORDS.filter((x) => x.level <= 3), level)
    return { word: w.word, emoji: w.emoji }
  }
  if (level === 5 && Math.random() < 0.4) {
    const w = pick(PICTURE_WORDS.filter((x) => x.level === 4))
    return { word: w.word, emoji: w.emoji }
  }
  return { word: pick(SIGHT_WORDS[level - 2]!.filter((w) => w !== 'I')) }
}

const emojiFor = (word: string) => PICTURE_WORDS.find((w) => w.word === word)?.emoji

function spellItem(word: string): ItemSpec {
  return {
    key: word,
    prompt: { text: 'Spell the word you hear', say: say(word), emoji: emojiFor(word) },
    answer: word,
    wrong: (n) => misspell(word, n),
    // One letter off on a longer word earns half credit — close counts for something.
    check: (r) => {
      const a = r.trim().toLowerCase()
      if (a === word.toLowerCase()) return 1
      return word.length >= 4 && editDistance(a, word.toLowerCase()) === 1 ? 0.5 : 0
    },
  }
}

function pickSpellingItem(word: string): ItemSpec {
  return {
    key: word,
    prompt: { text: 'Which spells the word you hear?', say: say(word), emoji: emojiFor(word) },
    answer: word,
    wrong: (n) => misspell(word, n),
  }
}

// Common kid spellings of tricky words.
const TRICKY: Record<string, string[]> = {
  said: ['sed', 'sayd', 'sade'], they: ['thay', 'thei', 'tha'], because: ['becuz', 'becaus', 'becose'],
  would: ['wud', 'woud', 'wood'], their: ['thier', 'ther', 'thear'], does: ['dus', 'doez', 'duz'],
  many: ['meny', 'mani', 'menny'], was: ['wuz', 'waz', 'wus'], what: ['wut', 'wat', 'whut'],
  of: ['uv', 'ov', 'off'], come: ['cum', 'kom', 'comm'], some: ['sum', 'som', 'somm'], one: ['won', 'wun', 'on'],
  have: ['hav', 'haf', 'haev'], were: ['wer', 'wur', 'whir'], could: ['cud', 'coud', 'culd'],
  again: ['agen', 'agin', 'ugen'], every: ['evry', 'evrey', 'avery'], once: ['wunce', 'onse', 'wuns'],
  very: ['vary', 'verry', 'vere'], which: ['wich', 'witch', 'whitch'], your: ['yor', 'yore', 'yur'],
  been: ['bin', 'ben', 'bean'], always: ['allways', 'alwayz', 'olways'], around: ['arownd', 'uround', 'arond'],
  before: ['befor', 'befour', 'bifore'], "don't": ['dont', "do'nt", 'dount'], write: ['rite', 'wright', 'writ'],
  you: ['yu', 'yoo', 'u'], the: ['teh', 'thu', 'da'], who: ['hoo', 'woh', 'whoo'], where: ['wear', 'were', 'whear'],
}

// Rules for plausible misspellings: drop a silent e, swap vowel teams, soften digraphs, (un)double letters.
const RULES: [RegExp, string][] = [
  [/([aeiou][^aeiou])e$/, '$1'], [/ai/, 'a'], [/ai/, 'ay'], [/oa/, 'o'], [/oa/, 'ow'], [/ee/, 'ea'], [/ee/, 'e'],
  [/ea/, 'ee'], [/oo/, 'u'], [/ou/, 'ow'], [/ow/, 'ou'], [/ck/, 'k'], [/ck/, 'c'], [/^sh/, 's'], [/^ch/, 'sh'],
  [/^th/, 't'], [/^wh/, 'w'], [/^c/, 'k'], [/^k/, 'c'], [/ll$/, 'l'], [/ss$/, 's'], [/y$/, 'ey'], [/ar/, 'or'],
  [/or/, 'er'], [/ir/, 'ur'], [/i([^aeiou])e$/, 'y$1'], [/([^aeiou])$/, '$1$1'], [/a([^aeiou]+)$/, 'e$1'],
  [/i([^aeiou]+)$/, 'e$1'], [/o([^aeiou]+)$/, 'u$1'], [/u([^aeiou]+)$/, 'o$1'], [/e([^aeiou]+)$/, 'i$1'],
]

export function misspell(word: string, count: number): string[] {
  // Best first: known kid spellings, then rule-based ones, then fallbacks.
  const likely = new Set<string>(TRICKY[word] ?? [])
  for (const [re, to] of RULES) {
    const m = word.replace(re, to)
    if (m !== word && m.length > 0) likely.add(m)
  }
  // Fallbacks: swap two neighboring letters ("thier"), drop a letter, double a letter.
  const fallback = new Set<string>()
  for (let i = 0; i < word.length - 1; i++) fallback.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2))
  for (let i = 1; i < word.length; i++) {
    if (word.length > 2) fallback.add(word.slice(0, i) + word.slice(i + 1))
    fallback.add(word.slice(0, i) + word[i] + word.slice(i))
  }
  return wrongFrom(word, count, [...fallback], [...likely])
}

// --- Capitals and punctuation: which one is written correctly? ---

type Variant = { right: string; wrongs: string[] }
const lowerFirst = (s: string) => s[0]!.toLowerCase() + s.slice(1)
const NAMES = ['Sam', 'Mia', 'Ben', 'Ava', 'Leo', 'Zoe']
const L1 = ['The dog ran fast.', 'We like to play.', 'My cat is soft.', 'The sun is hot.', 'I can see a bird.', 'We went to the park.', 'The frog can jump.', 'Mom made a cake.']
const L2 = ['{n} and I like cake.', 'Can {n} and I play?', 'I went to see {n}.', '{n} and I ride bikes.', 'I sat next to {n}.']
const L3 = ['Where is my hat?', 'Do you like pizza?', 'What is your name?', 'Can we go outside?', 'Who ate my cookie?', 'Is it time for lunch?']
const L4: [string, string][] = [
  ['We go to school on Monday.', 'Monday'], ['My birthday is in July.', 'July'], ['We went to Texas.', 'Texas'],
  ['Grandma lives in Utah.', 'Utah'], ['The game is on Friday.', 'Friday'], ['It snows in December.', 'December'],
  ['We saw the Pacific Ocean.', 'Pacific Ocean'], ['School starts in August.', 'August'],
]

function capsVariant(level: number): Variant {
  if (level === 1) {
    const s = pick(L1)
    return { right: s, wrongs: [lowerFirst(s), s.slice(0, -1), lowerFirst(s).slice(0, -1)] }
  }
  if (level === 2) {
    const n = pick(NAMES)
    const s = pick(L2).replace('{n}', n)
    return { right: s, wrongs: [s.replace(n, n.toLowerCase()), s.replace(/\bI\b/, 'i'), s.replace(n, n.toLowerCase()).replace(/\bI\b/, 'i')] }
  }
  if (level === 3) {
    const s = pick(L3)
    return { right: s, wrongs: [s.replace('?', '.'), lowerFirst(s), s.slice(0, -1)] }
  }
  const [s, proper] = pick(L4)
  return { right: s, wrongs: [s.replace(proper, proper.toLowerCase()), lowerFirst(s), s.slice(0, -1)] }
}

function capsItem(level: number): ItemSpec {
  const v = capsVariant(level)
  return {
    key: v.right,
    prompt: { text: 'Which one is written correctly?' },
    answer: v.right,
    wrong: (n) => wrongFrom(v.right, n, v.wrongs),
    // Capitals and periods are the whole point here, so compare exactly.
    check: (r) => (r.trim() === v.right ? 1 : 0),
  }
}

const SPELL_LABELS = ['Spelling short words', 'Spelling blends', 'Spelling long vowels', 'Spelling first-grade words', 'Spelling second-grade words']

export const writing: Subject = {
  id: 'writing',
  name: 'Writing',
  emoji: '✏️',
  skills: [
    {
      id: 'spell',
      label: (L) => SPELL_LABELS[L - 1]!,
      maxLevel: 5,
      formats: ['letters'],
      listen: true,
      generate: (L) => spellItem(spellWord(L).word),
      fromKey: (key) => spellItem(key),
    },
    {
      id: 'pick',
      label: (L) => SPELL_LABELS[L - 1]!.replace('Spelling', 'Spotting'),
      maxLevel: 5,
      formats: ['choice'],
      listen: true,
      generate: (L) => pickSpellingItem(spellWord(L).word),
      fromKey: (key) => pickSpellingItem(key),
    },
    {
      id: 'caps',
      label: (L) => ['Capitals and periods', 'Capital names and "I"', 'Question marks', 'Days, months and places'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      generate: capsItem,
    },
  ],
}
