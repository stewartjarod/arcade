import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * Grade 5 (and some grade 3–4) English skills, named like IXL's categories: text structure, poetry,
 * sensory details, reference books, long words, analogies, summaries, character traits, and the
 * writing rules for articles, abbreviations, spelling, linking words, paragraphs, and arguments.
 *
 * Each skill is a hand-written bank per level, like languageMore.ts. A row is one question (often
 * with a short passage), one right answer, and wrong answers that were each checked by hand to be
 * clearly wrong, so only one choice is ever right. Keys are "<skill>:<level>:<row>", so a missed
 * question can be rebuilt exactly.
 */

interface Row {
  /** The question, which may include a short passage. "___" marks a blank. */
  q: string
  a: string
  w: string[]
}

const r = (q: string, a: string, ...w: string[]): Row => ({ q, a, w })

function rowSkill(id: string, labels: string[], banks: Row[][], unlocksAfter: Skill['unlocksAfter']): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.q.replace(/___/g, 'blank') },
      answer: row.a,
      wrong: (n) => wrongFrom(row.a, n, row.w),
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
      if (k !== id || !Number.isInteger(level) || level < 1 || level > L) return null
      if (!Number.isInteger(i) || !banks[level - 1]?.[i]) return null
      return itemAt(level, i)
    },
  }
}

const SENSES = ['Sight', 'Sound', 'Smell', 'Taste', 'Touch']
/** "Which sense?" rows: every other sense is a wrong answer. */
const sense = (q: string, a: string) => r(q, a, ...SENSES.filter((x) => x !== a))
/** A passage followed by a standard question. */
const PASSAGE_Q = (p: string, question: string) => `${p}\n\n${question}`

// --- Reading -----------------------------------------------------------------------------------

// How a passage is organized. Each level uses the IXL grade it is named for.
const textStructure = (p: string, a: string, ...w: string[]) => r(PASSAGE_Q(p, 'How is this passage organized?'), a, ...w)

const textStructureSkill = rowSkill(
  'textStructure',
  ['Text structure: time order and description', 'Text structure: cause and effect, problem and solution', 'Text structure: compare and contrast'],
  [
    [
      textStructure('First, put on your shoes. Then, grab your backpack. Last, walk out the door.', 'Time order', 'Cause and effect', 'Compare and contrast', 'Problem and solution'),
      textStructure('Owls have big, round eyes. They have soft feathers. Their wings are wide and brown.', 'Description', 'Time order', 'Cause and effect', 'Problem and solution'),
      textStructure('In the morning, I eat cereal. At noon, I eat a sandwich. At night, I eat soup.', 'Time order', 'Cause and effect', 'Compare and contrast', 'Problem and solution'),
      textStructure('Roses are red and smell sweet. Their petals are soft, and their stems have sharp thorns.', 'Description', 'Time order', 'Cause and effect', 'Problem and solution'),
      textStructure('First, mix the paint. Next, dip the brush. Then, paint a line across the paper.', 'Time order', 'Problem and solution', 'Cause and effect', 'Compare and contrast'),
      textStructure('The sea is big and blue. The sky is wide and bright. A seagull circles above the waves.', 'Description', 'Time order', 'Problem and solution', 'Cause and effect'),
      textStructure('Start by washing your hands. Then dry them with a towel. Finally, wash your face.', 'Time order', 'Problem and solution', 'Compare and contrast', 'Cause and effect'),
      textStructure('A giraffe is very tall. It has long legs and a long neck. Its coat has brown spots.', 'Description', 'Time order', 'Problem and solution', 'Cause and effect'),
    ],
    [
      textStructure('Ana stayed up late reading. In the morning, she felt tired and yawned all through breakfast.', 'Cause and effect', 'Time order', 'Compare and contrast', 'Problem and solution'),
      textStructure('Our class wanted a garden. We did not have a place to plant. So we used big pots on the playground.', 'Problem and solution', 'Time order', 'Compare and contrast', 'Description'),
      textStructure('Heavy snow fell all night. Because of this, the school was closed the next day.', 'Cause and effect', 'Time order', 'Compare and contrast', 'Description'),
      textStructure('The dog kept barking at night. Mom bought a new bed for him by the door. Now he sleeps quietly.', 'Problem and solution', 'Time order', 'Compare and contrast', 'Description'),
      textStructure('Cats and dogs both make good pets. Cats are quiet and clean themselves. Dogs are loud and love long walks.', 'Compare and contrast', 'Time order', 'Problem and solution', 'Cause and effect'),
      textStructure('The farmer\'s crops were drying up. He dug a well, and now the crops get water every day.', 'Problem and solution', 'Time order', 'Compare and contrast', 'Description'),
      textStructure('Sam had a flat tire on his bike. He patched the tube so he could ride again.', 'Problem and solution', 'Time order', 'Compare and contrast', 'Description'),
      textStructure('Pine trees keep their needles all year. Maple trees lose their leaves in the fall. Both kinds grow tall.', 'Compare and contrast', 'Time order', 'Problem and solution', 'Cause and effect'),
    ],
    [
      textStructure('In the 1800s, travel was slow. People rode horses or walked for days. Today, a plane can cross a country in hours.', 'Compare and contrast', 'Cause and effect', 'Problem and solution', 'Description'),
      textStructure('Our library was too small for everyone. The town built a bigger one with more books and computers.', 'Problem and solution', 'Compare and contrast', 'Cause and effect', 'Description'),
      textStructure('Hawks hunt during the day, while owls hunt at night. Both birds have sharp talons and excellent eyesight.', 'Compare and contrast', 'Cause and effect', 'Problem and solution', 'Time order'),
      textStructure('The river flooded after three days of heavy rain. The water covered the roads, and many families had to move to higher ground.', 'Cause and effect', 'Problem and solution', 'Compare and contrast', 'Time order'),
      textStructure('First, fill the pot with water. Next, wait until it boils. Then add the pasta and cook it for ten minutes.', 'Time order', 'Compare and contrast', 'Cause and effect', 'Problem and solution'),
      textStructure('The baker added too much salt to the bread. As a result, it tasted terrible, and nobody wanted a slice.', 'Cause and effect', 'Time order', 'Compare and contrast', 'Problem and solution'),
      textStructure('Our class wanted a bigger garden. We measured the space, bought seeds, and planted them in neat rows.', 'Time order', 'Cause and effect', 'Compare and contrast', 'Problem and solution'),
      textStructure('Maple and oak trees both lose their leaves in fall. Maple leaves turn bright red and orange. Oak leaves turn brown.', 'Compare and contrast', 'Cause and effect', 'Problem and solution', 'Time order'),
    ],
  ],
  [{ skill: 'mainIdea', level: 2 }],
)

