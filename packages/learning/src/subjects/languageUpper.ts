import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * English skills for grades 2–5, named like IXL's categories. These sit above language.ts and
 * unlock once a player is solid with the basics, so first and second graders don't see them yet.
 *
 * Each skill is a short hand-written bank per level. A row is [question, right answer, wrong answers...]
 * and every wrong answer is checked by hand to be clearly wrong, so only one choice is ever right.
 * Keys are "<skill>:<level>:<row>", so a missed question can be rebuilt exactly.
 */

type Row = [text: string, answer: string, ...wrong: string[]]

function rowSkill(id: string, labels: string[], banks: Row[][], unlocksAfter: Skill['unlocksAfter']): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const [text, answer, ...wrong] = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text, say: text.replace(/___/g, 'blank') },
      answer,
      wrong: (n) => wrongFrom(answer, n, wrong),
    }
  }
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: banks.length,
    formats: ['choice'],
    unlocksAfter,
    generate: (L) => {
      // Mostly this level's questions; sometimes an easier level's, so older ones still come back.
      const level = L > 1 && Math.random() < 0.3 ? 1 + Math.floor(Math.random() * (L - 1)) : L
      return itemAt(level, Math.floor(Math.random() * banks[level - 1]!.length))
    },
    fromKey: (key, L) => {
      const [k, lv, idx] = key.split(':')
      const level = Number(lv)
      const i = Number(idx)
      if (k !== id || !Number.isInteger(level) || level < 1 || level > L || !banks[level - 1]?.[i]) return null
      return itemAt(level, i)
    },
  }
}

const WRITING_GATE = [{ skill: 'grammar', level: 3 }]
const READING_GATE = [{ skill: 'wordMeaning', level: 3 }]
const ASK = 'Which sentence uses commas correctly?'

// --- Writing: conventions --------------------------------------------------------------------

const nouns = rowSkill(
  'nouns',
  ['Plural nouns', 'Possessive nouns: one owner', 'Possessive nouns: more than one owner'],
  [
    [
      ['Which word is the plural of box?', 'boxes', 'boxs', "box's", 'boxies'],
      ['Which word is the plural of child?', 'children', 'childs', "child's", 'childrens'],
      ['Which word is the plural of wish?', 'wishes', 'wishs', "wish's", 'wishies'],
      ['Which word is the plural of city?', 'cities', 'citys', "city's", 'cityes'],
      ['Which word is the plural of mouse?', 'mice', 'mouses', "mouse's", 'mousies'],
    ],
    [
      ['Pick the right word: The ___ bone is big. (one dog)', "dog's", 'dogs', "dogs'", 'dogz'],
      ['Pick the right word: The ___ tail is long. (one cat)', "cat's", 'cats', "cats'", 'catz'],
      ['Pick the right word: The ___ toys are new. (one baby)', "baby's", 'babies', "babies'", 'babys'],
      ['Pick the right word: The ___ hat is red. (one girl)', "girl's", 'girls', "girls'", 'girll'],
    ],
    [
      ['Pick the right word: The ___ coats are blue. (two boys)', "boys'", 'boys', "boy's", 'boyes'],
      ['Pick the right word: The ___ nests are high. (many birds)', "birds'", 'birds', "bird's", 'birdes'],
      ['Pick the right word: The ___ toys are in the box. (the children)', "children's", 'childrens', "childrens'", "children'"],
      ['Pick the right word: The ___ books are on the desk. (the teachers)', "teachers'", 'teachers', "teacher's", "teacher'"],
    ],
  ],
  WRITING_GATE,
)

const verbTense = rowSkill(
  'verbTense',
  ['Past tense: add -ed', 'Past tense: irregular verbs', 'Future and present perfect'],
  [
    [
      ['Pick the right word: Yesterday, Sam ___ his bike. (fix)', 'fixed', 'fix', 'fixing', 'fixes'],
      ['Pick the right word: Yesterday we ___ to the beach. (walk)', 'walked', 'walk', 'walking', 'walks'],
      ['Pick the right word: Last night the dog ___ at the mail carrier. (bark)', 'barked', 'barks', 'barking', 'bark'],
      ['Pick the right word: Every day, Mom ___ dinner. (cook)', 'cooks', 'cooked', 'cooking', 'cook'],
      ['Pick the right word: Yesterday, Ana ___ her room. (clean)', 'cleaned', 'cleans', 'cleaning', 'clean'],
    ],
    [
      ['Pick the right word: Yesterday I ___ a big apple. (eat)', 'ate', 'eated', 'eat', 'eating'],
      ['Pick the right word: Yesterday the bird ___ over the tree. (fly)', 'flew', 'flied', 'fly', 'flying'],
      ['Pick the right word: Last week we ___ a funny movie. (see)', 'saw', 'seed', 'see', 'seeing'],
      ['Pick the right word: Yesterday she ___ a red ball. (throw)', 'threw', 'throwed', 'throw', 'throwing'],
      ['Pick the right word: Last winter we ___ on the ice. (run)', 'ran', 'runned', 'run', 'running'],
    ],
    [
      ['Pick the right word: Tomorrow we ___ go to the zoo.', 'will', 'did', 'were', 'was'],
      ['Pick the right word: Tomorrow it ___ rain.', 'will', 'was', 'did', 'were'],
      ['Pick the right word: They ___ already finished their lunch.', 'have', 'has', 'having', 'is'],
      ['Pick the right word: She ___ already eaten lunch.', 'has', 'have', 'having', 'is'],
    ],
  ],
  WRITING_GATE,
)

