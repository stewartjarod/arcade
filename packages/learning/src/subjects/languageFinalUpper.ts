import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { wrongFrom } from './util'

/**
 * The last grades 3–5 English categories from IXL, named like IXL's categories: spelling patterns,
 * sight words, decodable stories, figurative language, visual elements (tables, tally charts, and
 * pictures shown as text or emoji), informational and literary passages, summaries, research sources,
 * writer's purpose, tone, shades of meaning, descriptive details, formatting, and grade 5 grammar
 * (verb types, subject-verb agreement, adjectives and adverbs, prepositions, contractions).
 *
 * Each skill is a hand-written bank per level. A row is one question (often with a short passage or a
 * shown chart), one right answer, and three wrong answers that were each checked by hand to be clearly
 * wrong, so only one choice is ever right. Keys are "<skill>:<level>:<row>", so a missed question can be
 * rebuilt exactly. Rows that depend on capitalization or punctuation use an exact-match check.
 */

interface Row {
  /** The question, which may include a short passage or a chart. "___" marks a blank. */
  q: string
  a: string
  w: string[]
}

const r = (q: string, a: string, ...w: string[]): Row => ({ q, a, w })
/** A passage (or chart) followed by its question. */
const P = (p: string, question: string) => `${p}\n\n${question}`