const poetryElements = rowSkill(
  'poetryElements',
  ['Poetry: stanzas, rhymes, and titles', 'Poetry: alliteration, rhythm, and similes', 'Poetry: haiku, limericks, and sonnets'],
  [
    [
      r('A group of lines in a poem is called a ___.', 'stanza', 'chapter', 'paragraph', 'title'),
      r('Words that end lines with the same sound, like cat and hat, are called ___.', 'rhymes', 'titles', 'chapters', 'pages'),
      r('Poets write in ___ instead of paragraphs.', 'lines', 'chapters', 'pages', 'columns'),
      r('Which word rhymes with bee?', 'tree', 'table', 'sun', 'rock'),
      r('Which word rhymes with sled?', 'red', 'cup', 'sun', 'tree'),
      r('Which word rhymes with frog?', 'dog', 'cup', 'sun', 'pen'),
      r('The name of a poem is its ___.', 'title', 'stanza', 'rhyme', 'line'),
      r('Which word rhymes with star?', 'car', 'cup', 'dog', 'leaf'),
    ],
    [
      r('Repeating the same first sound in nearby words, like "big brown bear," is called ___.', 'alliteration', 'rhyme', 'stanza', 'simile'),
      r('A poem\'s beat pattern, like da-DUM da-DUM, is its ___.', 'rhythm', 'rhyme', 'title', 'stanza'),
      r('Words that sound like the thing they name, like buzz or splash, are called ___.', 'onomatopoeia', 'alliteration', 'metaphor', 'stanza'),
      r('Comparing two things with "like" or "as," like "as quiet as a mouse," is a ___.', 'simile', 'rhyme', 'stanza', 'alliteration'),
      r('A poem\'s rhyme pattern, like ABAB, is called its ___.', 'rhyme scheme', 'rhythm', 'title', 'stanza'),
      r('Saying one thing IS another, like "the cloud is cotton candy," is a ___.', 'metaphor', 'simile', 'rhyme', 'stanza'),
      r('Giving an object human traits, like "the wind whispered," is called ___.', 'personification', 'alliteration', 'rhyme', 'simile'),
      r('The voice that tells a poem is called the ___.', 'speaker', 'title', 'stanza', 'rhythm'),
    ],
    [
      r('A three-line poem about nature, with 5, 7, then 5 syllables, is a ___.', 'haiku', 'limerick', 'sonnet', 'ballad'),
      r('A five-line funny poem with an AABBA rhyme pattern is a ___.', 'limerick', 'haiku', 'sonnet', 'acrostic'),
      r('A poem with 14 lines is called a ___.', 'sonnet', 'haiku', 'limerick', 'acrostic'),
      r('A poem that tells a story is called a ___ poem.', 'narrative', 'haiku', 'limerick', 'acrostic'),
      r('A poem where the first letters of the lines spell a word is an ___.', 'acrostic', 'haiku', 'limerick', 'sonnet'),
      r('A line that repeats again and again in a poem is called a ___.', 'refrain', 'stanza', 'rhyme', 'simile'),
      r('Which lines of a limerick rhyme?', 'Lines 1, 2, and 5', 'Lines 1 and 3', 'Lines 3 and 4', 'No lines rhyme'),
      r('How many lines does a haiku have?', '3', '4', '5', '6'),
    ],
  ],
  [{ skill: 'figurative', level: 1 }],
)

const sensoryDetails = rowSkill(
  'sensoryDetails',
  ['Which sense: one word', 'Which sense: a short phrase', 'Which sense: a sentence'],
  [
    [
      sense('Which sense does "sour" describe?', 'Taste'),
      sense('Which sense does "buzzing" describe?', 'Sound'),
      sense('Which sense does "scratchy" describe?', 'Touch'),
      sense('Which sense does "fragrant" describe?', 'Smell'),
      sense('Which sense does "glowing" describe?', 'Sight'),
      sense('Which sense does "roaring" describe?', 'Sound'),
      sense('Which sense does "salty" describe?', 'Taste'),
      sense('Which sense does "colorful" describe?', 'Sight'),
    ],
    [
      sense('Which sense does "the smell of fresh bread" describe?', 'Smell'),
      sense('Which sense does "the hiss of a teakettle" describe?', 'Sound'),
      sense('Which sense does "the warm sand between my toes" describe?', 'Touch'),
      sense('Which sense does "the bright orange sunset" describe?', 'Sight'),
      sense('Which sense does "the tangy taste of lemonade" describe?', 'Taste'),
      sense('Which sense does "the sweet smell of roses" describe?', 'Smell'),
      sense('Which sense does "the buzz of bees" describe?', 'Sound'),
      sense('Which sense does "the shiny silver spoon" describe?', 'Sight'),
    ],
    [
      sense(PASSAGE_Q('The smell of cinnamon filled the whole kitchen.', 'Which sense does this detail appeal to?'), 'Smell'),
      sense(PASSAGE_Q('Thunder rumbled so loudly that the windows rattled.', 'Which sense does this detail appeal to?'), 'Sound'),
      sense(PASSAGE_Q('The lemon was so sour that my lips puckered.', 'Which sense does this detail appeal to?'), 'Taste'),
      sense(PASSAGE_Q('Silver stars glittered across the dark sky.', 'Which sense does this detail appeal to?'), 'Sight'),
      sense(PASSAGE_Q('The wool blanket felt scratchy and rough on my arms.', 'Which sense does this detail appeal to?'), 'Touch'),
      sense(PASSAGE_Q('Birds chirped outside my window every morning.', 'Which sense does this detail appeal to?'), 'Sound'),
      sense(PASSAGE_Q('The forest smelled of pine needles and damp earth.', 'Which sense does this detail appeal to?'), 'Smell'),
      sense(PASSAGE_Q('The soup was bland, and I could barely taste the salt.', 'Which sense does this detail appeal to?'), 'Taste'),
    ],
  ],
  [{ skill: 'inference', level: 1 }],
)

const abc = (a: string, ...w: string[]) => r('Which word comes first in ABC order?', a, ...w)
const guide = (first: string, last: string, a: string, ...w: string[]) =>
  r(`A dictionary page has the guide words "${first}" and "${last}." Which word would be on that page?`, a, ...w)
const bookPart = (q: string, a: string, ...w: string[]) => r(q, a, ...w)

