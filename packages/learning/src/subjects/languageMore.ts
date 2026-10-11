import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * More English skills, named like IXL's categories: letters and sounds for kindergarten, phonics
 * and word patterns for grades 1–2, reading comprehension and vocabulary for grades 2–5, and
 * grammar for grades 2–5. Kids in grades 1–2 can start on the early ones right away.
 *
 * Each skill is a hand-written bank per level, like languageUpper.ts. A row is one question, one
 * right answer, and three wrong answers. Every wrong answer was checked by hand to be clearly
 * wrong, so only one choice is ever right. Keys are "<skill>:<level>:<row>", so a missed
 * question can be rebuilt exactly.
 */

interface Row {
  /** A big picture shown with the question. */
  pic?: string
  /** The question (may include a short passage). "___" marks a blank. */
  q: string
  a: string
  w: string[]
}

/** A plain row: question, right answer, three wrong answers. */
const r = (q: string, a: string, ...w: string[]): Row => ({ q, a, w })
/** A row with a picture. */
const p = (pic: string, q: string, a: string, ...w: string[]): Row => ({ pic, q, a, w })

function rowSkill(id: string, labels: string[], banks: Row[][], unlocksAfter?: Skill['unlocksAfter']): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.q.replace(/___/g, 'blank'), ...(row.pic ? { emoji: row.pic } : {}) },
      answer: row.a,
      wrong: (n) => wrongFrom(row.a, n, row.w),
    }
  }
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: banks.length,
    formats: ['choice'],
    ...(unlocksAfter ? { unlocksAfter } : {}),
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

const READING_GATE = [{ skill: 'affixes', level: 2 }]
const VERB_GATE = [{ skill: 'grammar', level: 2 }]
const CONJ_GATE = [{ skill: 'grammar', level: 3 }]

// --- Reading: letters and sounds (kindergarten) -----------------------------------------------

const letters = rowSkill(
  'letters',
  ['Letter identification', 'Uppercase and lowercase letters', 'Consonants and vowels'],
  [
    [
      r('Which letter is M?', 'M', 'W', 'N', 'H'),
      r('Which letter is S?', 'S', 'Z', 'C', 'G'),
      r('Which letter is A?', 'A', 'H', 'O', 'U'),
      r('Which letter is T?', 'T', 'I', 'F', 'L'),
      r('Which letter is K?', 'K', 'X', 'R', 'Y'),
      r('Which letter is E?', 'E', 'F', 'B', 'P'),
      r('Which letter is G?', 'G', 'C', 'O', 'Q'),
      r('Which letter is R?', 'R', 'P', 'B', 'K'),
      r('Which letter is J?', 'J', 'I', 'L', 'T'),
    ],
    [
      r('Which capital letter matches d?', 'D', 'B', 'P', 'Q'),
      r('Which capital letter matches m?', 'M', 'W', 'N', 'H'),
      r('Which capital letter matches a?', 'A', 'H', 'O', 'E'),
      r('Which capital letter matches g?', 'G', 'C', 'Q', 'O'),
      r('Which capital letter matches t?', 'T', 'F', 'I', 'L'),
      r('Which capital letter matches p?', 'P', 'R', 'B', 'F'),
      r('Which small letter matches F?', 'f', 'e', 't', 'r'),
      r('Which small letter matches Y?', 'y', 'v', 'j', 'g'),
      r('Which small letter matches N?', 'n', 'm', 'h', 'u'),
    ],
    [
      r('Which letter is a vowel?', 'a', 'b', 'k', 's'),
      r('Which letter is a vowel?', 'e', 'f', 'h', 't'),
      r('Which letter is a vowel?', 'i', 'l', 'n', 'p'),
      r('Which letter is a vowel?', 'o', 'c', 'g', 'r'),
      r('Which letter is a vowel?', 'u', 'd', 'j', 'w'),
      r('Which letter is a consonant?', 'm', 'a', 'e', 'u'),
      r('Which letter is a consonant?', 's', 'i', 'o', 'e'),
      r('Which letter is a consonant?', 'd', 'u', 'a', 'i'),
      r('Which letter is a consonant?', 't', 'o', 'e', 'a'),
    ],
  ],
)

const letterSounds = rowSkill(
  'letterSounds',
  ['Ending sounds', 'Short vowel sounds', 'Long vowel sounds'],
  [
    [
      p('🐱', 'Which letter does cat END with?', 't', 'c', 'a', 'k'),
      p('🐶', 'Which letter does dog END with?', 'g', 'd', 'o', 'p'),
      p('🐸', 'Which letter does frog END with?', 'g', 'f', 'r', 'o'),
      p('🚌', 'Which letter does bus END with?', 's', 'b', 'u', 't'),
      p('☀️', 'Which letter does sun END with?', 'n', 's', 'u', 'd'),
      p('🐷', 'Which letter does pig END with?', 'g', 'p', 'i', 's'),
      p('🛏', 'Which letter does bed END with?', 'd', 'b', 'e', 't'),
      p('🦊', 'Which letter does fox END with?', 'x', 'f', 'o', 's'),
    ],
    [
      p('🐷', 'Which letter makes the middle sound in pig?', 'i', 'a', 'o', 'u'),
      p('🐸', 'Which letter makes the middle sound in frog?', 'o', 'e', 'i', 'a'),
      p('🐱', 'Which letter makes the middle sound in cat?', 'a', 'u', 'i', 'e'),
      p('🛏', 'Which letter makes the middle sound in bed?', 'e', 'o', 'a', 'u'),
      p('🚌', 'Which letter makes the middle sound in bus?', 'u', 'i', 'e', 'o'),
      p('🐔', 'Which letter makes the middle sound in hen?', 'e', 'i', 'u', 'a'),
      p('🐞', 'Which letter makes the middle sound in bug?', 'u', 'o', 'e', 'a'),
      p('🧦', 'Which letter makes the middle sound in sock?', 'o', 'a', 'i', 'u'),
    ],
    [
      p('🐍', 'Which letter says its name in snake?', 'a', 'o', 'i', 'u'),
      p('🚲', 'Which letter says its name in bike?', 'i', 'a', 'o', 'e'),
      p('🏠', 'Which letter says its name in home?', 'o', 'a', 'i', 'u'),
      p('🧊', 'Which letter says its name in cube?', 'u', 'o', 'a', 'e'),
      p('🌳', 'Which letter says its name in tree?', 'e', 'a', 'i', 'o'),
      p('🌹', 'Which letter says its name in rose?', 'o', 'a', 'e', 'u'),
      p('🍰', 'Which letter says its name in cake?', 'a', 'o', 'i', 'u'),
      p('🐝', 'Which letter says its name in bee?', 'e', 'a', 'i', 'o'),
    ],
  ],
)

// --- Reading: phonemes (kindergarten to grade 2) — written but NOT exported: spelled-out sounds are read aloud as letter names. Needs real sound audio. ---

