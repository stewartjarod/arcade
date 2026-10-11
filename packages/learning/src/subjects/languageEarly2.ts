import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * More early reading and writing (K–2), for the IXL topics the earlier early-language files
 * don't cover yet: learning letters, letter sounds, word recognition, book and text features,
 * story order and setting, point of view, short read-along passages, multiple-meaning and clue
 * words, silent e and vowel teams, soft c and g, action and describing words, spelling endings,
 * prefixes and suffixes, linking words, topic sentences, opinions, and abbreviations.
 *
 * Each skill is a hand-written bank per level, like languageEarly.ts. A row is one question, one
 * right answer, and three wrong answers. Every wrong answer is clearly wrong by hand-check (no
 * judgment calls, and no case-only differences, because answers are compared ignoring case).
 * Keys are "<skill>:<level>:<row>", so a missed question can be rebuilt exactly.
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

/** One skill from its banks, three levels, one choice format. */
function rowSkill(id: string, labels: string[], banks: Row[][]): Skill {
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

// --- Reading: letters and sounds ----------------------------------------------------------------

const learnLetters = rowSkill(
  'learnLetters',
  ['Letters A to H', 'Letters I to P', 'Letters Q to Z'],
  [
    [
      r('Find the letter B.', 'B', 'E', 'H', 'D'),
      r('Find the letter F.', 'F', 'A', 'C', 'H'),
      r('Find the letter A.', 'A', 'D', 'G', 'H'),
      r('Find the letter E.', 'E', 'B', 'F', 'C'),
      r('Find the letter G.', 'G', 'H', 'C', 'D'),
      r('Find the letter D.', 'D', 'A', 'B', 'F'),
      r('Find the letter H.', 'H', 'A', 'E', 'G'),
      r('Find the letter C.', 'C', 'G', 'E', 'H'),
      r('Which letter comes right after A?', 'B', 'D', 'E', 'H'),
      r('Which letter comes right before E?', 'D', 'B', 'F', 'G'),
    ],
    [
      r('Find the letter K.', 'K', 'M', 'P', 'I'),
      r('Find the letter M.', 'M', 'L', 'P', 'I'),
      r('Find the letter P.', 'P', 'O', 'I', 'N'),
      r('Find the letter J.', 'J', 'I', 'L', 'N'),
      r('Find the letter N.', 'N', 'M', 'O', 'K'),
      r('Find the letter I.', 'I', 'J', 'L', 'P'),
      r('Find the letter L.', 'L', 'K', 'M', 'O'),
      r('Find the letter O.', 'O', 'N', 'P', 'I'),
      r('Which letter comes right after L?', 'M', 'K', 'N', 'P'),
      r('Which letter comes right before J?', 'I', 'K', 'H', 'L'),
    ],
    [
      r('Find the letter T.', 'T', 'R', 'Y', 'V'),
      r('Find the letter W.', 'W', 'V', 'X', 'Z'),
      r('Find the letter Q.', 'Q', 'P', 'R', 'Z'),
      r('Find the letter Y.', 'Y', 'X', 'Z', 'U'),
      r('Find the letter S.', 'S', 'R', 'T', 'Q'),
      r('Find the letter V.', 'V', 'U', 'W', 'Y'),
      r('Find the letter X.', 'X', 'Y', 'W', 'Z'),
      r('Find the letter Z.', 'Z', 'X', 'Y', 'Q'),
      r('Which letter comes right after S?', 'T', 'Q', 'R', 'U'),
      r('Which letter comes right before U?', 'T', 'V', 'W', 'S'),
    ],
  ],
)

const letterSoundMatch = rowSkill(
  'letterSoundMatch',
  ['Letter sounds at the start', 'Short vowel sounds', 'Last sounds of words'],
  [
    [
      p('🐶', 'Which letter says "duh"?', 'd', 'b', 'p', 'm'),
      p('🦁', 'Which letter says "lll"?', 'l', 'r', 'n', 't'),
      p('🌞', 'Which letter says "sss"?', 's', 'z', 'f', 't'),
      p('🐷', 'Which letter says "puh"?', 'p', 'b', 't', 'm'),
      p('🐟', 'Which letter says "fff"?', 'f', 'v', 's', 'p'),
      p('🌙', 'Which letter says "mmm"?', 'm', 'n', 'w', 'b'),
      p('🎁', 'Which letter says "guh"?', 'g', 'j', 'y', 'w'),
      p('🐯', 'Which letter says "tuh"?', 't', 'd', 'p', 'k'),
      p('🏠', 'Which letter says "huh"?', 'h', 'n', 'w', 'k'),
      p('🦓', 'Which letter says "zzz"?', 'z', 's', 'j', 'v'),
    ],
    [
      p('🍎', 'Which letter makes the "ah" sound in apple?', 'a', 'e', 'i', 'u'),
      p('🧢', 'Which letter makes the "ah" sound in cap?', 'a', 'e', 'u', 'i'),
      p('🥚', 'Which letter makes the "eh" sound in egg?', 'e', 'a', 'i', 'u'),
      p('🐔', 'Which letter makes the "eh" sound in hen?', 'e', 'u', 'a', 'i'),
      p('🐷', 'Which letter makes the "ih" sound in pig?', 'i', 'a', 'e', 'u'),
      p('🐥', 'Which letter makes the "ih" sound in chick?', 'i', 'u', 'e', 'a'),
      p('🥁', 'Which letter makes the "uh" sound in drum?', 'u', 'i', 'a', 'e'),
      p('🚌', 'Which letter makes the "uh" sound in bus?', 'u', 'e', 'a', 'i'),
      p('🐜', 'Which letter makes the "ah" sound in ant?', 'a', 'i', 'u', 'e'),
      p('🧒', 'Which letter makes the "ih" sound in kid?', 'i', 'a', 'u', 'e'),
    ],
    [
      r('Which letter makes the last sound in "dog"?', 'g', 'd', 'b', 'p'),
      r('Which letter makes the last sound in "bus"?', 's', 'b', 't', 'p'),
      r('Which letter makes the last sound in "cap"?', 'p', 'b', 't', 'd'),
      r('Which letter makes the last sound in "sun"?', 'n', 'm', 't', 'd'),
      r('Which letter makes the last sound in "rug"?', 'g', 'k', 'd', 'b'),
      r('Which letter makes the last sound in "bed"?', 'd', 'b', 't', 'g'),
      r('Which letter makes the last sound in "hat"?', 't', 'h', 'n', 'p'),
      r('Which letter makes the last sound in "bell"?', 'l', 'b', 't', 'm'),
      r('Which letter makes the last sound in "pen"?', 'n', 'p', 'm', 't'),
      r('Which letter makes the last sound in "jam"?', 'm', 'j', 'n', 't'),
    ],
  ],
)

const wordMatch = rowSkill(
  'wordMatch',
  ['Short words', 'Sight words', 'Longer words'],
  [
    [
      r('Which word says "cat"?', 'cat', 'cut', 'cot', 'cap'),
      r('Which word says "dog"?', 'dog', 'dig', 'bog', 'dot'),
      r('Which word says "sun"?', 'sun', 'son', 'fun', 'run'),
      r('Which word says "pig"?', 'pig', 'big', 'peg', 'pin'),
      r('Which word says "hat"?', 'hat', 'hit', 'had', 'mat'),
      r('Which word says "bus"?', 'bus', 'bun', 'bug', 'but'),
      r('Which word says "red"?', 'red', 'rod', 'bed', 'rid'),
      r('Which word says "map"?', 'map', 'mop', 'nap', 'mad'),
      r('Which word says "log"?', 'log', 'leg', 'lag', 'lot'),
      r('Which word says "fox"?', 'fox', 'box', 'fix', 'fog'),
    ],
    [
      r('Which word says "the"?', 'the', 'she', 'then', 'they'),
      r('Which word says "said"?', 'said', 'sad', 'sand', 'side'),
      r('Which word says "come"?', 'come', 'came', 'home', 'cone'),
      r('Which word says "what"?', 'what', 'that', 'went', 'with'),
      r('Which word says "are"?', 'are', 'ear', 'art', 'arm'),
      r('Which word says "funny"?', 'funny', 'fuzzy', 'bunny', 'sunny'),
      r('Which word says "please"?', 'please', 'plate', 'plane', 'place'),
      r('Which word says "every"?', 'every', 'very', 'berry', 'even'),
      r('Which word says "again"?', 'again', 'against', 'apart', 'asleep'),
      r('Which word says "those"?', 'those', 'these', 'close', 'chose'),
    ],
    [
      r('Which word says "morning"?', 'morning', 'warning', 'evening', 'nothing'),
      r('Which word says "garden"?', 'garden', 'harden', 'burden', 'gadget'),
      r('Which word says "rabbit"?', 'rabbit', 'ribbon', 'habit', 'bandit'),
      r('Which word says "kitchen"?', 'kitchen', 'chicken', 'kitten', 'pitcher'),
      r('Which word says "pencil"?', 'pencil', 'pickle', 'pistol', 'stencil'),
      r('Which word says "window"?', 'window', 'winter', 'shadow', 'yellow'),
      r('Which word says "happy"?', 'happy', 'puppy', 'hippo', 'hurry'),
      r('Which word says "summer"?', 'summer', 'number', 'hammer', 'lumber'),
      r('Which word says "winter"?', 'winter', 'water', 'hunter', 'sister'),
      r('Which word says "tomorrow"?', 'tomorrow', 'tomato', 'borrow', 'tornado'),
    ],
  ],
)

const bookParts = rowSkill(
  'bookParts',
  ['Parts of a book', 'Text features', 'More text features'],
  [
    [
      r('The front of a book is the ___.', 'cover', 'page', 'word', 'letter'),
      r('The name of a book is its ___.', 'title', 'author', 'page', 'letter'),
      r('The person who writes a book is the ___.', 'author', 'title', 'page', 'cover'),
      r('The part that holds the pages together is the ___.', 'spine', 'title', 'page', 'word'),
      r('A list of the chapters and their pages is the ___.', 'table of contents', 'glossary', 'cover', 'spine'),
      r('The person who draws the pictures in a book is the ___.', 'illustrator', 'page', 'title', 'spine'),
      r('The number at the top of a page is the ___.', 'page number', 'author', 'cover', 'spine'),
      r('The first page of a book with the title and author is the ___.', 'title page', 'table of contents', 'glossary', 'spine'),
      r('The front and back of a book are both called the ___.', 'cover', 'page', 'spine', 'title'),
      r('The list at the back of a book, with topics and pages, is the ___.', 'index', 'cover', 'spine', 'illustrator'),
    ],
    [
      r('The ___ tells what a word means.', 'glossary', 'index', 'caption', 'heading'),
      r('Words in dark, thick print are called ___ words.', 'bold', 'tiny', 'curved', 'hidden'),
      r('The words under a picture that tell about it are the ___.', 'caption', 'title', 'index', 'heading'),
      r('A big title for a part of the page is a ___.', 'heading', 'caption', 'glossary', 'index'),
      r('The list at the back that shows where topics are is the ___.', 'index', 'glossary', 'caption', 'heading'),
      r('A picture with labels that name its parts is a ___.', 'diagram', 'poem', 'letter', 'riddle'),
      r('A map in a book shows where ___ are.', 'places', 'feelings', 'sounds', 'numbers'),
      r('The list at the front that shows the chapters is the ___.', 'table of contents', 'glossary', 'caption', 'heading'),
      r('Which text feature tells what a hard word means?', 'glossary', 'caption', 'heading', 'index'),
      r('A short line that tells about a photo is a ___.', 'caption', 'heading', 'index', 'glossary'),
    ],
    [
      r('Which text feature tells where to find a topic in the book?', 'index', 'glossary', 'caption', 'heading'),
      r('Which text feature lists the chapters and their starting pages?', 'table of contents', 'glossary', 'caption', 'heading'),
      r('Which text feature tells what a word means?', 'glossary', 'index', 'heading', 'caption'),
      r('A short line under a photo that tells about it is a ___.', 'caption', 'heading', 'glossary', 'index'),
      r('Which text feature is a title for part of a page?', 'heading', 'caption', 'glossary', 'index'),
      r('Which text feature shows a picture with labels pointing to its parts?', 'diagram', 'glossary', 'index', 'caption'),
      r('Which text feature uses dark print to show important words?', 'bold', 'caption', 'index', 'heading'),
      r('Which text feature is a list at the back, in ABC order, with page numbers?', 'index', 'glossary', 'caption', 'heading'),
      r('Which text feature explains the symbols on a map?', 'legend', 'glossary', 'index', 'caption'),
      r('Which text feature is found at the front and lists the chapters?', 'table of contents', 'index', 'heading', 'caption'),
    ],
  ],
)

const storyOrder = rowSkill(
  'storyOrder',
  ['What came first', 'What came right after', 'The story problem'],
  [
    [
      r('Sam got up. He brushed his teeth. He ate eggs. He went to school. What happened first?', 'Sam got up', 'He brushed his teeth', 'He ate eggs', 'He went to school'),
      r('We planted a seed. It grew roots. It got leaves. It bloomed. What happened last?', 'It bloomed', 'We planted a seed', 'It grew roots', 'It got leaves'),
      r('The baker mixed the dough. She baked the bread. She cut the bread. She sold the bread. What happened first?', 'The baker mixed the dough', 'She baked the bread', 'She cut the bread', 'She sold the bread'),
      r('Ben put on his coat. He went outside. He played in the snow. He came home. What happened last?', 'He came home', 'Ben put on his coat', 'He went outside', 'He played in the snow'),
      r('Ana filled the pot with water. She put it on the stove. The water got hot. The pasta was cooked. What happened first?', 'Ana filled the pot with water', 'She put it on the stove', 'The water got hot', 'The pasta was cooked'),
      r('The puppy ate its food. The puppy took a nap. The puppy played with a ball. The puppy went for a walk. What happened last?', 'The puppy went for a walk', 'The puppy ate its food', 'The puppy took a nap', 'The puppy played with a ball'),
      r('The cat slept on the bed. The cat woke up. The cat stretched. The cat ate breakfast. What happened first?', 'The cat slept on the bed', 'The cat woke up', 'The cat stretched', 'The cat ate breakfast'),
      r('Lee drew a picture. Lee painted it blue. Lee let it dry. Lee hung it on the wall. What happened last?', 'Lee hung it on the wall', 'Lee drew a picture', 'Lee painted it blue', 'Lee let it dry'),
      r('Kim washed the car. Kim dried the car. Kim drove the car to the park. Kim parked the car. What happened first?', 'Kim washed the car', 'Kim dried the car', 'Kim drove the car to the park', 'Kim parked the car'),
      r('The rain fell. The puddles grew. The sun came out. The rainbow appeared. What happened last?', 'The rainbow appeared', 'The rain fell', 'The puddles grew', 'The sun came out'),
    ],
    [
      r('Tom made a snowman. Then he added a hat. Next, he added a scarf. Last, he took a picture. What happened right after Tom added a hat?', 'He added a scarf', 'He made a snowman', 'He added a hat', 'He took a picture'),
      r('Zoe filled the tub. She got in. She washed her hair. She dried off. What happened right after Zoe got in?', 'She washed her hair', 'Zoe filled the tub', 'She got in', 'She dried off'),
      r('Max opened the box. He took out a kite. He ran outside. He flew it high. What happened right after Max took out a kite?', 'He ran outside', 'Max opened the box', 'He took out a kite', 'He flew it high'),
      r('Ivy baked a pie. She let it cool. She cut a slice. She ate the slice. What happened right before Ivy cut a slice?', 'She let it cool', 'Ivy baked a pie', 'She cut a slice', 'She ate the slice'),
      r('Ray lit the candles. He sang a song. He blew out the candles. He ate cake. What happened right before Ray blew out the candles?', 'He sang a song', 'Ray lit the candles', 'He blew out the candles', 'He ate cake'),
      r('The frog jumped in the pond. It swam to a rock. It sat in the sun. It hopped away. What happened right after the frog swam to a rock?', 'It sat in the sun', 'The frog jumped in the pond', 'It swam to a rock', 'It hopped away'),
      r('Pam packed her bag. She put on her boots. She walked to the bus. She waved goodbye. What happened right after Pam put on her boots?', 'She walked to the bus', 'Pam packed her bag', 'She put on her boots', 'She waved goodbye'),
      r('The bell rang. The students lined up. They walked inside. They sat down. What happened right before the students walked inside?', 'The students lined up', 'The bell rang', 'They walked inside', 'They sat down'),
      r('Leo planted corn. He watered it. The corn grew tall. He picked the corn. What happened right after Leo watered it?', 'The corn grew tall', 'Leo planted corn', 'He watered it', 'He picked the corn'),
      r('Rosa swept the floor. She mopped it. She let it dry. She put the mop away. What happened right before Rosa let it dry?', 'She mopped it', 'Rosa swept the floor', 'She let it dry', 'She put the mop away'),
    ],
    [
      r("Jen's bike had a flat tire. She pumped air into the tire. Now the bike rolls fine. What was the problem in the story?", "Jen's bike had a flat tire", 'She pumped air into the tire', 'The bike rolls fine', 'Jen bought a new car'),
      r("Omar lost his dog at the park. He called its name and looked behind the trees. He found the dog sleeping by the pond. What was the problem?", 'Omar lost his dog', 'He found the dog by the pond', 'He looked behind the trees', 'The dog was sleeping'),
      r('The soup was too hot to eat. Kim blew on it and waited. Now it is just right. What was the problem?', 'The soup was too hot', 'Kim blew on it', 'Kim waited', 'The soup is just right'),
      r('The cookies were burning in the oven. Dad took them out and set the timer. What was the problem?', 'The cookies were burning', 'Dad took them out', 'Dad set the timer', 'Dad bought new cookies'),
      r('Lily could not reach the top shelf. She got a step stool and climbed up. She got the book. What was the problem?', 'Lily could not reach the top shelf', 'She got a step stool', 'She got the book', 'She climbed up'),
      r('The team had no ball for the game. Maya ran home and brought her own ball. The game started on time. What was the problem?', 'The team had no ball', 'Maya brought her own ball', 'The game started on time', 'Maya ran home'),
      r("Sam's tent leaked when it rained. He patched the hole with tape. The tent stayed dry. What was the problem?", "Sam's tent leaked when it rained", 'He patched the hole with tape', 'The tent stayed dry', 'Sam bought a new car'),
      r('The class pet was missing from its cage. The students searched the room. They found the hamster under a desk. What was the problem?', 'The class pet was missing', 'The students searched the room', 'They found the hamster', 'The hamster was under a desk'),
      r('Ana could not hear her friend in the loud gym. They moved to the hall where it was quiet. Now they can talk. What was the problem?', 'Ana could not hear her friend', 'They moved to the hall', 'It was quiet in the hall', 'They can talk now'),
      r('The shelf was too wobbly to hold books. Grandpa put a new screw in it. Now it is steady. What was the problem?', 'The shelf was too wobbly', 'Grandpa put a new screw in it', 'The shelf is steady now', 'Grandpa bought new books'),
    ],
  ],
)

const storySetting = rowSkill(
  'storySetting',
  ['Where the story happens', 'Who the main character is', 'When the story happens'],
  [
    [
      r('Max rode his bike down the big hill at the park. Where does the story happen?', 'at the park', 'in a bathtub', 'on the moon', 'in a shoe'),
      r('Mom and I baked bread in our kitchen. Where does the story happen?', 'in a kitchen', 'under the sea', 'in a barn', 'on a train'),
      r('The fish swam through the blue water. Where does the story happen?', 'in the water', 'in a tree', 'in the desert', 'on a shelf'),
      r('The cows ate grass in the big green field. Where does the story happen?', 'in a field', 'in a library', 'at a bus stop', 'in a pool'),
      r('We ran through the snow and built a fort. Where does the story happen?', 'in the snow', 'at the beach', 'in a pool', 'on the roof'),
      r('Lily sat in her seat and read a book at school. Where does the story happen?', 'at school', 'at the beach', 'in the pond', 'in the forest'),
      r('The cat slept in the sunny window all day. Where does the story happen?', 'by a sunny window', 'in a cave', 'under the bed', 'in a boat'),
      r('Dad drove us to the farm to pick apples. Where does the story happen?', 'at a farm', 'on a rocket', 'in a castle', 'in the pool'),
      r('The train whistle blew as we waited at the station. Where does the story happen?', 'at a train station', 'in a library', 'in the desert', 'at the dentist'),
      r('Bo splashed in the pool all afternoon. Where does the story happen?', 'at a pool', 'in a dark cave', 'at the mall', 'on a mountain'),
    ],
    [
      r('Ruby the puppy wagged her tail. Who is the main character?', 'Ruby the puppy', 'a red ball', 'the park', 'the sun'),
      r('Grandma Jo knitted a long scarf for me. Who is the main character?', 'Grandma Jo', 'a long scarf', 'the winter', 'a cold day'),
      r('A little frog wanted to hop across the pond. Who is the main character?', 'a little frog', 'the pond', 'a lily pad', 'the rain'),
      r('Ellie found a shiny rock on the beach. Who is the main character?', 'Ellie', 'the shiny rock', 'the beach', 'the waves'),
      r('The brave firefighter climbed the ladder to help. Who is the main character?', 'the firefighter', 'the ladder', 'the tall tree', 'the fire truck'),
      r('Yuki built a tall sand castle at the beach. Who is the main character?', 'Yuki', 'the sand castle', 'the ocean', 'the sunset'),
      r('The little bear was lost in the woods. Who is the main character?', 'the little bear', 'the woods', 'the rain', 'a map'),
      r('The old robot cleaned the house every day. Who is the main character?', 'the old robot', 'the house', 'the broom', 'the day'),
      r('Nora painted a rainbow on the wall of her room. Who is the main character?', 'Nora', 'the rainbow', 'the wall', 'the room'),
      r('The tiny mouse found a crumb under the table. Who is the main character?', 'the tiny mouse', 'the crumb', 'the table', 'the kitchen'),
    ],
    [
      r('Snowflakes fell on the streets as Ana built a snowman. When does the story happen?', 'in winter', 'in summer', 'at lunchtime', 'at midnight'),
      r('The stars shone bright as Dad read me a story in bed. When does the story happen?', 'at night', 'at lunchtime', 'in the morning', 'at noon'),
      r('Birds sang as the sun came up over the hill. When does the story happen?', 'in the morning', 'at midnight', 'at noon', 'late at night'),
      r('We ate watermelon on the hot, sunny day. When does the story happen?', 'in summer', 'in winter', 'at midnight', 'on Christmas Eve'),
      r('The leaves turned orange and fell from the trees. When does the story happen?', 'in autumn', 'in summer', 'in spring', 'at midnight'),
      r('The school bell rang, and the kids ran out for recess. When does the story happen?', 'during the school day', 'on a Saturday morning', 'at midnight', 'in the summer'),
      r('The ice cream melted fast on the hot pavement. When does the story happen?', 'on a hot day', 'on a snowy night', 'in January', 'at midnight'),
      r('Grandpa told stories by the fire on a cold, dark evening. When does the story happen?', 'on a cold evening', 'in the middle of summer', 'at noon', 'at lunchtime'),
      r('The kids put on their pajamas and brushed their teeth. When does the story happen?', 'at bedtime', 'at lunchtime', 'at recess', 'in the morning'),
      r('The farmer planted corn seeds in the spring. When does the story happen?', 'in spring', 'in winter', 'in autumn', 'at midnight'),
    ],
  ],
)

const PERSONS = ['first person', 'second person', 'third person', 'fourth person']

/** Point of view: say which person a sentence is told in. Each level has a different person. */
const personRow = (sentence: string, answer: string): Row => ({
  q: `Which person is this sentence told in? "${sentence}"`,
  a: answer,
  w: PERSONS.filter((x) => x !== answer).slice(0, 3),
})

const pointOfView = rowSkill(
  'pointOfView',
  ['First person (I, we)', 'Third person (he, she, they)', 'Second person (you)'],
  [
    [
      personRow('I like to draw pictures of cats.', 'first person'),
      personRow('We went to the lake on Saturday.', 'first person'),
      personRow('My dad and I made pancakes.', 'first person'),
      personRow('I can tie my own shoes now.', 'first person'),
      personRow('We put our bikes in the garage.', 'first person'),
      personRow('I found a shiny rock in my yard.', 'first person'),
      personRow('Our class sang a song today.', 'first person'),
      personRow('I lost my red mitten at the park.', 'first person'),
      personRow('We love to play soccer after school.', 'first person'),
      personRow('I wrote a letter to my grandma.', 'first person'),
    ],
    [
      personRow('She likes to draw pictures of cats.', 'third person'),
      personRow('Tom and Jo went to the lake on Saturday.', 'third person'),
      personRow('Her dad made pancakes with blueberries.', 'third person'),
      personRow('He can tie his own shoes now.', 'third person'),
      personRow('They put their bikes in the garage.', 'third person'),
      personRow('Lena found a shiny rock in her yard.', 'third person'),
      personRow('The class sang a song today.', 'third person'),
      personRow('Max lost his red mitten at the park.', 'third person'),
      personRow('They love to play soccer after school.', 'third person'),
      personRow('Grandpa wrote a letter to his friend.', 'third person'),
    ],
    [
      personRow('You can draw a picture of a cat.', 'second person'),
      personRow('You should bring a warm coat to the lake.', 'second person'),
      personRow('Your dad can make pancakes for you.', 'second person'),
      personRow('You can tie your shoes now.', 'second person'),
      personRow('You put your bike in the garage.', 'second person'),
      personRow('Will you find a shiny rock in the yard?', 'second person'),
      personRow('You and your class sang a song today.', 'second person'),
      personRow('You lost your mitten at the park.', 'second person'),
      personRow('You all love to play soccer.', 'second person'),
      personRow('You wrote a letter to your grandma.', 'second person'),
    ],
  ],
)

const readAlongLit = rowSkill(
  'readAlongLit',
  ['Short read-along stories', 'Read-alone stories', 'Longer read-alone stories'],
  [
    [
      r('Pip is a small brown dog. He likes to fetch sticks. What does Pip like to do?', 'fetch sticks', 'bake bread', 'fly kites', 'read books'),
      r('The sun was hot. Mia put on her hat and went to the pool. Where did Mia go?', 'to the pool', 'to the zoo', 'to school', 'to bed'),
      r('Jake had a big red kite. The wind was strong, and the kite flew high. What did Jake have?', 'a big red kite', 'a blue boat', 'a green frog', 'a tall tree'),
      r('Nana made soup on a cold day. We ate it with bread. What did we eat with the soup?', 'bread', 'cake', 'ice cream', 'pizza'),
      r('The hen laid three eggs. Her chicks hatched out in the spring. How many eggs did the hen lay?', 'three', 'two', 'five', 'ten'),
      r('Ella saw a big frog on a log. It jumped into the pond. Where did the frog jump?', 'into the pond', 'onto a rock', 'into a box', 'under a bed'),
      r('Ted lost his hat at the park. He looked under the bench and found it. Where did Ted find his hat?', 'under the bench', 'in the car', 'at home', 'in a tree'),
      r('The baby bird was hungry. Mom bird brought a worm. What did Mom bird bring?', 'a worm', 'a sock', 'a cookie', 'a ball'),
      r('Dad and I went to the store. We bought milk, eggs, and bread. What did we buy?', 'milk, eggs, and bread', 'a bike and a ball', 'toys and paint', 'shoes and socks'),
      r('The cat sat by the door. It wanted to go out and play. What did the cat want?', 'to go out and play', 'a bath', 'to take a nap', 'to read a book'),
    ],
    [
      r('Lucy and her brother Sam planted a garden in May. They put carrots and beans in the dirt. Each day they gave the plants water. What did they plant?', 'carrots and beans', 'roses and corn', 'tomatoes and peas', 'pumpkins and grass'),
      r('Owen wanted a pet. His mom said he could get a fish. Owen picked a gold fish named Bubbles. What is the fish named?', 'Bubbles', 'Goldie', 'Nemo', 'Splash'),
      r('The class went to the farm on a bus. They saw cows, pigs, and sheep. The sheep were white and fluffy. What did the class see at the farm?', 'cows, pigs, and sheep', 'horses and dogs', 'ducks and geese', 'lions and bears'),
      r('Gabe had a cold. He stayed home from school for two days. He drank hot tea and rested in bed. How many days did Gabe stay home?', 'two days', 'one day', 'three days', 'five days'),
      r('Ava made a card for her grandpa. She drew a big heart on the front. Inside, she wrote a note. Where did Ava draw the heart?', 'on the front of the card', 'inside the card', 'on the back of the card', 'on a box'),
      r('Our family went camping by a lake. We put up our tent before dark. In the morning, we ate pancakes. What did we eat in the morning?', 'pancakes', 'pizza', 'soup', 'eggs and toast'),
      r('Ray wanted to win the race. He practiced running every day after school. On race day, he came in second place. What place did Ray get?', 'second place', 'first place', 'third place', 'last place'),
      r('The library had a new book about whales. Maya read it during lunch. She learned that whales breathe air. What did Maya learn?', 'whales breathe air', 'whales can fly', 'whales live on land', 'whales have feathers'),
      r('Tom liked to draw. He drew a dragon, a castle, and a boat. He gave the boat picture to his friend. What did Tom give his friend?', 'a boat picture', 'a dragon picture', 'a castle picture', 'a map'),
      r('The bakery opened at seven. Mrs. Ruiz baked rolls and muffins. By noon, all the muffins were sold. What was sold out by noon?', 'the muffins', 'the apples', 'the pies', 'the bread'),
    ],
    [
      r('Nina was nervous on her first day at a new school. She sat alone at lunch. Then a girl named Pam asked to sit with her. They talked about their favorite books all lunch long. What did Pam and Nina talk about?', 'their favorite books', 'the weather', 'their pets', 'math homework'),
      r('The storm knocked out the power for three hours. Grandma lit a candle and told us stories. We played cards by the light. How long was the power out?', 'three hours', 'one hour', 'two days', 'all night'),
      r('Jorge wanted to build a tree house. He drew a plan on paper first. Then he gathered wood and nails. What did Jorge draw first?', 'a plan on paper', 'a tree', 'a wall', 'a window'),
      r('The museum had a dinosaur bones exhibit. Ellie took notes about the big T. rex skeleton. She also drew a picture of its teeth. What did Ellie draw?', 'its teeth', 'its tail', 'its footprints', 'its eggs'),
      r('Marco entered a science fair with a volcano. He mixed baking soda and vinegar in the cone. The mixture fizzed and bubbled over the top. What did the mixture do?', 'fizzed and bubbled over', 'froze solid', 'turned blue', 'made a loud song'),
      r('Our town holds a parade each summer. The marching band plays first, followed by the fire trucks. Kids ride decorated bikes at the end. Which came first in the parade?', 'the marching band', 'the fire trucks', 'the decorated bikes', 'the kids'),
      r('Rain fell on the farm for days. The creek rose over its banks. Farmer Jo moved her sheep to higher ground. By the next week, the water went down. What did Farmer Jo do?', 'moved her sheep to higher ground', 'built a new barn', 'sold her cows', 'planted corn'),
      r('Aisha wanted to earn money for a bike. She washed cars on Saturdays. She saved every dollar in a jar. After six weeks, she had enough. What was Aisha saving money for?', 'a bike', 'a new dog', 'a trip to the moon', 'a phone'),
      r('The lighthouse keeper climbed 90 steps each night. He lit the lamp so ships could see the rocks. In the morning, he cleaned the glass. How many steps did he climb?', '90 steps', '9 steps', '900 steps', '45 steps'),
      r('Ben read the directions twice before building the shelf. He laid out all the screws. Then he followed each step. What did Ben read twice?', 'the directions', 'the shelf', 'a map of town', 'the mail'),
    ],
  ],
)

const infoText = rowSkill(
  'infoText',
  ['Read-along facts', 'Read-alone facts', 'Longer facts'],
  [
    [
      r('Bees make honey. They take nectar from flowers. What do bees make?', 'honey', 'milk', 'bread', 'cheese'),
      r('Frogs start life as eggs in the water. The eggs hatch into tadpoles. What do frogs start life as?', 'eggs', 'puppies', 'kittens', 'seeds'),
      r('Penguins cannot fly. They use their wings to swim fast in the sea. Where do penguins swim?', 'in the sea', 'in the sky', 'in a tree', 'in the desert'),
      r('A cat has soft fur. Cats use their whiskers to feel things. What do cats use to feel things?', 'whiskers', 'feathers', 'wings', 'shells'),
      r('The sun is a star. It gives us light and heat. What does the sun give us?', 'light and heat', 'milk and eggs', 'cars and trucks', 'books and toys'),
      r('Snowflakes are made of tiny ice crystals. Most snowflakes have six sides. How many sides does a snowflake usually have?', 'six', 'four', 'eight', 'ten'),
      r('Turtles have hard shells. The shell keeps them safe. What keeps a turtle safe?', 'its hard shell', 'its long tail', 'its big ears', 'its soft fur'),
      r('A cow gives us milk. We can make butter and cheese from milk. What can we make from milk?', 'butter and cheese', 'bread and rice', 'candy and jam', 'paint and glue'),
      r('Ants live together in big groups. Each group is called a colony. What is an ant group called?', 'a colony', 'a herd', 'a flock', 'a pack'),
      r('Owls can turn their heads very far. This helps them look around. What can owls do?', 'turn their heads far', 'swim fast', 'dig deep holes', 'sing in the sea'),
    ],
    [
      r('Honeybees live in hives. A hive has thousands of bees. Worker bees make honey and care for the young. The queen bee lays the eggs. Who lays the eggs in a hive?', 'the queen bee', 'the worker bees', 'the drones', 'the baby bees'),
      r('Mount Everest is the tallest mountain above sea level. It is in Asia. Its top is over 29,000 feet high. Where is Mount Everest?', 'in Asia', 'in Africa', 'in South America', 'in Europe'),
      r('A butterfly starts as an egg. The egg hatches into a caterpillar. The caterpillar makes a chrysalis. A butterfly comes out of the chrysalis. What comes out of the chrysalis?', 'a butterfly', 'a caterpillar', 'an egg', 'a moth'),
      r('Earthworms help plants grow. They dig tunnels in the soil. The tunnels let air and water reach the roots. What do earthworms dig?', 'tunnels', 'ponds', 'caves', 'roads'),
      r('The Sahara is a desert in Africa. It is very hot in the day. It gets cold at night. What is the Sahara?', 'a desert', 'an ocean', 'a forest', 'a city'),
      r('Sea otters float on their backs in the ocean. They hold hands while they sleep so they do not drift apart. How do sea otters keep from drifting apart?', 'they hold hands', 'they swim in circles', 'they dig holes', 'they fly away'),
      r('Farmers plant corn seeds in the spring. The corn grows tall in the summer. In the fall, farmers pick the ears. When do farmers pick the corn?', 'in the fall', 'in the winter', 'in the spring', 'in the summer'),
      r('A rainbow forms when sunlight passes through rain drops. Red is at the top of a rainbow. Violet is at the bottom. What color is at the top of a rainbow?', 'red', 'violet', 'green', 'blue'),
      r('Polar bears live in the Arctic. Their thick fur keeps them warm. They hunt seals on the ice. Where do polar bears live?', 'in the Arctic', 'in the Sahara', 'in the rainforest', 'in the Amazon'),
      r('Lightning is a huge spark of electricity. Thunder is the sound it makes. We see lightning before we hear thunder. What do we hear after seeing lightning?', 'thunder', 'rain', 'wind', 'music'),
    ],
    [
      r('Octopuses have three hearts. Two hearts pump blood to the gills. The third heart pumps blood to the rest of the body. How many hearts does an octopus have?', 'three', 'one', 'two', 'four'),
      r('Bats are the only mammals that can truly fly. Many bats use echolocation to find food in the dark. They make sounds and listen for the echoes. How do many bats find food in the dark?', 'by echolocation', 'by smell alone', 'with bright lights', 'by sleeping'),
      r('Glaciers are huge sheets of slow-moving ice. They form over many years from packed snow. Some glaciers move only a few inches a day. What forms a glacier?', 'packed snow over many years', 'hot sand', 'rain in the summer', 'boiling water'),
      r('The Nile is one of the longest rivers in the world. It flows north through northeastern Africa. Ancient Egyptians farmed along its banks. Which way does the Nile flow?', 'north', 'south', 'east', 'west'),
      r('Coral reefs are built by tiny animals called polyps. Over many years, the polyps leave hard skeletons. These skeletons pile up to form reefs. What builds coral reefs?', 'tiny animals called polyps', 'large fish', 'ocean waves', 'seaweed plants'),
      r('Honey hardly ever goes bad. Scientists have found honey in ancient tombs that still looked fine. Honey has very little water in it. Why does honey last so long?', 'it has very little water', 'it has salt in it', 'it is kept in a fridge', 'it has ice in it'),
      r('Mars is called the Red Planet. Its rocks and dust contain iron oxide, which looks red. Mars has two small moons. What is Mars called?', 'the Red Planet', 'the Blue Planet', 'the Green Planet', 'the Yellow Planet'),
      r('The Great Wall of China is very long. It was built over many centuries to protect against invaders. Parts of it are still standing today. What was the Great Wall built to do?', 'protect against invaders', 'hold back the ocean', 'carry water', 'light the sky'),
      r('Sloths move slowly to save energy. They spend most of their time hanging in trees. What do sloths spend most of their time doing?', 'hanging in trees', 'swimming in lakes', 'digging holes', 'running fast'),
      r('Venus is the hottest planet in our solar system. Its thick clouds trap heat around it. Why is Venus so hot?', 'its clouds trap heat', 'it is covered in ice', 'it has no sun', 'it spins very fast'),
    ],
  ],
)

const multipleMeaning = rowSkill(
  'multipleMeaning',
  ['Words with two meanings', 'More two-meaning words', 'Tricky two-meaning words'],
  [
    [
      r('In "The bat flew at night," what is a bat?', 'an animal', 'a baseball stick', 'a soft hat', 'a little cup'),
      r('In "The bark on the tree was rough," what is bark?', 'the outside of a tree', 'the sound a dog makes', 'a small boat', 'a bright color'),
      r('In "The ring on my finger is gold," what is a ring?', 'a band you wear', 'a phone call', 'a loud bell', 'a race'),
      r('In "Turn on the light, please," what is a light?', 'something that makes things bright', 'not heavy', 'a pale color', 'to start a fire'),
      r('In "I will hold the pen," what is a pen?', 'a tool for writing', 'a yard for pigs', 'a box for toys', 'a cup for tea'),
      r('In "The fan kept us cool," what is a fan?', 'a machine that moves air', 'a sports lover', 'a folding book', 'a green plant'),
      r('In "We sat on the bank of the river," what is a bank?', 'the land beside water', 'a place to keep money', 'a shelf for books', 'a sofa'),
      r('In "The rose smelled sweet," what is a rose?', 'a flower', 'a color', 'a kind of soup', 'a kind of boat'),
      r('In "My team won the game," what is a game?', 'a contest to play', 'the meat of an animal', 'a wild animal', 'a kind of cake'),
      r('In "Please sign your name," what does sign mean?', 'to write your name', 'a board with words on it', 'a sound you hear', 'a kind of cloud'),
    ],
    [
      r('In "I can watch the birds in the yard," what does watch mean?', 'look at closely', 'a clock you wear', 'a time to sleep', 'a loud noise'),
      r('In "The county fair had rides," what is a fair?', 'a show with rides and games', 'just and equal', 'light and pale', 'to cry out'),
      r('In "The duck swam in the pond," what is a duck?', 'a water bird', 'to bend down quickly', 'a kind of hat', 'a toy truck'),
      r('In "Please do not pitch the ball so high," what does pitch mean?', 'to throw', 'a black tar', 'a musical sound level', 'a steep slope'),
      r('In "Spring is my favorite season," what is spring?', 'the season after winter', 'a metal coil', 'to jump up', 'a water well'),
      r('In "The well was full of cool water," what is a well?', 'a hole that holds water', 'in good health', 'very good', 'a kind of soup'),
      r('In "We sat in the back of the car," what is the back?', 'the rear part', 'to move backward', 'to support someone', 'a bet on a race'),
      r('In "The trunk of the tree was thick," what is a trunk?', 'the main stem of a tree', 'a big box', 'an elephant nose', 'a car part'),
      r('In "The fish had shiny scales," what are scales?', 'small flat coverings on fish', 'a tool for weighing', 'a set of musical notes', 'a steep climb'),
      r('In "I need a patch for my jeans," what is a patch?', 'a piece of cloth sewn on', 'a small garden plot', 'a rough spot', 'a fight'),
    ],
    [
      r('In "The shopkeeper said the price was fair," what does fair mean?', 'reasonable and just', 'pale and light', 'a carnival', 'to cry out'),
      r('In "She wore a bow in her hair," what is a bow?', 'a loop of ribbon', 'to bend at the waist', 'a kind of arrow', 'the front of a ship'),
      r('In "The bear walked into the woods," what is a bear?', 'a large wild animal', 'to hold up', 'to put up with', 'a kind of fruit'),
      r('In "The boy could not stand the cold," what does stand mean?', 'to bear or put up with', 'to be on your feet', 'a booth for selling things', 'to take a step'),
      r('In "He had a trace of mud on his shoe," what is a trace?', 'a tiny amount', 'a map of a city', 'a rope for a boat', 'a long road'),
      r('In "Ben gave a firm handshake," what does firm mean?', 'strong and steady', 'a business company', 'soft and squishy', 'a long time'),
      r('In "The coach blew his whistle at the game," what is a whistle?', 'a device that makes a loud sound', 'a pleasant tune', 'a kind of bird', 'a red flag'),
      r('In "The seal balanced a ball on its nose," what is a seal?', 'a sea animal', 'a stamp for letters', 'a tight closure', 'a kind of shoe'),
      r('In "The hall was full of people," what is a hall?', 'a large room in a building', 'a bedroom for guests', 'a kind of shoe', 'a kind of drink'),
      r('In "She drew a sketch of the house," what is a sketch?', 'a rough drawing', 'a funny play', 'a loud sound', 'a kind of cake'),
    ],
  ],
)

const contextClueWords = rowSkill(
  'contextClueWords',
  ['Clue words', 'Harder clue words', 'Hardest clue words'],
  [
    [
      r('The puppy was tiny. It fit in my hand. What does tiny mean?', 'very small', 'very loud', 'very old', 'very wet'),
      r('Ana was starving, so she ate two sandwiches. What does starving mean?', 'very hungry', 'very tired', 'very cold', 'very happy'),
      r('The room was dark, so we used a flashlight to see. What does dark mean?', 'with little light', 'full of toys', 'very loud', 'with fresh paint'),
      r('Jim was thrilled when he won the prize. He jumped and cheered. What does thrilled mean?', 'very excited and happy', 'very sad', 'very sleepy', 'very angry'),
      r('The water was freezing, so I wore gloves. What does freezing mean?', 'very cold', 'very hot', 'very dirty', 'very quiet'),
      r('Our house is huge. It has ten rooms! What does huge mean?', 'very big', 'very small', 'very dark', 'very cheap'),
      r('The baby was sleeping peacefully in her crib. What does peacefully mean?', 'calmly', 'loudly', 'angrily', 'quickly'),
      r('The lake was calm, with no waves at all. What does calm mean?', 'still and quiet', 'wild and rough', 'very cold', 'very deep'),
      r('Max was furious when his brother broke his toy. He yelled and stomped. What does furious mean?', 'very angry', 'very happy', 'very sleepy', 'very quiet'),
      r('The old man was ancient. He was over 100 years old. What does ancient mean?', 'very old', 'very new', 'very tall', 'very fast'),
    ],
    [
      r('The hikers were exhausted after the long climb. They sat down to rest. What does exhausted mean?', 'very tired', 'very excited', 'very hungry', 'very brave'),
      r('The sky was overcast, with gray clouds covering the sun. What does overcast mean?', 'cloudy', 'clear', 'sunny', 'windy'),
      r('Her gleaming shoes shone under the lights. What does gleaming mean?', 'shining brightly', 'muddy', 'torn', 'soft'),
      r('The soup was scalding, so we waited before eating. What does scalding mean?', 'very hot', 'very cold', 'very salty', 'very sour'),
      r('The dog was drenched after it jumped in the lake. Its fur was soaking wet. What does drenched mean?', 'soaked with water', 'dried off', 'covered in dust', 'shaved'),
      r('The baker was ecstatic about her new oven. She grinned all day. What does ecstatic mean?', 'overjoyed', 'bored', 'confused', 'nervous'),
      r('The hallway was bare, with no pictures or decorations. What does bare mean?', 'with nothing on it', 'full of paintings', 'loud and busy', 'painted bright red'),
      r('The bridge was sturdy and would not break, even with many cars. What does sturdy mean?', 'strong and solid', 'thin and fragile', 'shiny and new', 'very long'),
      r('The moon was luminous, glowing in the dark sky. What does luminous mean?', 'glowing with light', 'dark and shadowy', 'hidden in clouds', 'very small'),
      r('The shy boy hid behind his mother, afraid to talk. What does shy mean?', 'nervous around others', 'very loud', 'very bossy', 'very funny'),
    ],
    [
      r('The ancient castle was crumbling, its stones falling apart. What does crumbling mean?', 'breaking into pieces', 'shining', 'growing', 'painting'),
      r('Our teacher was patient, waiting calmly while we found the answers. What does patient mean?', 'willing to wait calmly', 'in a hurry', 'very angry', 'rude to others'),
      r('The chef made a delicious meal that everyone wanted more of. What does delicious mean?', 'very tasty', 'very cold', 'very messy', 'very loud'),
      r('The hailstorm ruined the farmer\'s crops. Nothing could be sold. What does ruined mean?', 'destroyed', 'improved', 'painted', 'counted'),
      r('The spy moved stealthily through the dark hallway, careful not to make a sound. What does stealthily mean?', 'quietly and secretly', 'loudly and proudly', 'slowly and sadly', 'angrily'),
      r('Mia\'s brother was reluctant to go to bed. He kept asking for one more story. What does reluctant mean?', 'unwilling', 'eager', 'sleepy', 'happy'),
      r('The desert was barren, with no trees, no grass, and no water. What does barren mean?', 'empty of plants', 'full of rain', 'full of flowers', 'filled with people'),
      r('The hikers were astonished to find a waterfall hidden in the woods. What does astonished mean?', 'very surprised', 'bored', 'angry', 'hungry'),
      r('The pancakes were fluffy and light, not dense at all. What does fluffy mean?', 'soft and light', 'hard and heavy', 'burnt', 'sour'),
      r('The villagers were cautious, checking the bridge before crossing it. What does cautious mean?', 'careful', 'fearless', 'rushed', 'lazy'),
    ],
  ],
)

const silentEVowels = rowSkill(
  'silentEVowels',
  ['Words that end in silent e', 'Long vowels with silent e', 'Vowel teams'],
  [
    [
      r('Which word ends with a silent e?', 'cake', 'cap', 'cat', 'cup'),
      r('Which word ends with a silent e?', 'bike', 'bit', 'big', 'bin'),
      r('Which word ends with a silent e?', 'rope', 'rod', 'rob', 'rot'),
      r('Which word ends with a silent e?', 'cube', 'cub', 'cut', 'cup'),
      r('Which word ends with a silent e?', 'kite', 'kid', 'kit', 'kin'),
      r('Which word ends with a silent e?', 'home', 'hop', 'hot', 'hum'),
      r('Which word ends with a silent e?', 'nose', 'nod', 'not', 'net'),
      r('Which word ends with a silent e?', 'tube', 'tub', 'tug', 'tap'),
      r('Which word ends with a silent e?', 'gate', 'gap', 'gum', 'got'),
      r('Which word ends with a silent e?', 'pine', 'pin', 'pen', 'pig'),
    ],
    [
      r('Which word has a silent e that makes the vowel long?', 'slide', 'slid', 'slip', 'slim'),
      r('Which word has a silent e that makes the vowel long?', 'stone', 'stop', 'step', 'stun'),
      r('Which word has a silent e that makes the vowel long?', 'whale', 'whip', 'whisk', 'wheel'),
      r('Which word has a silent e that makes the vowel long?', 'globe', 'grab', 'glad', 'glum'),
      r('Which word has a silent e that makes the vowel long?', 'dime', 'dim', 'dig', 'din'),
      r('Which word has a silent e that makes the vowel long?', 'tape', 'tap', 'tab', 'tip'),
      r('Which word has a silent e that makes the vowel long?', 'huge', 'hug', 'hut', 'hum'),
      r('Which word has a silent e that makes the vowel long?', 'wave', 'wag', 'wet', 'wig'),
      r('Which word has a silent e that makes the vowel long?', 'skate', 'skip', 'skit', 'skin'),
      r('Which word has a silent e that makes the vowel long?', 'hive', 'hip', 'hit', 'him'),
    ],
    [
      r('Which word has the "ai" team?', 'rain', 'rat', 'rip', 'rug'),
      r('Which word has the "ai" team?', 'snail', 'snap', 'sun', 'slim'),
      r('Which word has the "ee" team?', 'tree', 'tray', 'trip', 'tram'),
      r('Which word has the "ee" team?', 'sleep', 'slip', 'step', 'slap'),
      r('Which word has the "oa" team?', 'boat', 'bat', 'bit', 'bug'),
      r('Which word has the "oa" team?', 'coat', 'cat', 'cot', 'cut'),
      r('Which word has the "ai" team?', 'paint', 'pant', 'pint', 'punt'),
      r('Which word has the "ee" team?', 'green', 'grin', 'grab', 'grip'),
      r('Which word has the "oa" team?', 'goat', 'got', 'gut', 'gap'),
      r('Which word has the "ee" team?', 'seed', 'sad', 'sand', 'sag'),
    ],
  ],
)

const softCG = rowSkill(
  'softCG',
  ['Soft c, like s', 'Soft g, like j', 'Hard g, like go'],
  [
    [
      r('Which word has the soft c sound, like s?', 'city', 'cat', 'cup', 'cone'),
      r('Which word has the soft c sound, like s?', 'circle', 'cake', 'cap', 'cot'),
      r('Which word has the soft c sound, like s?', 'nice', 'cab', 'cod', 'cup'),
      r('Which word has the soft c sound, like s?', 'face', 'fact', 'fake', 'fan'),
      r('Which word has the soft c sound, like s?', 'pencil', 'pack', 'pocket', 'cabin'),
      r('Which word has the soft c sound, like s?', 'dance', 'cat', 'cup', 'can'),
      r('Which word has the soft c sound, like s?', 'race', 'rack', 'rock', 'rake'),
      r('Which word has the soft c sound, like s?', 'mice', 'cub', 'cot', 'cup'),
      r('Which word has the soft c sound, like s?', 'cent', 'camp', 'cast', 'cord'),
      r('Which word has the soft c sound, like s?', 'ice', 'cap', 'cup', 'cod'),
    ],
    [
      r('Which word has the soft g sound, like j?', 'gem', 'game', 'goat', 'gift'),
      r('Which word has the soft g sound, like j?', 'giant', 'girl', 'give', 'got'),
      r('Which word has the soft g sound, like j?', 'cage', 'gate', 'gum', 'gap'),
      r('Which word has the soft g sound, like j?', 'page', 'pig', 'pot', 'pen'),
      r('Which word has the soft g sound, like j?', 'ginger', 'gift', 'game', 'grab'),
      r('Which word has the soft g sound, like j?', 'huge', 'hug', 'hog', 'hag'),
      r('Which word has the soft g sound, like j?', 'bridge', 'bag', 'big', 'beg'),
      r('Which word has the soft g sound, like j?', 'orange', 'organ', 'garden', 'gobble'),
      r('Which word has the soft g sound, like j?', 'gym', 'gum', 'gate', 'game'),
      r('Which word has the soft g sound, like j?', 'age', 'egg', 'ago', 'ugly'),
    ],
    [
      r('Which word has the hard g sound, like g in go?', 'goat', 'gem', 'giant', 'cage'),
      r('Which word has the hard g sound, like g in go?', 'gift', 'gym', 'gem', 'giraffe'),
      r('Which word has the hard g sound, like g in go?', 'game', 'gem', 'page', 'ginger'),
      r('Which word has the hard g sound, like g in go?', 'girl', 'gym', 'cage', 'giant'),
      r('Which word has the hard g sound, like g in go?', 'give', 'gem', 'gym', 'age'),
      r('Which word has the hard g sound, like g in go?', 'got', 'gym', 'huge', 'cage'),
      r('Which word has the hard g sound, like g in go?', 'egg', 'age', 'gem', 'ginger'),
      r('Which word has the hard g sound, like g in go?', 'go', 'gem', 'giant', 'page'),
      r('Which word has the hard g sound, like g in go?', 'get', 'gym', 'gem', 'ginger'),
      r('Which word has the hard g sound, like g in go?', 'bag', 'cage', 'page', 'huge'),
    ],
  ],
)

// --- Reading: stories and words -----------------------------------------------------------------
// (The writing skills are in the second half of this file.)

export const READING_E2: Skill[] = [
  learnLetters,
  letterSoundMatch,
  wordMatch,
  bookParts,
  storyOrder,
  storySetting,
  pointOfView,
  readAlongLit,
  infoText,
  multipleMeaning,
  contextClueWords,
  silentEVowels,
  softCG,
]

// --- Writing: words and sentences ---------------------------------------------------------------

const wordTypes = rowSkill(
  'wordTypes',
  ['Action words', 'Describing words', 'Verbs in sentences'],
  [
    [
      r('Which word is an action word?', 'run', 'big', 'red', 'soft'),
      r('Which word is an action word?', 'jump', 'wet', 'tall', 'cold'),
      r('Which word is an action word?', 'sing', 'loud', 'sweet', 'round'),
      r('Which word is an action word?', 'hop', 'happy', 'red', 'big'),
      r('Which word is an action word?', 'eat', 'cold', 'wet', 'soft'),
      r('Which word is an action word?', 'clap', 'tall', 'round', 'loud'),
      r('Which word is an action word?', 'swim', 'happy', 'sweet', 'big'),
      r('Which word is an action word?', 'kick', 'soft', 'red', 'cold'),
      r('Which word is an action word?', 'sleep', 'loud', 'wet', 'tall'),
      r('Which word is an action word?', 'hug', 'sweet', 'round', 'happy'),
    ],
    [
      r('Which word is a describing word?', 'fluffy', 'pillow', 'window', 'puddle'),
      r('Which word is a describing word?', 'tiny', 'dog', 'tree', 'book'),
      r('Which word is a describing word?', 'shiny', 'bike', 'cup', 'rock'),
      r('Which word is a describing word?', 'green', 'apple', 'chair', 'pencil'),
      r('Which word is a describing word?', 'loud', 'horse', 'lamp', 'bus'),
      r('Which word is a describing word?', 'wet', 'sock', 'bench', 'road'),
      r('Which word is a describing word?', 'cold', 'river', 'pizza', 'hat'),
      r('Which word is a describing word?', 'soft', 'blanket', 'shoe', 'kite'),
      r('Which word is a describing word?', 'huge', 'whale', 'grass', 'park'),
      r('Which word is a describing word?', 'sweet', 'candy', 'spoon', 'orange'),
    ],
    [
      r('The birds ___ in the sky.', 'fly', 'tree', 'happy', 'under'),
      r('The dog ___ the ball across the yard.', 'chased', 'blue', 'dog', 'under'),
      r('We ___ cookies on Sunday.', 'baked', 'happy', 'park', 'under'),
      r('The baby ___ her toes.', 'wiggled', 'cloud', 'pink', 'between'),
      r('Ben ___ the door.', 'opened', 'tall', 'pencil', 'into'),
      r('The fish ___ in the pond.', 'swims', 'green', 'pond', 'under'),
      r('I ___ my teeth every night.', 'brush', 'blue', 'teeth', 'slowly'),
      r('The cat ___ on the mat.', 'sat', 'soft', 'mat', 'quiet'),
      r('Kids ___ in the yard.', 'play', 'sour', 'yard', 'under'),
      r('We ___ the window to get fresh air.', 'open', 'cold', 'window', 'between'),
    ],
  ],
)

const spellRight = rowSkill(
  'spellRight',
  ['Doubled consonants', 'Plurals and -ed', 'Endings -ly, -ful, -ness'],
  [
    [
      r('Which word is spelled right?', 'running', 'runing', 'runnig', 'runnning'),
      r('Which word is spelled right?', 'hopping', 'hoppng', 'hopng', 'hopinng'),
      r('Which word is spelled right?', 'sitting', 'siting', 'sittng', 'sitttng'),
      r('Which word is spelled right?', 'digging', 'diging', 'diggng', 'dygging'),
      r('Which word is spelled right?', 'swimming', 'swiming', 'swimmng', 'swimmming'),
      r('Which word is spelled right?', 'stopped', 'stoped', 'stopt', 'stoppped'),
      r('Which word is spelled right?', 'jumped', 'jumpd', 'jumpt', 'jumpped'),
      r('Which word is spelled right?', 'tapping', 'tappng', 'tapiing', 'tappping'),
      r('Which word is spelled right?', 'grabbed', 'grabed', 'grabbd', 'grabbedd'),
      r('Which word is spelled right?', 'clapping', 'clappng', 'claping', 'clappping'),
    ],
    [
      r('Which word is spelled right?', 'babies', 'babys', 'babyes', 'babbies'),
      r('Which word is spelled right?', 'wishes', 'wishs', 'wisches', 'wishies'),
      r('Which word is spelled right?', 'boxes', 'boxs', 'boxies', 'boxez'),
      r('Which word is spelled right?', 'hoped', 'hopeed', 'hopedd', 'hopt'),
      r('Which word is spelled right?', 'flies', 'flys', 'fliess', 'flyes'),
      r('Which word is spelled right?', 'cries', 'crys', 'cryes', 'criez'),
      r('Which word is spelled right?', 'families', 'familys', 'famillies', 'familyes'),
      r('Which word is spelled right?', 'churches', 'churchs', 'churchies', 'churchez'),
      r('Which word is spelled right?', 'dresses', 'dresss', 'dressez', 'dressis'),
      r('Which word is spelled right?', 'puppies', 'puppys', 'puppyes', 'puppiez'),
    ],
    [
      r('Which word is spelled right?', 'happily', 'happyly', 'happilly', 'happiley'),
      r('Which word is spelled right?', 'carefully', 'carefuly', 'carefullly', 'carefulley'),
      r('Which word is spelled right?', 'hopeful', 'hopefull', 'hopefol', 'hopefuul'),
      r('Which word is spelled right?', 'thankful', 'thankfull', 'thankfol', 'thankfuul'),
      r('Which word is spelled right?', 'kindness', 'kindnes', 'kindniss', 'kindnesss'),
      r('Which word is spelled right?', 'pennies', 'pennys', 'penies', 'penneis'),
      r('Which word is spelled right?', 'quickly', 'quickley', 'quikly', 'quicklly'),
      r('Which word is spelled right?', 'friendly', 'freindly', 'friendley', 'friendlly'),
      r('Which word is spelled right?', 'beautiful', 'beautifull', 'beutiful', 'beautifal'),
      r('Which word is spelled right?', 'useful', 'usefull', 'usefal', 'usefuul'),
    ],
  ],
)

const prefixSuffix = rowSkill(
  'prefixSuffix',
  ['Prefixes un- and re-', 'Words ending -er and -ful', 'Hopeless and careless'],
  [
    [
      r('Which word means "do again"?', 'redo', 'undo', 'doer', 'done'),
      r('Which word means "not fair"?', 'unfair', 'fairly', 'fairest', 'fairness'),
      r('Which word means "not safe"?', 'unsafe', 'safety', 'safer', 'safely'),
      r('Which word means "not tied"?', 'untied', 'tied', 'tying', 'tie'),
      r('Which word means "to write again"?', 'rewrite', 'writer', 'written', 'unwritten'),
      r('Which word means "not well"?', 'unwell', 'well', 'wells', 'welled'),
      r('Which word means "not seen"?', 'unseen', 'seen', 'seeing', 'seer'),
      r('Which word means "to fill again"?', 'refill', 'filler', 'fill', 'filled'),
      r('Which word means "not happy"?', 'unhappy', 'happily', 'happier', 'happen'),
      r('Which word means "to tie again"?', 'retie', 'tied', 'tie', 'tying'),
    ],
    [
      r('Which word means "a person who sings"?', 'singer', 'singing', 'sings', 'sung'),
      r('Which word means "a person who teaches"?', 'teacher', 'teach', 'teaches', 'teaching'),
      r('Which word means "able to be read"?', 'readable', 'reader', 'unread', 'reading'),
      r('Which word means "able to be washed"?', 'washable', 'washer', 'washed', 'unwashed'),
      r('Which word means "full of joy"?', 'joyful', 'joy', 'enjoy', 'joyless'),
      r('Which word means "full of play"?', 'playful', 'play', 'played', 'playing'),
      r('Which word means "full of help"?', 'helpful', 'helper', 'helping', 'helped'),
      r('Which word means "a person who paints"?', 'painter', 'paint', 'painted', 'painting'),
      r('Which word means "a person who drives"?', 'driver', 'drive', 'drove', 'driven'),
      r('Which word means "a person who builds"?', 'builder', 'build', 'built', 'building'),
    ],
    [
      r('Which word means "without hope"?', 'hopeless', 'hopeful', 'hoped', 'hopping'),
      r('Which word means "without care"?', 'careless', 'careful', 'cares', 'caring'),
      r('Which word means "without fear"?', 'fearless', 'fearful', 'feared', 'fearing'),
      r('Which word means "without pain"?', 'painless', 'painful', 'painted', 'painting'),
      r('Which word means "not harmful"?', 'harmless', 'harmful', 'harmed', 'harming'),
      r('Which word means "without an end"?', 'endless', 'endings', 'ended', 'ending'),
      r('Which word means "not useful"?', 'useless', 'useful', 'used', 'using'),
      r('Which word names the quality of being kind?', 'kindness', 'kindly', 'kinder', 'kinds'),
      r('Which word means "to spell wrong"?', 'misspell', 'respell', 'spelled', 'spelling'),
      r('Which word means "to read again"?', 'reread', 'reader', 'reading', 'unread'),
    ],
  ],
)

const linkWords = rowSkill(
  'linkWords',
  ['Linking words: and, but, so, because', 'Linking words: or, so, because', 'Linking words: also, however'],
  [
    [
      r('I like cats, ___ dogs too.', 'and', 'never', 'so', 'because'),
      r('It was hot, ___ we went swimming.', 'so', 'never', 'because', 'or'),
      r('We stayed inside ___ it was raining.', 'because', 'so', 'never', 'or'),
      r('I wanted to go out, ___ it was too cold.', 'but', 'and', 'so', 'because'),
      r('Sam had a red ball ___ a blue kite.', 'and', 'never', 'so', 'because'),
      r('I was tired, ___ I went to bed early.', 'so', 'or', 'never', 'because'),
      r('I packed a lunch, a hat, ___ my swim suit.', 'and', 'so', 'because', 'or'),
      r('The milk was sour, ___ I did not drink it.', 'so', 'or', 'never', 'because'),
      r('Mom made soup ___ Dad made rice.', 'and', 'so', 'because', 'never'),
      r('I wanted a pet, ___ I got a fish.', 'so', 'never', 'because', 'or'),
    ],
    [
      r('Do you want milk ___ juice?', 'or', 'never', 'so', 'because'),
      r('The store was closed, ___ we went home.', 'so', 'never', 'because', 'or'),
      r('The sky was dark, ___ it started to rain.', 'so', 'never', 'because', 'or'),
      r('Would you like tea ___ hot cocoa?', 'or', 'never', 'so', 'because'),
      r('We could walk to the park, ___ we could take the bus.', 'or', 'never', 'so', 'because'),
      r('Do you want to read ___ draw today?', 'or', 'never', 'because', 'so'),
      r('The game was canceled ___ it was raining hard.', 'because', 'or', 'never', 'so'),
      r('I can ride the blue bike ___ the red one.', 'or', 'never', 'because', 'so'),
      r('She missed the bus, ___ she was late for school.', 'so', 'or', 'never', 'because'),
      r('Should we eat now ___ wait for Dad?', 'or', 'never', 'because', 'so'),
    ],
    [
      r('Ben likes to swim. ___ he likes to run.', 'Also', 'Because', 'So', 'Or'),
      r('The park was wet. ___, we played on the swings anyway.', 'However', 'Also', 'Because', 'Never'),
      r('Riding a bike is fun. ___ it is good exercise.', 'Also', 'Because', 'Or', 'However'),
      r('We wanted to go to the beach. ___, it was too windy.', 'However', 'Also', 'Because', 'Or'),
      r('Maya likes apples. ___, she likes grapes too.', 'Also', 'However', 'Because', 'So'),
      r('The movie was long. ___, it was funny and kind.', 'However', 'Because', 'Or', 'So'),
      r('Lee has a dog. ___, Lee has a cat.', 'Also', 'Because', 'Or', 'Never'),
      r('The coach was tired. ___, she kept cheering for the team.', 'However', 'Because', 'Or', 'Never'),
      r('Our garden grows beans. ___, it grows peas too.', 'Also', 'However', 'Because', 'So'),
      r('The bread was stale. ___, we ate it with jam.', 'However', 'Because', 'Or', 'Never'),
    ],
  ],
)

const oddSentence = rowSkill(
  'oddSentence',
  ['Sentence that does not belong', 'Off-topic sentence', 'Best topic sentence'],
  [
    [
      r('Which sentence does not belong in a paragraph about bees?', 'Pizza has cheese on top.', 'Bees make honey.', 'Bees buzz when they fly.', 'Bees have six legs.'),
      r('Which sentence does not belong in a paragraph about dogs?', 'Bananas are yellow.', 'Dogs have four legs.', 'Dogs can bark.', 'Puppies need food and water.'),
      r('Which sentence does not belong in a paragraph about snow?', 'I like to eat cereal in the morning.', 'Snow is cold and white.', 'Snowflakes melt in your hand.', 'We made a snowman.'),
      r('Which sentence does not belong in a paragraph about the library?', 'A hammer is a tool.', 'The library has many books.', 'You can borrow books for free.', 'Librarians help us find books.'),
      r('Which sentence does not belong in a paragraph about planting seeds?', 'My favorite color is green.', 'Seeds need water and sunshine.', 'Plant the seed in soil.', 'Roots grow down from a seed.'),
      r('Which sentence does not belong in a paragraph about the school bus?', 'Elephants are very large animals.', 'The school bus picks us up at eight.', 'We sit in our seats on the bus.', 'The driver says hello to us.'),
      r('Which sentence does not belong in a paragraph about rain?', 'Dinosaurs lived long ago.', 'Rain falls from clouds.', 'Puddles form after it rains.', 'We use umbrellas when it rains.'),
      r('Which sentence does not belong in a paragraph about the beach?', 'My computer needs a new battery.', 'Sand is warm in the sun.', 'We built a sandcastle.', 'Waves crash on the shore.'),
      r('Which sentence does not belong in a paragraph about apples?', 'Trucks carry heavy loads.', 'Apples grow on trees.', 'A red apple is sweet and crunchy.', 'Apple pie tastes good with ice cream.'),
      r('Which sentence does not belong in a paragraph about the sun?', 'My shoes are too small.', 'The sun gives us light.', 'The sun is a star.', 'The sun warms the Earth.'),
    ],
    [
      r('Which sentence does not belong in a paragraph about frogs?', 'The store sells blue shirts.', 'Frogs have long, sticky tongues.', 'Frogs live near ponds.', 'Some frogs can jump very far.'),
      r('Which sentence does not belong in a paragraph about the moon?', 'My favorite soup is tomato.', 'The moon goes around the Earth.', 'The moon looks different each night.', 'The moon has no air.'),
      r('Which sentence does not belong in a paragraph about the ocean?', 'My grandmother knits sweaters.', 'The ocean is full of salt water.', 'Whales live in the ocean.', 'Waves are made by wind.'),
      r('Which sentence does not belong in a paragraph about deserts?', 'The bus was late this morning.', 'Deserts get very little rain.', 'Camels can live in the desert.', 'Deserts can be very hot in the day.'),
      r('Which sentence does not belong in a paragraph about volcanoes?', 'I wore my red boots today.', 'Volcanoes can erupt with hot lava.', 'Some volcanoes are under the sea.', 'Lava can be very hot.'),
      r('Which sentence does not belong in a paragraph about trees?', 'We ate pancakes for breakfast.', 'Trees need sunlight to make food.', 'Some trees lose their leaves in fall.', 'Tree roots hold soil in place.'),
      r('Which sentence does not belong in a paragraph about cars?', 'Dinner was spaghetti tonight.', 'Cars need gas or electricity to run.', 'The first cars were slow.', 'Cars have wheels.'),
      r('Which sentence does not belong in a paragraph about the post office?', 'The moon was bright last night.', 'Letters are sorted at the post office.', 'Mail carriers deliver letters.', 'Stamps are needed to mail a letter.'),
      r('Which sentence does not belong in a paragraph about bread?', 'Cats like to nap in sunbeams.', 'Bread is made from flour and water.', 'Yeast helps bread rise.', 'Many people eat bread every day.'),
      r('Which sentence does not belong in a paragraph about the Arctic?', 'Lemons taste sour.', 'The Arctic is very cold.', 'Polar bears live in the Arctic.', 'Arctic ice is frozen water.'),
    ],
    [
      r('Which sentence would be the best topic sentence for a paragraph about dogs?', 'Dogs make loyal and fun pets.', 'Tomatoes grow on vines.', 'My bike has a bell.', 'Pancakes need syrup.'),
      r('Which sentence would be the best topic sentence for a paragraph about recycling?', 'Recycling helps save our planet.', 'My socks are blue.', 'Lunch was good today.', 'The bus was late.'),
      r('Which sentence would be the best topic sentence for a paragraph about farms?', 'Farms grow food for many people.', 'The movie was too long.', 'Hats keep our heads warm.', 'Frogs can swim.'),
      r('Which sentence would be the best topic sentence for a paragraph about exercise?', 'Exercise keeps our bodies healthy.', 'The sky is blue.', 'Bread is baked in an oven.', 'Cats sleep a lot.'),
      r('Which sentence would be the best topic sentence for a paragraph about school lunch?', 'A healthy lunch has fruit and vegetables.', 'My sister plays the piano.', 'Trains are long.', 'Our class went to the park.'),
      r('Which sentence would be the best topic sentence for a paragraph about rainforests?', 'Rainforests are home to many animals.', 'The moon is far away.', 'Mittens are warm.', 'Clocks tell time.'),
      r('Which sentence would be the best topic sentence for a paragraph about baking?', 'Baking bread takes time and care.', 'The dog likes to swim.', 'The pencil is sharp.', 'Ice melts in summer.'),
      r('Which sentence would be the best topic sentence for a paragraph about weather?', 'Weather changes from day to day.', 'Socks come in pairs.', 'The pizza was hot.', 'My cousin lives in Texas.'),
      r('Which sentence would be the best topic sentence for a paragraph about the ocean?', 'The ocean covers most of Earth.', 'Cookies are sweet.', 'My shoe is untied.', 'Books have pages.'),
      r('Which sentence would be the best topic sentence for a paragraph about bicycles?', 'Bicycles are a fun way to get around.', 'Sandwiches are made with bread.', 'The clock ticks loudly.', 'The rain stopped at noon.'),
    ],
  ],
)

const opinionVsFact = rowSkill(
  'opinionVsFact',
  ['Opinion or fact', 'Fact sentences', 'Opinion words'],
  [
    [
      r('Which sentence is an opinion?', 'Dogs are the best pets.', 'Dogs have four legs.', 'Dogs can bark.', 'Dogs eat dog food.'),
      r('Which sentence is an opinion?', 'Pizza is the yummiest food.', 'Pizza is baked in an oven.', 'Pizza can be ordered by phone.', 'Pizza has cheese on top.'),
      r('Which sentence is an opinion?', 'Summer is more fun than winter.', 'A year has four seasons.', 'Winter comes after autumn.', 'Summer comes after spring.'),
      r('Which sentence is an opinion?', 'Reading is the most exciting thing to do.', 'Books have pages.', 'Libraries have books.', 'A book has a cover.'),
      r('Which sentence is an opinion?', 'Chocolate ice cream tastes the best.', 'Ice cream is made from milk.', 'Ice cream can melt.', 'Ice cream is served cold.'),
      r('Which sentence is an opinion?', 'Soccer is the coolest sport.', 'Soccer uses a round ball.', 'Soccer is played on a field.', 'Soccer teams have players.'),
      r('Which sentence is an opinion?', 'Cats make the nicest pets.', 'Cats have whiskers.', 'Cats sleep many hours a day.', 'Cats have fur.'),
      r('Which sentence is an opinion?', 'This is the best book in the library.', 'Books have words and pictures.', 'Libraries lend books.', 'A book can have many pages.'),
      r('Which sentence is an opinion?', 'Rain is the worst weather.', 'Rain falls from clouds.', 'Rain is water.', 'Rain helps plants grow.'),
      r('Which sentence is an opinion?', 'Trees are the most beautiful things in nature.', 'Trees grow from seeds.', 'Trees need water to live.', 'Many trees have bark.'),
    ],
    [
      r('Which sentence is a fact?', 'A week has seven days.', 'Mondays are the worst day.', 'Saturday is the best day.', 'Sunday is the most fun day.'),
      r('Which sentence is a fact?', 'Water freezes into ice when it gets very cold.', 'Ice cream is the best treat.', 'Snow is the prettiest thing ever.', 'Winter is the most boring season.'),
      r('Which sentence is a fact?', 'A triangle has three sides.', 'Triangles are the coolest shape.', 'Squares look nicer than triangles.', 'Circles are the best shape ever.'),
      r('Which sentence is a fact?', 'Bats are mammals.', 'Bats are the scariest animals.', 'Bats are cute and cuddly.', 'Bats are the best animals ever.'),
      r('Which sentence is a fact?', 'The Earth goes around the sun.', 'The Earth is the best planet.', 'Space is too scary.', 'Stars are the prettiest lights.'),
      r('Which sentence is a fact?', 'A dozen means twelve.', 'A dozen eggs is too many.', 'Twelve is my lucky number.', 'Eggs are the best food.'),
      r('Which sentence is a fact?', 'Carrots are orange.', 'Carrots taste the best.', 'Carrots are the tastiest vegetable.', 'Carrots are boring.'),
      r('Which sentence is a fact?', 'Chicago is a city in Illinois.', 'Chicago is the best city in the world.', 'Chicago is more fun than any other place.', 'Chicago has the nicest buildings ever.'),
      r('Which sentence is a fact?', 'There are 60 minutes in an hour.', 'An hour is way too long.', 'Minutes are the best way to tell time.', 'Hours go by too fast.'),
      r('Which sentence is a fact?', 'Frogs lay eggs in water.', 'Frogs are the cutest animals.', 'Frogs are better than dogs.', 'Frogs are the most fun pets.'),
    ],
    [
      r('Which sentence shows an opinion?', 'I think everyone should read more books.', 'Books have many pages.', 'A library lends books.', 'Stories can be long or short.'),
      r('Which sentence shows an opinion?', 'Recess should be longer.', 'Recess is a break from class.', 'Students play at recess.', 'Recess happens during the school day.'),
      r('Which sentence shows an opinion?', 'The new park is the best place in town.', 'Parks have trees and grass.', 'Parks can have playgrounds.', 'Many towns have parks.'),
      r('Which sentence shows an opinion?', 'Pancakes are the best breakfast.', 'Pancakes are made with flour.', 'Pancakes can be cooked in a pan.', 'Eggs are used in some pancakes.'),
      r('Which sentence shows an opinion?', 'Kids should wear helmets when they ride bikes.', 'Helmets protect the head.', 'Bikes have two wheels.', 'Bikes can be ridden on roads.'),
      r('Which sentence shows an opinion?', 'The best season is spring.', 'Spring comes after winter.', 'Flowers bloom in spring.', 'Spring is between winter and summer.'),
      r('Which sentence shows an opinion?', 'Cleaning your room is the most boring job.', 'Rooms have beds.', 'Some rooms have windows.', 'Many people have bedrooms.'),
      r('Which sentence shows an opinion?', 'Everyone should try swimming.', 'Swimming uses many muscles.', 'Pools have water.', 'Some people swim in lakes.'),
      r('Which sentence shows an opinion?', 'Carrots are the tastiest vegetable.', 'Carrots grow under the ground.', 'Carrots are orange.', 'Carrots have green tops.'),
      r('Which sentence shows an opinion?', 'Mornings are the best part of the day.', 'The sun rises in the morning.', 'Breakfast is eaten in the morning.', 'Some people walk in the morning.'),
    ],
  ],
)

const shortForms = rowSkill(
  'shortForms',
  ['Titles and street names', 'Measures', 'Time words'],
  [
    [
      r('What is the short form of "Mister"?', 'Mr.', 'Mrs.', 'Dr.', 'St.'),
      r('What is the short form of "Doctor"?', 'Dr.', 'Mr.', 'Ms.', 'St.'),
      r('What is the short form of "Street"?', 'St.', 'Ave.', 'Dr.', 'Mr.'),
      r('What is the short form of "Avenue"?', 'Ave.', 'St.', 'Rd.', 'Dr.'),
      r('What is the short form of "Monday"?', 'Mon.', 'Sat.', 'Sun.', 'Wed.'),
      r('What is the short form of "Sunday"?', 'Sun.', 'Sat.', 'Mon.', 'Wed.'),
      r('What is the short form of "January"?', 'Jan.', 'Feb.', 'Mar.', 'Dec.'),
      r('What is the short form of "December"?', 'Dec.', 'Jan.', 'Feb.', 'Nov.'),
      r('What is the short form of "inch"?', 'in.', 'ft.', 'yd.', 'mi.'),
      r('What is the short form of "foot"?', 'ft.', 'in.', 'yd.', 'mi.'),
    ],
    [
      r('What is the short form of "pound"?', 'lb.', 'oz.', 'in.', 'ft.'),
      r('What is the short form of "yard"?', 'yd.', 'ft.', 'mi.', 'in.'),
      r('What is the short form of "mile"?', 'mi.', 'in.', 'ft.', 'yd.'),
      r('What is the short form of "ounce"?', 'oz.', 'lb.', 'in.', 'ft.'),
      r('What is the short form of "gallon"?', 'gal.', 'qt.', 'pt.', 'oz.'),
      r('What is the short form of "quart"?', 'qt.', 'gal.', 'pt.', 'oz.'),
      r('What is the short form of "pint"?', 'pt.', 'qt.', 'gal.', 'oz.'),
      r('What is the short form of "Mount"?', 'Mt.', 'Mr.', 'Mrs.', 'Ms.'),
      r('What is the short form of "Saint"?', 'St.', 'Ave.', 'Rd.', 'Dr.'),
      r('What is the short form of "Road"?', 'Rd.', 'St.', 'Ave.', 'Dr.'),
    ],
    [
      r('What is the short form of "hour"?', 'hr.', 'min.', 'sec.', 'wk.'),
      r('What is the short form of "minute"?', 'min.', 'hr.', 'sec.', 'wk.'),
      r('What is the short form of "second"?', 'sec.', 'min.', 'hr.', 'mo.'),
      r('What is the short form of "week"?', 'wk.', 'mo.', 'yr.', 'hr.'),
      r('What is the short form of "month"?', 'mo.', 'wk.', 'yr.', 'hr.'),
      r('What is the short form of "year"?', 'yr.', 'wk.', 'mo.', 'hr.'),
      r('What is the short form of "teaspoon"?', 'tsp.', 'tbsp.', 'oz.', 'cup'),
      r('What is the short form of "tablespoon"?', 'tbsp.', 'tsp.', 'oz.', 'cup'),
      r('What is the short form of "kilometer"?', 'km', 'm', 'cm', 'mm'),
      r('What is the short form of "centimeter"?', 'cm', 'm', 'km', 'mm'),
    ],
  ],
)

// --- Skills so far -----------------------------------------------------------------------------

export const WRITING_E2: Skill[] = [wordTypes, spellRight, prefixSuffix, linkWords, oddSentence, opinionVsFact, shortForms]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". Grades never go down by level. */
export const LANGUAGE_E2_IXL: Record<string, IxlRef[]> = {
  'reading.learnLetters': [e(0, 'Learn letters: A–H'), e(0, 'Learn letters: I–P'), e(0, 'Learn letters: Q–Z')],
  'reading.letterSoundMatch': [e(0, 'Letter-sound associations'), e(0, 'Letter-sound associations'), e(1, 'Consonant sounds and letters')],
  'reading.wordMatch': [e(0, 'Word recognition'), e(0, 'Word recognition'), e(0, 'Word recognition')],
  'reading.bookParts': [e(0, 'Book features'), e(0, 'Text features'), e(1, 'Text features')],
  'reading.storyOrder': [e(0, 'Sequence and plot'), e(0, 'Sequence and plot'), e(2, 'Plot')],
  'reading.storySetting': [e(0, 'Setting and character'), e(0, 'Setting and character'), e(0, 'Setting and character')],
  'reading.pointOfView': [e(1, 'Point of view'), e(1, 'Point of view'), e(1, 'Point of view')],
  'reading.readAlongLit': [e(0, 'Read-along literary texts'), e(1, 'Read-alone literary texts'), e(2, 'Read-alone literary texts')],
  'reading.infoText': [e(0, 'Read-along informational texts'), e(1, 'Read-alone informational texts'), e(2, 'Read-alone informational texts')],
  'reading.multipleMeaning': [e(0, 'Multiple-meaning words'), e(1, 'Multiple-meaning words'), e(1, 'Multiple-meaning words')],
  'reading.contextClueWords': [e(1, 'Context clues'), e(2, 'Context clues'), e(2, 'Context clues')],
  'reading.silentEVowels': [e(2, 'Silent e'), e(2, 'Silent e'), e(2, 'Vowel teams')],
  'reading.softCG': [e(2, 'Soft g and c'), e(2, 'Soft g and c'), e(2, 'Soft g and c')],
  'writing.wordTypes': [e(0, 'Adjectives and verbs'), e(1, 'Nouns and adjectives'), e(1, 'Verbs')],
  'writing.spellRight': [e(2, 'Spelling'), e(2, 'Spelling'), e(2, 'Spelling')],
  'writing.prefixSuffix': [e(1, 'Prefixes and suffixes'), e(1, 'Prefixes and suffixes'), e(2, 'Affixed words')],
  'writing.linkWords': [e(1, 'Linking words'), e(2, 'Linking words'), e(2, 'Linking words')],
  'writing.oddSentence': [e(2, 'Topic sentences'), e(2, 'Topic sentences'), e(2, 'Topic sentences')],
  'writing.opinionVsFact': [e(2, 'Opinion writing'), e(2, 'Opinion writing'), e(2, 'Opinion writing')],
  'writing.shortForms': [e(2, 'Abbreviations'), e(3, 'Abbreviations'), e(3, 'Abbreviations')],
}