const subjectVerb = rowSkill(
  'subjectVerb',
  ['Subject and verb match: -s', 'Subject and verb match: a phrase in between', 'Subject and verb match: tricky subjects'],
  [
    [
      ['Pick the right word: The dog ___ fast. (run)', 'runs', 'run', 'running', 'ran'],
      ['Pick the right word: The cats ___ on the mat. (sit)', 'sit', 'sits', 'sitting', 'sat'],
      ['Pick the right word: A bird ___ in the tree. (sing)', 'sings', 'sing', 'singing', 'sang'],
      ['Pick the right word: My friends ___ at school today.', 'are', 'is', 'am', 'was'],
      ['Pick the right word: Mom and Dad ___ home now.', 'are', 'is', 'am', 'was'],
    ],
    [
      ['Pick the right word: The box of toys ___ heavy.', 'is', 'are', 'be', 'were'],
      ['Pick the right word: The boys in the class ___ loud.', 'are', 'is', 'was', 'be'],
      ['Pick the right word: The bag of apples ___ on the table.', 'is', 'are', 'were', 'be'],
      ['Pick the right word: The kids with the ball ___ happy.', 'are', 'is', 'was', 'am'],
    ],
    [
      ['Pick the right word: Each of the girls ___ a hat.', 'has', 'have', 'having', 'is'],
      ['Pick the right word: Everyone in the class ___ ready.', 'is', 'are', 'were', 'be'],
      ['Pick the right word: Tom and Ann ___ best friends.', 'are', 'is', 'was', 'be'],
      ['Pick the right word: Somebody ___ left the door open.', 'has', 'have', 'having', 'is'],
    ],
  ],
  WRITING_GATE,
)

const pronouns = rowSkill(
  'pronouns',
  ['Subject pronouns', 'Object pronouns', 'Possessive and reflexive pronouns'],
  [
    [
      ['Pick the right word: Mia and I went to the park. ___ played all day.', 'We', 'Us', 'Them', 'Me'],
      ['Pick the right word: The dog ran fast. ___ was happy.', 'It', 'Him', 'Them', 'Her'],
      ['Pick the right word: Tom is funny. ___ makes me laugh.', 'He', 'Him', 'His', 'Her'],
      ['Pick the right word: Ana and Ben like pizza. ___ like pasta too.', 'They', 'Them', 'Their', 'Us'],
      ['Pick the right word: My sister has a cat. ___ feeds it every day.', 'She', 'Her', 'Hers', 'Him'],
    ],
    [
      ['Pick the right word: Ana gave the book to ___. (Ben)', 'him', 'he', 'his', 'himself'],
      ['Pick the right word: Can you help ___, please?', 'me', 'I', 'my', 'mine'],
      ['Pick the right word: The teacher called ___ to the board. (the kids)', 'them', 'they', 'their', 'theirs'],
      ['Pick the right word: We saw Grandma at the park. We waved to ___.', 'her', 'she', 'hers', 'herself'],
      ['Pick the right word: This gift is for ___.', 'you', 'your', 'yours', 'yourself'],
    ],
    [
      ['Pick the right word: That bike is ___. (it belongs to me)', 'mine', 'my', 'me', 'I'],
      ['Pick the right word: The hat is ___. (it belongs to Sara)', 'hers', 'her', 'she', 'herself'],
      ['Pick the right word: I hurt ___ on the slide.', 'myself', 'me', 'my', 'mine'],
      ['Pick the right word: I made this cake all by ___.', 'myself', 'me', 'my', 'mine'],
      ['Pick the right word: They did the puzzle all by ___.', 'themselves', 'them', 'their', 'theirs'],
      ['Pick the right word: This book is ___. (it belongs to us)', 'ours', 'our', 'us', 'we'],
    ],
  ],
  WRITING_GATE,
)