const referenceSkills = rowSkill(
  'referenceSkills',
  ['ABC order', 'Guide words', 'Books and reference tools'],
  [
    [
      abc('ant', 'bee', 'cat', 'dog'),
      abc('bat', 'cup', 'dog', 'fish'),
      abc('lamp', 'mop', 'rake', 'sock'),
      abc('monkey', 'nest', 'pear', 'zebra'),
      abc('pencil', 'rabbit', 'sun', 'tree'),
      abc('grape', 'hat', 'ice', 'jam'),
      abc('frog', 'king', 'lion', 'tiger'),
      abc('coat', 'duck', 'egg', 'hat'),
    ],
    [
      guide('bike', 'boat', 'bird', 'apple', 'bob', 'cat'),
      guide('fish', 'frog', 'fox', 'cat', 'goat', 'tree'),
      guide('sun', 'tent', 'swim', 'rock', 'upon', 'mop'),
      guide('cow', 'dog', 'dam', 'bee', 'egg', 'ant'),
      guide('moon', 'pig', 'nest', 'kite', 'quilt', 'door'),
      guide('rain', 'robe', 'red', 'pear', 'sun', 'tree'),
      guide('dark', 'dog', 'dish', 'cake', 'bell', 'egg'),
      guide('lamp', 'lemon', 'leaf', 'kite', 'lily', 'zebra'),
    ],
    [
      bookPart('Which book part lists topics and the page numbers where they appear?', 'The index', 'The glossary', 'The cover', 'The spine'),
      bookPart('Which book part explains the meanings of special words?', 'The glossary', 'The index', 'The cover', 'The table of contents'),
      bookPart('Which book part lists the chapters and the pages where they start?', 'The table of contents', 'The glossary', 'The cover', 'The spine'),
      bookPart('An encyclopedia has volumes labeled by letter. Which volume would have "whales"?', 'W', 'A', 'M', 'P'),
      bookPart('An encyclopedia volume is labeled "M-N." Which topic would be in it?', 'Monkeys', 'Apples', 'Zebras', 'Sharks'),
      bookPart('Which reference book is a collection of maps?', 'Atlas', 'Dictionary', 'Thesaurus', 'Cookbook'),
      bookPart('Which reference book lists words with their meanings in ABC order?', 'Dictionary', 'Atlas', 'Calendar', 'Index'),
      bookPart('Which reference book lists words that mean the same thing?', 'Thesaurus', 'Atlas', 'Calendar', 'Cookbook'),
    ],
  ],
  [{ skill: 'homophones', level: 2 }],
)

// Syllable counts are the usual dictionary counts for these words.
const syl = (word: string, n: number) => {
  const wrongs: Record<number, string[]> = { 2: ['1', '3', '4'], 3: ['1', '2', '4'], 4: ['2', '3', '5'], 5: ['3', '4', '6'] }
  return r(`How many syllables are in "${word}"?`, String(n), ...wrongs[n]!)
}

const multisyllabic = rowSkill(
  'multisyllabic',
  ['Count the syllables: 2 or 3', 'Count the syllables: 3 or 4', 'Count the syllables: 5'],
  [
    [
      syl('rabbit', 2), syl('butterfly', 3), syl('elephant', 3), syl('umbrella', 3),
      syl('tomorrow', 3), syl('hospital', 3), syl('computer', 3), syl('hamburger', 3),
    ],
    [
      syl('information', 4), syl('education', 4), syl('dictionary', 4), syl('understanding', 4),
      syl('celebrate', 3), syl('calendar', 3), syl('vacation', 3), syl('mosquito', 3),
    ],
    [
      syl('vocabulary', 5), syl('multiplication', 5), syl('hippopotamus', 5), syl('refrigerator', 5),
      syl('examination', 5), syl('mathematician', 5), syl('pronunciation', 5), syl('unbelievable', 5),
    ],
  ],
  [{ skill: 'affixes', level: 2 }],
)

const analogies = rowSkill(
  'analogies',
  ['Analogies: pairs that go together', 'Analogies: uses and jobs', 'Analogies: harder pairs'],
  [
    [
      r('Cat is to kitten as dog is to ___.', 'puppy', 'bone', 'leash', 'bark'),
      r('Cow is to moo as duck is to ___.', 'quack', 'bark', 'buzz', 'hoot'),
      r('Hot is to cold as day is to ___.', 'night', 'sun', 'sky', 'bright'),
      r('Sugar is to sweet as lemon is to ___.', 'sour', 'loud', 'soft', 'hot'),
      r('Warm is to hot as cool is to ___.', 'cold', 'damp', 'wet', 'sunny'),
      r('Doctor is to patient as teacher is to ___.', 'student', 'desk', 'chalk', 'lesson'),
      r('Star is to galaxy as tree is to ___.', 'forest', 'leaf', 'branch', 'river'),
      r('Happy is to sad as brave is to ___.', 'scared', 'loud', 'kind', 'wild'),
    ],
    [
      r('Pilot is to airplane as captain is to ___.', 'ship', 'train', 'bus', 'horse'),
      r('Eye is to see as ear is to ___.', 'hear', 'taste', 'smell', 'touch'),
      r('Nose is to smell as tongue is to ___.', 'taste', 'hear', 'see', 'touch'),
      r('Thirsty is to drink as hungry is to ___.', 'eat', 'sleep', 'read', 'run'),
      r('Fork is to eat as broom is to ___.', 'sweep', 'cook', 'read', 'paint'),
      r('Gallop is to fast as crawl is to ___.', 'slow', 'quick', 'loud', 'high'),
      r('Thermometer is to temperature as clock is to ___.', 'time', 'weight', 'distance', 'volume'),
      r('Book is to reader as song is to ___.', 'listener', 'piano', 'stage', 'ticket'),
    ],
    [
      r('Architect is to building as author is to ___.', 'book', 'pen', 'reader', 'library'),
      r('Paragraph is to sentence as sentence is to ___.', 'word', 'letter', 'page', 'chapter'),
      r('Ruler is to length as scale is to ___.', 'weight', 'time', 'speed', 'volume'),
      r('Ship is to sail as car is to ___.', 'drive', 'fly', 'swim', 'wash'),
      r('Hunger is to food as thirst is to ___.', 'water', 'bread', 'sleep', 'cookie'),
      r('Chapter is to book as stanza is to ___.', 'poem', 'paragraph', 'title', 'sentence'),
      r('Scholar is to library as chef is to ___.', 'kitchen', 'desk', 'shelf', 'flower'),
      r('Lion is to pride as wolf is to ___.', 'pack', 'herd', 'flock', 'school'),
    ],
  ],
  [{ skill: 'shadesOfMeaning', level: 3 }],
)

const sum = (passage: string, a: string, ...w: string[]) =>
  r(PASSAGE_Q(passage, 'Which sentence best sums up the passage?'), a, ...w)