const phonemes = rowSkill(
  'phonemes',
  ['Blend the sounds', 'Take away a sound', 'Change a sound'],
  [
    [
      p('🐶', 'Blend these sounds: d - o - g. Which word is it?', 'dog', 'dig', 'pig', 'bug'),
      p('☀️', 'Blend these sounds: s - u - n. Which word is it?', 'sun', 'bed', 'hat', 'map'),
      p('🐸', 'Blend these sounds: f - r - o - g. Which word is it?', 'frog', 'fog', 'fish', 'flag'),
      p('🚌', 'Blend these sounds: b - u - s. Which word is it?', 'bus', 'bug', 'but', 'bud'),
      p('🎩', 'Blend these sounds: h - a - t. Which word is it?', 'hat', 'hen', 'hit', 'hot'),
      p('🐷', 'Blend these sounds: p - i - g. Which word is it?', 'pig', 'pin', 'pen', 'pot'),
      r('Blend these sounds: m - o - p. Which word is it?', 'mop', 'map', 'mug', 'top'),
      p('🛏', 'Blend these sounds: b - e - d. Which word is it?', 'bed', 'bad', 'bag', 'red'),
    ],
    [
      r('Say sun. Take away the s sound. What is left?', 'un', 'sn', 'su', 'fun'),
      r('Say dog. Take away the d sound. What is left?', 'og', 'do', 'dg', 'go'),
      r('Say hat. Take away the h sound. What is left?', 'at', 'ha', 'ht', 'hit'),
      r('Say bus. Take away the b sound. What is left?', 'us', 'bu', 'bs', 'bud'),
      r('Say pig. Take away the p sound. What is left?', 'ig', 'pi', 'pg', 'big'),
      r('Say bed. Take away the d sound. What is left?', 'be', 'bd', 'ed', 'bad'),
      r('Say cup. Take away the k sound. What is left?', 'up', 'cu', 'cp', 'pup'),
      r('Say pan. Take away the n sound. What is left?', 'pa', 'an', 'pn', 'pen'),
      r('Say top. Take away the t sound. What is left?', 'op', 'to', 'tp', 'hop'),
    ],
    [
      r('Change the k sound in cat to r. What word do you get?', 'rat', 'sat', 'hat', 'bat'),
      r('Change the b sound in bat to h. What word do you get?', 'hat', 'bit', 'cat', 'bet'),
      r('Change the d sound in dog to l. What word do you get?', 'log', 'lag', 'dig', 'dot'),
      r('Change the s sound in sun to r. What word do you get?', 'run', 'rug', 'ran', 'fun'),
      r('Change the p sound in pin to f. What word do you get?', 'fin', 'fan', 'fun', 'pan'),
      r('Change the t sound in top to m. What word do you get?', 'mop', 'map', 'mud', 'hop'),
      r('Change the n sound in net to p. What word do you get?', 'pet', 'pen', 'pot', 'set'),
      r('Change the k sound in cup to p. What word do you get?', 'pup', 'pop', 'cap', 'cop'),
    ],
  ],
)

// --- Reading: long vowel spellings (grades 1–2) -----------------------------------------------

const longVowels = rowSkill(
  'longVowels',
  ['Silent e words', 'Vowel teams', 'Long vowel patterns'],
  [
    [
      r('We ride our ___ to the park.', 'bike', 'sock', 'lamp', 'mop'),
      r('Fly your ___ high in the sky.', 'kite', 'hat', 'mug', 'bus'),
      r('Pick the shape with six square sides: a ___.', 'cube', 'ball', 'book', 'star'),
      r('An ice cream ___ is pointy at the bottom.', 'cone', 'bowl', 'cup', 'ball'),
      r('The mouse ran back to its ___.', 'home', 'shoe', 'pen', 'sun'),
      r('Tug on the ___ with both hands.', 'rope', 'cup', 'pen', 'bed'),
      r('I smell a flower with my ___.', 'nose', 'hand', 'knee', 'ear'),
      r('Open the ___ and walk into the yard.', 'gate', 'book', 'cup', 'sock'),
    ],
    [
      r('The ___ runs along the tracks to the city.', 'train', 'bus', 'boat', 'bike'),
      r('A ___ is a slow animal with a shell on its back.', 'snail', 'snake', 'bee', 'fish'),
      r('Put on your warm ___ when it is cold outside.', 'coat', 'boat', 'bee', 'cup'),
      r('The ___ says baa.', 'sheep', 'cow', 'duck', 'bee'),
      r('Plant a ___ in the dirt and water it.', 'seed', 'ball', 'cup', 'shoe'),
      r('We sail our ___ on the lake.', 'boat', 'coat', 'tree', 'bus'),
      r('Waves crash on the sand at the ___.', 'beach', 'desk', 'barn', 'farm'),
      r('A ___ falls from a tree in autumn.', 'leaf', 'rock', 'cup', 'bell'),
    ],
    [
      r('We turn on the ___ when it gets dark.', 'light', 'mud', 'rug', 'bread'),
      r('The stars come out at ___.', 'night', 'noon', 'recess', 'breakfast'),
      r('We build a snowman out of ___.', 'snow', 'sand', 'mud', 'paper'),
      r("Let's ___ our drawings to the class.", 'show', 'eat', 'sleep', 'sing'),
      r('Please ___ your shoe before you run.', 'tie', 'eat', 'sing', 'drink'),
      r('On a clear, sunny day, the sky is ___.', 'blue', 'green', 'red', 'yellow'),
      r('Plants need water and sun to ___.', 'grow', 'sleep', 'swim', 'sing'),
      r('A baby may ___ when she is hungry.', 'cry', 'laugh', 'dance', 'hop'),
      r('We use ___ to stick the paper.', 'glue', 'ruler', 'eraser', 'pencil'),
      r('Toothpaste comes in a ___.', 'tube', 'cup', 'sock', 'lamp'),
      r('My feet grew, so I need ___ shoes.', 'new', 'old', 'wet', 'tall'),
    ],
  ],
)

// --- Reading: r-controlled and variant vowels (grades 1–2) ------------------------------------

const rVowels = rowSkill(
  'rVowels',
  ['R-controlled vowels: ar, or', 'R-controlled vowels: er, ir, ur', 'Variant vowels: aw, oo, au'],
  [
    [
      r('We drive a ___ to the store.', 'car', 'cake', 'pen', 'shoe'),
      r('Cows and horses live on a ___.', 'farm', 'school', 'pool', 'lake'),
      r('Put the cookie in the ___.', 'jar', 'sock', 'hat', 'bed'),
      r('The ___ is a fish with sharp teeth.', 'shark', 'duck', 'cat', 'bird'),
      r('A big ___ brought rain and wind.', 'storm', 'bee', 'cup', 'hat'),
      r('The ___ twinkles in the night sky.', 'star', 'cake', 'bell', 'dog'),
      r('We play on the swings at the ___.', 'park', 'bed', 'sink', 'pan'),
      r('Grandma knits a sweater with ___.', 'yarn', 'glue', 'paint', 'mud'),
    ],
    [
      r('The ___ flew to its nest.', 'bird', 'cat', 'pig', 'fish'),
      r('A ___ is a green plant with feathery leaves.', 'fern', 'rock', 'pen', 'cup'),
      r('Please ___ the page.', 'turn', 'eat', 'sit', 'sing'),
      r('The hot sun can ___ your skin.', 'burn', 'sleep', 'jump', 'read'),
      r('The ___ helped me at the clinic.', 'nurse', 'chef', 'baker', 'cook'),
      r('A ___ has a hard shell and moves slowly.', 'turtle', 'puppy', 'kitten', 'bird'),
      r('I buttoned my ___.', 'shirt', 'socks', 'window', 'puddle'),
      r('A group of cows is called a ___.', 'herd', 'flock', 'pack', 'swarm'),
    ],
    [
      r('A cat has sharp ___ on its paws.', 'claws', 'wings', 'shells', 'leaves'),
      r('Please ___ at the book.', 'look', 'jump', 'swim', 'sing'),
      r('We play ___ in the park.', 'ball', 'cake', 'shoe', 'hat'),
      r('You can ___ a picture with crayons.', 'draw', 'eat', 'sleep', 'sing'),
      r('A ___ is a big bird that hunts for mice.', 'hawk', 'frog', 'snail', 'fish'),
      r('Use a ___ to cut the wood.', 'saw', 'spoon', 'rake', 'shovel'),
      r('We hang our coats on a ___.', 'hook', 'shoe', 'cup', 'ball'),
      r('The teacher ___ us how to read.', 'taught', 'ate', 'sang', 'ran'),
      r('Drink your milk through a ___.', 'straw', 'spoon', 'fork', 'knife'),
    ],
  ],
)