const prepositions = rowSkill(
  'prepositions',
  ['Which word is a preposition?', 'Prepositions of time: on, in, at, for', 'Prepositions in set phrases'],
  [
    [
      ['Which word is a preposition? (It shows where.)', 'under', 'jump', 'happy', 'quickly'],
      ['Which word is a preposition? (It shows where.)', 'behind', 'dog', 'sing', 'blue'],
      ['Which word is a preposition? (It shows where.)', 'into', 'house', 'hop', 'tall'],
      ['Which word is a preposition? (It shows where.)', 'near', 'pencil', 'swim', 'loud'],
      ['Which word is a preposition? (It shows where.)', 'over', 'cloud', 'read', 'soft'],
    ],
    [
      ['Pick the right word: We go to the park ___ Monday.', 'on', 'in', 'at', 'for'],
      ['Pick the right word: Our class starts ___ 8 o\'clock.', 'at', 'on', 'in', 'for'],
      ['Pick the right word: We swim ___ the summer.', 'in', 'on', 'at', 'for'],
      ['Pick the right word: The fair happens ___ June.', 'in', 'on', 'at', 'for'],
      ['Pick the right word: The party is ___ my birthday.', 'on', 'in', 'at', 'for'],
    ],
    [
      ['Pick the right word: We listened ___ the story.', 'to', 'at', 'for', 'of'],
      ['Pick the right word: She is afraid ___ spiders.', 'of', 'for', 'at', 'from'],
      ['Pick the right word: I am proud ___ my drawing.', 'of', 'for', 'at', 'from'],
      ['Pick the right word: Sam depends ___ his mom for a ride.', 'on', 'of', 'for', 'at'],
    ],
  ],
  WRITING_GATE,
)

const adjectivesAdverbs = rowSkill(
  'adjectivesAdverbs',
  ['Adjectives: describe a noun', 'Adverbs: tell how', 'Comparing: -er and -est'],
  [
    [
      ['Which word tells what the cake is like?', 'sweet', 'sweetly', 'bake', 'cakes'],
      ['Which word tells what the puppy is like?', 'fluffy', 'fluffily', 'puppy', 'run'],
      ['Which word tells what the sky is like?', 'blue', 'bluely', 'sky', 'fly'],
      ['Which word tells what the hill is like?', 'steep', 'steeply', 'hill', 'climb'],
      ['Which word tells what the soup is like?', 'hot', 'hotly', 'soup', 'eat'],
    ],
    [
      ['Pick the right word: She ran ___ to the bus.', 'quickly', 'quick', 'quicker', 'quickness'],
      ['Pick the right word: He spoke ___.', 'softly', 'soft', 'softer', 'softness'],
      ['Pick the right word: The bird sang ___.', 'happily', 'happy', 'happiness', 'happier'],
      ['Pick the right word: Dad walked ___ into the room.', 'slowly', 'slow', 'slower', 'slowness'],
      ['Pick the right word: The baby slept ___.', 'peacefully', 'peaceful', 'peace', 'peacefulness'],
    ],
    [
      ['Pick the right word: Sam is ___ than Ben. (tall)', 'taller', 'tallest', 'more tall', 'most tall'],
      ['Pick the right word: Of the three cats, Mia is the ___. (fluffy)', 'fluffiest', 'fluffier', 'most fluffy', 'more fluffy'],
      ['Pick the right word: This soup is ___ than that one. (hot)', 'hotter', 'hottest', 'more hot', 'most hot'],
      ['Pick the right word: This is the ___ book I have ever read. (good)', 'best', 'better', 'goodest', 'most good'],
      ['Pick the right word: My room is ___ than yours. (big)', 'bigger', 'biggest', 'more big', 'most big'],
    ],
  ],
  WRITING_GATE,
)