const summarizing = rowSkill(
  'summarizing',
  ['Summarize: two sentences', 'Summarize: a short passage', 'Summarize: a longer passage'],
  [
    [
      sum('Bees visit flowers to collect nectar. As they fly from flower to flower, they carry pollen that helps plants make seeds.', 'Bees help flowers make seeds.', 'Bees are black and yellow.', 'Flowers come in many colors.', 'Honey is sweet and sticky.'),
      sum('Dogs can be trained to help people. Some guide people who cannot see, and others help police find lost things.', 'Dogs can be trained to help people.', 'Dogs eat meat and bones.', 'Police cars are very fast.', 'Cats like to sleep all day.'),
      sum('The Nile is a long river in Africa. It flows north into the Mediterranean Sea.', 'The Nile is a long river that flows north.', 'Africa is covered in ice.', 'Ships sail on the Mediterranean Sea.', 'Rivers are always very cold.'),
      sum('Plants need sunlight to grow. Without light, a plant cannot make its own food.', 'Plants need sunlight to make food and grow.', 'Plants come in many colors.', 'Sunlight is very hot.', 'Seeds fall from trees in autumn.'),
      sum('Ice cream melts quickly on a hot day. To keep it cold, put it in the freezer right away.', 'Keep ice cream cold so it does not melt.', 'Ice cream comes in many flavors.', 'Freezers are made of metal.', 'Hot summers are long in some places.'),
      sum('Libraries lend books for free. You can borrow a book, read it at home, and bring it back later.', 'Libraries let people borrow books for free.', 'Books are made from paper.', 'Bookstores sell new books.', 'Books are very heavy to carry.'),
      sum('Sharks have many rows of sharp teeth. When one tooth falls out, a new one moves forward to take its place.', 'Sharks grow new teeth to replace lost ones.', 'Sharks live only in cold water.', 'Teeth help people chew food.', 'Whales swim faster than sharks.'),
      sum('Recycling turns old cans and bottles into new things. This saves trees, water, and energy.', 'Recycling reuses materials and saves resources.', 'Cans are made of aluminum.', 'Trees grow very tall.', 'Bottles can float on water.'),
    ],
    [
      sum('Volcanoes form where melted rock, called magma, rises through cracks in Earth\'s crust. When magma reaches the surface, it becomes lava. Over time, the lava piles up and builds a mountain.', 'Lava from magma can build up into a mountain.', 'Earthquakes shake the ground near cities.', 'Lava is always black in color.', 'Oceans are deeper than mountains are tall.'),
      sum('Many people think spiders are insects. Spiders actually have eight legs, while insects have six. They also have only two body parts.', 'Spiders are not insects; they have eight legs.', 'Insects have eight legs.', 'Spiders spin webs to catch food.', 'Ants are the best insect builders.'),
      sum('A solar eclipse happens when the Moon passes between the Sun and Earth. For a short time, the Moon blocks the Sun\'s light. People must wear special glasses to watch safely.', 'The Moon blocks the Sun, causing a solar eclipse.', 'Special glasses make the Sun brighter.', 'The Moon is larger than Earth.', 'Earth goes around the Sun once a year.'),
      sum('In the 1800s, many families moved west to farm. The journey took months by wagon. Once they arrived, they cleared land and planted crops.', 'Families traveled west by wagon to start farms.', 'Trains carried most families to the West.', 'Crops grow best in the winter.', 'Cities in the East were very crowded.'),
      sum('Honeybees dance to tell other bees where flowers are. A waggle dance shows the direction and distance. Other bees follow the dance to find food.', 'Honeybees use dances to share where food is.', 'Bees can see only in black and white.', 'Flowers dance in the wind.', 'Bees make wax for their hives.'),
      sum('Glaciers are huge rivers of ice that move very slowly. As they move, they carve valleys in the land. Many lakes and valleys were shaped this way long ago.', 'Glaciers slowly carve valleys and shape land.', 'Glaciers move faster than rivers.', 'Lakes are always very salty.', 'Rivers flow down to the sea.'),
      sum('Many schools have gardens where students grow vegetables. Students learn about plants, water, and healthy food. Some schools even sell their vegetables to families.', 'School gardens teach students about plants and food.', 'Vegetables taste better in the winter.', 'Schools should close during summer.', 'Garden tools are very heavy.'),
      sum('A bridge must be strong enough to hold heavy trucks. Engineers test materials and check the design many times before building. Good planning keeps bridges safe for years.', 'Engineers plan and test bridges so they are safe.', 'Bridges are always painted red.', 'Trucks are heavier than cars.', 'Bridges only last a single year.'),
    ],
    [
      sum('The Erie Canal opened in 1825. It connected New York City to the Great Lakes. Before the canal, goods traveled slowly over land. After it opened, goods moved faster and cheaper by water. Many new towns grew along its path.', 'The Erie Canal sped up trade and helped towns grow.', 'Ships on the Great Lakes were made of wood.', 'Canals are the fastest way to travel today.', 'New York City was founded in 1825.'),
      sum('Many dinosaurs were small, and some had feathers. Fossils show how these animals changed over time. Scientists think birds evolved from small feathered dinosaurs. So a sparrow is, in a way, a living dinosaur.', 'Birds are living relatives of small dinosaurs.', 'All dinosaurs were as big as houses.', 'Dinosaurs lived only in the desert.', 'Chickens cannot fly very far.'),
      sum('Coral reefs are built by tiny animals called polyps. Over thousands of years, their hard skeletons pile up into large reefs. Reefs give homes to many kinds of fish. Without them, many ocean animals would lose their homes.', 'Tiny animals build reefs that give homes to fish.', 'Reefs are found only in lakes.', 'Fish are the largest ocean animals.', 'Polyps are a kind of ocean plant.'),
      sum('When the first settlers reached the new town, they had to build homes quickly before winter. They cut down trees for logs. They also grew food and stored it. By working together, the settlers survived their first winter.', 'Settlers survived by building homes and working together.', 'Winters in the new town were always warm.', 'The town had no trees at all.', 'Settlers sold their logs for gold.'),
      sum('Wind turbines turn wind into electricity. Their large blades spin when the wind blows. The spinning shaft powers a generator. Many towns now use wind power because it does not pollute the air.', 'Wind turbines make clean electricity from moving air.', 'Wind blows only during the summer.', 'Turbine blades never need to spin.', 'Generators make wind blow faster.'),
      sum('Tadpoles hatch from eggs in water. They breathe with gills and eat plants. As they grow, they develop legs and lungs. Eventually, most tadpoles change into frogs that can live on land.', 'Tadpoles change into frogs as they grow.', 'Frogs always lay their eggs on land.', 'Frogs can never swim in water.', 'Tadpoles hatch from eggs in the desert.'),
      sum('Terraces are flat steps cut into hillsides. Farmers in Japan built terraces to grow rice on steep land. The steps stop water from running away, which helps rice grow well. Terraces are still used today.', 'Terraces help farmers grow rice on hills.', 'Rice grows best in cold, dry places.', 'All hills in Japan are very tall.', 'Farmers in Japan keep no animals.'),
      sum('A good library has books for all ages. It also has computers, quiet reading rooms, and helpers who answer questions. Many libraries offer free programs for children and families.', 'Libraries offer books, computers, and free programs.', 'Libraries are closed on weekends.', 'Quiet rooms are only for teachers.', 'Children should not read in libraries.'),
    ],
  ],
  [{ skill: 'mainIdea', level: 2 }],
)

