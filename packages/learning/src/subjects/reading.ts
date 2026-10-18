import type { ItemSpec, Subject, Teach } from '../core/types'
import { rhyme, syllables, wordMeaning } from './language'
import { READING_EARLY } from './languageEarly'
import { READING_E2 } from './languageEarly2'
import { READING_FE } from './languageFinalEarly'
import { READING_PH } from './languagePhonemes'
import { READING_FU } from './languageFinalUpper'
import { READING_G5 } from './languageGrade5'
import { READING_U2 } from './languageUpper2'
import { READING_MORE } from './languageMore'
import { READING_UPPER } from './languageUpper'
import { pick, rand, shuffle, upToLevel, wrongFrom } from './util'
import { PICTURE_WORDS, SIGHT_WORDS } from './words'

/**
 * Reading: first sounds, reading picture words, sight words, and understanding short stories.
 */

// --- First sounds: "🐶 starts with...?" ---

const DIGRAPHS = ['sh', 'ch', 'th', 'wh']
const firstSound = (w: string) => DIGRAPHS.find((d) => w.startsWith(d)) ?? w[0]!
// Letters that can make the same first sound — never offer both.
const SAME_SOUND: Record<string, string[]> = { c: ['k'], k: ['c'] }
// Letters kids mix up, offered together at level 2.
const LOOKALIKES: Record<string, string[]> = {
  b: ['d', 'p'], d: ['b', 'p'], p: ['b', 'q'], m: ['n', 'w'], n: ['m', 'h'],
  f: ['v', 't'], v: ['f', 'w'], s: ['z', 'c'], t: ['f', 'l'], h: ['n', 'k'],
  c: ['s', 'g'], g: ['j', 'q'], r: ['l', 'w'], l: ['r', 'i'], w: ['v', 'm'],
  e: ['a', 'i'], k: ['g', 'h'], j: ['g', 'y'], y: ['j', 'v'],
}
const CONSONANTS = 'b c d f g h j k l m n p r s t v w y z'.split(' ')

function firstSoundItem(level: number): ItemSpec {
  const pool = PICTURE_WORDS.filter((w) =>
    level >= 3 ? DIGRAPHS.includes(firstSound(w.word)) || Math.random() < 0.3 : !DIGRAPHS.includes(firstSound(w.word)),
  )
  return firstSoundSpec(level, pick(pool.length ? pool : PICTURE_WORDS).word)
}

/** One first-sound question for a picture word. Its key is "first:<word>", so a missed one can be rebuilt. */
function firstSoundSpec(level: number, word: string): ItemSpec {
  const w = PICTURE_WORDS.find((x) => x.word === word)!
  const sound = firstSound(w.word)
  const avoid = SAME_SOUND[sound] ?? []
  const letters = (DIGRAPHS.includes(sound) ? DIGRAPHS : CONSONANTS).filter((l) => !avoid.includes(l))
  const near = level >= 2 ? (LOOKALIKES[sound] ?? []).filter((l) => !avoid.includes(l)) : []
  return {
    key: `first:${w.word}`,
    prompt: { text: 'What sound does it start with?', emoji: w.emoji, say: w.word },
    answer: sound,
    wrong: (n) => wrongFrom(sound, n, letters, near),
  }
}

function firstSoundFromKey(key: string, level: number): ItemSpec | null {
  const word = key.startsWith('first:') ? key.slice(6) : ''
  if (!PICTURE_WORDS.some((w) => w.word === word)) return null
  // Digraph words only come up from level 3 on, so don't rebuild them lower down.
  if (level < 3 && DIGRAPHS.includes(firstSound(word))) return null
  return firstSoundSpec(level, word)
}

// --- Picture words: "🐸 → frog / from / flag" ---

function pictureWordItem(level: number): ItemSpec {
  const w = upToLevel(PICTURE_WORDS, level)
  return pictureWordSpec(w.word)!
}

function pictureWordSpec(word: string): ItemSpec | null {
  const w = PICTURE_WORDS.find((x) => x.word === word)
  if (!w) return null
  return {
    key: w.word,
    prompt: { text: 'Which word is this?', emoji: w.emoji },
    answer: w.word,
    wrong: (n) => wrongFrom(w.word, n, PICTURE_WORDS.filter((x) => x.level === w.level).map((x) => x.word), w.near),
  }
}