// --- Reading: question words, color and number words, location words (kindergarten) -----------

const questionWords = rowSkill(
  'questionWords',
  ['Question words: who, what', 'Question words: where, when', 'Question words: why, how'],
  [
    [
      r('___ is at the door? My friend Sam is.', 'Who', 'What', 'Where', 'When'),
      r('___ is in the box? A red ball is.', 'What', 'Who', 'Where', 'When'),
      r('___ is that girl? She is my sister.', 'Who', 'What', 'Where', 'When'),
      r('___ did you eat for lunch? A sandwich.', 'What', 'Who', 'Where', 'When'),
      r('___ is the teacher? Ms. Ruiz is.', 'Who', 'What', 'Where', 'When'),
      r('___ is the color of the sky? Blue.', 'What', 'Who', 'Where', 'When'),
      r('___ is on the table? A book is.', 'What', 'Who', 'When', 'Why'),
      r('___ is the baker? Mr. Lee is the baker.', 'Who', 'What', 'Where', 'When'),
    ],
    [
      r('___ is the park? It is down the street.', 'Where', 'When', 'Who', 'Why'),
      r('___ do we eat lunch? At noon.', 'When', 'Where', 'Who', 'Why'),
      r('___ are my shoes? Under the bed.', 'Where', 'When', 'Who', 'What'),
      r('___ does school start? At eight o\'clock.', 'When', 'Where', 'Who', 'Why'),
      r('___ is the library? Across from the park.', 'Where', 'When', 'Who', 'What'),
      r('___ is your birthday? In May.', 'When', 'Where', 'Who', 'What'),
      r('___ is the party? On Saturday at two.', 'When', 'Where', 'Who', 'Why'),
      r('___ is the bus stop? Next to the big tree.', 'Where', 'When', 'Who', 'Why'),
    ],
    [
      r('___ do you wear a coat? Because it is cold.', 'Why', 'Who', 'Where', 'When'),
      r('___ do you make a sandwich? First, spread the peanut butter.', 'How', 'Why', 'Who', 'Where'),
      r('___ did the dog bark? Because the mail came.', 'Why', 'Who', 'Where', 'When'),
      r('___ do you ride a bike? You pedal and steer.', 'How', 'Why', 'Who', 'When'),
      r('___ is the baby crying? Because she is hungry.', 'Why', 'How', 'Who', 'Where'),
      r('___ do you spell your name? One letter at a time.', 'How', 'Why', 'Who', 'When'),
      r('___ do birds fly south in winter? Because it gets cold.', 'Why', 'How', 'Who', 'Where'),
      r('___ do you wash your hands? With soap and water.', 'How', 'Why', 'Who', 'Where'),
    ],
  ],
)

const colorNumberWords = rowSkill(
  'colorNumberWords',
  ['Color words', 'Number words', 'Number words: counting'],
  [
    [
      p('🌿', 'What color is the grass?', 'green', 'red', 'purple', 'black'),
      p('🍌', 'What color is a banana?', 'yellow', 'purple', 'red', 'black'),
      p('🍓', 'What color is a strawberry?', 'red', 'blue', 'white', 'brown'),
      p('🌞', 'What color is the sky on a sunny day?', 'blue', 'brown', 'black', 'pink'),
      p('🥕', 'What color is a carrot?', 'orange', 'purple', 'green', 'blue'),
      p('❄️', 'What color is snow?', 'white', 'black', 'red', 'yellow'),
      p('🍫', 'What color is chocolate?', 'brown', 'pink', 'white', 'orange'),
      p('🍆', 'What color is an eggplant?', 'purple', 'orange', 'yellow', 'white'),
    ],
    [
      r('Which word means 2?', 'two', 'four', 'five', 'ten'),
      r('Which word means 3?', 'three', 'seven', 'one', 'nine'),
      r('Which word means 4?', 'four', 'six', 'eight', 'one'),
      r('Which word means 5?', 'five', 'two', 'three', 'ten'),
      r('Which word means 6?', 'six', 'nine', 'eight', 'three'),
      r('Which word means 7?', 'seven', 'one', 'four', 'two'),
      r('Which word means 8?', 'eight', 'six', 'nine', 'five'),
      r('Which word means 9?', 'nine', 'ten', 'seven', 'one'),
    ],
    [
      r('Which word comes right after "two"?', 'three', 'one', 'four', 'ten'),
      r('Which word comes right after "four"?', 'five', 'three', 'six', 'two'),
      r('Which word comes right after "six"?', 'seven', 'five', 'eight', 'four'),
      r('Which word comes right after "eight"?', 'nine', 'seven', 'ten', 'six'),
      r('Which word comes right after "nine"?', 'ten', 'eight', 'seven', 'one'),
      r('Which word comes right after "one"?', 'two', 'three', 'four', 'ten'),
      r('Which word comes right after "seven"?', 'eight', 'six', 'nine', 'two'),
      r('Which word comes right after "three"?', 'four', 'two', 'five', 'one'),
    ],
  ],
)

const locationWords = rowSkill(
  'locationWords',
  ['Location words: in, on, under', 'Location words: next to, behind, between', 'Location words: above, near, far'],
  [
    [
      r('The cup is ___ the table. (on top of it)', 'on', 'in', 'under', 'beside'),
      r('The ball is ___ the box. (inside it)', 'in', 'on', 'under', 'beside'),
      r('The cat hides ___ the bed. (down below it)', 'under', 'in', 'on', 'beside'),
      r('The apple is ___ the bowl. (inside it)', 'in', 'on', 'under', 'beside'),
      r('The hat is ___ your head. (on top)', 'on', 'in', 'under', 'beside'),
      r('The shoes are ___ the bed. (down below it)', 'under', 'on', 'in', 'beside'),
      r('The book is ___ my bag. (inside it)', 'in', 'on', 'under', 'beside'),
      r('The dog sleeps ___ the table. (below it)', 'under', 'in', 'on', 'beside'),
    ],
    [
      r('The dog is ___ the tree. (right beside it)', 'next to', 'behind', 'between', 'above'),
      r('The girl stands ___ the boy and the dog. (in the middle)', 'between', 'behind', 'above', 'under'),
      r('The ball rolled ___ the couch. (out of sight, on the far side)', 'behind', 'between', 'above', 'under'),
      r('The bench is ___ the sign. (right at its side)', 'next to', 'between', 'behind', 'above'),
      r('The bird is ___ the branch. (up above it)', 'above', 'under', 'behind', 'between'),
      r('The pencil is ___ the two erasers. (in the middle)', 'between', 'behind', 'above', 'under'),
      r('The cat hid ___ the chair. (on the back side)', 'behind', 'between', 'above', 'under'),
      r('The lamp is ___ the sofa. (very close to it)', 'next to', 'between', 'behind', 'above'),
    ],
    [
      r('The tree is ___ the door. (right in front of it)', 'in front of', 'far from', 'behind', 'beside'),
      r('The school is ___ our house. (a long walk away)', 'far from', 'near', 'beside', 'in front of'),
      r('The garden is ___ our house. (very close by)', 'near', 'far from', 'under', 'behind'),
      r('The kite is ___ the trees. (way up high in the sky)', 'above', 'under', 'beside', 'behind'),
      r('The teacher stands ___ the class. (facing them)', 'in front of', 'behind', 'far from', 'beside'),
      r('The sock is ___ the bed. (down below it)', 'under', 'above', 'near', 'in front of'),
      r('The cat is ___ the couch. (far away across the room)', 'far from', 'near', 'beside', 'under'),
      r('The clock is ___ the bed. (on the wall above the bed)', 'above', 'under', 'beside', 'in front of'),
    ],
  ],
)