const ch = (p: string, a: string, ...w: string[]) =>
  r(PASSAGE_Q(p, 'Which word best describes the character?'), a, ...w)

const characterTraits = rowSkill(
  'characterTraits',
  ['Character traits: what they do', 'Character traits: what they do and why', 'Character traits: tricky ones'],
  [
    [
      ch('Mia gave her crayons to a friend who had none. She smiled while she shared.', 'Kind', 'Grumpy', 'Lazy', 'Scared'),
      ch('Ben jumped into the pool to save his little brother, even though he was nervous.', 'Brave', 'Lazy', 'Rude', 'Silly'),
      ch('Sam found a wallet on the sidewalk. He took it straight back to the owner.', 'Honest', 'Greedy', 'Lazy', 'Loud'),
      ch('Zoe slept until noon and never cleaned her room.', 'Lazy', 'Generous', 'Brave', 'Kind'),
      ch('Leo yelled at his sister and slammed the door when she took his toy.', 'Angry', 'Calm', 'Gentle', 'Shy'),
      ch('Ava practiced piano every day for a year. Now she plays at the school concert.', 'Hardworking', 'Lazy', 'Silly', 'Shy'),
      ch('When the new girl sat alone, Max asked her to join his game.', 'Friendly', 'Rude', 'Greedy', 'Lazy'),
      ch('Lily told the teacher she had broken the vase, even though no one saw.', 'Honest', 'Lazy', 'Sneaky', 'Silly'),
    ],
    [
      ch('Dan was nervous before the play. He practiced his lines every night until he knew them by heart.', 'Determined', 'Careless', 'Rude', 'Greedy'),
      ch('When Ella\'s team lost, she shook hands with the winners and told them they played well.', 'Good sport', 'Selfish', 'Jealous', 'Lazy'),
      ch('Omar always let others go first in line and never asked for special treatment.', 'Considerate', 'Impatient', 'Rude', 'Greedy'),
      ch('Rosa kept reading even after the power went out, using a flashlight to finish her chapter.', 'Determined', 'Bored', 'Careless', 'Shy'),
      ch('Jun spent all his allowance on candy and then borrowed money from his friends.', 'Irresponsible', 'Generous', 'Thrifty', 'Patient'),
      ch('Carla listened carefully to her friend\'s problem and offered to help solve it.', 'Caring', 'Rude', 'Lazy', 'Greedy'),
      ch('Hannah kept her promise to meet her cousin, even when it started to rain.', 'Reliable', 'Forgetful', 'Rude', 'Shy'),
      ch('Tom laughed at his own mistake and tried the problem again with a big grin.', 'Cheerful', 'Angry', 'Bossy', 'Lazy'),
    ],
    [
      ch('At first, Kenji refused to join the group project. After watching his classmates struggle, he admitted he was wrong and offered his ideas.', 'Open-minded', 'Greedy', 'Careless', 'Rude'),
      ch('Priya had the highest score on the test, but she quietly helped her friend study for the retake.', 'Humble', 'Boastful', 'Jealous', 'Lazy'),
      ch('Marcus sat in the back of the room and never raised his hand, but he always finished his work perfectly.', 'Reserved', 'Bossy', 'Loud', 'Rude'),
      ch('The old man on the bus gave up his seat for a student carrying a heavy backpack.', 'Considerate', 'Selfish', 'Lazy', 'Sneaky'),
      ch('Nina wanted to win the spelling bee so badly that she peeked at a classmate\'s list.', 'Dishonest', 'Honest', 'Brave', 'Generous'),
      ch('Even after losing three games in a row, Gabe kept practicing and stayed positive.', 'Resilient', 'Careless', 'Bitter', 'Lazy'),
      ch('Ruby always said thank you and wrote notes to everyone who helped her.', 'Grateful', 'Ungrateful', 'Jealous', 'Bossy'),
      ch('Theo was nervous about speaking in front of the big crowd, but he gave his speech anyway.', 'Courageous', 'Careless', 'Lazy', 'Rude'),
    ],
  ],
  [{ skill: 'settingCharacter', level: 3 }],
)

export const READING_G5: Skill[] = [textStructureSkill, poetryElements, sensoryDetails, referenceSkills, multisyllabic, analogies, summarizing, characterTraits]

// --- Writing -----------------------------------------------------------------------------------

const articles = rowSkill(
  'articles',
  ['Articles: a or an', 'Articles: the', 'Articles: a or an, by sound'],
  [
    [
      r('I ate ___ apple for lunch.', 'an', 'a', 'and', 'at'),
      r('She has ___ umbrella in her bag.', 'an', 'a', 'and', 'at'),
      r('We saw ___ elephant at the zoo.', 'an', 'a', 'and', 'at'),
      r('He wore ___ orange hat.', 'an', 'a', 'and', 'at'),
      r('I have ___ dog named Max.', 'a', 'an', 'and', 'at'),
      r('She got ___ red bike for her birthday.', 'a', 'an', 'and', 'at'),
      r('Mom bought ___ new book.', 'a', 'an', 'and', 'at'),
      r('We live in ___ house by the lake.', 'a', 'an', 'and', 'at'),
    ],
    [
      r('___ sun is very hot.', 'The', 'A', 'An', 'And'),
      r('Our class visited ___ Statue of Liberty.', 'the', 'a', 'an', 'and'),
      r('___ Pacific Ocean is the largest ocean.', 'The', 'A', 'An', 'And'),
      r('She is ___ best player on the team.', 'the', 'a', 'an', 'and'),
      r('___ first day of school was fun.', 'The', 'A', 'An', 'And'),
      r('He is ___ only kid who can sing that song.', 'the', 'a', 'an', 'and'),
      r('___ Moon goes around the Earth.', 'The', 'A', 'An', 'And'),
      r('We climbed ___ highest hill in town.', 'the', 'a', 'an', 'and'),
    ],
    [
      r('It took ___ hour to walk home.', 'an', 'a', 'and', 'at'),
      r('She is ___ university student.', 'a', 'an', 'and', 'at'),
      r('I saw ___ unicorn in a book.', 'a', 'an', 'and', 'at'),
      r('He wore ___ honest smile.', 'an', 'a', 'and', 'at'),
      r('She has ___ one-eyed cat.', 'a', 'an', 'and', 'at'),
      r('It was ___ European trip.', 'a', 'an', 'and', 'at'),
      r('We took ___ hour-long nap.', 'an', 'a', 'and', 'at'),
      r('Ben found ___ interesting rock.', 'an', 'a', 'and', 'at'),
    ],
  ],
  [{ skill: 'nouns', level: 1 }],
)

const ab = (word: string, a: string, ...w: string[]) => r(`Which is the correct abbreviation for "${word}"?`, a, ...w)