const commas = rowSkill(
  'commas',
  ['Commas in a list', 'Commas after an opening word', 'Commas before and, but, or so'],
  [
    [
      [ASK, 'I bought apples, bananas, and grapes.', 'I bought apples bananas, and grapes.', 'I bought, apples, bananas, and grapes.', 'I bought apples, bananas and, grapes.'],
      [ASK, 'We need eggs, milk, and bread.', 'We need eggs milk, and bread.', 'We, need eggs, milk and bread.', 'We need eggs, milk, and, bread.'],
      [ASK, 'Lee has a red, blue, and green kite.', 'Lee has a red blue, and green kite.', 'Lee, has a red, blue, and green kite.', 'Lee has a red, blue and, green kite.'],
      [ASK, 'We bought pens, paper, and glue.', 'We bought pens paper, and glue.', 'We, bought pens, paper, and glue.', 'We bought, pens, paper and glue.'],
    ],
    [
      [ASK, 'After school, we play outside.', 'After school we, play outside.', 'After, school we play outside.', 'After school we play, outside.'],
      [ASK, 'No, I did not take it.', 'No I did not take it.', 'No, I, did not take it.', 'No I, did not take it.'],
      [ASK, 'Mom, can I have a snack?', 'Mom can I have a snack?', 'Mom can, I have a snack?', 'Mom, can I, have a snack?'],
      [ASK, 'When it rains, we stay inside.', 'When it, rains we stay inside.', 'When it rains we, stay inside.', 'When, it rains we stay inside.'],
      [ASK, 'Yes, Ana can come to the party.', 'Yes Ana, can come to the party.', 'Yes Ana can come to the party.', 'Yes, Ana, can come to the party.'],
    ],
    [
      [ASK, 'I like pizza, but I do not like olives.', 'I like pizza but, I do not like olives.', 'I like pizza but I do not like olives,', 'I like pizza but I do not, like olives.'],
      [ASK, 'It was late, so we went to bed.', 'It was late so we went to bed.', 'It was, late so we went to bed.', 'It was late so, we went to bed.'],
      [ASK, 'The sun set, and the stars came out.', 'The sun set and the stars came out.', 'The sun, set and the stars came out.', 'The sun set and, the stars came out.'],
      [ASK, 'The rain stopped, and we went outside.', 'The rain stopped and, we went outside.', 'The rain, stopped and we went outside.', 'The rain stopped and we went outside,'],
    ],
  ],
  WRITING_GATE,
)

const contractions = rowSkill(
  'contractions',
  ['Contractions: not, am, will', 'Contractions: cannot, let us, she is', 'Contractions: it\'s, who\'s, you\'re, does not'],
  [
    [
      ['Which is the contraction for "do not"?', "don't", "do'nt", "doesn't", 'dont'],
      ['Which is the contraction for "they are"?', "they're", 'their', 'there', 'theyre'],
      ['Which is the contraction for "we will"?', "we'll", "we'd", 'well', "wel'l"],
      ['Which is the contraction for "is not"?', "isn't", "it's", "in't", 'isnot'],
      ['Which is the contraction for "I am"?', "I'm", "I'd", "I'll", 'Im'],
    ],
    [
      ['Which is the contraction for "cannot"?', "can't", 'cant', "con't", 'canot'],
      ['Which is the contraction for "will not"?', "won't", 'wont', "willn't", "wil't"],
      ['Which is the contraction for "let us"?', "let's", 'lets', "let'us", "let'd"],
      ['Which is the contraction for "she is"?', "she's", 'shes', "she'd", "she'll"],
      ['Which is the contraction for "that will"?', "that'll", "that'd", "than's", 'thats'],
    ],
    [
      ['Which is the contraction for "it is"?', "it's", 'its', "it'd", 'itis'],
      ['Which is the contraction for "who is"?', "who's", 'whose', "who'd", 'whos'],
      ['Which is the contraction for "you are"?', "you're", 'your', "you'd", 'youre'],
      ['Which is the contraction for "does not"?', "doesn't", "dosn't", "does'nt", 'dont'],
      ['Which is the contraction for "they will"?', "they'll", "they'd", 'then', 'theyll'],
    ],
  ],
  WRITING_GATE,
)

// --- Reading: vocabulary and comprehension ---------------------------------------------------

const affixes = rowSkill(
  'affixes',
  ['Prefixes and suffixes: un-, re-', 'Prefixes and suffixes: pre-, dis-, -er, -ly', 'Prefixes and suffixes: mis-, sub-, -less, inter-'],
  [
    [
      ['What does "unhappy" mean? (The prefix un- means "not.")', 'not happy', 'very happy', 'happy again', 'happy a lot'],
      ['What does "redo" mean? (The prefix re- means "again.")', 'do again', 'do not', 'do before', 'do too much'],
      ['What does "helpful" mean? (The suffix -ful means "full of.")', 'full of help', 'without help', 'helping again', 'not helpful'],
      ['What does "careless" mean? (The suffix -less means "without.")', 'without care', 'full of care', 'care again', 'very careful'],
      ['What does "kindness" mean? (The suffix -ness means "the state of being.")', 'the state of being kind', 'without kindness', 'kind again', 'full of kind'],
    ],
    [
      ['What does "preview" mean? (The prefix pre- means "before.")', 'to see before', 'to see again', 'not to see', 'to see a lot'],
      ['What does "disagree" mean? (The prefix dis- means "not.")', 'not agree', 'agree again', 'agree too much', 'agree before'],
      ['What does "teacher" mean? (The suffix -er means "one who.")', 'one who teaches', 'one who learns', 'a place to teach', 'to teach again'],
      ['What does "slowly" mean? (The suffix -ly means "in a way that is.")', 'in a slow way', 'very slow', 'without slowing', 'more slow'],
      ['What does "nonstop" mean? (The prefix non- means "not.")', 'without stopping', 'stop again', 'stop before', 'stop a lot'],
    ],
    [
      ['What does "misbehave" mean? (The prefix mis- means "wrongly.")', 'behave badly', 'behave again', 'behave very well', 'not behave'],
      ['What does "subway" mean? (The prefix sub- means "under.")', 'a train under the ground', 'a train over the sea', 'a train above the road', 'a train with no tracks'],
      ['What does "fearless" mean? (The suffix -less means "without.")', 'without fear', 'full of fear', 'fear again', 'very scared'],
      ['What does "international" mean? (The prefix inter- means "between.")', 'between nations', 'inside one nation', 'without a nation', 'a nation again'],
    ],
  ],
  READING_GATE,
)