function rowSkill(id: string, labels: string[], banks: Row[][], unlocksAfter: Skill['unlocksAfter'], exact = false): Skill {
  const itemAt = (level: number, i: number): ItemSpec => {
    const row = banks[level - 1]![i]!
    return {
      key: `${id}:${level}:${i}`,
      prompt: { text: row.q, say: row.q.replace(/___/g, 'blank') },
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

// --- Reading -----------------------------------------------------------------------------------

// Sight words in sentences (grade 3), spelling sight words (grade 4), harder sight words (grade 5).
const irregularWords = rowSkill(
  'irregularWords',
  ['Sight words in sentences', 'Spelling sight words', 'Harder sight words to spell'],
  [
    [
      r('Please ___ me a story before bed.', 'read', 'red', 'reed', 'ready'),
      r('Yesterday we ___ to the park after lunch.', 'went', 'gone', 'goes', 'going'),
      r('Yesterday I ___ my friend at school.', 'saw', 'seen', 'sees', 'sawed'),
      r('Last week our class ___ a big cake.', 'had', 'has', 'have', 'hadn\'t'),
      r('Do you ___ what time it is?', 'know', 'no', 'now', 'new'),
      r('Please ___ your shoes by the door.', 'put', 'pot', 'poot', 'putt'),
      r('We ___ a fun game at recess yesterday.', 'played', 'plaid', 'pleyed', 'playing'),
      r('The baby ___ her first word today.', 'said', 'sayed', 'siad', 'sad'),
    ],
    [
      r('Which word is spelled correctly? (a person you like and play with)', 'friend', 'freind', 'frend', 'freiend'),
      r('Which word is spelled correctly? (the reason something happens)', 'because', 'becuase', 'becase', 'becaus'),
      r('Which word is spelled correctly? (once more)', 'again', 'agian', 'agin', 'againe'),
      r('Which word is spelled correctly? (going from one side to the other)', 'through', 'throug', 'througth', 'thruogh'),
      r('Which word is spelled correctly? (not too little)', 'enough', 'enogh', 'enouh', 'enoughh'),
      r('Which word is spelled correctly? (a room full of books to borrow)', 'library', 'libary', 'libarry', 'libery'),
      r('Which word is spelled correctly? (to trust that something is true)', 'believe', 'beleive', 'beleeve', 'belive'),
      r('Which word is spelled correctly? (the day after Tuesday)', 'Wednesday', 'Wensday', 'Wednsday', 'Wendsday'),
      r('Which word is spelled correctly? (very pretty)', 'beautiful', 'beatiful', 'beautifull', 'beuatiful'),
    ],
    [
      r('Which word is spelled correctly? (needed, not optional)', 'necessary', 'neccessary', 'necesary', 'necesery'),
      r('Which word is spelled correctly? (certainly, without doubt)', 'definitely', 'definately', 'definatly', 'defintely'),
      r('Which word is spelled correctly? (to keep apart)', 'separate', 'seperate', 'separete', 'seprate'),
      r('Which word is spelled correctly? (to make someone feel foolish)', 'embarrass', 'embarass', 'embaras', 'embarras'),
      r('Which word is spelled correctly? (a steady beat in music)', 'rhythm', 'rhythym', 'rythm', 'rhythem'),
      r('Which word is spelled correctly? (the second month of the year)', 'February', 'Febuary', 'Februray', 'Febrary'),
      r('Which word is spelled correctly? (to make room for)', 'accommodate', 'accomodate', 'acommodate', 'accomadate'),
      r('Which word is spelled correctly? (how tall something is)', 'height', 'hieght', 'heigth', 'heighth'),
      r('Which word is spelled correctly? (happened)', 'occurred', 'ocurred', 'occured', 'occurrd'),
    ],
  ],
  [{ skill: 'sight', level: 2 }],
)

// Decodable stories: short passages built from long vowel words (level 1) and r-controlled or variant vowel words (level 2).
const decodableStories = rowSkill(
  'decodableStories',
  ['Long vowel stories', 'R-controlled and variant vowel stories'],
  [
    [
      r(P('Jake has a pet snail named Pete. Pete likes to ride on Jake\'s hand. Each day, Jake gives him a leaf to eat.', 'What is the snail\'s name?'), 'Pete', 'Jake', 'Leaf', 'Hand'),
      r(P('The kite flew high over the lake. Jane held the string tight and smiled.', 'What did Jane hold?'), 'The string', 'The lake', 'A cake', 'The hat'),
      r(P('Ray rode his bike to the lake. He wore a red cap and rode fast.', 'What color was Ray\'s cap?'), 'Red', 'Blue', 'Green', 'Yellow'),
      r(P('Sue made a cake for Pete. She used eggs, milk, and sweet grapes.', 'What did Sue make?'), 'A cake', 'A kite', 'A boat', 'A sandwich'),
      r(P('We go to the store on Saturday. Mom gets bread, and I pick out a tray of grapes.', 'What day do they go to the store?'), 'Saturday', 'Monday', 'Friday', 'Sunday'),
      r(P('Bo has a pet goat. Each day, the goat eats hay and goes to the gate to say hi.', 'What animal is Bo\'s pet?'), 'A goat', 'A snake', 'A dog', 'A fish'),
      r(P('Kate wants to ride the train. She waits on the platform with her mom until the train comes.', 'What does Kate wait on?'), 'The platform', 'The boat', 'The roof', 'The stage'),
      r(P('Hope and Bo go to the beach. They dig a hole and they find a shell.', 'What do they find?'), 'A shell', 'A fish', 'A boat', 'A crab'),
      r(P('Lupe the goat eats green grass. She likes it so much that she eats at noon every day.', 'When does Lupe eat?'), 'At noon', 'At night', 'In the morning', 'At dawn'),
    ],
    [
      r(P('Mark found a bird nest in the park. Inside were three small eggs, and a mother bird sat on them.', 'Where did Mark find the nest?'), 'In the park', 'In the house', 'On a boat', 'At school'),
      r(P('Her sister wore a warm, short coat. It had a hood and two big pockets.', 'What did the coat have?'), 'A hood', 'Wheels', 'A tail', 'A zipper on the back'),
      r(P('The farmer grows corn and beans. Every spring he plants seeds in the rich soil.', 'What does the farmer plant?'), 'Seeds', 'Bricks', 'Shoes', 'Books'),
      r(P('Our class went to a museum. We saw a dinosaur bone and a shark tooth.', 'What did the class see?'), 'A dinosaur bone', 'A fire truck', 'A big cake', 'A parrot'),
      r(P('Lou heard a loud noise outside. It was a truck, not a bear! Lou smiled.', 'What made the loud noise?'), 'A truck', 'A bear', 'A storm', 'A train'),
      r(P('Burt the turtle lives in a pond. He swims slowly and hides under a log when it rains.', 'Where does Burt live?'), 'In a pond', 'In a barn', 'In a cave', 'On a hill'),
      r(P('Ann took a book to the porch. She sat in a chair and read until dark.', 'Where did Ann read?'), 'On the porch', 'In the kitchen', 'In a car', 'At the zoo'),
      r(P('The moon was round and bright. Owls hooted in the trees while the kids slept.', 'What did the owls do?'), 'Hooted', 'Sang loudly', 'Danced', 'Swam'),
      r(P('Our baby bird learned to fly. First it hopped on the fence, then it flew to the tree.', 'Where did the bird fly to?'), 'The tree', 'The car', 'The sink', 'The pool'),
    ],
  ],
  [{ skill: 'longVowels', level: 2 }],
)

// Similes (grade 3) and the meanings of metaphors and idioms (grade 5).
const figurativeMeaning = rowSkill(
  'figurativeMeaning',
  ['Similes: "like" or "as"', 'Metaphors and what they mean'],
  [
    [
      r('Which sentence is a simile?', 'The baby is as quiet as a mouse.', 'The baby is a quiet mouse.', 'The baby is quiet.', 'The baby tiptoes past.'),
      r('Which sentence uses a simile?', 'Her smile was like sunshine.', 'Her smile was sunshine.', 'Her smile was big.', 'She smiled at me.'),
      r('Which sentence is a simile?', 'The dog runs like the wind.', 'The dog is the wind.', 'The dog runs fast.', 'The dog is a fast runner.'),
      r('Which sentence is a simile?', 'The snow was as soft as a pillow.', 'The snow was a soft pillow.', 'The snow fell softly.', 'The snow was white.'),
      r('Which sentence is a simile?', 'The lake looked like a mirror.', 'The lake was a mirror.', 'The lake was calm.', 'The lake had fish.'),
      r('Which sentence is a simile?', 'My brother eats like a horse.', 'My brother is a horse.', 'My brother eats a lot of food.', 'My brother is hungry.'),
      r('Which sentence is a simile?', 'Her hair was as red as a fire truck.', 'Her hair was fire.', 'Her hair was red.', 'Her hair was long.'),
      r('Which sentence is a simile?', 'The kitten is soft like a cloud.', 'The kitten is a soft cloud.', 'The kitten is soft.', 'The kitten sleeps all day.'),
      r('Which sentence is a simile?', 'The bread smelled like warm cinnamon.', 'The bread was cinnamon.', 'The bread was warm.', 'The bread was in the oven.'),
    ],
    [
      r('What does "The classroom was a zoo" mean?', 'It was very loud and wild', 'It had many animals inside', 'It was clean and quiet', 'It smelled like food'),
      r('What does "Her words were daggers" mean?', 'Her words hurt people', 'Her words were made of metal', 'Her words were quiet', 'Her words were funny'),
      r('What does "The teacher is a rock for us" mean?', 'She is steady and dependable', 'She is made of stone', 'She is very heavy', 'She likes rocks'),
      r('What does "The moon was a silver coin" mean?', 'The moon was round and shiny', 'The moon was made of money', 'The moon was dark and cloudy', 'The moon was very hot'),
      r('What does "The test was a piece of cake" mean?', 'The test was very easy', 'The test was made of cake', 'The test was very hard', 'The test was about baking'),
      r('What does "He was a walking encyclopedia" mean?', 'He knew a lot of facts', 'He walked very slowly', 'He wrote books for a living', 'He liked to read maps'),
      r('What does "The water was a mirror" mean?', 'The water was smooth and reflected things', 'The water was made of glass', 'The water was dirty and brown', 'The water was very deep'),
      r('Which sentence uses a metaphor?', 'The world is a stage, and we are actors.', 'The world is like a stage.', 'The stage is in the world.', 'The world is big.'),
      r('Which sentence uses a metaphor?', 'Time is a thief that steals our hours.', 'Time passes like a river.', 'Time moves quickly.', 'Time goes on and on.'),
    ],
  ],
  [{ skill: 'figurative', level: 2 }],
)

// Visual elements: a chart, table, or graphic organizer shown as text, or a picture shown as emoji.
const visualDisplays = rowSkill(
  'visualDisplays',
  ['Pictures and tally charts', 'Tables, flow charts, and organizers', 'Charts, timelines, and maps'],
  [
    [
      r(P('Pet votes:\n\nDogs ||||\nCats |||\nBirds ||', 'Which pet got the most votes?'), 'Dogs', 'Cats', 'Birds', 'Fish'),
      r(P('Pet votes:\n\nDogs ||||\nCats |||\nBirds ||\nFish |', 'Which pet got the fewest votes?'), 'Fish', 'Dogs', 'Cats', 'Birds'),
      r(P('Pets in our class:\n\nDog | 6\nCat | 4\nFish | 2\nBird | 3', 'Which pet is the most common?'), 'Dog', 'Cat', 'Fish', 'Bird'),
      r(P('Pet tally:\n\nDog ||||||\nCat ||||\nFish ||\nBird |||', 'How many tally marks are for the cat?'), '4', '6', '2', '3'),
      r(P('Map key:\n★ = park\n▲ = lake', 'What does the ★ stand for?'), 'A park', 'A lake', 'A school', 'A farm'),
      r(P('Weather this week:\n\nMonday: sunny\nTuesday: rainy\nWednesday: rainy\nThursday: snowy', 'Which day was snowy?'), 'Thursday', 'Monday', 'Tuesday', 'Wednesday'),
      r('🐉 Look at the picture.\n\nWhat mythical creature is shown?', 'A dragon', 'A unicorn', 'A mermaid', 'A phoenix'),
      r('🦄 Look at the picture.\n\nWhat mythical creature is shown?', 'A unicorn', 'A dragon', 'A mermaid', 'A centaur'),
      r('⚡ This picture shows a lightning bolt.\n\nWhich Greek god is linked to lightning?', 'Zeus', 'Poseidon', 'Hades', 'Athena'),
    ],
    [
      r(P('Compare two pets:\n\nDogs: bark, wag tails, live in homes\nCats: purr, climb trees, live in homes', 'What do dogs do that cats do not?'), 'Bark', 'Purr', 'Climb trees', 'Live in homes'),
      r(P('Flow chart:\n\nSeed → Sprout → Plant → Flower', 'What comes right after Sprout?'), 'Plant', 'Seed', 'Flower', 'Sprout'),
      r(P('Cause: It rained all day.\nEffect: The field got muddy.', 'What is the effect?'), 'The field got muddy', 'It rained all day', 'The sun was out', 'The field was dry'),
      r(P('Trip costs:\n\nTickets | $12\nLunch | $8\nBus | $4', 'Which cost is the highest?'), 'Tickets', 'Lunch', 'Bus', 'Parking'),
      r(P('Timeline of a school day:\n\n8:00 Arrive\n10:00 Recess\n12:00 Lunch\n3:00 Go home', 'What happens at 12:00?'), 'Lunch', 'Recess', 'Arrive', 'Go home'),
      r(P('K: what I know\nW: what I want to know\nL: what I learned', 'Which column do you fill in after reading?'), 'L', 'K', 'W', 'K and W'),
      r(P('Plant parts:\nRoots: hold the plant in soil\nStem: carries water\nLeaves: make food', 'Which part makes food?'), 'Leaves', 'Roots', 'Stem', 'Flower'),
      r(P('Two books:\n\nBook A: has pictures, is short\nBook B: has pictures, is long', 'What do both books have?'), 'Pictures', 'Dragons', 'A map', 'Recipes'),
      r(P('Life cycle:\n\nEgg → Caterpillar → Cocoon → Butterfly', 'What comes after the caterpillar?'), 'Cocoon', 'Egg', 'Butterfly', 'Caterpillar'),
    ],
    [
      r(P('Store prices for apples:\n\nStore A | $3\nStore B | $2\nStore C | $4', 'Which store has the lowest price?'), 'Store B', 'Store A', 'Store C', 'Store D'),
      r(P('Hours of reading each week:\n\nWeek 1 = 3\nWeek 2 = 5\nWeek 3 = 2\nWeek 4 = 6', 'In which week did they read the least?'), 'Week 3', 'Week 1', 'Week 2', 'Week 4'),
      r(P('Water cycle: evaporation → condensation → precipitation → collection', 'What happens right after condensation?'), 'Precipitation', 'Evaporation', 'Collection', 'Condensation'),
      r(P('Map: The park is north of the school. The library is east of the school.', 'What is east of the school?'), 'The library', 'The park', 'The lake', 'Nothing'),
      r(P('Problem: Litter in the yard.\nSolution: Add trash cans.', 'What is the solution?'), 'Add trash cans', 'Litter in the yard', 'Mow the lawn', 'Plant flowers'),
      r(P('Animal | Legs | Wings\nDog | 4 | 0\nBird | 2 | 2\nSnake | 0 | 0', 'Which animal has 4 legs and no wings?'), 'Dog', 'Bird', 'Snake', 'Fish'),
      r(P('Survey: 12 kids picked pizza, 6 picked tacos, 6 picked soup.', 'Which food did the most kids pick?'), 'Pizza', 'Tacos', 'Soup', 'Salad'),
      r(P('1990: The park opened\n2005: The library was built\n2015: The school was built', 'Which event happened first?'), 'The park opened', 'The library was built', 'The school was built', 'The pool opened'),
      r(P('Cats: fur, whiskers, meows\nDogs: fur, barks, wags tail', 'Which sound do dogs make?'), 'Barks', 'Meows', 'Purrs', 'Chirps'),
    ],
  ],
  [{ skill: 'textFeatures', level: 2 }],
)

// Informational passages: short facts about people, animals, places, and sports, with a question about one detail.
const infoPassages = rowSkill(
  'infoPassages',
  ['Facts about famous people', 'Facts about animals, places, and sports', 'Facts about places, sports, and hobbies'],
  [
    [
      r(P('Harriet Tubman was born into slavery in Maryland. She later helped many people escape to freedom on the Underground Railroad.', 'Where was Harriet Tubman born?'), 'Maryland', 'Texas', 'Florida', 'New York'),
      r(P('Thomas Edison built many inventions. One of them was the phonograph, which could record and play back sound.', 'What did the phonograph do?'), 'Recorded and played sound', 'Baked bread', 'Cut wood', 'Grew plants'),
      r(P('Maya Angelou was a poet and writer. She wrote a famous book called I Know Why the Caged Bird Sings.', 'What did Maya Angelou write?'), 'Poems and books', 'Songs for the radio', 'Maps of the world', 'Recipes for cakes'),
      r(P('George Washington Carver studied plants. He found many new uses for peanuts, like making paint and glue.', 'What did Carver find new uses for?'), 'Peanuts', 'Cars', 'Bricks', 'Gold'),
      r(P('Jim Thorpe was a famous athlete. He won gold medals at the 1912 Olympics in two sports.', 'Where did Thorpe win gold medals?'), 'At the 1912 Olympics', 'At a school contest', 'In a movie', 'At a science fair'),
      r(P('Sally Ride was the first American woman in space. She flew on the space shuttle Challenger in 1983.', 'What did Sally Ride fly on?'), 'The space shuttle Challenger', 'A train', 'A submarine', 'A hot air balloon'),
      r(P('Cesar Chavez worked to help farm workers get fair pay and safer conditions. He led peaceful protests.', 'What did Cesar Chavez work to help farm workers get?'), 'Fair pay', 'A new farm', 'Bigger tractors', 'Free cars'),
      r(P('Clara Barton started the American Red Cross in 1881. Its volunteers help people during disasters.', 'What did Clara Barton start?'), 'The American Red Cross', 'A public library', 'A national park', 'A school newspaper'),
      r(P('Albert Einstein was a scientist who studied light and time. His ideas changed how we understand space.', 'What did Einstein study?'), 'Light and time', 'Music and dance', 'Cooking', 'Farming'),
    ],
    [
      r(P('Polar bears have thick fur and a layer of fat. These help them stay warm in the icy Arctic.', 'What keeps polar bears warm?'), 'Thick fur and fat', 'Thin shells', 'Long tails', 'Sharp horns'),
      r(P('Bats are the only mammals that can truly fly. Many bats find food at night by using sound.', 'When do many bats find food?'), 'At night', 'In the morning', 'At noon', 'In winter'),
      r(P('The Eiffel Tower is in Paris, France. It was built for a world fair in 1889.', 'Where is the Eiffel Tower?'), 'Paris, France', 'London, England', 'Rome, Italy', 'Madrid, Spain'),
      r(P('Basketball was invented in 1891 by James Naismith. He used a peach basket for the first goal.', 'What did Naismith use for the first goal?'), 'A peach basket', 'A soccer net', 'A hoop of wood', 'A tall tree'),
      r(P('Honeybees live in hives. Worker bees collect nectar from flowers and turn it into honey.', 'What do worker bees collect?'), 'Nectar', 'Sand', 'Feathers', 'Leaves'),
      r(P('The Grand Canyon is in Arizona. It was carved over millions of years by the Colorado River.', 'What carved the Grand Canyon?'), 'The Colorado River', 'A giant storm', 'A volcano', 'Tall glaciers'),
      r(P('Soccer is played with a round ball. Each team tries to kick the ball into the other team\'s goal.', 'What is the goal of each team?'), 'Kick the ball into the other goal', 'Catch the ball in their hands', 'Score in a basket', 'Hit the ball with a bat'),
      r(P('Gardeners can grow tomatoes in pots. Tomatoes need lots of sunlight and water.', 'What do tomatoes need to grow?'), 'Sunlight and water', 'Snow and ice', 'Sand only', 'Darkness'),
      r(P('Pandas eat bamboo for most of the day. They spend many hours each day chewing.', 'What do pandas eat most?'), 'Bamboo', 'Fish', 'Berries', 'Grass seeds'),
    ],
    [
      r(P('The Statue of Liberty stands on Liberty Island in New York Harbor. France gave the statue to the United States in 1886.', 'Who gave the Statue of Liberty to the United States?'), 'France', 'England', 'Spain', 'Canada'),
      r(P('Mount Everest is the tallest mountain above sea level. It is located in the Himalayas, on the border of Nepal and China.', 'Where is Mount Everest located?'), 'In the Himalayas', 'In the Alps', 'In the Andes', 'In the Rocky Mountains'),
      r(P('Chess is played on a board with 64 squares. Each player starts with 16 pieces.', 'How many squares are on a chess board?'), '64', '36', '48', '100'),
      r(P('Surfing began as a sport in Hawaii many centuries ago. Surfers ride waves on boards made of wood or foam.', 'Where did surfing begin as a sport?'), 'Hawaii', 'Florida', 'Brazil', 'Alaska'),
      r(P('Knitting uses two long needles and yarn to make cloth. Knitters make scarves, socks, and hats.', 'What do knitters use to make cloth?'), 'Two long needles and yarn', 'A loom and thread', 'Paint and brushes', 'Clay and a wheel'),
      r(P('The Amazon River flows through South America. It is one of the longest rivers in the world.', 'Where does the Amazon River flow?'), 'South America', 'Africa', 'Europe', 'Asia'),
      r(P('Ballet is a form of dance with special steps called positions. Dancers often wear soft shoes called slippers.', 'What do ballet dancers often wear?'), 'Soft shoes called slippers', 'Heavy boots', 'Ice skates', 'Roller blades'),
      r(P('Cranes are tall machines used to lift heavy things at building sites. Many cranes have a long arm called a jib.', 'What is the long arm on many cranes called?'), 'A jib', 'A hook', 'A tower', 'A cable'),
      r(P('The Sahara is the largest hot desert in the world. It covers much of northern Africa.', 'Where is most of the Sahara?'), 'Northern Africa', 'Australia', 'South America', 'Antarctica'),
    ],
  ],
  [{ skill: 'informationalTexts', level: 2 }],
)

// Literary passages: realistic fiction, poems, a short play, and a fantasy story, each with a question about one detail.
const storyPassages = rowSkill(
  'storyPassages',
  ['Short stories and poems', 'Stories, poems, and short plays', 'Fantasy and historical stories'],
  [
    [
      r(P('Lily lost her red mitten in the snow. She searched under the bench and behind the tree. Then she found it in her coat pocket!', 'Where was the mitten at the end?'), 'In her coat pocket', 'Under the bench', 'Behind the tree', 'In the snow'),
      r(P('Tom was nervous before his first soccer game. His dad said, "Just play your best." Tom scored a goal, and his team cheered.', 'What did Tom do in the game?'), 'He scored a goal', 'He fell down', 'He left early', 'He took a nap'),
      r(P('Mia and her brother built a sandcastle at the beach. A big wave knocked it down. They laughed and built a new one.', 'What knocked down the sandcastle?'), 'A big wave', 'A dog', 'A bird', 'A truck'),
      r(P('Our class planted beans in cups. Every day, Ben checked the cups and watered the soil. On day five, a green sprout came up.', 'What came up on day five?'), 'A green sprout', 'A flower', 'A worm', 'A rock'),
      r(P('Grandpa told a story about his old bike. It had a red bell and a basket on the front. He rode it to school every day.', 'What was on the front of the bike?'), 'A basket', 'A horn', 'A flag', 'A mirror'),
      r(P('Rosa wanted to win the spelling bee. She practiced every night with her sister. On the big day, she spelled every word right.', 'Who helped Rosa practice?'), 'Her sister', 'Her teacher', 'Her dog', 'Her grandmother'),
      r(P('Dan forgot his lunch at home. His friend Kim shared her apple and half of her sandwich.', 'What happened to Dan\'s lunch?'), 'He forgot it at home', 'He ate it at breakfast', 'He gave it to Kim', 'He lost it at the park'),
      r(P('The poem says: "The sun is gold, the sky is blue, the grass is green, and so are you."', 'What color is the sky in the poem?'), 'Blue', 'Gold', 'Green', 'Red'),
      r(P('Ella loved the library. Every Friday, she borrowed three new books and read them by the window.', 'Where did Ella read her books?'), 'By the window', 'In the garden', 'On a bus', 'Under her bed'),
    ],
    [
      r(P('MAX: Did you finish the science project?\nLEE: Not yet. I need one more day.\nMAX: I will help you after school.', 'What does Lee need?'), 'One more day', 'A new backpack', 'A ride home', 'More paper'),
      r(P('In 1863, Sarah walked five miles to a town with a new school. Her family had just moved west on a wagon train.', 'How did Sarah get to school?'), 'She walked five miles', 'She rode a bus', 'She took a boat', 'She drove a car'),
      r(P('The wind hums through the tall pines,\nits whisper soft and slow.\nThe moon climbs up above the hill,\nand the night begins to glow.', 'What time of day is it in the poem?'), 'Night', 'Morning', 'Noon', 'Afternoon'),
      r(P('Jada was scared of the dark. Every night, her brother left the hall light on. One night, he forgot. Jada went to his room and asked for help.', 'What did Jada do when the hall light was off?'), 'She went to her brother\'s room', 'She turned on the TV', 'She slept outside', 'She called her friend'),
      r(P('Omar wanted a new bike, but it cost too much. He began washing cars on Saturdays. After three months, he had enough money.', 'How did Omar earn money?'), 'By washing cars', 'By selling his books', 'By winning a race', 'By selling his old bike'),
      r(P('NURSE: Please sit down.\nJOE: My arm hurts a lot!\nNURSE: Let me look at it.', 'Who is hurt in this scene?'), 'Joe', 'The nurse', 'Lee', 'Nobody'),
      r(P('In 1900, many families cooked on coal stoves. Each morning, the cook filled the stove with coal and lit a fire.', 'What did the cook fill the stove with?'), 'Coal', 'Sugar', 'Ice', 'Paint'),
      r(P('My kite flies high, my kite flies free,\na bird of paper, dancing with me.', 'What is the kite compared to in the poem?'), 'A bird', 'A fish', 'A cloud', 'A boat'),
      r(P('Tara lost her library card. She checked her backpack twice, then found it inside a library book.', 'Where was Tara\'s card?'), 'Inside a library book', 'In her coat', 'In her shoe', 'In the car'),
    ],
    [
      r(P('The dragon in the cave was not mean. He only wanted a friend to share his warm fire on cold nights.', 'What did the dragon want?'), 'A friend', 'Gold coins', 'A new cave', 'A fight'),
      r(P('Pip the fox wanted to fly. Every morning he jumped from the old oak tree, and every morning he fell. Then a wise owl taught him to spread his tail like a sail.', 'What did the owl teach Pip?'), 'To spread his tail like a sail', 'To dig a hole', 'To swim fast', 'To climb a wall'),
      r(P('Long ago, a village sat beside a frozen lake. Each winter, the people carved boats from ice and raced them at sunrise.', 'Where was the village?'), 'Beside a frozen lake', 'Inside a desert', 'On a volcano', 'Under the sea'),
      r(P('The little robot Bolt had one job: to water the garden. One day it rained, and Bolt sat under a leaf, dry and happy.', 'Why did Bolt sit under a leaf?'), 'It was raining', 'It was hungry', 'It was lost', 'It was broken'),
      r(P('In the kingdom of Hal, every child got a silver key on their tenth birthday. The key opened the castle\'s secret garden.', 'What did the silver key open?'), 'The castle\'s secret garden', 'The castle gate', 'A treasure chest', 'A cave'),
      r(P('Mara found a map that glowed in the dark. It showed a path through a forest to a waterfall.', 'What did the map show?'), 'A path to a waterfall', 'A path to a cave', 'A city under the sea', 'The way to school'),
      r(P('In 1776, a young girl named Eliza sewed a flag for her town. Her neighbors cheered when they saw it hanging from the hall.', 'What did Eliza make?'), 'A flag', 'A quilt', 'A boat', 'A hat'),
      r(P('The old clock in the square stopped at noon every day. The children believed it was waiting for them to come home for lunch.', 'What did the children believe about the clock?'), 'It was waiting for them', 'It was broken forever', 'It ran too fast', 'It was made of gold'),
      r(P('Nina\'s shadow started to follow her one morning. It copied every move she made, even when she tried to hide behind a tree.', 'What did Nina\'s shadow do?'), 'Copied every move she made', 'Ran away from her', 'Disappeared at noon', 'Grew into a tree'),
    ],
  ],
  [{ skill: 'literaryTexts', level: 2 }],
)

// Summaries: pick the sentence that keeps the main point of a short passage. The wrong ones add a false
// detail, keep only a small detail, or say the opposite.
const summarizePassages = rowSkill(
  'summarizePassages',
  ['Summarizing a short passage'],
  [
    [
      r(P('Sam wanted a pet. He asked his parents for a dog. They said yes, and Sam chose a puppy from the shelter. Now Sam walks the puppy every morning.', 'Which sentence is the best summary?'), 'Sam adopted a puppy and walks it daily.', 'Sam ate cereal for breakfast.', 'Sam\'s parents bought him a car.', 'Sam hates animals and never walks.'),
      r(P('The town library had a book sale on Saturday. People bought old novels for a dollar each. The money will buy new computers for kids.', 'Which sentence is the best summary?'), 'The library sold old books to buy computers.', 'The library closed for the summer.', 'The sale was held on a Monday.', 'Kids wrote all the books themselves.'),
      r(P('Bees visit flowers to collect nectar. As they move from flower to flower, they carry pollen, which helps plants make seeds. Without bees, many fruits would not grow.', 'Which sentence is the best summary?'), 'Bees carry pollen so plants can make seeds.', 'Bees are yellow and black with stripes.', 'Plants grow fine without any help from animals.', 'Fruit grows best in cold, snowy places.'),
      r(P('The school garden needs more water in summer. Students take turns watering the plants each morning. The plants have grown tall and green.', 'Which sentence is the best summary?'), 'Students take turns watering the garden.', 'The garden is covered in snow.', 'Students plant new trees every winter.', 'The school closed the garden.'),
      r(P('Hiking is a fun way to see nature. Hikers should bring water, wear sturdy shoes, and tell someone their route before they go.', 'Which sentence is the best summary?'), 'Hikers should plan ahead and bring water.', 'Hiking is only for adults.', 'Hikers should never bring water.', 'Hiking is boring in the forest.'),
      r(P('Ava practiced piano every day for a year. Her hands grew stronger, and she learned five songs. At the spring concert, she played a song for the whole school.', 'Which sentence is the best summary?'), 'Ava practiced piano and played at a concert.', 'Ava quit piano after one week.', 'The spring concert was canceled.', 'Ava learned to play the drums.'),
      r(P('Our town flooded last spring after heavy rain. Many families stayed in a school gym for a week. Volunteers brought food and blankets to help.', 'Which sentence is the best summary?'), 'Families stayed in a gym after the flood.', 'The town never gets any rain.', 'Families built new houses on the moon.', 'The school gym was closed for a year.'),
      r(P('Penguins live mostly in the Southern Hemisphere. Emperor penguins can dive deep into the sea to find fish. They huddle together to stay warm in icy winters.', 'Which sentence is the best summary?'), 'Penguins dive for fish and huddle for warmth.', 'Penguins live in hot deserts.', 'Penguins can fly high in the sky.', 'Emperor penguins cannot swim.'),
      r(P('The science fair was held in the gym. Twenty students showed projects about volcanoes, plants, and magnets. Judges gave prizes to the best three.', 'Which sentence is the best summary?'), 'Judges gave prizes to science fair projects.', 'The gym was painted blue.', 'Twenty students got a free trip.', 'Judges gave no prizes that year.'),
    ],
  ],
  [{ skill: 'summarizing', level: 2 }],
)

// Research sources: primary versus secondary sources, and how to use a source without plagiarizing.
const researchSources = rowSkill(
  'researchSources',
  ['Primary and secondary sources', 'Sources and plagiarism'],
  [
    [
      r('Which source is a PRIMARY source?', 'A diary written by a soldier in 1944', 'A textbook about World War II', 'An encyclopedia article about the war', 'A school report about the war'),
      r('Which is a primary source about a camping trip?', 'A photo you took at the campsite', 'A website summary of camping', 'A guidebook about campsites', 'A magazine article about tents'),
      r('Which is a SECONDARY source?', 'A history book written decades later', 'A letter written during the event', 'An interview with a witness', 'An old newspaper from that day'),
      r('Which source is a primary source?', 'A letter a farmer wrote in 1870', 'A museum guide about farms', 'A textbook from 2020 about farming', 'A summary website about farming'),
      r('Maya copied a paragraph from a website into her report and did not name the website. What is this called?', 'Plagiarism', 'Citation', 'Summarizing', 'Paraphrasing'),
      r('Which is the best way to use a fact from a book?', 'Write it in your own words and name the book', 'Copy it word for word and leave out the book name', 'Change one word and say it is your idea', 'Use it without any name at all'),
      r('A researcher wants to learn about a school in 1905. Which is the best primary source?', 'The school yearbook from 1905', 'A modern video about old schools', 'A book summary written in 2020', 'A blog post about schools'),
      r('Which source about the moon landing is secondary?', 'A history book written in 2019', 'A video of the 1969 landing', 'Astronaut Neil Armstrong\'s own notes', 'A photo taken on the moon in 1969'),
    ],
    [
      r('A student wrote "Bees have five eyes" in her report. She got the fact from a book but did not say where she found it. What did she fail to do?', 'Name the source', 'Draw a picture', 'Use bigger words', 'Count the pages'),
      r('Which is the strongest primary source for a report on a 1920s dance?', 'A dancer\'s handwritten notes from 1925', 'A dance textbook from 2010', 'A movie about dancers made in 2015', 'A blog post about dance history'),
      r('Which practice avoids plagiarism?', 'Use quotation marks and cite the source', 'Copy a paragraph and change the title', 'Use someone else\'s words as your own', 'Copy a sentence and remove two words'),
      r('A report says "Dolphins sleep with half their brain awake." Which source would be best to check this fact?', 'A marine biology reference book', 'A cartoon about dolphins', 'A friend\'s guess', 'A toy store catalog'),
      r('Which is a primary source about a famous speech?', 'A recording of the speech made that day', 'A summary of the speech in a 2018 article', 'A quiz about the speech', 'A poster that quotes the speech'),
      r('Jun paraphrased an idea from a website but forgot to credit the website. Is this plagiarism?', 'Yes, it is plagiarism', 'No, paraphrasing is never plagiarism', 'No, because the website was free', 'No, because the idea was short'),
      r('Which is a SECONDARY source?', 'An encyclopedia article summarizing a war', 'A soldier\'s letter home from the war', 'A government record from 1945', 'A photo taken during the war'),
      r('Which source would be most reliable for today\'s weather?', 'The national weather service website', 'A weather rhyme from a children\'s book', 'A TV ad about umbrellas', 'A joke posted online'),
    ],
  ],
  [{ skill: 'referenceSkills', level: 2 }],
)

// Writer's purpose: why a text was written (inform, persuade, or entertain).
const writerGoal = rowSkill(
  'writerGoal',
  ['Why a writer wrote it', 'Choosing a text for a purpose'],
  [
    [
      r(P('Bears sleep all winter in dens. Their bodies slow down, so they do not need much food.', 'Why did the writer write this?'), 'To inform', 'To persuade', 'To entertain', 'To scare readers'),
      r(P('Please join our club! Our meetings are fun, and every kid is welcome.', 'Why did the writer write this?'), 'To persuade', 'To inform', 'To entertain', 'To tell a funny story'),
      r(P('Once upon a time, a cat wore boots and talked to the king.', 'Why did the writer write this?'), 'To entertain', 'To persuade', 'To inform', 'To give directions'),
      r(P('The first airplane flew in 1903 for only twelve seconds.', 'Why did the writer write this?'), 'To inform', 'To persuade', 'To entertain', 'To warn readers'),
      r(P('Vote for Sam for class president! He will bring back Friday games.', 'Why did the writer write this?'), 'To persuade', 'To inform', 'To entertain', 'To explain a rule'),
      r(P('Ha! The goat ate my hat and then tried to eat the mailbox!', 'Why did the writer write this?'), 'To entertain', 'To persuade', 'To inform', 'To explain a rule'),
      r(P('The Nile River is in Africa. It is one of the longest rivers in the world.', 'Why did the writer write this?'), 'To inform', 'To persuade', 'To entertain', 'To scare readers'),
      r(P('Mix two cups of flour with one egg. Bake for twenty minutes.', 'Why did the writer write this?'), 'To inform', 'To persuade', 'To entertain', 'To scare readers'),
    ],
    [
      r('Which text was written to entertain readers?', 'A silly poem about a sneezing giraffe', 'A list of rules for the pool', 'A report on rainfall in May', 'An ad for new running shoes'),
      r('Which text was written to persuade?', 'An ad asking kids to donate food', 'A map of the zoo', 'A poem about the moon', 'A report on sharks'),
      r('Which text was written to inform?', 'A report on how volcanoes form', 'A joke about a cow', 'A story about a dragon', 'A call to vote for mayor'),
      r('Which text was written to entertain?', 'A funny story about a dog who wears socks', 'Steps to build a birdhouse', 'A poster asking people to recycle', 'A chart of rainfall totals'),
      r('Which text was written to persuade?', 'A note urging everyone to wear helmets', 'A list of the planets', 'A story about a kite', 'A recipe for soup'),
      r('Which text was written to inform?', 'A guide to how bees make honey', 'A funny song about a frog', 'A message asking for a vote', 'A tale about a wizard'),
      r('Which text was written to entertain?', 'A riddle: what has keys but no locks?', 'A letter asking the city for a park', 'A report on rivers', 'An ad for toothpaste'),
      r('Which text was written to persuade?', 'A letter asking for a skate park', 'A chart of how far each city is', 'A recipe for pancakes', 'A story about a sleepy bear'),
    ],
  ],
  [{ skill: 'authorPurpose', level: 2 }],
)

// Tone: which sentence is more formal (grade 5).
const formalTone = rowSkill(
  'formalTone',
  ['Formal and informal sentences'],
  [
    [
      r('Which sentence is more formal?', 'Could you please tell me the time?', 'Hey, what time is it?', 'Yo, tell me the time!', 'What time is it, dude?'),
      r('Which sentence is more formal?', 'I would be grateful for your help.', 'Thanks a bunch for helping me out!', 'Can you help with this stuff?', 'Hey, help me with this!'),
      r('Which sentence is more formal?', 'We regret to inform you of a cancellation.', 'Sorry, the meeting got canceled.', 'Bummer, no meeting today!', 'Hey, the meeting is off.'),
      r('Which sentence is more formal?', 'Thank you for your prompt reply.', 'Thanks for getting back so fast!', 'Cool, you wrote back!', 'Got your reply, thanks!'),
      r('Which sentence is more formal?', 'Please accept my apologies for the delay.', 'Sorry we were late, guys.', 'My bad, sorry it took forever.', 'Oops, sorry it took so long.'),
      r('Which sentence is more formal?', 'The committee will review it next week.', 'The gang is going to check the plan next week.', 'They will look at the plan soon, okay?', 'The big group will peek at the plan.'),
      r('Which sentence is more formal?', 'I am writing to request a copy of the report.', 'Send me the report, please!', 'Hey, can I get that report?', 'Gimme the report.'),
      r('Which sentence is more formal?', 'Would you kindly consider my application?', 'Hey, check out my application!', 'Look at my application, okay?', 'Please look at my app, pal.'),
      r('Which sentence is more formal?', 'Greetings, and welcome to our school.', 'Yo, welcome to the school!', 'Hey guys, glad you came!', 'Hi kids, welcome to the school!'),
    ],
  ],
  [{ skill: 'writerPurpose', level: 2 }],
)

// Shades of meaning: the strongest or weakest word in a group (level 1), and positive or negative connotation (level 2).
const shadesGraded = rowSkill(
  'shadesGraded',
  ['Strong and weak words', 'Positive and negative words'],
  [
    [
      r('Which word is the strongest version of "happy"?', 'Ecstatic', 'Pleased', 'Content', 'Calm'),
      r('Which word means the strongest version of "cold"?', 'Freezing', 'Cool', 'Chilly', 'Crisp'),
      r('Which word shows the most tiredness?', 'Exhausted', 'Sleepy', 'Drowsy', 'Relaxed'),
      r('Which word shows the most anger?', 'Furious', 'Annoyed', 'Grumpy', 'Bothered'),
      r('Which word is the biggest in size?', 'Gigantic', 'Big', 'Large', 'Roomy'),
      r('Which word shows the most fear?', 'Terrified', 'Uneasy', 'Worried', 'Nervous'),
      r('Which word shows the most hunger?', 'Starving', 'Peckish', 'Hungry', 'Stuffed'),
      r('Which word shows the most brightness?', 'Dazzling', 'Dim', 'Faint', 'Dull'),
      r('Which word is the smallest in size?', 'Tiny', 'Huge', 'Enormous', 'Massive'),
    ],
    [
      r('Which word has a negative meaning?', 'Stubborn', 'Determined', 'Confident', 'Careful'),
      r('Which word has a negative meaning about spending money?', 'Stingy', 'Thrifty', 'Careful', 'Frugal'),
      r('Which word has a positive meaning?', 'Thrifty', 'Greedy', 'Nosy', 'Bossy'),
      r('Which word has a negative meaning?', 'Snoop', 'Explore', 'Observe', 'Notice'),
      r('Which word has a positive meaning?', 'Cheerful', 'Grumpy', 'Moody', 'Sulky'),
      r('Which word has a negative meaning?', 'Reckless', 'Brave', 'Bold', 'Daring'),
      r('Which word has a positive meaning?', 'Curious', 'Nosy', 'Pushy', 'Greedy'),
      r('Which word has a negative meaning?', 'Lazy', 'Calm', 'Relaxed', 'Peaceful'),
      r('Which word has a positive meaning?', 'Generous', 'Selfish', 'Bossy', 'Rude'),
    ],
  ],
  [{ skill: 'shadesOfMeaning', level: 2 }],
)

// --- Writing -----------------------------------------------------------------------------------

// Spelling patterns: long and short vowels (grade 3), blends, digraphs, and trigraphs, then variant vowels and r-controlled spellings.
const patternSpelling = rowSkill(
  'patternSpelling',
  ['Short and long vowel spellings', 'Blends, digraphs, and trigraphs', 'Variant, diphthong, and r vowel spellings'],
  [
    [
      r('Which word is spelled correctly? (falling water from clouds)', 'rain', 'rayn', 'rane', 'rein'),
      r('Which word is spelled correctly? (what a boat does on the water)', 'sail', 'sayl', 'sale', 'sael'),
      r('Which word is spelled correctly? (a small buzzing insect that makes honey)', 'bee', 'bea', 'bie', 'bi'),
      r('Which word is spelled correctly? (what you use to see in the dark)', 'light', 'lyte', 'lihgt', 'lighte'),
      r('Which word is spelled correctly? (a small boat you row across a lake)', 'boat', 'bote', 'bowt', 'boatt'),
      r('Which word is spelled correctly? (you wear this on your head in the sun)', 'hat', 'haat', 'hatt', 'hot'),
      r('Which word is spelled correctly? (a bird\'s home)', 'nest', 'nestt', 'nast', 'nets'),
      r('Which word is spelled correctly? (a color of a clear sky)', 'blue', 'bloo', 'bleu', 'blew'),
      r('Which word is spelled correctly? (a flat tool you carry food on)', 'tray', 'trai', 'trey', 'trayy'),
    ],
    [
      r('Which word is spelled correctly? (the part of your face below your mouth)', 'chin', 'cin', 'chinn', 'kin'),
      r('Which word is spelled correctly? (a store where you buy things)', 'shop', 'shopp', 'chop', 'shap'),
      r('Which word is spelled correctly? (the short finger next to your pointer)', 'thumb', 'thum', 'tumb', 'thumbb'),
      r('Which word is spelled correctly? (the joint in the middle of your leg)', 'knee', 'nee', 'knea', 'kneh'),
      r('Which word is spelled correctly? (a device you call people with)', 'phone', 'phon', 'phoen', 'phune'),
      r('Which word is spelled correctly? (a huge animal that lives in the ocean)', 'whale', 'wale', 'wael', 'whayl'),
      r('Which word is spelled correctly? (to pull your arms out long)', 'stretch', 'strech', 'stratch', 'streetch'),
      r('Which word is spelled correctly? (a structure built over a river)', 'bridge', 'bridj', 'brige', 'bridghe'),
      r('Which word is spelled correctly? (the sound water makes when you jump in)', 'splash', 'slash', 'splach', 'splsh'),
    ],
    [
      r('Which word is spelled correctly? (a vehicle with four wheels)', 'car', 'kar', 'cahr', 'kaar'),
      r('Which word is spelled correctly? (a feathered animal that can fly)', 'bird', 'berd', 'burd', 'brid'),
      r('Which word is spelled correctly? (a reptile with a hard shell)', 'turtle', 'turtel', 'turtl', 'tirtle'),
      r('Which word is spelled correctly? (to yell loudly)', 'shout', 'shaut', 'shoute', 'shought'),
      r('Which word is spelled correctly? (a night bird with big eyes)', 'owl', 'oul', 'owel', 'owle'),
      r('Which word is spelled correctly? (what you read, with pages)', 'book', 'buk', 'bouk', 'booke'),
      r('Which word is spelled correctly? (food made from flour that you toast)', 'bread', 'bred', 'breed', 'brede'),
      r('Which word is spelled correctly? (a small piece of metal money)', 'coin', 'coyn', 'koin', 'coine'),
      r('Which word is spelled correctly? (a round shiny gem from an oyster)', 'pearl', 'purl', 'perl', 'pearel'),
    ],
  ],
  [{ skill: 'spell', level: 2 }],
)

// Affixed words: meanings of prefixes and suffixes (level 1), and choosing the affixed word for a sentence (level 2).
const affixMeaning = rowSkill(
  'affixMeaning',
  ['Prefixes and suffixes: meanings', 'Affixed words in sentences'],
  [
    [
      r('Which word means "not fair"?', 'Unfair', 'Fairly', 'Fairness', 'Refair'),
      r('Which word means "to write again"?', 'Rewrite', 'Writer', 'Writing', 'Unwritten'),
      r('Which word means "able to be washed"?', 'Washable', 'Unwashable', 'Washer', 'Washed'),
      r('Which word means "someone who teaches"?', 'Teacher', 'Teaching', 'Taught', 'Untaught'),
      r('Which word means "without a home"?', 'Homeless', 'Homesick', 'Homework', 'Homely'),
      r('Which word means "to make longer"?', 'Lengthen', 'Lengthy', 'Shorten', 'Lengthwise'),
      r('Which word means "a person who sings"?', 'Singer', 'Singing', 'Sang', 'Unsung'),
      r('Which word means "the state of being happy"?', 'Happiness', 'Happily', 'Unhappy', 'Happen'),
      r('Which word means "to fill again"?', 'Refill', 'Unfill', 'Filler', 'Filled'),
    ],
    [
      r('The bridge was ___ after the storm, so cars could not cross.', 'unsafe', 'safely', 'safety', 'safeness'),
      r('Sam had to ___ the broken bike before he could ride it.', 'rebuild', 'builder', 'building', 'buildings'),
      r('The door was locked, so we had to ___ it with a key.', 'unlock', 'locker', 'locking', 'locks'),
      r('Jin\'s little brother is very ___ and laughs at everything.', 'joyful', 'joyless', 'joyfully', 'joy'),
      r('It was ___ to see the stars through the thick cloud.', 'impossible', 'possibly', 'possibility', 'impossibly'),
      r('The map was ___, so we could not read the street names.', 'unreadable', 'readably', 'readability', 'readable'),
      r('The swimmers were ___ as they waited for the race, so they paced back and forth.', 'impatient', 'patiently', 'patience', 'patient'),
      r('The puppy had never been ___, so it stayed on a leash.', 'untrained', 'trainer', 'training', 'retrained'),
    ],
  ],
  [{ skill: 'prefixSuffix', level: 2 }],
)

// Formatting: greetings and closings, addresses, titles, and dialogue. Exact-case check, since capitals and punctuation are the point.
const formatWriting = rowSkill(
  'formatWriting',
  ['Letters, addresses, and titles', 'Dates, closings, and titles', 'Dialogue, titles, and addresses'],
  [
    [
      r('Which greeting is correct for a letter?', 'Dear Grandma,', 'dear Grandma,', 'Dear Grandma', 'Dear grandma,'),
      r('Which closing is correct for a letter?', 'With love,', 'with love,', 'With love', 'With Love,'),
      r('Which street address is written correctly?', '125 Oak Street', '125 oak street', '125 Oak street', '125 OAK STREET'),
      r('Which is the correct way to write the title of a short story?', '"The Fox and the Crow"', 'The Fox and the Crow', '"the Fox and the Crow"', '"The Fox And The Crow"'),
      r('Which is the correct capitalization of a book title?', 'Charlotte\'s Web', 'Charlotte\'s web', 'charlotte\'s web', 'Charlotte\'s Web,'),
      r('Which is the correct form of a poem title?', '"Hope Is the Thing with Feathers"', '"Hope is the Thing with Feathers"', '"Hope Is The Thing With Feathers"', 'Hope Is the Thing with Feathers'),
      r('Which address is in the correct order?', '42 Pine Road, Springfield', 'Springfield, 42 Pine Road', '42, Pine Road Springfield', 'Pine Road 42 Springfield'),
      r('Which closing is correct for a letter to a teacher?', 'Sincerely,', 'sincerely,', 'Sincerely', 'SINCERELY,'),
    ],
    [
      r('Which is the correct way to write a city, state, and zip code?', 'Denver, CO 80202', 'Denver CO, 80202', 'Denver, co 80202', 'Denver, CO, 80202'),
      r('Which is the correct way to write a date in a letter?', 'March 3, 2025', 'March, 3 2025', 'March 3 2025', '3 March, 2025'),
      r('Which title is capitalized correctly?', 'The Lion King', 'The lion king', 'The Lion king', 'the Lion King'),
      r('Which sentence punctuates the title of a story correctly?', 'I read "The Gift."', 'I read "The Gift".', 'I read The Gift.', 'I read "The Gift"."'),
      r('Which chapter title is capitalized correctly?', 'Chapter Two: The Storm', 'Chapter Two: the Storm', 'Chapter two: The Storm', 'chapter Two: The Storm'),
      r('Which is a correct business letter closing?', 'Respectfully,', 'Respectfully', 'respectfully,', 'Respectfully!'),
      r('Which salutation is correct for a doctor?', 'Dear Dr. Lopez,', 'dear Dr. Lopez,', 'Dear Dr. Lopez', 'Dear Dr. lopez,'),
      r('Which book title is capitalized correctly?', 'To Kill a Mockingbird', 'To kill a Mockingbird', 'To Kill A Mockingbird', 'to kill a mockingbird'),
    ],
    [
      r('Which sentence punctuates dialogue correctly?', '"Let\'s go," said Mia.', '"Let\'s go" said Mia.', '"Let\'s go." said Mia.', '"Let\'s go", said Mia.'),
      r('Which sentence punctuates dialogue correctly?', '"Are you ready?" asked Dan.', '"Are you ready," asked Dan?', '"Are you ready?", asked Dan.', '"Are you ready" asked Dan.'),
      r('Which sentence punctuates dialogue correctly?', 'Mom said, "Dinner is ready."', 'Mom said "Dinner is ready".', 'Mom said, "Dinner is ready".', 'Mom said "Dinner is ready."'),
      r('Which title is capitalized correctly?', 'A Tale of Two Cities', 'A Tale Of Two Cities', 'a Tale of Two Cities', 'A tale of two cities'),
      r('Which address format is correct for an envelope?', '22 Lake Road, Austin, TX 78701', '22 Lake Road Austin TX 78701', '22 Lake Road, Austin TX, 78701', '22 lake road, Austin, TX 78701'),
      r('Which title follows the rule for short words like "of" and "the"?', 'Rules of the Road', 'Rules Of The Road', 'Rules of The Road', 'rules of the Road'),
      r('Which sentence punctuates dialogue correctly?', 'Sam asked, "Can I come?"', 'Sam asked "Can I come?"', 'Sam asked, "Can I come"?', 'Sam asked, "Can I come.?"'),
      r('Which sentence punctuates dialogue correctly?', '"Watch out!" yelled Jo.', '"Watch out," yelled Jo!', '"Watch out" yelled Jo!', '"Watch out!", yelled Jo.'),
      r('Which is the correct way to write a poem title in a sentence?', 'We read "Fire and Ice" in class.', 'We read "fire and Ice" in class.', 'We read "Fire And Ice" in class.', 'We read Fire and Ice in class.'),
    ],
  ],
  [{ skill: 'capitalizationAdv', level: 2 }],
  true,
)

// Descriptive details: specific details (level 1), sensory imagery (level 2), and vivid verbs and showing feelings (level 3).
const descriptiveDetails = rowSkill(
  'descriptiveDetails',
  ['Adding specific details', 'Sense words and imagery', 'Vivid verbs and showing feelings'],
  [
    [
      r('Which sentence has more descriptive details?', 'The tiny brown puppy wagged its curly tail.', 'The puppy moved.', 'The dog was there.', 'A puppy is nice.'),
      r('Which sentence shows that Ana is happy without using the word happy?', 'Ana skipped and clapped with a big grin.', 'Ana was happy.', 'Ana frowned and sat down.', 'Ana ate a sandwich.'),
      r('Which sentence shows that Leo is scared?', 'Leo hid behind the couch and held his breath.', 'Leo ate three pancakes.', 'Leo painted a red fence.', 'Leo waved to his friend.'),
      r('Which sentence gives the most details about the tree?', 'The tall oak had thick branches.', 'The tree was big.', 'Trees are nice.', 'There was a tree.'),
      r('Which sentence shows that Mia is tired?', 'Mia yawned and dragged her feet to bed.', 'Mia ran to the park.', 'Mia sang a loud song.', 'Mia painted a picture.'),
      r('Which sentence has the most vivid detail about the food?', 'Warm cinnamon bread smelled sweet.', 'The bread was food.', 'We ate bread.', 'Bread is good.'),
      r('Which sentence shows that the dog is excited?', 'The dog jumped up, wagging its tail.', 'The dog slept on the rug.', 'The dog ate a bone quietly.', 'The dog sat still and did not move.'),
      r('Which sentence describes the sound of the storm best?', 'Thunder rumbled and rain pounded the roof.', 'The storm was there.', 'It was a storm.', 'The sky was blue.'),
      r('Which sentence shows that the character is angry?', 'Jay slammed the door and stomped away.', 'Jay smiled at his brother.', 'Jay read a book in bed.', 'Jay hugged his dog.'),
    ],
    [
      r('Which sentence uses SMELL imagery?', 'The bakery smelled of warm bread.', 'The bakery was on the corner.', 'The bakery was loud.', 'The bakery had a blue sign.'),
      r('Which sentence uses SOUND imagery?', 'Waves crashed loudly against the rocks.', 'The sea was blue and calm.', 'The sand felt warm and gritty.', 'Salt filled the air.'),
      r('Which sentence uses TASTE imagery?', 'The lemon was so sour my cheeks puckered.', 'The lemon was yellow and round.', 'The lemon rolled off the table.', 'The lemon was in a bowl.'),
      r('Which sentence uses TOUCH imagery?', 'The fuzzy blanket felt soft against my cheek.', 'The blanket was on the bed.', 'The blanket was red and bright.', 'The blanket smelled like pine.'),
      r('Which sentence uses SIGHT imagery?', 'Golden leaves drifted past the red barn.', 'Birds sang in the morning air.', 'The soup tasted spicy.', 'The mud smelled damp.'),
      r('Which sentence uses touch imagery to show the cold?', 'My fingers were numb from the icy wind.', 'The winter was a season.', 'It was December.', 'The snow was on the ground.'),
      r('Which sentence uses SMELL imagery?', 'Pine needles scented the cool forest air.', 'The forest had many trees.', 'The forest was quiet.', 'The forest was green.'),
      r('Which sentence uses SOUND imagery?', 'The crowd roared, and the drums boomed.', 'The crowd sat in rows of red seats.', 'The stadium was big.', 'The crowd felt happy.'),
      r('Which sentence uses SIGHT imagery?', 'The moon glowed silver over the calm lake.', 'The moon was a nice thing.', 'The lake was a good place.', 'The moon hummed a tune.'),
    ],
    [
      r('Which verb best shows slow, heavy steps?', 'Trudged', 'Skipped', 'Floated', 'Bounced'),
      r('Which verb shows the fastest movement?', 'Sprinted', 'Strolled', 'Crawled', 'Drifted'),
      r('Which verb shows that someone is angry when speaking?', 'Snapped', 'Whispered', 'Giggled', 'Sighed'),
      r('Which word is more specific than "big" for a mountain?', 'Towering', 'Small', 'Green', 'Nice'),
      r('Which sentence adds the most descriptive detail?', 'The old boat creaked as waves slapped it.', 'The boat was there.', 'A boat was on the water.', 'The boat is big.'),
      r('Which sentence shows, rather than tells, that Ben is proud?', 'Ben stood tall and held his trophy high.', 'Ben was very proud of himself.', 'Ben ate lunch with his friends.', 'Ben walked to the bus stop.'),
      r('Which sentence uses the most vivid verb?', 'The lightning zigzagged across the sky.', 'The lightning was in the sky.', 'The lightning went across the sky.', 'The lightning is bright in the sky.'),
      r('Which sentence uses imagery to describe the sound of the ocean?', 'Waves hissed and crashed against the sand.', 'The ocean was big and blue.', 'The sand was warm.', 'The ocean was far away.'),
      r('Which sentence best shows that the character is scared?', 'Her knees knocked and her voice shook.', 'She stepped on stage and waved hello.', 'She laughed at the joke.', 'She bought a snack after the show.'),
    ],
  ],
  [{ skill: 'sentenceVariety', level: 2 }],
)

// Verb types: helping and main verbs (level 1), and modal verbs (level 2).
const helpingModals = rowSkill(
  'helpingModals',
  ['Helping and main verbs', 'Modal verbs'],
  [
    [
      r('Which word is the helping verb? "She has finished her homework."', 'has', 'finished', 'homework', 'She'),
      r('Which word is the helping verb? "The kids are playing outside."', 'are', 'playing', 'outside', 'kids'),
      r('Which word is the main verb? "We will paint the fence today."', 'paint', 'will', 'fence', 'today'),
      r('Which word is the helping verb? "Dad was cooking dinner."', 'was', 'cooking', 'dinner', 'Dad'),
      r('Which word is the main verb? "The dog has barked all night."', 'barked', 'has', 'night', 'dog'),
      r('Which word is the helping verb? "I have read that book twice."', 'have', 'read', 'twice', 'book'),
      r('Which word is the main verb? "The bird is singing in the tree."', 'singing', 'is', 'tree', 'bird'),
      r('Which word is the helping verb? "They had finished before we arrived."', 'had', 'finished', 'arrived', 'before'),
      r('Which word is the main verb? "She could swim across the lake."', 'swim', 'could', 'lake', 'across'),
    ],
    [
      r('Which modal verb shows ability? "Mia ___ swim across the lake."', 'can', 'must', 'may', 'should'),
      r('Which modal verb shows that something is required? "You ___ wear a seatbelt."', 'must', 'might', 'could', 'would'),
      r('Which modal verb shows possibility? "It ___ rain later today."', 'might', 'must', 'should', 'will'),
      r('Which modal verb shows permission? "You ___ borrow my pencil."', 'may', 'must', 'should', 'will'),
      r('Which modal verb shows a future event that is certain? "The bus ___ arrive at eight."', 'will', 'might', 'could', 'should'),
      r('Which modal verb shows past ability? "When I was four, I ___ read simple books."', 'could', 'must', 'will', 'should'),
      r('Which word is the modal verb? "The kids could hear the music."', 'could', 'hear', 'music', 'kids'),
      r('Which word is the modal verb? "I would like some tea."', 'would', 'like', 'tea', 'some'),
    ],
  ],
  [{ skill: 'verbTypes', level: 2 }],
)

// Subject-verb agreement: phrases between subject and verb (level 1), and compound subjects (level 2).
const subjectVerbPairs = rowSkill(
  'subjectVerbPairs',
  ['Subjects with phrases between', 'Compound subjects'],
  [
    [
      r('The box of crayons ___ on the table.', 'is', 'are', 'were', 'be'),
      r('The dogs in the yard ___ barking.', 'are', 'is', 'was', 'be'),
      r('One of the cookies ___ gone.', 'is', 'are', 'were', 'be'),
      r('Each of the students ___ a pencil.', 'has', 'have', 'having', 'had'),
      r('The leaves on the oak tree ___ yellow in the fall.', 'turn', 'turns', 'turned', 'turning'),
      r('My friend and I ___ at the library.', 'are', 'is', 'am', 'was'),
      r('Our bags on the floor ___ heavy.', 'are', 'is', 'was', 'be'),
      r('The cat, along with the mice, ___ asleep.', 'is', 'are', 'were', 'be'),
    ],
    [
      r('Tom and Sara ___ best friends.', 'are', 'is', 'was', 'be'),
      r('The bread and the butter ___ on the counter.', 'are', 'is', 'was', 'has'),
      r('Either the dog or the cats ___ the ball.', 'have', 'has', 'is', 'be'),
      r('Mom, Dad, and I ___ going to the zoo.', 'are', 'is', 'was', 'be'),
      r('The pencil and the eraser ___ in my bag.', 'are', 'is', 'was', 'has'),
      r('Both the cat and the dog ___ hungry.', 'are', 'is', 'was', 'be'),
      r('Sam and his brother ___ playing soccer now.', 'are', 'is', 'has', 'was'),
      r('The sun and the moon ___ in the sky.', 'are', 'is', 'was', 'be'),
      r('Ben, Ana, and Kim ___ the winners.', 'are', 'is', 'was', 'be'),
    ],
  ],
  [{ skill: 'subjectVerb', level: 2 }],
)

// Adjectives and adverbs: identifying each (level 1), and putting adjectives in order (level 2).
const adjOrderAdverbs = rowSkill(
  'adjOrderAdverbs',
  ['Adjectives and adverbs', 'Order of adjectives'],
  [
    [
      r('Which word is an adverb? "The tired dog slept quietly."', 'quietly', 'tired', 'dog', 'slept'),
      r('Which word is an adjective? "The tall tree grew slowly."', 'tall', 'grew', 'slowly', 'tree'),
      r('Which word is an adverb? "Our team played well."', 'well', 'team', 'played', 'Our'),
      r('Which word is an adjective? "The red kite flew away."', 'red', 'kite', 'flew', 'away'),
      r('Which word is an adverb? "She spoke softly to the baby."', 'softly', 'spoke', 'baby', 'the'),
      r('Which word is an adjective? "A loud truck rolled by the school."', 'loud', 'rolled', 'school', 'truck'),
      r('Which word is an adverb? "The baby giggled happily."', 'happily', 'baby', 'giggled', 'The'),
      r('Which word is an adverb? "We will leave early."', 'early', 'will', 'leave', 'We'),
      r('Which word is an adjective? "The cold water splashed onto the rocks."', 'cold', 'splashed', 'rocks', 'onto'),
    ],
    [
      r('Which phrase has its adjectives in the correct order?', 'a big red ball', 'a red big ball', 'a ball big red', 'a red ball big'),
      r('Which phrase has its adjectives in the correct order?', 'a lovely old wooden box', 'a wooden lovely old box', 'an old wooden lovely box', 'an old lovely wooden box'),
      r('Which phrase has its adjectives in the correct order?', 'three small round stones', 'small round three stones', 'three round small stones', 'round three small stones'),
      r('Which phrase has its adjectives in the correct order?', 'a tiny gray kitten', 'a gray tiny kitten', 'a kitten tiny gray', 'tiny a gray kitten'),
      r('Which phrase has its adjectives in the correct order?', 'a huge gray stone', 'a gray huge stone', 'a stone gray huge', 'a huge stone gray'),
      r('Which phrase has its adjectives in the correct order?', 'a long wooden table', 'a wooden long table', 'a table wooden long', 'a wooden table long'),
      r('Which phrase has its adjectives in the correct order?', 'an old Italian car', 'an Italian old car', 'an old car Italian', 'Italian an old car'),
      r('Which phrase has its adjectives in the correct order?', 'a beautiful little yellow flower', 'a little beautiful yellow flower', 'a yellow beautiful little flower', 'a yellow little beautiful flower'),
      r('Which phrase has its adjectives in the correct order?', 'two round silver coins', 'silver round two coins', 'round two silver coins', 'two silver round coins'),
    ],
  ],
  [{ skill: 'adjectivesAdverbs', level: 2 }],
)

// Prepositions: finding the preposition (level 1), and the prepositional phrase or its object (level 2).
const prepPhrases = rowSkill(
  'prepPhrases',
  ['Finding prepositions', 'Prepositional phrases'],
  [
    [
      r('Which word is the preposition? "The cat hid under the table."', 'under', 'cat', 'hid', 'table'),
      r('Which word is the preposition? "The book is on the shelf."', 'on', 'book', 'is', 'shelf'),
      r('Which word is the preposition? "We walked across the bridge."', 'across', 'walked', 'bridge', 'We'),
      r('Which word is the preposition? "Mia sat beside her brother."', 'beside', 'sat', 'brother', 'Mia'),
      r('Which word is the preposition? "The kite floated above the trees."', 'above', 'kite', 'floated', 'trees'),
      r('Which word is the preposition? "Dad put the cups in the cupboard."', 'in', 'cups', 'cupboard', 'put'),
      r('Which word is the preposition? "The boat sailed toward the island."', 'toward', 'sailed', 'island', 'boat'),
      r('Which word is the preposition? "The class went to the museum."', 'to', 'went', 'museum', 'class'),
    ],
    [
      r('Which is the prepositional phrase? "The pen is under the desk."', 'under the desk', 'The pen is', 'is under the', 'The pen'),
      r('What is the object of the preposition in "She ran toward the lake"?', 'the lake', 'She ran', 'toward', 'ran toward'),
      r('Which is the prepositional phrase? "The birds flew over the hill."', 'over the hill', 'The birds flew', 'flew over', 'birds flew'),
      r('What is the object of the preposition in "Put the milk in the fridge."', 'the fridge', 'the milk', 'Put the milk', 'in the'),
      r('Which is the prepositional phrase? "We sat by the window."', 'by the window', 'We sat', 'sat by', 'the window'),
      r('What is the object of the preposition in "The ball rolled behind the couch."', 'the couch', 'the ball', 'rolled behind', 'behind the'),
      r('Which is the prepositional phrase? "My hat is on my head."', 'on my head', 'My hat is', 'is on', 'my hat'),
      r('What is the object of the preposition in "Sam walked with his friends."', 'his friends', 'Sam walked', 'walked with', 'with his'),
      r('Which is the prepositional phrase? "The kids played during recess."', 'during recess', 'The kids played', 'played during', 'kids played'),
    ],
  ],
  [{ skill: 'prepositions', level: 2 }],
)

// Contractions: pronoun and verb contractions (level 1), and contractions with "not" (level 2).
const pronounContractions = rowSkill(
  'pronounContractions',
  ['Pronoun and verb contractions', 'Contractions with "not"'],
  [
    [
      r('What is the contraction for "it is"?', 'it\'s', 'its', 'itis', 'it\'ll'),
      r('What is the contraction for "we are"?', 'we\'re', 'were', 'wer', 'we\'ll'),
      r('What is the contraction for "you are"?', 'you\'re', 'your', 'you\'ll', 'yours'),
      r('What is the contraction for "she will"?', 'she\'ll', 'she\'s', 'shell', 'she\'d'),
      r('What is the contraction for "I have"?', 'I\'ve', 'I\'m', 'I\'d', 'I\'ll'),
      r('What is the contraction for "they will"?', 'they\'ll', 'they\'re', 'they\'ve', 'them\'ll'),
      r('What is the contraction for "he is"?', 'he\'s', 'hes', 'he\'d', 'he\'ll'),
      r('What is the contraction for "we have"?', 'we\'ve', 'we\'d', 'we\'re', 'weve'),
    ],
    [
      r('What is the contraction for "do not"?', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t'),
      r('What is the contraction for "is not"?', 'isn\'t', 'aren\'t', 'wasn\'t', 'won\'t'),
      r('What is the contraction for "will not"?', 'won\'t', 'wouldn\'t', 'don\'t', 'wasn\'t'),
      r('What is the contraction for "cannot"?', 'can\'t', 'couldn\'t', 'won\'t', 'shouldn\'t'),
      r('What is the contraction for "did not"?', 'didn\'t', 'doesn\'t', 'don\'t', 'wasn\'t'),
      r('What is the contraction for "should not"?', 'shouldn\'t', 'couldn\'t', 'wouldn\'t', 'mustn\'t'),
      r('What is the contraction for "are not"?', 'aren\'t', 'isn\'t', 'weren\'t', 'didn\'t'),
      r('Which contraction means "was not"?', 'wasn\'t', 'weren\'t', 'isn\'t', 'hasn\'t'),
      r('What is the contraction for "does not"?', 'doesn\'t', 'don\'t', 'didn\'t', 'isn\'t'),
    ],
  ],
  [{ skill: 'contractions', level: 2 }],
)

// --- Registered skills and IXL levels ----------------------------------------------------------

export const READING_FU: Skill[] = [
  irregularWords,
  decodableStories,
  figurativeMeaning,
  visualDisplays,
  infoPassages,
  storyPassages,
  researchSources,
  writerGoal,
  formalTone,
  shadesGraded,
]

export const WRITING_FU: Skill[] = [patternSpelling, affixMeaning, formatWriting, descriptiveDetails, helpingModals, subjectVerbPairs, adjOrderAdverbs, prepPhrases, pronounContractions]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

/** One IXL topic per level (index 0 = level 1), keyed "<subject>.<skill id>". Grades never go down by level. */
export const LANGUAGE_FU_IXL: Record<string, IxlRef[]> = {
  'reading.irregularWords': [e(3, 'High-frequency and irregular words'), e(4, 'High-frequency and irregular words'), e(5, 'High-frequency and irregular words')],
  'reading.decodableStories': [e(3, 'Decodable texts'), e(3, 'Decodable texts')],
  'reading.figurativeMeaning': [e(3, 'Literary devices'), e(5, 'Literary devices')],
  'reading.visualDisplays': [e(3, 'Visual elements'), e(4, 'Visual elements'), e(5, 'Visual elements')],
  'reading.infoPassages': [e(3, 'Informational texts: level 2'), e(4, 'Informational texts: level 1'), e(5, 'Informational texts: level 1')],
  'reading.storyPassages': [e(3, 'Literary texts: level 2'), e(4, 'Literary texts: level 2'), e(5, 'Literary texts: level 1')],
  'reading.researchSources': [e(4, 'Research skills'), e(5, 'Research skills')],
  'reading.writerGoal': [e(3, "Writer's purpose"), e(3, "Writer's purpose")],
  'reading.formalTone': [e(5, 'Tone')],
  'reading.shadesGraded': [e(5, 'Shades of meaning'), e(5, 'Shades of meaning')],
  'writing.patternSpelling': [e(3, 'Short and long vowels'), e(3, 'Blends, digraphs, and trigraphs'), e(3, 'Variant, diphthong, and r vowel patterns')],
  'writing.affixMeaning': [e(5, 'Affixed words'), e(5, 'Affixed words')],
  'writing.formatWriting': [e(3, 'Formatting'), e(4, 'Formatting'), e(5, 'Formatting')],
  'writing.descriptiveDetails': [e(3, 'Descriptive details'), e(4, 'Descriptive details'), e(5, 'Descriptive details')],
  'writing.helpingModals': [e(5, 'Verb types'), e(5, 'Verb types')],
  'writing.subjectVerbPairs': [e(5, 'Subject-verb agreement'), e(5, 'Subject-verb agreement')],
  'writing.adjOrderAdverbs': [e(5, 'Adjectives and adverbs'), e(5, 'Adjectives and adverbs')],
  'writing.prepPhrases': [e(5, 'Prepositions'), e(5, 'Prepositions')],
  'writing.pronounContractions': [e(5, 'Contractions'), e(5, 'Contractions')],
}