const abbreviations = rowSkill(
  'abbreviations',
  ['Abbreviations: titles, days, and months', 'Abbreviations: measurements and titles', 'Abbreviations: government and military ranks'],
  [
    [
      ab('Doctor', 'Dr.', 'Mr.', 'Mrs.', 'Ms.'),
      ab('Mister', 'Mr.', 'Dr.', 'Mrs.', 'Ms.'),
      ab('Monday', 'Mon.', 'Sun.', 'Sat.', 'Wed.'),
      ab('Sunday', 'Sun.', 'Mon.', 'Fri.', 'Wed.'),
      ab('Friday', 'Fri.', 'Sat.', 'Sun.', 'Wed.'),
      ab('Wednesday', 'Wed.', 'Fri.', 'Sat.', 'Sun.'),
      ab('January', 'Jan.', 'Feb.', 'Mar.', 'Jun.'),
      ab('December', 'Dec.', 'Jan.', 'Oct.', 'Nov.'),
    ],
    [
      ab('pound', 'lb.', 'oz.', 'in.', 'ft.'),
      ab('inch', 'in.', 'ft.', 'yd.', 'mi.'),
      ab('foot', 'ft.', 'in.', 'yd.', 'mi.'),
      ab('yard', 'yd.', 'ft.', 'in.', 'mi.'),
      ab('mile', 'mi.', 'in.', 'yd.', 'ft.'),
      ab('ounce', 'oz.', 'lb.', 'gal.', 'mi.'),
      ab('gallon', 'gal.', 'oz.', 'lb.', 'mi.'),
      ab('junior', 'Jr.', 'Sr.', 'Dr.', 'Mr.'),
    ],
    [
      ab('Governor', 'Gov.', 'Sen.', 'Gen.', 'Rep.'),
      ab('Senator', 'Sen.', 'Gov.', 'Gen.', 'Rep.'),
      ab('General', 'Gen.', 'Gov.', 'Sen.', 'Rep.'),
      ab('Representative', 'Rep.', 'Sen.', 'Gen.', 'Gov.'),
      ab('Captain', 'Capt.', 'Sgt.', 'Lt.', 'Col.'),
      ab('Sergeant', 'Sgt.', 'Capt.', 'Lt.', 'Col.'),
      ab('Colonel', 'Col.', 'Capt.', 'Sgt.', 'Lt.'),
      ab('Lieutenant', 'Lt.', 'Capt.', 'Sgt.', 'Col.'),
    ],
  ],
  [{ skill: 'caps', level: 2 }],
)

const pl = (word: string, a: string, ...w: string[]) => r(`What is the plural of "${word}"?`, a, ...w)
const addEnding = (prompt: string, a: string, ...w: string[]) => r(prompt, a, ...w)

const spellingRules = rowSkill(
  'spellingRules',
  ['Spelling plurals: -es and -ies', 'Spelling -ed and -ing endings', 'Spelling: words that are easy to mix up'],
  [
    [
      pl('box', 'boxes', 'boxs', 'boxies', 'boxez'),
      pl('baby', 'babies', 'babys', 'babyes', 'babbies'),
      pl('dish', 'dishes', 'dishs', 'dishies', 'dishez'),
      pl('city', 'cities', 'citys', 'cityes', 'citties'),
      pl('church', 'churches', 'churchs', 'churchies', 'churchez'),
      pl('match', 'matches', 'matchs', 'matchies', 'matchez'),
      pl('monkey', 'monkeys', 'monkies', 'monkeies', 'monkeyes'),
      pl('wish', 'wishes', 'wishs', 'wishies', 'wishez'),
    ],
    [
      addEnding('Add -ing to "hop." Which is spelled right?', 'hopping', 'hoping', 'hoppng', 'hopin'),
      addEnding('Add -ing to "make." Which is spelled right?', 'making', 'makeing', 'makking', 'maing'),
      addEnding('Add -ed to "stop." Which is spelled right?', 'stopped', 'stoped', 'stoppped', 'stopping'),
      addEnding('Add -ed to "carry." Which is spelled right?', 'carried', 'carryed', 'carred', 'carrid'),
      addEnding('Change "try" to end with -ies. Which is spelled right?', 'tries', 'trys', 'tryes', 'triez'),
      addEnding('Add -ed to "smile." Which is spelled right?', 'smiled', 'smileed', 'smilled', 'smiling'),
      addEnding('Add -ing to "run." Which is spelled right?', 'running', 'runing', 'runnig', 'runnning'),
      addEnding('Add -ed to "study." Which is spelled right?', 'studied', 'studyed', 'studdied', 'studyied'),
    ],
    [
      r('I am taller ___ my brother.', 'than', 'then', 'that', 'the'),
      r('We finished dinner, and ___ we went to bed.', 'then', 'than', 'that', 'the'),
      r('The kids brought ___ lunch to school.', 'their', 'there', 'they\'re', 'thier'),
      r('___ going to the park after school.', 'They\'re', 'Their', 'There', 'Thier'),
      r('Put the book over ___.', 'there', 'their', 'they\'re', 'thier'),
      r('Don\'t ___ your keys on the way home.', 'lose', 'loose', 'loss', 'lousy'),
      r('My front tooth is ___ and wiggly.', 'loose', 'lose', 'loss', 'lousy'),
      r('Everyone came ___ Sam.', 'except', 'accept', 'expect', 'excerpt'),
    ],
  ],
  [{ skill: 'spell', level: 4 }],
)