// --- Reading: categories and reality (kindergarten to grade 2) ---------------------------------

const categories = rowSkill(
  'categories',
  ['Categories: not an animal, fruit', 'Categories: vegetables, months, shapes', 'Categories: harder groups'],
  [
    [
      r('Which one is NOT an animal?', 'tree', 'dog', 'cat', 'fish'),
      r('Which one is NOT a fruit?', 'carrot', 'apple', 'banana', 'grape'),
      r('Which one is NOT a vehicle?', 'dog', 'bus', 'car', 'boat'),
      r('Which one is NOT a toy?', 'spoon', 'ball', 'doll', 'kite'),
      r('Which one is NOT food?', 'shoe', 'bread', 'milk', 'egg'),
      r('Which one is NOT clothing?', 'table', 'hat', 'sock', 'coat'),
      r('Which one is NOT a color?', 'door', 'red', 'blue', 'pink'),
      r('Which one is NOT a bird?', 'bee', 'owl', 'duck', 'robin'),
    ],
    [
      r('Which one is NOT a vegetable?', 'banana', 'carrot', 'lettuce', 'potato'),
      r('Which one is NOT a fruit?', 'celery', 'apple', 'pear', 'grape'),
      r('Which one is NOT a day of the week?', 'June', 'Monday', 'Friday', 'Sunday'),
      r('Which one is NOT a month?', 'Tuesday', 'March', 'July', 'October'),
      r('Which one is NOT a flat (2D) shape?', 'cube', 'circle', 'square', 'triangle'),
      r('Which one is NOT an instrument?', 'pencil', 'drum', 'piano', 'flute'),
      r('Which one is NOT an insect?', 'spider', 'ant', 'bee', 'beetle'),
      r('Which one is NOT a mammal?', 'snake', 'dog', 'cow', 'whale'),
    ],
    [
      r('Which one is NOT a reptile?', 'frog', 'lizard', 'turtle', 'crocodile'),
      r('Which one is NOT a planet?', 'moon', 'Mars', 'Venus', 'Jupiter'),
      r('Which one is NOT a sport?', 'piano', 'soccer', 'tennis', 'baseball'),
      r('Which one is NOT a bird?', 'bat', 'robin', 'eagle', 'penguin'),
      r('Which one is NOT a dessert?', 'bread', 'pie', 'cookie', 'pudding'),
      r('Which one is NOT a kind of weather?', 'desk', 'rain', 'snow', 'fog'),
      r('Which one is NOT a country?', 'Paris', 'Japan', 'Brazil', 'Canada'),
      r('Which one is NOT a flower?', 'oak', 'tulip', 'daisy', 'rose'),
    ],
  ],
)

const realFiction = rowSkill(
  'realFiction',
  ['Could it really happen?', 'What could NOT happen?', 'Facts or make-believe'],
  [
    [
      r('Which could really happen?', 'The girl ate toast for breakfast.', 'A pig flew over the house.', 'The dog drove a bus.', 'Trees can sing.'),
      r('Which one is real?', 'Birds build nests.', 'Fish walk to school.', 'Cows wear hats and dance.', 'A bear talks on the phone.'),
      r('Which could really happen?', 'We planted a seed.', 'The seed ate my dinner.', 'A tree swam across the lake.', 'The sun is made of cake.'),
      r('Which one is real?', 'Rain makes puddles.', 'Puddles bark at dogs.', 'Rain can sing songs.', 'The moon is made of cheese.'),
      r('Which could really happen?', 'Kids ride bikes to the park.', 'A bike swims in the sea.', 'Dogs fly like birds.', 'A cat reads a book aloud.'),
      r('Which one is real?', 'Bees make honey.', 'Frogs wear shoes.', 'Cows talk to horses.', 'Pigs sing in the rain.'),
      r('Which could really happen?', 'Mom made pancakes.', 'Pancakes flew out of the sky.', 'A pancake had a face.', 'Mom walked on the moon for lunch.'),
      r('Which one is real?', 'A horse can gallop.', 'A horse can talk.', 'A horse wears a crown.', 'A horse drives a car.'),
    ],
    [
      r('Which sentence could NOT happen in real life?', 'A dragon flew over our school.', 'A bird flew over our school.', 'A plane flew over our school.', 'A kite flew over our school.'),
      r('Which sentence could NOT happen in real life?', 'The cat wore a tiny hat and drove a car.', 'The cat slept on the rug.', 'The cat chased a ball.', 'The cat drank some milk.'),
      r('Which sentence could NOT happen in real life?', 'The mouse talked and asked for cheese.', 'The mouse ate some cheese.', 'The mouse ran under the bed.', 'The mouse hid from the cat.'),
      r('Which sentence could NOT happen in real life?', 'The teapot sang a happy song.', 'The teapot held hot water.', 'The teapot sat on the stove.', 'The teapot was made of clay.'),
      r('Which sentence could NOT happen in real life?', 'Snowmen can walk to the store.', 'Snowmen melt in the sun.', 'Snow is cold and white.', 'We made a snowman.'),
      r('Which sentence could NOT happen in real life?', 'The tree gave us apples and waved hello.', 'The tree had green leaves.', 'Apples grow on trees.', 'The tree grew tall.'),
      r('Which sentence could NOT happen in real life?', 'A fish rode a bike down the street.', 'A fish swam in the pond.', 'A fish has fins.', 'Fish live in water.'),
      r('Which sentence could NOT happen in real life?', 'The clock told jokes at noon.', 'The clock showed the time.', 'The clock hung on the wall.', 'The clock ticked loudly.'),
    ],
    [
      r('Which sentence is a fact?', 'Dogs have four legs.', 'Dogs can fly to the moon.', 'Dogs can talk like people.', 'Dogs can drive cars.'),
      r('Which sentence is a fact?', 'Bees make honey.', 'Bees can talk to cats.', 'Bees sleep in shoes.', 'Bees wear hats.'),
      r('Which sentence is a fact?', 'Plants need water and sunlight.', 'Plants can sing songs.', 'Plants can run races.', 'Plants can eat pizza.'),
      r('Which sentence is a fact?', 'The moon goes around the Earth.', 'The moon is made of cheese.', 'The moon can talk to kids.', 'The moon is a pet dog.'),
      r('Which sentence is a fact?', 'Ducks can swim.', 'Ducks can drive.', 'Ducks can speak English.', 'Ducks can ride bikes.'),
      r('Which sentence is a fact?', 'Snakes shed their skin.', 'Snakes can cook dinner.', 'Snakes can wear glasses.', 'Snakes can dance on stage.'),
      r('Which sentence is a fact?', 'Frogs lay eggs in water.', 'Frogs can make pizza.', 'Frogs have wings.', 'Frogs can read books.'),
      r('Which sentence is a fact?', 'Cows give milk.', 'Cows can sing.', 'Cows can play the piano.', 'Cows have wings.'),
    ],
  ],
)