const homophones = rowSkill(
  'homophones',
  ['Homophones: to, too, two; hear, here; sea, see', 'Homophones: pear, pair; flour, flower; meat, meet', 'Homophones: write, right; except, accept; whether, weather'],
  [
    [
      ['Pick the right word: I have ___ cats.', 'two', 'to', 'too', 'tu'],
      ['Pick the right word: Can you ___ the birds sing?', 'hear', 'here', 'hair', 'heard'],
      ['Pick the right word: Come ___ and sit with me.', 'here', 'hear', 'hair', 'heer'],
      ['Pick the right word: We sat by the ___ and watched the waves.', 'sea', 'see', 'sew', 'sow'],
      ['Pick the right word: I ___ a big red apple for lunch.', 'ate', 'eight', 'eighty', 'at'],
    ],
    [
      ['Pick the right word: Please pick a ripe ___ from the tree.', 'pear', 'pair', 'pare', 'peer'],
      ['Pick the right word: I bought a ___ of socks.', 'pair', 'pear', 'pare', 'peer'],
      ['Pick the right word: We baked a cake with ___.', 'flour', 'flower', 'floor', 'flours'],
      ['Pick the right word: We ate ___ for dinner.', 'meat', 'meet', 'mete', 'mint'],
      ['Pick the right word: Our dog wagged its ___.', 'tail', 'tale', 'tall', 'tael'],
    ],
    [
      ['Pick the right word: Please ___ your name on the paper.', 'write', 'right', 'rite', 'wright'],
      ['Pick the right word: Everyone came ___ Sam.', 'except', 'accept', 'expect', 'exept'],
      ['Pick the right word: Ask Mom ___ we can go to the park.', 'whether', 'weather', 'wither', 'wetter'],
      ['Pick the right word: The bus came, and ___ we left.', 'then', 'than', 'them', 'thin'],
      ['Pick the right word: I got a ___ bike for my birthday.', 'new', 'knew', 'gnu', 'nu'],
    ],
  ],
  READING_GATE,
)

const figurative = rowSkill(
  'figurative',
  ['Similes: like or as', 'What a comparison means', 'Idioms: what they mean'],
  [
    [
      ['Which sentence is a simile?', 'The lake was as calm as glass.', 'The lake was a mirror.', 'The lake was calm.', 'The lake was very big.'],
      ['Which sentence is a simile?', 'He runs like the wind.', 'He is the wind.', 'He runs fast.', 'The wind runs fast.'],
      ['Which sentence is a simile?', 'Her hair is as yellow as the sun.', 'Her hair is the sun.', 'Her hair is yellow.', 'Her hair shines.'],
      ['Which sentence is a simile?', 'The puppy is as busy as a bee.', 'The puppy is a busy bee.', 'The puppy is busy.', 'The puppy buzzes.'],
      ['Which sentence is a simile?', 'My little brother is as quiet as a mouse.', 'My little brother is a mouse.', 'My little brother is quiet.', 'My little brother squeaks.'],
    ],
    [
      ['What does "The classroom was a zoo." mean?', 'It was very noisy and messy.', 'It had lots of animals.', 'It was very quiet.', 'It was empty.'],
      ['What does "The test was a piece of cake." mean?', 'It was very easy.', 'It was made of cake.', 'It was very hard.', 'It was very big.'],
      ['What does "The baby was a little angel at dinner." mean?', 'The baby was very well behaved.', 'The baby could fly.', 'The baby was sick.', 'The baby was loud.'],
      ['What does "The lake is a mirror." mean?', 'It is very smooth and still.', 'It is full of fish.', 'It is very cold.', 'It is made of glass.'],
    ],
    [
      ['What does "It is raining cats and dogs." mean?', 'It is raining very hard.', 'Cats and dogs are falling from the sky.', 'It is raining softly.', 'It is snowing.'],
      ['What does "Break a leg!" mean?', 'Good luck!', 'Be careful on the stairs.', 'Run very fast.', 'Please stop.'],
      ['What does "Spill the beans." mean?', 'Tell a secret.', 'Make a mess.', 'Cook dinner.', 'Count the beans.'],
      ['What does "Hit the books." mean?', 'Study hard.', 'Throw the books.', 'Read a comic.', 'Close the library.'],
      ['What does "Once in a blue moon." mean?', 'Very rarely.', 'Every night.', 'At the same time.', 'When it is cloudy.'],
    ],
  ],
  READING_GATE,
)

