import type { ItemSpec, Subject } from '../core/types'
import { pick, rand, upToLevel, wrongFrom } from './util'
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
  const w = pick(pool.length ? pool : PICTURE_WORDS)
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

function story(level: number): Story {
  const [name, He] = pick(KIDS)
  const color = pick(COLORS)
  const animal = pick(ANIMALS)
  if (level === 1) {
    return pick<Story>([
      { text: `The ${animal} is ${color}.`, question: `What color is the ${animal}?`, answer: color, pool: COLORS },
      { text: `The ${color} ${animal} can ${pick(LIKES)}.`, question: `What animal is ${color}?`, answer: animal, pool: ANIMALS },
    ])
  }
  if (level === 2) {
    const thing = pick(THINGS)
    const like = pick(LIKES)
    const text = `${name} has a ${color} ${thing}. ${He} likes to ${like}.`
    return pick<Story>([
      { text, question: `What does ${name} have?`, answer: `a ${thing}`, pool: THINGS.map((t) => `a ${t}`) },
      { text, question: `What color is the ${thing}?`, answer: color, pool: COLORS },
      { text, question: `What does ${name} like to do?`, answer: like, pool: LIKES },
    ])
  }
  if (level === 3) {
    const place = pick(PLACES)
    const [feel, did, doIt] = pick(BECAUSE)
    const text = `${name} went to the ${place}. ${He} saw a ${animal}. The ${animal} was ${feel}, so ${He.toLowerCase()} ${did}.`
    return pick<Story>([
      { text, question: `Where did ${name} go?`, answer: `the ${place}`, pool: PLACES.map((p) => `the ${p}`) },
      { text, question: `What did ${name} see?`, answer: `a ${animal}`, pool: ANIMALS.map((a) => `a ${a}`) },
      { text, question: `Why did ${name} ${doIt}?`, answer: `The ${animal} was ${feel}.`, pool: BECAUSE.map(([f]) => `The ${animal} was ${f}.`) },
    ])
  }
  // Level 4: order of events
  const acts = [...ACTIONS].sort(() => Math.random() - 0.5).slice(0, 3) as [string, string, string]
  const text = `First, ${name} ${acts[0]}. Then ${He.toLowerCase()} ${acts[1]}. Last, ${He.toLowerCase()} ${acts[2]}.`
  const which = rand(0, 2)
  return {
    text,
    question: `What did ${name} do ${['first', 'next', 'last'][which]}?`,
    answer: acts[which]!,
    // Other events from the story are the best wrong answers.
    pool: [...acts, ...ACTIONS],
  }
}

function storyItem(level: number): ItemSpec {
  const s = story(level)
  return {
    key: `${s.text}|${s.question}`,
    prompt: { text: `${s.text}\n\n${s.question}` },
    answer: s.answer,
    wrong: (n) => wrongFrom(s.answer, n, s.pool.slice(3), s.pool.slice(0, 3)),
  }
}

export const reading: Subject = {
  id: 'reading',
  name: 'Reading',
  emoji: '📚',
  skills: [
    {
      id: 'sounds',
      label: (L) => ['First sounds', 'Tricky first sounds (b, d, p)', 'sh, ch, th, wh'][L - 1]!,
      maxLevel: 3,
      formats: ['choice'],
      startByGrade: { 0: 1, 1: 2, 2: 3 },
      generate: firstSoundItem,
    },
    {
      id: 'words',
      label: (L) => ['Short words (cat, dog)', 'Blends (frog, ship)', 'Long vowels (cake, boat)', 'Words like star, horse, cloud'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      startByGrade: { 0: 1, 1: 1, 2: 3 },
      generate: pictureWordItem,
      fromKey: pictureWordSpec,
    },
    {
      id: 'sight',
      label: (L) => ['Sight words: first list', 'Sight words: second list', 'Sight words: first grade', 'Sight words: second grade'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      listen: true,
      startByGrade: { 0: 1, 1: 2, 2: 3 },
      generate: (L) => sightItem(L),
      fromKey: (key, L) => (SIGHT_WORDS[L - 1]?.includes(key) ? sightItem(L, key) : null),
    },
    {
      id: 'stories',
      label: (L) => ['Reading a sentence', 'Reading two sentences', 'Why did it happen?', 'First, next, last'][L - 1]!,
      maxLevel: 4,
      formats: ['choice'],
      unlocksAfter: [{ skill: 'words', level: 2 }],
      startByGrade: { 1: 1, 2: 2 },
      generate: storyItem,
    },
  ],
}