// --- Reading: setting, character, and plot (grades 1–3) ----------------------------------------

const settingCharacter = rowSkill(
  'settingCharacter',
  ['Setting', 'How characters feel', 'Story elements'],
  [
    [
      r('Mia ran into the waves and dug in the warm sand with her shovel.\n\nWhere does this story happen?', 'At the beach', 'In a kitchen', 'At the library', 'In a barn'),
      r('Sam put on his mittens and slid on the ice. Then he built a snowman.\n\nWhere does this story happen?', 'Outside in the snow', 'In a bathtub', 'At the pool', 'In a hot desert'),
      r('The baker shaped the dough. The smell of bread filled the shop.\n\nWhere does this story happen?', 'In a bakery', 'On a ship', 'In a forest', 'At the zoo'),
      r('A tiny bird built a nest in the apple tree.\n\nWhere does this story happen?', 'In a tree', 'In a pond', 'Under the sea', 'In a cave'),
      r('Ben took the bus to school. He carried his lunch box and his backpack.\n\nWhere are Ben and the bus going?', 'On the way to school', 'On a farm', 'In a bakery', 'At the zoo'),
      r('The rocket lifted off, and the stars zoomed past the window.\n\nWhere does this story happen?', 'In outer space', 'In a bakery', 'In a park', 'Under the ocean'),
      r('Grandma and I baked cookies. We made a big mess in the kitchen.\n\nWhere does this story happen?', 'In a kitchen', 'At a pond', 'On a farm', 'In a cave'),
      r('The sheep and the cows ate grass all day in the green field.\n\nWhere does this story happen?', 'On a farm', 'In a city subway', 'In a library', 'On a boat'),
    ],
    [
      r('Max waited all day for his birthday party. When his friends came through the door, he jumped up and cheered.\n\nHow does Max feel?', 'excited', 'sleepy', 'angry', 'bored'),
      r('Lily dropped her ice cream on the sidewalk. She stared at the mess and began to cry.\n\nHow does Lily feel?', 'sad', 'proud', 'silly', 'calm'),
      r('The dog barked at the mailman, and the boy hid behind the door.\n\nHow does the boy feel?', 'scared', 'happy', 'hungry', 'proud'),
      r('Jen got a perfect score on her spelling test. She hugged her mom.\n\nHow does Jen feel?', 'proud', 'lonely', 'tired', 'afraid'),
      r("The puppy licked Sam's face. Sam giggled and gave it a big hug.\n\nHow does Sam feel?", 'happy', 'angry', 'bored', 'worried'),
      r('Grandpa fell asleep in his chair before the movie ended. He snored softly.\n\nHow does Grandpa feel?', 'sleepy', 'excited', 'nervous', 'hungry'),
      r('Rosa had to read in front of the whole class. Her hands shook, and her voice was tiny.\n\nHow does Rosa feel?', 'nervous', 'silly', 'proud', 'bored'),
      r('The team lost the game. Nobody spoke on the bus home.\n\nHow does the team feel?', 'disappointed', 'thrilled', 'hungry', 'relaxed'),
    ],
    [
      r('The fox wanted to cross the river. There was no bridge, so the fox built one with logs.\n\nWhat is the problem in this story?', 'There was no bridge over the river.', 'The fox was too tall.', 'The river was too cold.', 'The fox lost its tail.'),
      r('The school play was tonight. Ben forgot his lines, but he looked at his friend and remembered them.\n\nWhat is the problem in this story?', 'Ben forgot his lines.', 'The play was canceled.', 'Ben lost his costume.', 'His friend was sick.'),
      r('Deep in the forest, a small owl could not find her nest. She searched all night. At dawn, her friends showed her the way.\n\nWhat is the setting?', 'A deep forest', 'A busy city', 'A farm', 'A swimming pool'),
      r('Captain Lee sailed across the sea on a big ship. A storm rocked the boat, but Lee kept the crew calm.\n\nWhere does the story take place?', 'On a ship at sea', 'In a library', 'In a cave', 'On a farm'),
      r('The baker ran out of flour on the busiest day. Her neighbor shared a bag, and the bread was ready just in time.\n\nHow is the problem solved?', 'A neighbor shares flour.', 'The baker closed the shop.', 'The bread was thrown away.', 'A customer went home.'),
      r("Nora's tooth was loose. She wiggled it all day, and at night it finally came out.\n\nWho is the main character?", 'Nora', 'the tooth fairy', 'her mom', 'the dentist'),
    ],
  ],
)