const contextClues = rowSkill(
  'contextClues',
  ['Context clues: everyday words', 'Context clues: harder words', 'Context clues: hard vocabulary'],
  [
    [
      ['Jake was famished after the long hike, so he ate three sandwiches. What does famished mean?', 'very hungry', 'very tired', 'very happy', 'very cold'],
      ['The room was dim, so we used a flashlight to see. What does dim mean?', 'not bright', 'very loud', 'very warm', 'very clean'],
      ['Mia was furious when her brother broke her toy. She stomped and yelled. What does furious mean?', 'very angry', 'very sleepy', 'very silly', 'very quiet'],
    ],
    [
      ['The baker was meticulous. She measured each cup and checked every step. What does meticulous mean?', 'very careful', 'very fast', 'very messy', 'very loud'],
      ['The puppies were timid at first, but they slowly came out to play. What does timid mean?', 'shy and nervous', 'very loud', 'very fast', 'very hungry'],
      ['The lake was tranquil. Not a single wave moved on the water. What does tranquil mean?', 'calm and peaceful', 'very cold', 'very dirty', 'very deep'],
      ['Ana was reluctant to try the spicy soup, so she took only a tiny sip. What does reluctant mean?', 'not willing', 'very excited', 'very hungry', 'very fast'],
    ],
    [
      ['The explorers found an abundant supply of water, so they had plenty to drink. What does abundant mean?', 'a large amount', 'a tiny amount', 'no amount', 'a strange color'],
      ['The coach was incredulous when the team won. She could not believe it. What does incredulous mean?', 'unable to believe something', 'very angry', 'very bored', 'very sleepy'],
      ["The dog's fur was matted and tangled, so the groomer used a brush to comb it out. What does matted mean?", 'tangled together', 'freshly washed', 'very short', 'very wet'],
    ],
  ],
  READING_GATE,
)

const mainIdea = rowSkill(
  'mainIdea',
  ['Main idea: key details', 'Main idea of a passage', 'Main idea across several sentences'],
  [
    [
      ['Bees make honey. They gather nectar from flowers. Then they store the honey in a hive. What is the main idea?', 'Bees make honey.', 'Bees store honey in a hive.', 'Flowers have bright colors.', 'The moon is far away.'],
      ['Dogs need food and water every day. They also need walks and a safe place to sleep. Caring for a dog takes time. What is the main idea?', 'Caring for a dog takes time.', 'Dogs like to run fast.', 'Dogs need food and water.', 'Cats sleep all day.'],
      ['The sun is a star. It gives us light and heat. Without the sun, plants could not grow. What is the main idea?', 'The sun helps us and our planet in many ways.', 'Plants can grow in the dark.', 'The moon is a star.', 'Stars are very far away.'],
      ['Lily planted a seed in a cup of soil. She gave it water and sunshine every day. Soon a tiny green sprout popped up. What is the main idea?', 'Lily cared for a seed and watched it grow.', 'Sprouts are green.', 'Soil is brown.', 'Cups are made of plastic.'],
    ],
    [
      ['Many kids join clubs at school. Chess club teaches strategy. Art club lets kids paint. Clubs help kids learn new skills. What is the main idea?', 'Clubs help kids learn new skills.', 'Chess is the best club.', 'Art club lets kids paint.', 'Clubs meet after school.'],
      ["A volcano is an opening in Earth's crust. Hot melted rock called magma rises up from deep inside. Some volcanoes erupt, and others stay quiet. What is the main idea?", "Volcanoes are openings in Earth's crust that can erupt.", 'Magma is cold and hard.', 'Earth has no volcanoes.', 'Scientists are not interested in volcanoes.'],
      ['Stories are a great way to learn about the past. Many old tales show how people lived long ago. Reading them helps us understand history. What is the main idea?', 'Stories help us learn about history.', 'People did not live long ago.', 'Old tales are always true.', 'Reading is hard work.'],
    ],
    [
      ["Ms. Lee's class started a garden. The students planted seeds, watered them each day, and pulled weeds. By fall, the garden grew tomatoes and beans. What is the main idea?", 'Hard work and care turn an empty space into something useful.', 'Tomatoes are the best vegetable.', 'Weeds grow faster than seeds.', 'Ms. Lee is a strict teacher.'],
      ['Some people think school is only about tests. But learning also happens in art, music, and on the playground. Every part of school teaches us something. What is the main idea?', 'School teaches us in many ways, not just with tests.', 'Tests are the most important part of school.', 'Playgrounds are the best part of school.', 'Art and music are not useful.'],
      ['Owls are birds that hunt at night. Their eyes are very big, and they help them see in the dark. Their soft feathers let them fly without a sound. What is the main idea?', 'Owls have special features that help them hunt at night.', 'Owls cannot see at all.', 'Owls are noisy when they fly.', 'Owls only eat fish.'],
    ],
  ],
  READING_GATE,
)