// --- Sight words: hear it, find it ---

function sightItem(level: number, word = pick(SIGHT_WORDS[level - 1]!)): ItemSpec {
  const list = SIGHT_WORDS[level - 1]!
  // Look-alikes: same first letter or same length.
  const near = list.filter((x) => x !== word && (x[0] === word[0] || x.length === word.length))
  return {
    key: word,
    prompt: { text: 'Tap the word you hear', say: word },
    answer: word,
    listen: true,
    seconds: 5,
    wrong: (n) => wrongFrom(word, n, list, near),
  }
}

// --- Stories: read, then answer ---

const COLORS = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown']
const ANIMALS = ['cat', 'dog', 'pig', 'frog', 'duck', 'fish', 'bird', 'bug', 'fox', 'hen']
const THINGS = ['ball', 'kite', 'hat', 'box', 'cup', 'bike', 'book', 'drum']
const LIKES = ['run', 'jump', 'swim', 'read', 'sing', 'dance', 'paint', 'skip']
const PLACES = ['park', 'zoo', 'farm', 'pond', 'beach', 'store', 'lake']
const KIDS = [['Mia', 'She'], ['Ava', 'She'], ['Zoe', 'She'], ['Lily', 'She'], ['Sam', 'He'], ['Ben', 'He'], ['Leo', 'He'], ['Max', 'He']] as const
// Cause → effect pairs for "why" questions.
// [feeling, what they did, the same thing for a question ("Why did Mia ___?")]
const BECAUSE = [
  ['silly', 'laughed', 'laugh'], ['sad', 'gave it a hug', 'give it a hug'], ['hungry', 'gave it some food', 'give it some food'],
  ['little', 'picked it up', 'pick it up'], ['fast', 'ran after it', 'run after it'], ['sleepy', 'let it take a nap', 'let it take a nap'],
  ['wet', 'got a towel', 'get a towel'], ['lost', 'helped it get home', 'help it get home'],
] as const
const ACTIONS = ['ate breakfast', 'put on a hat', 'went outside', 'read a book', 'fed the cat', 'rode a bike', 'made a snack', 'played a game', 'took a bath', 'drew a picture']

type Story = { text: string; question: string; answer: string; pool: readonly string[] }

// How many questions each level can ask about one story.
const STORY_QUESTIONS = [2, 3, 3, 1]

/**
 * Build a story from its picks: question number `q`, then the words that story uses.
 * A story's key holds exactly these picks, so fromKey can rebuild the same story.
 */
function buildStory(level: number, q: number, p: string[]): Story | null {
  if (q < 0 || q >= STORY_QUESTIONS[level - 1]!) return null
  if (level === 1) {
    if (q === 0) {
      const [animal, color] = p as [string, string]
      return { text: `The ${animal} is ${color}.`, question: `What color is the ${animal}?`, answer: color, pool: COLORS }
    }
    const [color, animal, like] = p as [string, string, string]
    return { text: `The ${color} ${animal} can ${like}.`, question: `What animal is ${color}?`, answer: animal, pool: ANIMALS }
  }
  const [name, ...rest] = p
  const He = KIDS.find(([n]) => n === name)?.[1]
  if (!He) return null
  const he = He.toLowerCase()
  if (level === 2) {
    const [color, thing, like] = rest as [string, string, string]
    const text = `${name} has a ${color} ${thing}. ${He} likes to ${like}.`
    const qs: Story[] = [
      { text, question: `What does ${name} have?`, answer: `a ${thing}`, pool: THINGS.map((t) => `a ${t}`) },
      { text, question: `What color is the ${thing}?`, answer: color, pool: COLORS },
      { text, question: `What does ${name} like to do?`, answer: like, pool: LIKES },
    ]
    return qs[q]!
  }
  if (level === 3) {
    const [place, animal, feel] = rest as [string, string, string]
    const because = BECAUSE.find(([f]) => f === feel)
    if (!because) return null
    const [, did, doIt] = because
    const text = `${name} went to the ${place}. ${He} saw a ${animal}. The ${animal} was ${feel}, so ${he} ${did}.`
    const qs: Story[] = [
      { text, question: `Where did ${name} go?`, answer: `the ${place}`, pool: PLACES.map((x) => `the ${x}`) },
      { text, question: `What did ${name} see?`, answer: `a ${animal}`, pool: ANIMALS.map((x) => `a ${x}`) },
      { text, question: `Why did ${name} ${doIt}?`, answer: `The ${animal} was ${feel}.`, pool: BECAUSE.map(([f]) => `The ${animal} was ${f}.`) },
    ]
    return qs[q]!
  }
  // Level 4: order of events. The last pick says which event the question asks about (0 first, 1 next, 2 last).
  const acts = rest.slice(0, 3)
  const i = Number(rest[3])
  if (!acts[i]) return null
  const [a0, a1, a2] = acts as [string, string, string]
  return {
    text: `First, ${name} ${a0}. Then ${he} ${a1}. Last, ${he} ${a2}.`,
    question: `What did ${name} do ${['first', 'next', 'last'][i]}?`,
    answer: acts[i]!,
    // Other events from the story are the best wrong answers.
    pool: [...acts, ...ACTIONS],
  }
}