const plotSequence = rowSkill(
  'plotSequence',
  ['Sequence: first', 'Plot: problem and solution', 'Sequence: before and after'],
  [
    [
      r('First, Ana planted a seed. Then she watered it. Last, a flower grew.\n\nWhat did Ana do first?', 'She planted a seed.', 'She watered it.', 'A flower grew.', 'She picked the flower.'),
      r('Tim put on his shoes. Then he grabbed his backpack. Last, he walked out the door.\n\nWhat did Tim do last?', 'He walked out the door.', 'He put on his shoes.', 'He grabbed his backpack.', 'He ate breakfast.'),
      r('We made a sandwich. First, we spread the peanut butter. Then we added jelly.\n\nWhat did we do first?', 'We spread the peanut butter.', 'We added jelly.', 'We ate the sandwich.', 'We baked bread.'),
      r('The sun came up. The rooster crowed. Then Dad made breakfast.\n\nWhat happened first?', 'The sun came up.', 'Dad made breakfast.', 'The rooster crowed.', 'The dog barked.'),
      r('Mia painted a picture. Then it dried. Last, she hung it on the wall.\n\nWhat did Mia do last?', 'She hung it on the wall.', 'She painted a picture.', 'It dried.', 'She bought paint.'),
      r('First, the baby bird hatched. Next, it grew feathers. Last, it flew away.\n\nWhat happened last?', 'It flew away.', 'It hatched.', 'It grew feathers.', 'It sang a song.'),
      r('Sam washed his hands. Then he sat down to eat. Last, he cleaned the table.\n\nWhat did Sam do first?', 'He washed his hands.', 'He sat down to eat.', 'He cleaned the table.', 'He went to bed.'),
      r('The egg cracked open. A tiny chick came out. Soon it was big enough to run.\n\nWhat happened first?', 'The egg cracked open.', 'A tiny chick came out.', 'It ran around.', 'It went to sleep.'),
    ],
    [
      r("Jo's kite got stuck in a tree. She tried to pull it, but it was too high. Her dad brought a long stick and freed the kite.\n\nWhat was the problem?", "Jo's kite was stuck in a tree.", 'Jo lost her shoes.', 'It was raining.', 'Jo had no lunch.'),
      r('The cat was hungry, but the bowl was empty. Ella filled the bowl with food. The cat ate happily.\n\nHow was the problem solved?', 'Ella filled the bowl with food.', 'The cat slept all day.', 'The cat ran away.', 'Ella took a nap.'),
      r('The bus was late, and Leo was worried about school. He waved, and the bus stopped.\n\nWhat was the problem?', 'The bus was late.', 'Leo lost his bag.', 'It was snowing.', 'Leo forgot his lunch.'),
      r('The sandcastle fell down when the wave came. The kids built it again farther from the water.\n\nHow did the kids fix the problem?', 'They built it farther from the water.', 'They ran home.', 'They wrote a letter.', 'They went to sleep.'),
      r('Ruby could not reach the cookie jar. She pushed a chair over and climbed up. She got a cookie.\n\nHow did Ruby solve the problem?', 'She pushed a chair over and climbed up.', 'She asked for a bigger jar.', 'She cried all day.', 'She ate a banana.'),
      r('The power went out, so the room was dark. Dad lit a candle, and the family played a game.\n\nWhat was the problem?', 'The room was dark.', 'The game was over.', 'The cat was lost.', 'The food was cold.'),
      r('Max left his toy truck in the rain, and it got rusty. He dried it and oiled the wheels. Now it rolls again.\n\nHow did Max fix the problem?', 'He dried it and oiled the wheels.', 'He threw it away.', 'He sold it.', 'He painted it pink.'),
      r("The bird's nest blew down in the wind. The eggs were safe. The family built a new nest in the tree.\n\nWhat was the problem?", 'The nest blew down.', 'The birds flew south.', 'The eggs were too big.', 'A cat ate the tree.'),
    ],
    [
      r('Rosa mixed flour and eggs. Next, she poured the batter in a pan. Then she baked it. Last, she frosted the cake.\n\nWhat did Rosa do right after she poured the batter?', 'She baked it.', 'She frosted the cake.', 'She mixed flour and eggs.', 'She ate the cake.'),
      r('The seed was planted in spring. Rain came, and it sprouted. The plant grew tall in summer. In fall, it made seeds.\n\nWhat happened in summer?', 'The plant grew tall.', 'The seed was planted.', 'It sprouted.', 'It made seeds.'),
      r('Leo woke up, brushed his teeth, and ate cereal. Then he got on the bus. After school, he came home and read a book.\n\nWhat did Leo do right before he got on the bus?', 'He ate cereal.', 'He read a book.', 'He came home.', 'He woke up.'),
      r('The volcano rumbled. Then hot lava flowed down the hill. Later, the lava cooled and turned into rock.\n\nWhat happened after the lava flowed?', 'The lava cooled and turned into rock.', 'The volcano rumbled.', 'Hot lava flowed down the hill.', 'The hill was green.'),
      r('Jada wanted a pet. First she read about puppies. Next she asked her mom. Finally, they went to the shelter and picked one.\n\nWhat did Jada do before she asked her mom?', 'She read about puppies.', 'They picked a puppy.', 'They went to the shelter.', 'She got a cat.'),
      r('We packed our bags on Friday. On Saturday, we drove to the lake. We swam all afternoon. On Sunday, we drove home.\n\nWhat did they do on Sunday?', 'They drove home.', 'They packed their bags.', 'They drove to the lake.', 'They swam in the lake.'),
      r('The farmer planted corn in May. In July, the corn grew tall. In September, the farmer picked the corn.\n\nWhen did the farmer pick the corn?', 'In September.', 'In May.', 'In July.', 'In winter.'),
      r('The baby giraffe stood up. Then it took its first steps. Soon, it could run next to its mother.\n\nWhat happened before it took its first steps?', 'It stood up.', 'It ran next to its mother.', 'It drank milk.', 'It went to sleep.'),
    ],
  ],
)

// --- Reading: compound words, shades of meaning, Greek and Latin roots (grades 2–5) -----------

const compoundWords = rowSkill(
  'compoundWords',
  ['Compound words', 'Compound words: harder', 'Compound words: hardest'],
  [
    [
      r('Which word is a compound word?', 'sunflower', 'happy', 'jumping', 'giraffe'),
      r('Which word is a compound word?', 'rainbow', 'wiggle', 'purple', 'pizza'),
      r('Which word is a compound word?', 'bedroom', 'teacher', 'pencil', 'rocket'),
      r('Which word is a compound word?', 'cupcake', 'garden', 'tiger', 'window'),
      r('Which word is a compound word?', 'classroom', 'pretty', 'school', 'listen'),
      r('Which word is a compound word?', 'toothbrush', 'kitten', 'bottle', 'pillow'),
      r('Which word is a compound word?', 'football', 'soccer', 'kitten', 'pencil'),
      r('Which word is a compound word?', 'snowman', 'penguin', 'blanket', 'whistle'),
    ],
    [
      r('Which word is a compound word?', 'outside', 'around', 'beyond', 'behind'),
      r('Which word is a compound word?', 'homework', 'lesson', 'pencil', 'reading'),
      r('Which word is a compound word?', 'playground', 'swing', 'slide', 'recess'),
      r('Which word is a compound word?', 'earthquake', 'tremor', 'shaking', 'rumble'),
      r('Which word is a compound word?', 'butterfly', 'caterpillar', 'moth', 'beetle'),
      r('Which word is a compound word?', 'bookshelf', 'shelf', 'librarian', 'chair'),
      r('Which word is a compound word?', 'lunchbox', 'napkin', 'tray', 'plate'),
      r('Which word is a compound word?', 'sunshine', 'brightly', 'shiny', 'warmth'),
    ],
    [
      r('Which word is a compound word?', 'newspaper', 'article', 'editor', 'headline'),
      r('Which word is a compound word?', 'airplane', 'engine', 'wing', 'pilot'),
      r('Which word is a compound word?', 'eyelash', 'cheek', 'lid', 'brow'),
      r('Which word is a compound word?', 'sailboat', 'canoe', 'yacht', 'ferry'),
      r('Which word is a compound word?', 'toothpaste', 'brush', 'floss', 'enamel'),
      r('Which word is a compound word?', 'grandmother', 'mother', 'sister', 'cousin'),
      r('Which word is a compound word?', 'fingernail', 'thumb', 'knuckle', 'palm'),
    ],
  ],
)

const shadesOfMeaning = rowSkill(
  'shadesOfMeaning',
  ['Shades of meaning: strongest', 'Shades of meaning: least and most', 'Shades of meaning: harder words'],
  [
    [
      r('Which word means the MOST cold?', 'freezing', 'cool', 'chilly', 'mild'),
      r('Which word means the MOST hot?', 'scorching', 'warm', 'toasty', 'mild'),
      r('Which word means the MOST big?', 'enormous', 'little', 'big', 'large'),
      r('Which word means the MOST happy?', 'ecstatic', 'glad', 'pleased', 'content'),
      r('Which word means the MOST mad?', 'furious', 'annoyed', 'grumpy', 'upset'),
      r('Which word means the MOST scared?', 'terrified', 'nervous', 'uneasy', 'worried'),
      r('Which word means the MOST fast?', 'sprinted', 'jogged', 'walked', 'strolled'),
    ],
    [
      r('Which word means the LEAST hot?', 'warm', 'scorching', 'boiling', 'blazing'),
      r('Which word means the LEAST dark?', 'dim', 'dark', 'black', 'pitch-black'),
      r('Which word means the MOST tired?', 'exhausted', 'sleepy', 'drowsy', 'tired'),
      r('Which word means the LEAST loud?', 'whisper', 'yell', 'scream', 'shout'),
      r('Which word means the MOST wet?', 'soaked', 'damp', 'moist', 'wet'),
      r('Which word means the LEAST cold?', 'cool', 'icy', 'freezing', 'frigid'),
      r('Which word means the LEAST big?', 'tiny', 'medium', 'large', 'huge'),
    ],
    [
      r('Which word means the MOST angry?', 'enraged', 'annoyed', 'irritated', 'grumpy'),
      r('Which word means the MOST hungry?', 'starving', 'hungry', 'peckish', 'full'),
      r('Which word means the LEAST important?', 'trivial', 'vital', 'crucial', 'major'),
      r('Which word means the MOST crowded?', 'packed', 'busy', 'quiet', 'empty'),
      r('Which word means the MOST dirty?', 'filthy', 'dirty', 'messy', 'clean'),
      r('Which word means the MOST bright?', 'dazzling', 'bright', 'shiny', 'pale'),
    ],
  ],
)