const inference = rowSkill(
  'inference',
  ['Draw inferences from clues', 'Draw inferences and find supporting details', 'Draw inferences from longer clues'],
  [
    [
      ['Mia grabbed her umbrella and her boots before she left. What can you infer?', 'It is raining outside.', 'It is very hot outside.', 'Mia forgot her shoes.', 'Mia is going to bed.'],
      ["Ben's cheeks were red, and he was shivering. He put on his hat and gloves. What can you infer?", 'It is cold outside.', 'It is very hot outside.', 'Ben is not hungry.', 'Ben is going to bed.'],
      ['Lily poured the milk into a cup and set out a plate of cookies. She kept checking the front door. What can you infer?', 'Lily is waiting for a guest.', 'Lily is cleaning the floor.', 'Lily does not like milk.', 'Lily is at the zoo.'],
    ],
    [
      ['The room was dark and quiet. Jay tiptoed past the sleeping dog. What can you infer?', 'Everyone in the house is asleep.', 'There is a party in the house.', 'The dog is angry.', 'Jay is going to the store.'],
      ['Sara kept checking the clock. She looked at the door every minute. What can you infer?', 'Sara is waiting for someone.', 'Sara is sleeping.', 'Sara does not care about time.', 'Sara has already gone home.'],
      ['The chef wiped her hands, took off her apron, and smiled. "Dinner is served," she said. What can you infer?', 'The meal is ready to eat.', 'The chef is closing the kitchen forever.', 'The chef does not like cooking.', 'The guests are leaving.'],
    ],
    [
      ['The lights flickered, and the phone went silent. Then the power went out, and candles were lit. What can you infer?', 'A storm knocked out the power.', 'The family is going to the beach.', 'The phone is new.', 'It was a sunny day.'],
      ['Maya checked the mailbox three times. Her letter from camp was supposed to arrive today. She ran to the box again after lunch. What can you infer?', 'Maya is excited and waiting for a letter.', 'Maya does not like camp.', 'Maya is sleeping in the mailbox.', 'Maya already got her letter and threw it away.'],
      ['The sand was hot, and the waves rolled in. Kids built castles and dug holes. A lifeguard watched from a tall chair. What can you infer?', 'The story takes place at a beach.', 'The story takes place in a snowy forest.', 'The lifeguard is sleeping on the sand.', 'The kids are doing homework.'],
    ],
  ],
  READING_GATE,
)

const authorPurpose = rowSkill(
  'authorPurpose',
  ["Author's purpose: inform, entertain, persuade", "Author's purpose: the message", "Author's purpose in ads and speeches"],
  [
    [
      ["Penguins are birds that cannot fly. They have thick feathers and swim well in cold water. What is the author's purpose?", 'to inform', 'to entertain', 'to persuade', 'to warn'],
      ["Ha! Our cat tried to hug the vacuum cleaner. It was a silly mess, and the vacuum got stuck under the couch. What is the author's purpose?", 'to entertain', 'to inform', 'to persuade', 'to warn'],
      ["You should wear a helmet when you ride your bike. Helmets protect your head if you fall. Please always wear one! What is the author's purpose?", 'to persuade', 'to entertain', 'to describe a bike', 'to tell a joke'],
      ["Dinosaurs lived millions of years ago. Scientists dig up their bones and study them. This helps us learn how dinosaurs lived. What is the author's purpose?", 'to inform', 'to entertain', 'to persuade', 'to warn'],
    ],
    [
      ['A recycling bin keeps paper and cans out of the trash. When we recycle, we save space in landfills. Everyone should recycle every day! What is the author\'s purpose?', 'to convince readers to recycle', 'to tell a funny story', 'to explain how bees make honey', 'to describe a trip to the beach'],
      ['Last summer my family drove to the lake. We swam, ate too many marshmallows, and laughed until our sides hurt. What is the author\'s purpose?', 'to share a fun memory', 'to explain how lakes form', 'to warn about storms', 'to list rules for camping'],
      ['A computer has a screen, a keyboard, and a mouse. The screen shows pictures and words. What is the author\'s purpose?', 'to explain the parts of a computer', 'to tell a scary story', 'to describe a farm', 'to convince readers to buy a computer'],
    ],
    [
      ['Try Zip Juice today! It is the tastiest drink around, and it gives you energy all day. What is the author\'s purpose?', 'to persuade you to buy juice', 'to inform you about planets', 'to tell a bedtime story', 'to explain how juice is made'],
      ['Dogs were first tamed thousands of years ago. Today there are many different breeds. This passage gives facts about dogs. What is the author\'s purpose?', 'to inform readers about dogs', 'to persuade readers to adopt a dog', 'to make readers laugh', 'to warn readers about dogs'],
      ['Our school needs a new library. Please sign the petition and help us raise money. Together we can make it happen! What is the author\'s purpose?', 'to persuade readers to help', 'to inform readers about library history', 'to entertain readers with a joke', 'to describe a school building'],
    ],
  ],
  READING_GATE,
)