/** Random picks for one story: only the ones that story uses. */
function randomStory(level: number): { q: number; p: string[] } {
  const q = rand(0, STORY_QUESTIONS[level - 1]! - 1)
  const [name] = pick(KIDS)
  const color = pick(COLORS)
  const animal = pick(ANIMALS)
  if (level === 1) return { q, p: q === 0 ? [animal, color] : [color, animal, pick(LIKES)] }
  if (level === 2) return { q, p: [name, color, pick(THINGS), pick(LIKES)] }
  if (level === 3) return { q, p: [name, pick(PLACES), animal, pick(BECAUSE)[0]] }
  return { q, p: [name, ...shuffle([...ACTIONS]).slice(0, 3), String(rand(0, 2))] }
}

function storySpec(level: number, q: number, p: string[]): ItemSpec | null {
  const s = buildStory(level, q, p)
  if (!s) return null
  return {
    key: `story:${level}:${q}:${p.join('|')}`,
    prompt: { text: `${s.text}\n\n${s.question}` },
    answer: s.answer,
    wrong: (n) => wrongFrom(s.answer, n, s.pool.slice(3), s.pool.slice(0, 3)),
  }
}

function storyItem(level: number): ItemSpec {
  const { q, p } = randomStory(level)
  return storySpec(level, q, p)!
}

function storyFromKey(key: string, level: number): ItemSpec | null {
  const m = key.match(/^story:(\d+):(\d+):(.*)$/)
  if (!m || Number(m[1]) !== level) return null
  const spec = storySpec(level, Number(m[2]), m[3]!.split('|'))
  // Accept only a key it would have built itself, so a stray key can't rebuild a different story.
  return spec?.key === key ? spec : null
}

// --- Teach cards (shown before a kid's first question on a new idea) ---

const SOUND_TEACH: Teach[] = [
  { text: 'Say the word slowly. The first sound you hear is the letter it starts with, like c in cat.', say: 'Say the word slowly. The first sound you hear is the letter it starts with, like c in cat.' },
  { text: 'Some letters look alike, like b and d, or p and q. Say the word slowly and check its first sound.', say: 'Some letters look alike, like b and d, or p and q. Say the word slowly and check its first sound.' },
  { text: 'Two letters can team up for one sound: sh as in ship, ch as in chick, th as in thumb, wh as in whale.', say: 'Two letters can team up for one sound: sh, as in ship. ch, as in chick. th, as in thumb. wh, as in whale.' },
]

const WORD_TEACH: Teach[] = [
  { text: 'Short vowels say their short sound: a in cat, e in bed, i in pig, o in hot, u in bug.', say: 'Short vowels say their short sound: a as in cat, e as in bed, i as in pig, o as in hot, u as in bug.' },
  { text: 'Blends: two consonants that both keep their sound, like fr in frog. Digraphs: two letters that make one new sound, like sh in ship.', say: 'Blends: two consonants that both keep their sound, like fr in frog. Digraphs: two letters that make one new sound, like sh in ship.' },
  { text: 'A silent e at the end makes the vowel say its name: cap becomes cape. Pairs like ai and ee often do too, as in rain and tree.', say: 'A silent e at the end makes the vowel say its name: cap becomes cape. Vowel pairs like ai and ee often do too, as in rain and tree.' },
  { text: 'Some vowels team up in new ways: ar as in car, or as in fork, ou and ow as in cloud and cow, oy as in boy.', say: 'Some vowels team up in new ways: ar as in car, or as in fork, ou and ow as in cloud and cow, oy as in boy.' },
]