const greekLatin = rowSkill(
  'greekLatin',
  ['Greek and Latin roots: tele, aud, port', 'Greek and Latin roots: auto, therm, chron', 'Greek and Latin roots: ject, tract, ped'],
  [
    [
      r("What does the root 'tele' mean? (telephone, television)", 'far', 'near', 'write', 'small'),
      r("What does the root 'aud' mean? (audience, audio)", 'hear', 'see', 'carry', 'write'),
      r("What does the root 'port' mean? (transport, portable)", 'carry', 'say', 'look', 'build'),
      r("What does the root 'graph' mean? (photograph, autograph)", 'write', 'hear', 'carry', 'small'),
      r("What does the root 'bio' mean? (biology, biography)", 'life', 'water', 'earth', 'light'),
      r("What does the root 'micro' mean? (microscope)", 'small', 'large', 'far', 'say'),
      r("What does the root 'dict' mean? (dictionary, predict)", 'say', 'look', 'break', 'build'),
      r("What does the root 'spect' mean? (inspect, spectator)", 'look', 'hear', 'carry', 'far'),
    ],
    [
      r("What does the Greek root 'auto' mean? (automatic, automobile)", 'self', 'water', 'light', 'heat'),
      r("What does the root 'therm' mean? (thermometer, thermal)", 'heat', 'time', 'sound', 'name'),
      r("What does the root 'chron' mean? (chronology, synchronize)", 'time', 'earth', 'write', 'break'),
      r("What does the root 'nym' mean? (synonym, antonym)", 'name', 'sound', 'heat', 'light'),
      r("What does the root 'phon' mean? (phonics, microphone)", 'sound', 'name', 'time', 'water'),
      r("What does the root 'rupt' mean? (interrupt, erupt)", 'break', 'build', 'look', 'carry'),
      r("What does the root 'struct' mean? (construct, structure)", 'build', 'break', 'look', 'carry'),
      r("What does the root 'aqua' mean? (aquarium, aquatic)", 'water', 'earth', 'light', 'self'),
    ],
    [
      r("What does the root 'ject' mean? (inject, project)", 'throw', 'pull', 'hand', 'foot'),
      r("What does the root 'tract' mean? (attract, tractor)", 'pull', 'throw', 'hand', 'foot'),
      r("What does the root 'ped' mean? (pedal, pedestrian)", 'foot', 'hand', 'throw', 'send'),
      r("What does the root 'manu' mean? (manual, manufacture)", 'hand', 'foot', 'pull', 'fear'),
      r("What does the root 'phob' mean? (claustrophobia, hydrophobia)", 'fear', 'hand', 'pull', 'send'),
      r("What does the root 'mit' mean? (transmit, submit)", 'send', 'hand', 'pull', 'fear'),
      r("What does the root 'vert' mean? (convert, invert)", 'turn', 'send', 'fear', 'foot'),
      r("What does the root 'scrib' mean? (describe, inscribe)", 'write', 'turn', 'hand', 'send'),
    ],
  ],
  READING_GATE,
)

// --- Writing: plurals, verb types, conjunctions (grades 1–5) -----------------------------------

const pluralNouns = rowSkill(
  'pluralNouns',
  ['Plurals: add -s', 'Plurals: add -es', 'Plurals: irregular'],
  [
    [
      r('Which word means more than one cat?', 'cats', 'cat', "cat's", 'catz'),
      r('Which word means more than one dog?', 'dogs', 'dog', "dog's", 'dogz'),
      r('Which word means more than one hat?', 'hats', 'hat', "hat's", 'hatz'),
      r('Which word means more than one pig?', 'pigs', 'pig', "pig's", 'pigz'),
      r('Which word means more than one bug?', 'bugs', 'bug', "bug's", 'bugz'),
      r('Which word means more than one cup?', 'cups', 'cup', "cup's", 'cupz'),
      r('Which word means more than one book?', 'books', 'book', "book's", 'bookz'),
      r('Which word means more than one bee?', 'bees', 'bee', "bee's", 'beez'),
    ],
    [
      r('Which word means more than one box?', 'boxes', 'boxs', 'box', 'boxies'),
      r('Which word means more than one bus?', 'buses', 'buss', 'bus', 'busies'),
      r('Which word means more than one dish?', 'dishes', 'dishs', 'dish', 'dishies'),
      r('Which word means more than one watch?', 'watches', 'watchs', 'watch', 'watchies'),
      r('Which word means more than one fox?', 'foxes', 'foxs', 'fox', 'foxies'),
      r('Which word means more than one brush?', 'brushes', 'brushs', 'brush', 'brushies'),
      r('Which word means more than one glass?', 'glasses', 'glasss', 'glass', 'glassies'),
      r('Which word means more than one peach?', 'peaches', 'peachs', 'peach', 'peachies'),
    ],
    [
      r('Which word means more than one child?', 'children', 'childs', 'child', 'childrens'),
      r('Which word means more than one mouse?', 'mice', 'mouses', 'mouse', 'mices'),
      r('Which word means more than one foot?', 'feet', 'foots', 'foot', 'footes'),
      r('Which word means more than one tooth?', 'teeth', 'tooths', 'tooth', 'teethes'),
      r('Which word means more than one man?', 'men', 'mans', 'man', 'manes'),
      r('Which word means more than one woman?', 'women', 'womans', 'woman', 'womens'),
      r('Which word means more than one goose?', 'geese', 'gooses', 'goose', 'geeses'),
      r('Which word means more than one wolf?', 'wolves', 'wolfs', 'wolf', 'wolfes'),
    ],
  ],
)

const verbTypes = rowSkill(
  'verbTypes',
  ['Action verbs', 'Linking verbs', 'Helping verbs'],
  [
    [
      r('The dog runs fast.\n\nWhich word is an action verb?', 'runs', 'dog', 'fast', 'The'),
      r('Birds sing in the morning.\n\nWhich word is an action verb?', 'sing', 'Birds', 'morning', 'the'),
      r('Mom bakes bread every day.\n\nWhich word is an action verb?', 'bakes', 'Mom', 'bread', 'day'),
      r('The kids play outside.\n\nWhich word is an action verb?', 'play', 'kids', 'outside', 'The'),
      r('I eat an apple.\n\nWhich word is an action verb?', 'eat', 'apple', 'an', 'I'),
      r('The frog jumps into the pond.\n\nWhich word is an action verb?', 'jumps', 'frog', 'pond', 'into'),
      r('We read a book together.\n\nWhich word is an action verb?', 'read', 'book', 'together', 'We'),
      r('The baby giggles at the cat.\n\nWhich word is an action verb?', 'giggles', 'baby', 'cat', 'the'),
    ],
    [
      r('The soup is hot.\n\nWhich word is a linking verb?', 'is', 'soup', 'hot', 'The'),
      r('Ben seems tired today.\n\nWhich word is a linking verb?', 'seems', 'Ben', 'tired', 'today'),
      r('We were late for the bus.\n\nWhich word is a linking verb?', 'were', 'late', 'bus', 'the'),
      r('She became a doctor.\n\nWhich word is a linking verb?', 'became', 'She', 'doctor', 'a'),
      r('I am ready for school.\n\nWhich word is a linking verb?', 'am', 'I', 'ready', 'school'),
      r('The cookies were warm.\n\nWhich word is a linking verb?', 'were', 'cookies', 'warm', 'The'),
      r('My sister is a nurse.\n\nWhich word is a linking verb?', 'is', 'sister', 'nurse', 'a'),
      r('That song sounds happy.\n\nWhich word is a linking verb?', 'sounds', 'song', 'happy', 'That'),
    ],
    [
      r('She is running to school.\n\nWhich word is a helping verb?', 'is', 'running', 'school', 'She'),
      r('They have finished their lunch.\n\nWhich word is a helping verb?', 'have', 'finished', 'lunch', 'They'),
      r('We will visit Grandma on Sunday.\n\nWhich word is a helping verb?', 'will', 'visit', 'Grandma', 'Sunday'),
      r('The dog has eaten its dinner.\n\nWhich word is a helping verb?', 'has', 'eaten', 'dinner', 'dog'),
      r('I can see the moon tonight.\n\nWhich word is a helping verb?', 'can', 'see', 'moon', 'tonight'),
      r('Dad was painting the fence.\n\nWhich word is a helping verb?', 'was', 'painting', 'fence', 'Dad'),
      r('The kids should brush their teeth.\n\nWhich word is a helping verb?', 'should', 'brush', 'teeth', 'kids'),
      r('The cat is sleeping on the rug.\n\nWhich word is a helping verb?', 'is', 'sleeping', 'rug', 'cat'),
    ],
  ],
  VERB_GATE,
)

