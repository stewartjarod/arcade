import type { ItemSpec, Skill } from '../core/types'
import { pick, wrongFrom } from './util'

/**
 * Language skills for Kindergarten to grade 2, named like IXL's categories: Rhyming, Syllables,
 * Synonyms and antonyms, Sentences, and Nouns/Verbs/Adjectives.
 * Every list is hand-checked so each question has exactly one right answer.
 */

// --- Rhyming: "Which word rhymes with cat?" ---------------------------------------------------
// Families inside one level never rhyme with each other, so a wrong choice can't also rhyme.

const RHYMES: string[][][] = [
  // 1 — short vowel families
  [['cat', 'hat', 'bat', 'mat', 'rat'], ['can', 'fan', 'van', 'man', 'pan'], ['dog', 'log', 'frog', 'fog'], ['pig', 'big', 'dig', 'wig'], ['bug', 'rug', 'hug', 'mug'], ['hen', 'pen', 'ten', 'men'], ['sun', 'run', 'bun', 'fun'], ['pot', 'dot', 'hot', 'cot']],
  // 2 — long vowels and endings
  [['cake', 'lake', 'snake', 'rake'], ['rain', 'train', 'brain', 'chain'], ['boat', 'goat', 'coat', 'float'], ['tree', 'bee', 'see', 'free'], ['night', 'light', 'right', 'bright'], ['ring', 'sing', 'king', 'wing'], ['clock', 'rock', 'sock', 'block'], ['sleep', 'sheep', 'jeep', 'deep'], ['day', 'play', 'say', 'tray']],
  // 3 — rhymes that are spelled differently
  [['blue', 'shoe', 'zoo', 'glue'], ['pear', 'bear', 'chair', 'stair'], ['eight', 'gate', 'plate', 'late'], ['phone', 'bone', 'cone', 'stone'], ['bed', 'red', 'bread', 'head'], ['moon', 'spoon', 'soon', 'noon'], ['book', 'look', 'cook', 'hook']],
]
const rhymeLabels = ['Rhyming', 'Rhyming: long vowels', 'Rhyming: different spellings']

// A level can ask about its own families and every earlier one (the newest most often).
const familiesUpTo = (L: number) => RHYMES.slice(0, L).flat()

function rhymeItem(L: number, target?: string, answer?: string): ItemSpec {
  const own = RHYMES[L - 1]!
  const family = target ? familiesUpTo(L).find((f) => f.includes(target)) ?? pick(own) : Math.random() < 0.65 ? pick(own) : pick(familiesUpTo(L))
  const word = target ?? pick(family)
  const rhyme = answer ?? pick(family.filter((w) => w !== word))
  const others = familiesUpTo(L).filter((f) => f !== family).flat()
  const text = `Which word rhymes with ${word}?`
  return {
    key: `rhyme:${word}:${rhyme}`,
    prompt: { text, say: text },
    answer: rhyme,
    wrong: (n) => wrongFrom(rhyme, n, others),
    seconds: 6,
  }
}

export const rhyme: Skill = {
  id: 'rhyme',
  label: (L) => rhymeLabels[L - 1]!,
  maxLevel: RHYMES.length,
  formats: ['choice'],
  generate: (L) => rhymeItem(L),
  fromKey: (key, L) => {
    const [kind, word, rhymed] = key.split(':')
    return kind === 'rhyme' && word && rhymed && familiesUpTo(L).some((f) => f.includes(word) && f.includes(rhymed)) ? rhymeItem(L, word, rhymed) : null
  },
}

// --- Syllables: clap the beats --------------------------------------------------------------

const SYLLABLES: { word: string; emoji: string; n: number }[] = [
  { word: 'cat', emoji: '🐱', n: 1 }, { word: 'dog', emoji: '🐶', n: 1 }, { word: 'star', emoji: '⭐', n: 1 }, { word: 'fish', emoji: '🐟', n: 1 },
  { word: 'tree', emoji: '🌳', n: 1 }, { word: 'house', emoji: '🏠', n: 1 }, { word: 'sun', emoji: '☀️', n: 1 },
  { word: 'apple', emoji: '🍎', n: 2 }, { word: 'tiger', emoji: '🐯', n: 2 }, { word: 'rainbow', emoji: '🌈', n: 2 }, { word: 'pizza', emoji: '🍕', n: 2 },
  { word: 'rocket', emoji: '🚀', n: 2 }, { word: 'carrot', emoji: '🥕', n: 2 }, { word: 'dolphin', emoji: '🐬', n: 2 }, { word: 'giraffe', emoji: '🦒', n: 2 },
  { word: 'banana', emoji: '🍌', n: 3 }, { word: 'elephant', emoji: '🐘', n: 3 }, { word: 'butterfly', emoji: '🦋', n: 3 }, { word: 'octopus', emoji: '🐙', n: 3 },
  { word: 'bicycle', emoji: '🚲', n: 3 }, { word: 'dinosaur', emoji: '🦖', n: 3 }, { word: 'kangaroo', emoji: '🦘', n: 3 }, { word: 'piano', emoji: '🎹', n: 3 },
  { word: 'watermelon', emoji: '🍉', n: 4 }, { word: 'helicopter', emoji: '🚁', n: 4 }, { word: 'caterpillar', emoji: '🐛', n: 4 }, { word: 'hippopotamus', emoji: '🦛', n: 5 },
]
const SYLLABLE_MAX = [2, 3, 5]
const syllableLabels = ['Syllables: 1 or 2', 'Syllables: up to 3', 'Syllables: up to 5']