const textFeatures = rowSkill(
  'textFeatures',
  ['Text features: table of contents, index, glossary, caption', 'Text features: maps, diagrams, tables', 'Text features: timelines, sidebars, footnotes'],
  [
    [
      ['Which text feature lists the chapters and their page numbers?', 'table of contents', 'glossary', 'index', 'caption'],
      ['Which text feature explains the meaning of hard words?', 'glossary', 'table of contents', 'index', 'caption'],
      ['Which text feature is the short description under a picture?', 'caption', 'index', 'glossary', 'table of contents'],
      ['Which text feature lists topics in ABC order with page numbers?', 'index', 'table of contents', 'glossary', 'caption'],
    ],
    [
      ['Which text feature shows places and directions?', 'map', 'diagram', 'table', 'glossary'],
      ['Which text feature shows how the parts of a bike fit together?', 'diagram', 'map', 'table', 'caption'],
      ['Which text feature puts facts in rows and columns?', 'table', 'diagram', 'map', 'index'],
      ['You want to find the page about frogs fast. Which text feature helps most?', 'index', 'caption', 'table of contents', 'glossary'],
    ],
    [
      ['Which text feature gives extra information at the bottom of a page?', 'footnote', 'sidebar', 'timeline', 'index'],
      ['Which text feature shows events in order over time?', 'timeline', 'footnote', 'sidebar', 'glossary'],
      ['Which text feature is a box of extra facts beside the main text?', 'sidebar', 'footnote', 'timeline', 'caption'],
    ],
  ],
  READING_GATE,
)

export const WRITING_UPPER: Skill[] = [nouns, verbTense, subjectVerb, pronouns, prepositions, adjectivesAdverbs, commas, contractions]
export const READING_UPPER: Skill[] = [affixes, homophones, figurative, contextClues, mainIdea, inference, authorPurpose, textFeatures]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** The IXL category each level practices, one entry per level. Keys are "<subject>.<skill id>". */
export const LANGUAGE_UPPER_IXL: Record<string, IxlRef[]> = {
  'writing.nouns': [e(3, 'Nouns'), e(4, 'Nouns'), e(5, 'Nouns')],
  'writing.verbTense': [e(2, 'Verb tense'), e(3, 'Verb tense'), e(4, 'Verb tense')],
  'writing.subjectVerb': [e(2, 'Subject-verb agreement'), e(3, 'Subject-verb agreement'), e(4, 'Subject-verb agreement')],
  'writing.pronouns': [e(2, 'Pronouns'), e(3, 'Pronouns'), e(4, 'Pronouns')],
  'writing.prepositions': [e(2, 'Prepositions'), e(3, 'Prepositions'), e(4, 'Prepositions')],
  'writing.adjectivesAdverbs': [e(2, 'Adjectives and adverbs'), e(3, 'Adjectives and adverbs'), e(4, 'Adjectives and adverbs')],
  'writing.commas': [e(3, 'Commas'), e(4, 'Commas'), e(5, 'Commas')],
  'writing.contractions': [e(2, 'Contractions'), e(3, 'Contractions'), e(4, 'Contractions')],
  'reading.affixes': [e(2, 'Prefixes and suffixes'), e(3, 'Prefixes and suffixes'), e(4, 'Prefixes and suffixes')],
  'reading.homophones': [e(2, 'Homophones and homonyms'), e(3, 'Homophones and homonyms'), e(4, 'Homophones and homonyms')],
  'reading.figurative': [e(4, 'Literary devices'), e(4, 'Literary devices'), e(4, 'Idioms and adages')],
  'reading.contextClues': [e(3, 'Context clues'), e(4, 'Context clues'), e(5, 'Context clues')],
  'reading.mainIdea': [e(3, 'Main idea'), e(4, 'Main idea'), e(5, 'Main idea')],
  'reading.inference': [e(3, 'Inference and theme'), e(4, 'Inference and theme'), e(5, 'Inference and theme')],
  'reading.authorPurpose': [e(3, "Author's purpose and perspective"), e(4, "Author's purpose and perspective"), e(5, "Author's purpose and perspective")],
  'reading.textFeatures': [e(3, 'Text features'), e(4, 'Text features'), e(5, 'Text features')],
}