const conjunctions = rowSkill(
  'conjunctions',
  ['Conjunctions: and, but, or, so', 'Conjunctions: because, when, if', 'Conjunctions: pairs and phrases'],
  [
    [
      r('Which conjunction adds one more idea?\n\nI like to dance ___ sing.', 'and', 'but', 'so', 'or'),
      r('Which conjunction shows an opposite idea?\n\nI was tired, ___ I kept going.', 'but', 'and', 'so', 'or'),
      r('Which conjunction shows a choice?\n\nDo you want tea ___ juice?', 'or', 'and', 'but', 'so'),
      r('Which conjunction shows a result?\n\nIt rained, ___ we stayed inside.', 'so', 'and', 'but', 'or'),
      r('Which conjunction adds one more idea?\n\nWe ate lunch ___ we played outside.', 'and', 'but', 'so', 'or'),
      r('Which conjunction shows a choice?\n\nStay here ___ come with me.', 'or', 'and', 'but', 'so'),
      r('Which conjunction shows an opposite idea?\n\nThe sun was out, ___ it was cold.', 'but', 'and', 'so', 'or'),
      r('Which conjunction shows a result?\n\nThe store was closed, ___ we went home.', 'so', 'and', 'but', 'or'),
    ],
    [
      r('Which word shows a reason?\n\nWe stayed in ___ it was raining.', 'because', 'although', 'unless', 'when'),
      r('Which word shows a time?\n\nCall me ___ you get home.', 'when', 'because', 'although', 'unless'),
      r('Which word means "if not"?\n\nWe cannot play outside ___ it stops raining.', 'unless', 'because', 'although', 'when'),
      r('Which word shows a contrast?\n\nShe finished her homework ___ she was very tired.', 'although', 'because', 'unless', 'if'),
      r('Which word shows a condition?\n\nYou can go outside ___ you finish your homework.', 'if', 'because', 'although', 'unless'),
      r('Which word shows the order?\n\nWe brushed our teeth ___ we went to bed.', 'before', 'after', 'because', 'although'),
      r('Which word shows the order?\n\nWe wash the dishes ___ we eat dinner.', 'after', 'before', 'because', 'although'),
      r('Which word shows a reason?\n\nShe smiled ___ she got a gift.', 'because', 'although', 'unless', 'if'),
    ],
    [
      r('Which word completes the pair?\n\nBoth the cat ___ the dog were happy.', 'and', 'or', 'nor', 'but'),
      r('Which word completes the pair?\n\nEither tea ___ juice is fine.', 'or', 'nor', 'and', 'but'),
      r('Which word completes the pair?\n\nNeither the bus ___ the train was on time.', 'nor', 'or', 'and', 'but'),
      r('Which word completes the pair?\n\nNot only did she sing, ___ she also danced.', 'but', 'and', 'or', 'nor'),
      r('Which word completes the pair?\n\nWhether you win ___ lose, you did your best.', 'or', 'nor', 'and', 'but'),
      r('Which phrase shows a purpose?\n\nSpeak clearly ___ everyone can hear you.', 'so that', 'because', 'although', 'unless'),
      r('Which phrase shows timing?\n\nWe will leave ___ the bell rings.', 'as soon as', 'unless', 'although', 'because'),
    ],
  ],
  CONJ_GATE,
)

export const READING_MORE: Skill[] = [
  letters,
  letterSounds,
  longVowels,
  rVowels,
  questionWords,
  colorNumberWords,
  locationWords,
  categories,
  realFiction,
  settingCharacter,
  plotSequence,
  compoundWords,
  shadesOfMeaning,
  greekLatin,
]

export const WRITING_MORE: Skill[] = [pluralNouns, verbTypes, conjunctions]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level, keyed by "<subject>.<skill>". Grades never go down by level. */
export const LANGUAGE_MORE_IXL: Record<string, IxlRef[]> = {
  'reading.letters': [e(0, 'Letter identification'), e(0, 'Lowercase and uppercase letters'), e(0, 'Consonants and vowels')],
  'reading.letterSounds': [e(0, 'Beginning and ending sounds'), e(0, 'Short vowel sounds'), e(0, 'Long vowel sounds')],
  'reading.longVowels': [e(1, 'Silent e'), e(1, 'Vowel teams'), e(2, 'Long vowel patterns')],
  'reading.rVowels': [e(1, 'R-controlled vowels'), e(2, 'R-controlled vowels'), e(2, 'Variant vowels')],
  'reading.questionWords': [e(0, 'Question words'), e(0, 'Question words'), e(0, 'Question words')],
  'reading.colorNumberWords': [e(0, 'Color and number words'), e(0, 'Color and number words'), e(0, 'Color and number words')],
  'reading.locationWords': [e(0, 'Location words'), e(0, 'Location words'), e(0, 'Location words')],
  'reading.categories': [e(0, 'Categories'), e(1, 'Categories'), e(2, 'Categories')],
  'reading.realFiction': [e(0, 'Reality vs. fiction'), e(1, 'Reality vs. fiction'), e(1, 'Reality vs. fiction')],
  'reading.settingCharacter': [e(1, 'Setting and character'), e(2, 'Setting and character'), e(3, 'Story elements')],
  'reading.plotSequence': [e(1, 'Sequence'), e(1, 'Plot'), e(2, 'Sequence')],
  'reading.compoundWords': [e(2, 'Compound words'), e(3, 'Compound words'), e(4, 'Compound words')],
  'reading.shadesOfMeaning': [e(2, 'Shades of meaning'), e(3, 'Shades of meaning'), e(4, 'Shades of meaning')],
  'reading.greekLatin': [e(3, 'Greek and Latin roots'), e(4, 'Greek and Latin roots'), e(5, 'Greek and Latin roots')],
  'writing.pluralNouns': [e(0, 'Nouns'), e(1, 'Nouns'), e(2, 'Nouns')],
  'writing.verbTypes': [e(2, 'Verb types'), e(3, 'Verb types'), e(4, 'Verb types')],
  'writing.conjunctions': [e(3, 'Conjunctions'), e(4, 'Conjunctions'), e(5, 'Conjunctions')],
}