function syllableItem(L: number, word?: string): ItemSpec {
  const options = SYLLABLES.filter((w) => w.n <= SYLLABLE_MAX[L - 1]!)
  const w = word ? SYLLABLES.find((x) => x.word === word)! : pick(options)
  const text = `How many syllables in ${w.word}?`
  return {
    key: `syl:${w.word}`,
    prompt: { text, say: `${text} Clap it out!`, emoji: w.emoji },
    answer: String(w.n),
    wrong: (k) => wrongFrom(String(w.n), k, ['1', '2', '3', '4', '5'], [String(w.n + 1), String(w.n - 1)].filter((v) => Number(v) >= 1)),
    seconds: 6,
  }
}

export const syllables: Skill = {
  id: 'syllables',
  label: (L) => syllableLabels[L - 1]!,
  maxLevel: SYLLABLE_MAX.length,
  formats: ['number', 'choice'],
  generate: syllableItem,
  fromKey: (key, L) => {
    const word = key.startsWith('syl:') ? key.slice(4) : ''
    return SYLLABLES.some((w) => w.word === word) ? syllableItem(L, word) : null
  },
}

// --- Opposites and same-meaning words --------------------------------------------------------
// Every concept appears once, so a wrong choice can never also be a right one.

const OPPOSITES1: [string, string][] = [['hot', 'cold'], ['up', 'down'], ['big', 'small'], ['day', 'night'], ['full', 'empty'], ['wet', 'dry'], ['fast', 'slow'], ['happy', 'sad'], ['hard', 'soft'], ['in', 'out'], ['stop', 'go'], ['old', 'new']]
const SAMES: [string, string][] = [['large', 'huge'], ['begin', 'start'], ['quick', 'rapid'], ['glad', 'joyful'], ['shut', 'close'], ['sleepy', 'tired'], ['mad', 'angry'], ['pretty', 'beautiful'], ['smart', 'clever'], ['kid', 'child'], ['sofa', 'couch'], ['shout', 'yell'], ['easy', 'simple']]
const OPPOSITES3: [string, string][] = [['early', 'late'], ['buy', 'sell'], ['always', 'never'], ['remember', 'forget'], ['smooth', 'rough'], ['wide', 'narrow'], ['front', 'back'], ['above', 'below'], ['safe', 'dangerous'], ['brave', 'scared'], ['strong', 'weak'], ['thick', 'thin']]
const wordLabels = ['Antonyms', 'Synonyms', 'Antonyms: harder words']

const PAIRS = [OPPOSITES1, SAMES, OPPOSITES3]
const wordsOf = (pairs: [string, string][]) => pairs.flat()

function wordsItem(L: number, given?: string): ItemSpec {
  const pairs = PAIRS[L - 1]!
  const opposite = L !== 2
  const pair = given ? pairs.find((p) => p.includes(given)) ?? pick(pairs) : pick(pairs)
  const word = given ?? pick(pair)
  const answer = pair.find((w) => w !== word)!
  const text = opposite ? `Which word means the opposite of ${word}?` : `Which word means the same as ${word}?`
  const others = wordsOf(pairs.filter((p) => p !== pair))
  return { key: `${opposite ? 'opp' : 'syn'}${L}:${word}`, prompt: { text, say: text }, answer, wrong: (n) => wrongFrom(answer, n, others), seconds: 7 }
}

export const wordMeaning: Skill = {
  id: 'wordMeaning',
  label: (L) => wordLabels[L - 1]!,
  maxLevel: PAIRS.length,
  formats: ['choice'],
  generate: (L) => wordsItem(L),
  fromKey: (key, L) => {
    const word = key.split(':')[1]
    return word && wordsOf(PAIRS[L - 1]!).includes(word) && key.match(/^(opp|syn)\d:/) ? wordsItem(L, word) : null
  },
}

// --- Sentences: a whole thought, or just a piece? ---------------------------------------------
// Every choice starts with a capital and ends with a period, so only the words can give it away.