const linkingWords = rowSkill(
  'linkingWords',
  ['Linking words: but, so, and, or', 'Linking words: order, contrast, and examples', 'Linking words: cause, result, and adding on'],
  [
    [
      r('I wanted to play outside, ___ it was raining.', 'but', 'so', 'because', 'also'),
      r('We ate lunch, ___ we went to the park.', 'then', 'because', 'although', 'if'),
      r('I was hungry, ___ I made a sandwich.', 'so', 'because', 'however', 'except'),
      r('I like pizza, ___ I like pasta too.', 'and', 'but', 'because', 'or'),
      r('Do you want milk ___ juice?', 'or', 'and', 'but', 'so'),
      r('Ben was tired, ___ he kept playing.', 'but', 'so', 'because', 'unless'),
      r('The sky is dark, ___ I need my umbrella.', 'so', 'but', 'because', 'unless'),
      r('First, wash the dishes. ___, dry them.', 'Then', 'But', 'Because', 'Although'),
    ],
    [
      r('The forecast said sunshine all week. ___, it poured rain every day.', 'However', 'Also', 'For example', 'Finally'),
      r('Pets need food and water. ___, dogs need walks every day.', 'For example', 'However', 'Finally', 'Therefore'),
      r('I forgot my lunch. ___, I had to buy lunch at school.', 'Therefore', 'Finally', 'For example', 'However'),
      r('Turn off the lights. ___, lock the door.', 'Finally', 'However', 'For example', 'Therefore'),
      r('The shop was closed. ___, we went home.', 'Therefore', 'However', 'For example', 'Also'),
      r('She practices every day. ___, she plays very well.', 'As a result', 'However', 'For example', 'First'),
      r('Some animals live in water. ___, frogs and turtles live in ponds.', 'For example', 'However', 'Finally', 'Therefore'),
      r('I like to read. ___, I like to draw.', 'Also', 'However', 'Finally', 'Therefore'),
    ],
    [
      r('The bus was late. ___, we missed the first movie.', 'As a result', 'For example', 'Next', 'However'),
      r('Lily loves swimming. ___, she dislikes getting her hair wet.', 'However', 'For example', 'Also', 'Finally'),
      r('The park has a playground. ___, it has a duck pond.', 'In addition', 'However', 'Therefore', 'Finally'),
      r('Many animals sleep through winter. ___, bears can rest for months.', 'For example', 'However', 'Finally', 'Next'),
      r('The team practiced every day. ___, they won the championship.', 'As a result', 'However', 'For example', 'Finally'),
      r('The movie was long. ___, it was very funny.', 'However', 'Also', 'For example', 'Finally'),
      r('I like apples. ___, I like bananas.', 'Also', 'However', 'For example', 'Finally'),
      r('Some plants need very little water. ___, cacti can live in the desert.', 'For example', 'However', 'Finally', 'Next'),
    ],
  ],
  [{ skill: 'sentences', level: 2 }],
)

const essayParts = rowSkill(
  'essayParts',
  ['Paragraph parts: topic and details', 'Paragraphs: topic, support, and ending', 'Introductions and conclusions'],
  [
    [
      r('Which sentence tells the main idea of a paragraph?', 'The topic sentence', 'A supporting detail', 'The closing sentence', 'The page number'),
      r('Which sentence usually comes first in a paragraph?', 'The topic sentence', 'The closing sentence', 'A supporting detail', 'The last sentence'),
      r('Which part of a paragraph gives facts that support the main idea?', 'Supporting details', 'The topic sentence', 'The title', 'The closing sentence'),
      r('Which part of a paragraph sums it up at the end?', 'The closing sentence', 'The topic sentence', 'A supporting detail', 'The title'),
      r('A paragraph starts with: "Dogs make great pets." What is that sentence?', 'The topic sentence', 'A supporting detail', 'The closing sentence', 'A question'),
      r('Which sentence gives a reason or an example?', 'A supporting detail', 'The topic sentence', 'The closing sentence', 'The title'),
      r('Which part of an essay comes first?', 'The introduction', 'The conclusion', 'The closing paragraph', 'The bibliography'),
      r('Which part of an essay comes last?', 'The conclusion', 'The introduction', 'The body', 'The title'),
    ],
    [
      r('Which sentence is the best topic sentence for a paragraph about camping?', 'Camping is a fun way to spend a weekend.', 'My sister has a red bike.', 'Tacos are my favorite food.', 'Pencils need to be sharpened.'),
      r('Which sentence is a supporting detail for a paragraph about recycling?', 'Recycling keeps old cans out of the landfill.', 'Lunch is served at noon.', 'Thanks for reading about recycling.', 'Trucks are painted blue.'),
      r('Which sentence fits best as the first sentence of a paragraph about our class trip?', 'Our class took a trip to the science museum.', 'Then we ate lunch in the park.', 'The bus ride took one hour.', 'Thanks for reading about our trip.'),
      r('Which sentence is the best way to end a paragraph about a school garden?', 'Our garden makes our school a happier place.', 'Carrots need lots of water.', 'Roses are my favorite flower.', 'We planted seeds on Monday.'),
      r('Which sentence supports the claim "Dogs make great pets"?', 'Dogs can learn to fetch and sit.', 'Fish need clean tanks.', 'Birds sing in the morning.', 'Rain falls from clouds.'),
      r('Which sentence does NOT belong in a paragraph about the library?', 'The pizza at lunch was cold.', 'The library has many picture books.', 'The librarian helps us find books.', 'Kids can borrow books for free.'),
      r('Which is the best topic sentence for a paragraph about exercise?', 'Exercise keeps our bodies and minds healthy.', 'I ran to the bus stop today.', 'Some shoes are blue and white.', 'My uncle lives in Ohio.'),
      r('Which sentence works best as the closing sentence of a paragraph about bees?', 'Bees are amazing helpers for our world.', 'Bees have six legs and fuzzy bodies.', 'Bees live in a hive with many others.', 'A bee can sting once and then die.'),
    ],
    [
      r('What is the main job of a conclusion?', 'To sum up the main points', 'To name the author', 'To introduce a new topic', 'To list the page numbers'),
      r('Which is a good way to start an essay?', 'Open with a surprising fact or question', 'Copy a paragraph from another book', 'Say nothing about the topic', 'End with the words "The End"'),
      r('A conclusion should NOT ___.', 'introduce brand-new main ideas', 'restate the main idea', 'remind readers of key points', 'leave readers thinking'),
      r('Which sentence is the best conclusion for an essay about why kids should read?', 'Reading opens doors to new worlds and ideas.', 'Dogs can run very fast in the park.', 'The library is closed on Sundays.', 'Blue is my favorite color.'),
      r('What should an introduction do?', 'Tell the topic and grab the reader\'s attention', 'Give every detail of the story', 'Say goodbye to the reader', 'End the essay'),
      r('What makes a conclusion strong?', 'It connects back to the opening idea', 'It adds a brand-new character', 'It is only one word long', 'It repeats every sentence'),
      r('In an essay, which part usually states the main claim?', 'The introduction', 'The bibliography', 'The title page', 'The glossary'),
      r('Which closing sentence fits a paragraph about trees?', 'Trees give us shade, air, and beauty.', 'Ants climbed the big oak tree.', 'Trees have green leaves in spring.', 'My grandpa planted a maple tree.'),
    ],
  ],
  [{ skill: 'sentences', level: 3 }],
)

const cl = (claim: string, a: string, ...w: string[]) =>
  r(`Claim: "${claim}"\n\nWhich reason best supports this claim?`, a, ...w)
const ev = (claim: string, a: string, ...w: string[]) =>
  r(`Claim: "${claim}"\n\nWhich is the best evidence for this claim?`, a, ...w)
const ct = (claim: string, a: string, ...w: string[]) =>
  r(`Claim: "${claim}"\n\nWhich sentence is a counterclaim, an argument against this claim?`, a, ...w)