const SIGHT_TEACH: Teach = {
  text: "Some words don't follow the sound rules, so learn them by heart. Look at the spelling, say it, and remember it.",
  say: "Some words don't follow the sound rules, so learn them by heart. Look at the spelling, say it, and remember it.",
}

const STORY_TEACH: Teach[] = [
  { text: 'Read the sentence, then find the answer in the words.', say: 'Read the sentence, then find the answer in the words.' },
  { text: 'Read both sentences. The answer might be in either one.', say: 'Read both sentences. The answer might be in either one.' },
  { text: 'A cause is why something happens. An effect is what happens because of it. Look for so and because.', say: 'A cause is why something happens. An effect is what happens because of it. Look for so and because.' },
  { text: 'Sequence is the order things happen in. Look for first, then, next, and last.', say: 'Sequence is the order things happen in. Look for first, then, next, and last.' },
]

const RHYME_TEACH: Teach[] = [
  { text: 'Rhyming words end with the same sound, like cat and hat.', say: 'Rhyming words end with the same sound, like cat and hat.' },
  { text: 'Rhyming words end with the same sound, like cake and lake, or tree and bee.', say: 'Rhyming words end with the same sound, like cake and lake, or tree and bee.' },
  { text: 'Some rhymes are spelled differently, like blue and shoe. Listen to the ending sound, not the spelling.', say: 'Some rhymes are spelled differently, like blue and shoe. Listen to the ending sound, not the spelling.' },
]

const SYLLABLE_TEACH: Teach[] = [
  { text: 'A syllable is one beat in a word. Clap the beats: cat has 1, and pen-cil has 2.', say: 'A syllable is one beat in a word. Clap the beats: cat has one, and pen-cil has two.' },
  { text: 'Say each beat and count: lad-y-bug has 3, and wa-ter has 2.', say: 'Say each beat and count: lad-y-bug has three, and wa-ter has two.' },
  { text: 'Longer words have more beats. Clap and count: mon-ster has 2, and wa-ter-mel-on has 4.', say: 'Longer words have more beats. Clap and count: mon-ster has two, and wa-ter-mel-on has four.' },
]

export const reading: Subject = {
  id: 'reading',
  name: 'Reading',
  emoji: '📚',
  skills: [
    {
      id: 'sounds',
      label: (L) => ['Identify the first sound', 'Identify the first sound: look-alike letters', 'Choose the correct digraph: sh, ch, th, wh'][L - 1]!,
      maxLevel: 3,
      formats: ['choice'],
      generate: firstSoundItem,
      fromKey: firstSoundFromKey,
      teach: (L) => SOUND_TEACH[L - 1]!,
    },
    {
      id: 'words',
      label: (L) => ['Read short vowel words', 'Read words with blends', 'Read long vowel words', 'Read words with other vowel patterns'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      generate: pictureWordItem,
      fromKey: pictureWordSpec,
      teach: (L) => WORD_TEACH[L - 1]!,
    },
    {
      id: 'sight',
      label: (L) => ['Read sight words: set 1', 'Read sight words: set 2', 'Read sight words: grade 1', 'Read sight words: grade 2'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      listen: true,
      generate: (L) => sightItem(L),
      teach: () => SIGHT_TEACH,
      fromKey: (key, L) => (SIGHT_WORDS[L - 1]?.includes(key) ? sightItem(L, key) : null),
    },
    { ...rhyme, teach: rhyme.teach ?? ((L: number) => RHYME_TEACH[L - 1]!) },
    { ...syllables, teach: syllables.teach ?? ((L: number) => SYLLABLE_TEACH[L - 1]!) },
    wordMeaning,
    {
      id: 'stories',
      label: (L) => ['Read a sentence', 'Read two sentences', 'Cause and effect', 'Sequence'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      unlocksAfter: [{ skill: 'words', level: 2 }],
      generate: storyItem,
      fromKey: storyFromKey,
      teach: (L) => STORY_TEACH[L - 1]!,
    },
    ...READING_UPPER,
    ...READING_MORE,
    ...READING_G5,
    ...READING_EARLY,
    ...READING_U2,
    ...READING_E2,
    ...READING_FU,
    ...READING_FE,
    ...READING_PH,
  ],
}