const SENTENCES: string[][] = [
  ['The cat sat.', 'I like to play.', 'We run fast.', 'The sun is hot.', 'A bird can fly.', 'Dad made lunch.', 'My dog is big.', 'She has a red hat.'],
  ['The frog jumped into the pond.', 'We ate pizza for dinner.', 'My sister reads a book.', 'The bus stops at school.', 'Birds build nests in trees.', 'I can tie my shoes.', 'The baby is sleeping.', 'Grandma baked a cake.'],
  ['The dog barked, and the cat ran away.', 'After lunch, we played outside.', 'I wore a coat because it was cold.', 'The bell rang, so we lined up.', 'My friend and I built a big sandcastle.', 'When it rains, the flowers grow.'],
]
const FRAGMENTS: string[][] = [
  ['The big cat.', 'In the box.', 'Runs fast.', 'My red hat.', 'A little bird.', 'On the bed.', 'Jumped up high.', 'The sun.'],
  ['Under the big tree.', 'The girl with a hat.', 'Ran down the hill.', 'Because it was raining.', 'My brother and me.', 'Looking at the stars.', 'In the green pond.', 'Eats her lunch.'],
  ['Walking to the park.', 'When we got home.', 'The tall man in the red coat.', 'Because I was tired.', 'Under the bed and behind the door.'],
]
const RUN_ONS = ['The dog barked the cat ran away.', 'I like pizza my sister likes pasta.', 'We went to the park we played on the swings.', 'It was cold I wore my coat.', 'Mom cooked dinner we ate it all.', 'The bus came we got on.']
const sentenceLabels = ['Find the complete sentence', 'Find the complete sentence: longer', 'Sentences, fragments, and run-ons']

function sentenceItem(L: number, given?: string): ItemSpec {
  const answer = given ?? pick(SENTENCES[L - 1]!)
  const wrongs = [...FRAGMENTS[L - 1]!, ...FRAGMENTS.slice(0, L - 1).flat(), ...(L === 3 ? RUN_ONS : [])]
  return {
    key: `sent:${answer}`,
    prompt: { text: 'Which is a complete sentence?', say: 'Which one is a complete sentence?' },
    answer,
    wrong: (n) => wrongFrom(answer, n, wrongs),
    seconds: 10,
  }
}

export const sentences: Skill = {
  id: 'sentences',
  label: (L) => sentenceLabels[L - 1]!,
  maxLevel: SENTENCES.length,
  formats: ['choice'],
  generate: (L) => sentenceItem(L),
  fromKey: (key, L) => {
    const s = key.startsWith('sent:') ? key.slice(5) : ''
    return SENTENCES[L - 1]!.includes(s) ? sentenceItem(L, s) : null
  },
}

// --- Parts of speech: nouns, then verbs, then adjectives ---------------------------------------

const NOUNS = ['dog', 'cat', 'tree', 'house', 'ball', 'cake', 'teacher', 'school', 'boy', 'girl', 'hat', 'book', 'car', 'bird', 'moon', 'rock']
const VERBS = ['run', 'jump', 'eat', 'sing', 'swim', 'read', 'climb', 'sleep', 'throw', 'laugh', 'hop', 'draw']
const ADJECTIVES = ['red', 'big', 'soft', 'happy', 'tall', 'loud', 'cold', 'small', 'funny', 'sweet']
const POS = [
  { kind: 'noun', words: NOUNS, hint: 'a person, place or thing', label: 'Nouns' },
  { kind: 'verb', words: VERBS, hint: 'an action word', label: 'Verbs' },
  { kind: 'adjective', words: ADJECTIVES, hint: 'a word that describes', label: 'Adjectives' },
]

function posItem(L: number, given?: string): ItemSpec {
  const me = POS[L - 1]!
  const answer = given ?? pick(me.words)
  const others = POS.filter((p) => p !== me).flatMap((p) => p.words)
  const text = `Which word is ${me.kind === 'adjective' ? 'an' : 'a'} ${me.kind}? (${me.hint})`
  return { key: `pos:${me.kind}:${answer}`, prompt: { text, say: `Which word is ${me.kind === 'adjective' ? 'an' : 'a'} ${me.kind}? It is ${me.hint}.` }, answer, wrong: (n) => wrongFrom(answer, n, others), seconds: 6 }
}

export const grammar: Skill = {
  id: 'grammar',
  label: (L) => POS[L - 1]!.label,
  maxLevel: POS.length,
  formats: ['choice'],
  generate: (L) => posItem(L),
  fromKey: (key, L) => {
    const [kind, type, word] = key.split(':')
    return kind === 'pos' && type === POS[L - 1]!.kind && word && POS[L - 1]!.words.includes(word) ? posItem(L, word) : null
  },
}