const argumentSupport = rowSkill(
  'argumentSupport',
  ['Claims and reasons', 'Claims and evidence', 'Counterclaims'],
  [
    [
      cl('We should recycle paper at school.', 'Recycling paper saves trees.', 'Paper is white or yellow.', 'Our teacher has a blue pen.', 'The bell rings at nine.'),
      cl('Kids should drink water instead of soda.', 'Water helps our bodies stay healthy.', 'Soda comes in cans and bottles.', 'Some drinks are blue.', 'Lakes are full of water.'),
      cl('Our town needs more bike lanes.', 'Bike lanes keep riders safe from cars.', 'Bikes have two wheels.', 'Pizza is served on Fridays.', 'Some streets are named after trees.'),
      cl('Students should have time for art.', 'Art helps kids express ideas and relax.', 'Art supplies come in boxes.', 'Teachers use chalk on boards.', 'Some art is made with clay.'),
      cl('Everyone should wear a helmet when biking.', 'Helmets protect your head if you fall.', 'Helmets come in many colors.', 'Bikes have bells on them.', 'Helmets are made of plastic.'),
      cl('Our class should have a classroom library.', 'Books help students learn new words and ideas.', 'Books have covers and pages.', 'Bookshelves are brown.', 'The school has a big gym.'),
      cl('We should walk to school when we can.', 'Walking gets our bodies moving and fresh air.', 'School buses are yellow.', 'Sidewalks are gray.', 'Shoes come in many sizes.'),
      cl('Schools should serve more fruit at lunch.', 'Fruit gives us vitamins and energy.', 'Lunch trays are made of plastic.', 'Fruit comes in many colors.', 'The cafeteria is on the first floor.'),
    ],
    [
      ev('Our park needs more trash cans.', 'Last week, litter covered the grass by the slide.', 'Trash cans are usually green.', 'I like picnics at the park.', 'Birds sometimes sit on the fence.'),
      ev('Students should have a longer lunch break.', 'Many students said they could not finish eating in time.', 'Lunch is my favorite part of school.', 'Lunch rooms have round tables.', 'Some students bring snacks from home.'),
      ev('Our town should plant more trees.', 'Shady trees help keep streets cooler in summer.', 'Trees are my favorite plant.', 'Maple trees turn red in fall.', 'Parks are usually quiet.'),
      ev('Our class should start a recycling bin.', 'Paper and cans can be made into new products.', 'Recycling bins are blue.', 'I think recycling is boring.', 'Trash trucks come on Tuesdays.'),
      ev('We should eat more vegetables.', 'Vegetables have vitamins that help the body fight sickness.', 'My favorite vegetable is corn.', 'Vegetables come in green, red, and orange.', 'Vegetable gardens are in the backyard.'),
      ev('Kids should go to bed earlier.', 'Children who sleep enough can pay attention better in school.', 'Bedtime is at eight o\'clock in our house.', 'Pillows are soft.', 'I like to read before bed.'),
      ev('Our school should have a garden.', 'Students who grow plants learn about science.', 'Gardens have flowers and dirt.', 'Gardening tools are in the shed.', 'My best friend likes tulips.'),
      ev('Everyone should wear a seatbelt in the car.', 'Seatbelts help keep people from being thrown forward in a crash.', 'Cars come in many colors.', 'Seatbelts are made of nylon.', 'My car is red and fast.'),
    ],
    [
      ct('Homework helps students learn.', 'Some say homework takes time away from family.', 'Homework is often given on Mondays.', 'Homework has math problems in it.', 'Students finish homework at a desk.'),
      ct('Schools should start later in the morning.', 'Some parents worry about longer afternoons.', 'Buses are yellow and big.', 'Clocks show the time.', 'Mornings are cool and bright.'),
      ct('Our town should build a skate park.', 'Skate parks can be noisy for nearby homes.', 'A skate park has ramps and rails.', 'Skateboards have four wheels.', 'Skate parks give kids a safe place to ride.'),
      ct('Kids should earn an allowance.', 'Some think allowances spoil kids.', 'Allowances are paid each Friday.', 'Money comes in coins and bills.', 'Kids can save money in a jar.'),
      ct('Zoos help save endangered animals.', 'Some say animals are happier in the wild.', 'Zoos have animals from many countries.', 'Zoo tickets cost ten dollars.', 'Zoos help families learn about animals.'),
      ct('Our class should have more recess.', 'Some say recess cuts into learning time.', 'Recess is the best part of the day.', 'Recess is held at eleven o\'clock.', 'Playgrounds have slides and swings.'),
      ct('Parks should allow dogs off their leashes.', 'Some worry off-leash dogs could bite people.', 'Dogs love to run and play outside.', 'Leashes are sold at pet stores.', 'Parks have benches and trees.'),
      ct('Students should use calculators in math class.', 'Some worry calculators keep students from practicing.', 'Calculators have many buttons.', 'Math class is on the second floor.', 'Calculators can check answers quickly.'),
    ],
  ],
  [{ skill: 'conjunctions', level: 2 }],
)

export const WRITING_G5: Skill[] = [articles, abbreviations, spellingRules, linkingWords, essayParts, argumentSupport]

// --- IXL links ---------------------------------------------------------------------------------

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". */
export const LANGUAGE_G5_IXL: Record<string, IxlRef[]> = {
  'reading.textStructure': [e(3, 'Text structure'), e(4, 'Text structure'), e(5, 'Text structure')],
  'reading.poetryElements': [e(3, 'Poetry elements'), e(4, 'Poetry elements'), e(5, 'Poetry elements')],
  'reading.sensoryDetails': [e(3, 'Sensory details'), e(4, 'Sensory details'), e(5, 'Sensory details')],
  'reading.referenceSkills': [e(3, 'Reference skills'), e(4, 'Reference skills'), e(5, 'Reference skills')],
  'reading.multisyllabic': [e(3, 'Multisyllabic words'), e(4, 'Multisyllabic words'), e(5, 'Multisyllabic words')],
  'reading.analogies': [e(5, 'Analogies'), e(5, 'Analogies'), e(5, 'Analogies')],
  'reading.summarizing': [e(5, 'Summarizing'), e(5, 'Summarizing'), e(5, 'Summarizing')],
  'reading.characterTraits': [e(3, 'Character'), e(4, 'Character'), e(5, 'Character')],
  'writing.articles': [e(3, 'Articles'), e(4, 'Articles'), e(4, 'Articles')],
  'writing.abbreviations': [e(3, 'Abbreviations'), e(4, 'Abbreviations'), e(5, 'Abbreviations')],
  'writing.spellingRules': [e(3, 'Spelling'), e(4, 'Spelling'), e(5, 'Spelling')],
  'writing.linkingWords': [e(3, 'Linking words'), e(4, 'Linking words'), e(4, 'Linking words')],
  'writing.essayParts': [e(3, 'Organizing writing'), e(4, 'Organizing writing'), e(5, 'Introductions and conclusions')],
  'writing.argumentSupport': [e(4, 'Developing and supporting arguments'), e(4, 'Developing and supporting arguments'), e(5, 'Developing and supporting arguments')],
}
