import type { ItemSpec, Skill, Subject } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { upToLevel, wrongFrom } from './util'

/**
 * Science and Social Studies for kindergarten to grade 5, named like IXL's categories.
 * Every question is a multiple-choice fact from a hand-checked list. Wrong answers come from
 * other things of the same kind but NOT the right kind (other animals, other holidays), so a
 * wrong choice can never also be right.
 */

interface Fact {
  /** Unique inside its skill. It becomes part of the item key, so never rename it. */
  id: string
  /** The first level this fact shows up at (1 = the first level). */
  level: number
  q: string
  a: string
  /** Believable wrong answers. Keep at least 3, and none of them correct. */
  wrong: string[]
  emoji?: string
}

function factItem(skillId: string, f: Fact): ItemSpec {
  return {
    key: `${skillId}:${f.id}`,
    prompt: { text: f.q, say: f.q, emoji: f.emoji },
    answer: f.a,
    wrong: (n) => wrongFrom(f.a, n, f.wrong),
  }
}

/** A skill made of facts. Each level asks its own facts and the ones from the levels below it. */
function factSkill(id: string, labels: string[], facts: Fact[], unlocksAfter?: { skill: string; level: number }[]): Skill {
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: labels.length,
    formats: ['choice'],
    ...(unlocksAfter ? { unlocksAfter } : {}),
    generate: (L) => factItem(id, upToLevel(facts, L)),
    fromKey: (key) => {
      const f = facts.find((x) => `${id}:${x.id}` === key)
      return f ? factItem(id, f) : null
    },
  }
}

// ============================================================================================
// SCIENCE
// ============================================================================================

const NONLIVING = ['a rock', 'a toy car', 'a bottle', 'a pencil', 'a cloud', 'a spoon']

const livingThings = factSkill(
  'livingThings',
  ['Living or not living', 'What living things need'],
  [
    { id: 'puppy', level: 1, q: 'Which one is alive?', a: 'a puppy', wrong: NONLIVING },
    { id: 'tree', level: 1, q: 'Which one is alive?', a: 'a tree', wrong: NONLIVING },
    { id: 'fish', level: 1, q: 'Which one is alive?', a: 'a fish', wrong: NONLIVING },
    { id: 'ladybug', level: 1, q: 'Which one is alive?', a: 'a ladybug', wrong: NONLIVING },
    { id: 'sunflower', level: 1, q: 'Which one is alive?', a: 'a sunflower', wrong: NONLIVING },
    { id: 'needWater', level: 2, q: 'Which one do ALL living things need to live?', a: 'water', wrong: ['a toy', 'a bicycle', 'a rock', 'a crayon'] },
    { id: 'plantSun', level: 2, q: 'What do plants need to make their own food?', a: 'sunlight', wrong: ['candy', 'a rock', 'a toy', 'milk'] },
    { id: 'animalAir', level: 2, q: 'Which gas in the air do animals need to stay alive?', a: 'oxygen', wrong: ['helium', 'smoke', 'steam'] },
  ],
)

const plants = factSkill(
  'plants',
  ['Parts of a plant', 'What plants need', 'Seeds, fruit, and pollinators'],
  [
    { id: 'roots', level: 1, q: 'Which part of a plant soaks up water from the ground?', a: 'roots', wrong: ['petals', 'leaves', 'seeds'] },
    { id: 'leaves', level: 1, q: 'Which part of a plant makes food using sunlight?', a: 'leaves', wrong: ['roots', 'petals', 'seeds'] },
    { id: 'stem', level: 1, q: 'Which part of a plant carries water up to the leaves?', a: 'stem', wrong: ['petals', 'seeds', 'fruit'] },
    { id: 'petals', level: 1, q: 'Which part of a flower is bright and colorful?', a: 'petals', wrong: ['roots', 'stem', 'leaves'] },
    { id: 'seed', level: 1, q: 'Which part of a plant is a baby plant, waiting to sprout?', a: 'seed', wrong: ['roots', 'leaves', 'petals'] },
    { id: 'sunlight', level: 2, q: 'What do plants need to make their own food?', a: 'sunlight', wrong: ['candy', 'a rock', 'a toy', 'milk'] },
    { id: 'seedWater', level: 2, q: 'Which of these does a seed need to sprout?', a: 'water', wrong: ['candy', 'a rock', 'a toy', 'a crayon'] },
    { id: 'seedPlant', level: 3, q: 'What does a seed grow into?', a: 'a plant', wrong: ['an insect', 'a rock', 'a cloud'] },
    { id: 'fruit', level: 3, q: 'What does a flower turn into after it is pollinated?', a: 'fruit', wrong: ['roots', 'leaves', 'thorns'] },
    { id: 'bee', level: 3, q: 'Which animal helps flowers make seeds by carrying pollen?', a: 'a bee', wrong: ['a fish', 'a snake', 'a turtle'] },
  ],
)

const animals = factSkill(
  'animals',
  ['Animal groups', 'Mammals, reptiles, and amphibians', 'Life cycles'],
  [
    { id: 'robin', level: 1, q: 'Which animal is a bird?', a: 'a robin', wrong: ['a frog', 'a shark', 'a snake', 'a butterfly', 'a bear'] },
    { id: 'goldfish', level: 1, q: 'Which animal is a fish?', a: 'a goldfish', wrong: ['a frog', 'a turtle', 'a dog', 'a bee'] },
    { id: 'ladybug', level: 1, q: 'Which animal is an insect?', a: 'a ladybug', wrong: ['a frog', 'an owl', 'a fish', 'a lizard'] },
    { id: 'dog', level: 2, q: 'Which animal is a mammal?', a: 'a dog', wrong: ['a snake', 'a frog', 'a fish', 'an owl'] },
    { id: 'snake', level: 2, q: 'Which animal is a reptile?', a: 'a snake', wrong: ['a dog', 'a frog', 'a robin', 'a whale'] },
    { id: 'frog', level: 2, q: 'Which animal is an amphibian?', a: 'a frog', wrong: ['a snake', 'a fish', 'a cat'] },
    { id: 'frogLife', level: 3, q: 'A frog starts life as an egg. What hatches from the egg?', a: 'a tadpole', wrong: ['a caterpillar', 'a chick', 'a puppy'] },
    { id: 'butterflyLife', level: 3, q: 'A butterfly starts as an egg. What comes out of the egg first?', a: 'a caterpillar', wrong: ['a tadpole', 'a chick', 'a puppy'] },
    { id: 'chickLife', level: 3, q: 'A chicken starts as an egg. What comes out of the egg?', a: 'a chick', wrong: ['a tadpole', 'a caterpillar', 'a kitten'] },
  ],
)

const ecosystems = factSkill(
  'ecosystems',
  ['Where animals live', 'Food chains', 'Who makes food and who breaks things down'],
  [
    { id: 'camel', level: 1, q: 'Where does a camel live?', a: 'in the desert', wrong: ['in the ocean', 'in a pond', 'in a rainforest'] },
    { id: 'polarBear', level: 1, q: 'Where does a polar bear live?', a: 'in the Arctic', wrong: ['in the desert', 'in a rainforest', 'in a pond'] },
    { id: 'fishHome', level: 1, q: 'Where does a fish live?', a: 'in the water', wrong: ['in a tree', 'in the desert', 'in a burrow'] },
    { id: 'rabbitEats', level: 2, q: 'In a food chain, what does a rabbit eat?', a: 'grass', wrong: ['a fox', 'a hawk', 'an owl'] },
    { id: 'foxEats', level: 2, q: 'In the food chain grass, rabbit, fox, what does the fox eat?', a: 'a rabbit', wrong: ['grass', 'leaves', 'seeds'] },
    { id: 'firstLink', level: 2, q: 'What is the first link in most food chains?', a: 'plants', wrong: ['a fox', 'a hawk', 'a snake'] },
    { id: 'maker', level: 3, q: 'Which living thing makes its own food from sunlight?', a: 'a plant', wrong: ['a rabbit', 'a fox', 'a mushroom'] },
    { id: 'breakdown', level: 3, q: 'Which living thing breaks down dead plants and animals?', a: 'a mushroom', wrong: ['a rabbit', 'a plant', 'a fox'] },
    { id: 'sunEnergy', level: 3, q: 'Where does the energy in most food chains come from?', a: 'the Sun', wrong: ['the Moon', 'the ocean', 'the wind'] },
  ],
)

const weather = factSkill(
  'weather',
  ['Kinds of weather', 'Weather tools', 'Seasons'],
  [
    { id: 'rainy', level: 1, q: 'What kind of weather is this?', a: 'rainy', wrong: ['sunny', 'snowy', 'windy'], emoji: '🌧️' },
    { id: 'snowy', level: 1, q: 'What kind of weather is this?', a: 'snowy', wrong: ['sunny', 'rainy', 'windy'], emoji: '❄️' },
    { id: 'sunny', level: 1, q: 'What kind of weather is this?', a: 'sunny', wrong: ['snowy', 'rainy', 'windy'], emoji: '☀️' },
    { id: 'windy', level: 1, q: 'What kind of weather is this?', a: 'windy', wrong: ['sunny', 'snowy', 'rainy'], emoji: '💨' },
    { id: 'thermometer', level: 2, q: 'Which tool measures how hot or cold it is?', a: 'a thermometer', wrong: ['a ruler', 'a clock', 'a scale', 'a compass'] },
    { id: 'rainGauge', level: 2, q: 'Which tool measures how much rain fell?', a: 'a rain gauge', wrong: ['a thermometer', 'a ruler', 'a clock', 'a scale'] },
    { id: 'hottest', level: 3, q: 'Which season is the hottest in most of the US?', a: 'summer', wrong: ['winter', 'spring', 'fall'] },
    { id: 'coldest', level: 3, q: 'Which season is the coldest in most of the US?', a: 'winter', wrong: ['spring', 'summer', 'fall'] },
    { id: 'babies', level: 3, q: 'In which season do flowers bloom and many baby animals get born?', a: 'spring', wrong: ['winter', 'fall', 'summer'] },
  ],
)

const statesOfMatter = factSkill(
  'statesOfMatter',
  ['Solid, liquid, or gas', 'Shapes and containers', 'Changes of state'],
  [
    { id: 'solidRock', level: 1, q: 'Which one is a solid?', a: 'a rock', wrong: ['water', 'air', 'milk', 'juice'] },
    { id: 'solidIce', level: 1, q: 'Which one is a solid?', a: 'an ice cube', wrong: ['water', 'air', 'milk', 'juice'] },
    { id: 'liquidWater', level: 1, q: 'Which one is a liquid?', a: 'water', wrong: ['a rock', 'a pencil', 'air'] },
    { id: 'liquidMilk', level: 1, q: 'Which one is a liquid?', a: 'milk', wrong: ['a rock', 'a pencil', 'air'] },
    { id: 'gasAir', level: 1, q: 'Which one is a gas?', a: 'air', wrong: ['a rock', 'water', 'milk'] },
    { id: 'keepsShape', level: 2, q: 'Which one keeps its own shape when you move it?', a: 'a block', wrong: ['water', 'juice', 'air'] },
    { id: 'takesShape', level: 2, q: 'Which one takes the shape of the cup it is in?', a: 'juice', wrong: ['a block', 'a pencil', 'a rock'] },
    { id: 'fillsBox', level: 2, q: 'Which one spreads out to fill the whole box?', a: 'air', wrong: ['a block', 'water', 'a rock'] },
    { id: 'melting', level: 3, q: 'What do we call it when ice turns into water?', a: 'melting', wrong: ['freezing', 'boiling', 'shrinking'] },
    { id: 'freezing', level: 3, q: 'What do we call it when water turns into ice?', a: 'freezing', wrong: ['melting', 'boiling', 'shrinking'] },
    { id: 'boiling', level: 3, q: 'What do we call it when water gets very hot and turns into a gas?', a: 'boiling', wrong: ['freezing', 'melting', 'shrinking'] },
  ],
)

const forces = factSkill(
  'forces',
  ['Pushes and pulls', 'What a force is'],
  [
    { id: 'pushSwing', level: 1, q: 'Which one is a push?', a: 'pushing a swing', wrong: ['pulling a wagon', 'pulling a rope', 'pulling a sled'] },
    { id: 'kickBall', level: 1, q: 'Which one is a push?', a: 'kicking a ball', wrong: ['pulling a wagon', 'pulling a rope', 'pulling a sled'] },
    { id: 'shoveBox', level: 1, q: 'Which one is a push?', a: 'shoving a box', wrong: ['pulling a wagon', 'pulling a rope', 'pulling a sled'] },
    { id: 'pullWagon', level: 1, q: 'Which one is a pull?', a: 'pulling a wagon', wrong: ['kicking a ball', 'pushing a swing', 'shoving a box', 'pushing a door shut'] },
    { id: 'pullRope', level: 1, q: 'Which one is a pull?', a: 'pulling a rope', wrong: ['kicking a ball', 'pushing a swing', 'shoving a box', 'pushing a door shut'] },
    { id: 'pullSled', level: 1, q: 'Which one is a pull?', a: 'pulling a sled', wrong: ['kicking a ball', 'pushing a swing', 'shoving a box', 'pushing a door shut'] },
    { id: 'forceName', level: 2, q: 'What do we call a push or a pull?', a: 'a force', wrong: ['a sound', 'a color', 'a shadow'] },
    { id: 'carMoves', level: 2, q: 'What can a push or a pull do to a toy car that is standing still?', a: 'it makes it move', wrong: ['it makes it sing', 'it makes it change color', 'it makes it disappear'] },
  ],
  undefined,
)

const forcesAdvanced = factSkill(
  'forcesAdvanced',
  ['Gravity', 'Friction'],
  [
    { id: 'gravity', level: 1, q: 'What pulls everything down toward the ground?', a: 'gravity', wrong: ['friction', 'a bounce', 'the wind'] },
    { id: 'apples', level: 1, q: 'Why do apples fall down from trees?', a: 'gravity', wrong: ['friction', 'a bounce', 'a shadow'] },
    { id: 'friction', level: 2, q: 'What force slows down a box that is sliding on the floor?', a: 'friction', wrong: ['a bounce', 'a color', 'a sound'] },
    { id: 'roughCarpet', level: 2, q: 'Which surface makes a toy car slow down the most?', a: 'rough carpet', wrong: ['smooth ice', 'a smooth wood floor', 'a glass tabletop'] },
  ],
  [{ skill: 'forces', level: 2 }],
)

const magnets = factSkill(
  'magnets',
  ['What magnets pull', 'Magnets pushing and pulling'],
  [
    { id: 'clip', level: 1, q: 'Which one will a magnet pull?', a: 'a paper clip', wrong: ['a wooden spoon', 'a plastic cup', 'a rubber ball', 'a crayon'] },
    { id: 'nail', level: 1, q: 'Which one will a magnet pull?', a: 'a steel nail', wrong: ['a wooden spoon', 'a plastic cup', 'a rubber ball', 'a crayon'] },
    { id: 'samePush', level: 2, q: 'What happens when the same ends of two magnets face each other?', a: 'they push apart', wrong: ['they stick together', 'nothing happens', 'they spin'] },
    { id: 'oppStick', level: 2, q: 'What happens when opposite ends of two magnets face each other?', a: 'they stick together', wrong: ['they push apart', 'nothing happens', 'they spin'] },
  ],
)

const lightSound = factSkill(
  'lightSound',
  ['Using your senses', 'What makes sound and shadows'],
  [
    { id: 'ears', level: 1, q: 'What do we hear with?', a: 'ears', wrong: ['eyes', 'nose', 'hands'] },
    { id: 'eyes', level: 1, q: 'What do we see with?', a: 'eyes', wrong: ['ears', 'nose', 'tongue'] },
    { id: 'nose', level: 1, q: 'What do we smell with?', a: 'nose', wrong: ['ears', 'eyes', 'tongue'] },
    { id: 'tongue', level: 1, q: 'What do we taste with?', a: 'tongue', wrong: ['ears', 'eyes', 'hands'] },
    { id: 'vibrations', level: 2, q: 'What makes sound?', a: 'vibrations', wrong: ['shadows', 'rainbows', 'colors'] },
    { id: 'flashlight', level: 2, q: 'Which one gives off its own light?', a: 'a flashlight', wrong: ['a rock', 'a pillow', 'a spoon'] },
    { id: 'shadow', level: 2, q: 'Which one makes a shadow when light shines on it?', a: 'a block', wrong: ['air', 'a rainbow', 'a color'] },
  ],
)

const earthResources = factSkill(
  'earthResources',
  ['Natural resources', 'Keeping Earth clean'],
  [
    { id: 'water', level: 1, q: 'Which one is a natural resource?', a: 'water', wrong: ['a toy car', 'a chair', 'a crayon'] },
    { id: 'trees', level: 1, q: 'Which one is a natural resource?', a: 'trees', wrong: ['a toy car', 'a chair', 'a crayon'] },
    { id: 'soil', level: 1, q: 'Which one is a natural resource?', a: 'soil', wrong: ['a toy car', 'a chair', 'a crayon'] },
    { id: 'sunlight', level: 1, q: 'Which one is a natural resource?', a: 'sunlight', wrong: ['a toy car', 'a chair', 'a crayon'] },
    { id: 'recycle', level: 2, q: 'What can we do with cans and paper so they do not go in the trash?', a: 'recycle them', wrong: ['litter them', 'leave them outside', 'throw them in the creek'] },
    { id: 'saveWater', level: 2, q: 'What is a good way to save water?', a: 'turn off the tap while you brush', wrong: ['leave the water running', 'wash the sidewalk with a hose', 'fill a pool all day'] },
    { id: 'litter', level: 2, q: 'What hurts animals and the Earth when it is left on the ground?', a: 'litter', wrong: ['recycling', 'planting trees', 'picking up trash'] },
  ],
)

const conservation = factSkill(
  'conservation',
  ['Nonrenewable resources', 'Renewable resources'],
  [
    { id: 'oil', level: 1, q: 'Which one is a nonrenewable resource, something we can use up?', a: 'oil', wrong: ['wind', 'sunlight', 'water'] },
    { id: 'coal', level: 1, q: 'Which one is a nonrenewable resource, something we can use up?', a: 'coal', wrong: ['wind', 'sunlight', 'water'] },
    { id: 'wind', level: 2, q: 'Which one is a renewable resource, one we can keep replacing?', a: 'wind', wrong: ['coal', 'oil', 'natural gas'] },
    { id: 'sunRenew', level: 2, q: 'Which one is a renewable resource, one we can keep replacing?', a: 'sunlight', wrong: ['coal', 'oil', 'natural gas'] },
  ],
  [{ skill: 'earthResources', level: 2 }],
)

export const science: Subject = {
  id: 'science',
  name: 'Science',
  emoji: '🔬',
  skills: [livingThings, plants, animals, ecosystems, weather, statesOfMatter, forces, forcesAdvanced, magnets, lightSound, earthResources, conservation],
}

// ============================================================================================
// SOCIAL STUDIES
// ============================================================================================

const community = factSkill(
  'community',
  ['Community helpers', 'More helpers in town'],
  [
    { id: 'fire', level: 1, q: 'Who puts out fires?', a: 'a firefighter', wrong: ['a doctor', 'a teacher', 'a mail carrier', 'a farmer'], emoji: '🚒' },
    { id: 'sick', level: 1, q: 'Who helps sick people feel better?', a: 'a doctor', wrong: ['a firefighter', 'a teacher', 'a mail carrier', 'a farmer'] },
    { id: 'teach', level: 1, q: 'Who teaches kids at school?', a: 'a teacher', wrong: ['a firefighter', 'a doctor', 'a farmer', 'a pilot'] },
    { id: 'mail', level: 1, q: 'Who delivers letters and packages?', a: 'a mail carrier', wrong: ['a firefighter', 'a doctor', 'a teacher', 'a baker'], emoji: '📬' },
    { id: 'food', level: 1, q: 'Who grows food on a farm?', a: 'a farmer', wrong: ['a firefighter', 'a doctor', 'a teacher', 'a mail carrier'] },
    { id: 'safe', level: 1, q: 'Who keeps our town safe and catches bad guys?', a: 'a police officer', wrong: ['a firefighter', 'a dentist', 'a baker'] },
    { id: 'pilot', level: 2, q: 'Who flies airplanes?', a: 'a pilot', wrong: ['a farmer', 'a baker', 'a dentist'], emoji: '✈️' },
    { id: 'bus', level: 2, q: 'Who drives a bus to take kids to school?', a: 'a bus driver', wrong: ['a pilot', 'a baker', 'a firefighter'] },
    { id: 'library', level: 2, q: 'Who helps you find books at the library?', a: 'a librarian', wrong: ['a pilot', 'a farmer', 'a baker'] },
    { id: 'hair', level: 2, q: 'Who cuts hair?', a: 'a barber', wrong: ['a pilot', 'a farmer', 'a mail carrier'] },
  ],
)

const symbols = factSkill(
  'symbols',
  ['National symbols', 'Buildings and landmarks', 'Monuments and famous places'],
  [
    { id: 'eagle', level: 1, q: 'What is the national bird of the United States?', a: 'the bald eagle', wrong: ['the robin', 'the owl', 'the parrot'] },
    { id: 'flagName', level: 1, q: 'What is the nickname of the American flag?', a: 'the Stars and Stripes', wrong: ['the Union Jack', 'the Maple Leaf', 'the Rising Sun'] },
    { id: 'stripes', level: 1, q: 'How many stripes are on the American flag?', a: '13', wrong: ['50', '12', '7'] },
    { id: 'liberty', level: 1, q: 'Where is the Statue of Liberty?', a: 'New York', wrong: ['Chicago', 'Texas', 'Washington, D.C.'] },
    { id: 'freedom', level: 1, q: 'What does the Statue of Liberty stand for?', a: 'freedom', wrong: ['money', 'trees', 'rain'] },
    { id: 'whiteHouse', level: 2, q: 'Who lives in the White House?', a: 'the President', wrong: ['the mayor', 'the principal', 'the governor'] },
    { id: 'capitol', level: 2, q: 'Which building in Washington, D.C. is where Congress meets?', a: 'the Capitol', wrong: ['the White House', 'the Empire State Building', 'the Eiffel Tower'] },
    { id: 'arch', level: 2, q: 'Which big arch is in St. Louis, Missouri?', a: 'the Gateway Arch', wrong: ['the Golden Gate Bridge', 'the Statue of Liberty', 'the Space Needle'] },
    { id: 'lincoln', level: 3, q: 'Which memorial in Washington, D.C. honors Abraham Lincoln?', a: 'the Lincoln Memorial', wrong: ['the Jefferson Memorial', 'the Gateway Arch', 'the Space Needle'] },
    { id: 'washington', level: 3, q: 'Which tall monument in Washington, D.C. honors George Washington?', a: 'the Washington Monument', wrong: ['the Gateway Arch', 'the Statue of Liberty', 'the Space Needle'] },
    { id: 'rushmore', level: 3, q: 'Which mountain carving shows four presidents?', a: 'Mount Rushmore', wrong: ['the Grand Canyon', 'the Gateway Arch', 'Niagara Falls'] },
  ],
)

const holidays = factSkill(
  'holidays',
  ['Holidays we celebrate', 'Why we celebrate', 'Holidays and what they honor'],
  [
    { id: 'birthday', level: 1, q: "Which holiday is our country's birthday?", a: 'Independence Day', wrong: ['Labor Day', 'Thanksgiving', 'Veterans Day'] },
    { id: 'halloween', level: 1, q: 'Which holiday has pumpkins and costumes?', a: 'Halloween', wrong: ["Valentine's Day", 'Easter', 'Labor Day'] },
    { id: 'valentine', level: 1, q: 'Which holiday has hearts and cards?', a: "Valentine's Day", wrong: ['Halloween', 'Easter', 'Labor Day'] },
    { id: 'easter', level: 1, q: 'Which holiday has the Easter Bunny?', a: 'Easter', wrong: ['Halloween', "Valentine's Day", 'Independence Day'] },
    { id: 'thanksgiving', level: 1, q: 'Which holiday is a big family meal in November?', a: 'Thanksgiving', wrong: ['Easter', "Valentine's Day", 'Independence Day'] },
    { id: 'veterans', level: 2, q: 'Which holiday honors people who served in the military?', a: 'Veterans Day', wrong: ['Labor Day', 'Halloween', "Valentine's Day"] },
    { id: 'labor', level: 2, q: 'Which holiday honors workers?', a: 'Labor Day', wrong: ['Veterans Day', 'Halloween', 'Easter'] },
    { id: 'mlk', level: 2, q: 'Which holiday honors Martin Luther King Jr.?', a: 'Martin Luther King Jr. Day', wrong: ['Veterans Day', 'Labor Day', "Presidents' Day"] },
    { id: 'presidents', level: 3, q: 'Which holiday honors the presidents?', a: "Presidents' Day", wrong: ['Labor Day', 'Memorial Day', 'Veterans Day'] },
    { id: 'memorial', level: 3, q: 'Which holiday in May honors people who died while serving in the military?', a: 'Memorial Day', wrong: ['Labor Day', "Presidents' Day", 'Halloween'] },
    { id: 'july4', level: 3, q: 'Which holiday celebrates the Declaration of Independence?', a: 'Independence Day', wrong: ['Memorial Day', 'Labor Day', "Presidents' Day"] },
  ],
)

const maps = factSkill(
  'maps',
  ['Directions', 'Map keys and titles', 'Between directions'],
  [
    { id: 'upNorth', level: 1, q: 'On most maps, which direction is up?', a: 'north', wrong: ['south', 'east', 'west'] },
    { id: 'southOpposite', level: 1, q: 'Which direction is the opposite of north?', a: 'south', wrong: ['east', 'west', 'northwest'] },
    { id: 'sunrise', level: 1, q: 'Which direction does the Sun rise?', a: 'east', wrong: ['west', 'south', 'north'] },
    { id: 'sunset', level: 1, q: 'Which direction does the Sun set?', a: 'west', wrong: ['east', 'north', 'south'] },
    { id: 'rightOfNorth', level: 1, q: 'If you face north, which direction is on your right?', a: 'east', wrong: ['west', 'south', 'north'] },
    { id: 'mapKey', level: 2, q: 'What does a map key tell you?', a: 'what the symbols mean', wrong: ['the name of the mapmaker', 'the date the map was made', 'the color of the paper'] },
    { id: 'compass', level: 2, q: 'What does a compass rose on a map show?', a: 'directions', wrong: ['the weather', 'the size of the town', 'how many trees'] },
    { id: 'mapTitle', level: 2, q: 'What does a map title tell you?', a: 'what the map is about', wrong: ['the weather today', 'how many people live there', 'the price of the map'] },
    { id: 'northeast', level: 3, q: 'Which direction is between north and east?', a: 'northeast', wrong: ['southwest', 'southeast', 'northwest'] },
    { id: 'southwest', level: 3, q: 'Which direction is between south and west?', a: 'southwest', wrong: ['northeast', 'southeast', 'northwest'] },
    { id: 'northwest', level: 3, q: 'Which direction is between north and west?', a: 'northwest', wrong: ['southeast', 'northeast', 'southwest'] },
  ],
)

const government = factSkill(
  'government',
  ['Rules and voting', 'Leaders and branches'],
  [
    { id: 'laws', level: 1, q: 'What do we call the rules everyone in a country must follow?', a: 'laws', wrong: ['recipes', 'songs', 'games'] },
    { id: 'voting', level: 1, q: 'What do we call choosing a leader by marking a ballot?', a: 'voting', wrong: ['sleeping', 'singing', 'cooking'] },
    { id: 'president', level: 2, q: 'Who is the leader of the United States?', a: 'the President', wrong: ['the mayor', 'the judge', 'the governor'] },
    { id: 'congress', level: 2, q: 'Which part of the government makes the laws?', a: 'Congress', wrong: ['the President', 'the judges', 'the police'] },
    { id: 'courts', level: 2, q: 'Which part of the government decides what laws mean?', a: 'the courts', wrong: ['Congress', 'the President', 'the army'] },
    { id: 'threeBranches', level: 2, q: 'How many branches does the United States government have?', a: '3', wrong: ['2', '4', '5'] },
  ],
)

const economics = factSkill(
  'economics',
  ['Needs and wants', 'Goods and services', 'Supply and demand'],
  [
    { id: 'needWater', level: 1, q: 'Which one is a need?', a: 'water', wrong: ['a video game', 'a new toy', 'candy'] },
    { id: 'needHome', level: 1, q: 'Which one is a need?', a: 'a home', wrong: ['a video game', 'a new toy', 'candy'] },
    { id: 'needFood', level: 1, q: 'Which one is a need?', a: 'food', wrong: ['a video game', 'a new toy', 'a bike'] },
    { id: 'wantToy', level: 1, q: 'Which one is a want, not a need?', a: 'a new toy', wrong: ['water', 'food', 'a home'] },
    { id: 'wantCandy', level: 1, q: 'Which one is a want, not a need?', a: 'candy', wrong: ['water', 'food', 'a home'] },
    { id: 'good', level: 2, q: 'Which one is a good, something you can hold?', a: 'a loaf of bread', wrong: ['a haircut', 'a dentist checkup', 'a car wash'] },
    { id: 'serviceHaircut', level: 2, q: 'Which one is a service, where someone does work for you?', a: 'a haircut', wrong: ['a bike', 'a book', 'an apple'] },
    { id: 'serviceDentist', level: 2, q: 'Which one is a service, where someone does work for you?', a: 'a dentist checkup', wrong: ['a bike', 'a book', 'an apple'] },
    { id: 'priceUp', level: 3, q: 'Many people want a toy, but there are only a few. What usually happens to the price?', a: 'it goes up', wrong: ['it goes down', 'it stays the same forever', 'it disappears'] },
    { id: 'priceDown', level: 3, q: 'Lots of toys are made, but few people want them. What usually happens to the price?', a: 'it goes down', wrong: ['it goes up', 'it stays the same forever', 'it disappears'] },
  ],
  [{ skill: 'government', level: 2 }],
)

const famousPeople = factSkill(
  'famousPeople',
  ['Famous Americans', 'Helpers in history'],
  [
    { id: 'washington', level: 1, q: 'Who was the first president of the United States?', a: 'George Washington', wrong: ['Abraham Lincoln', 'Thomas Jefferson', 'Benjamin Franklin'] },
    { id: 'lincoln', level: 1, q: 'Who led the United States during the Civil War?', a: 'Abraham Lincoln', wrong: ['George Washington', 'Thomas Jefferson', 'Benjamin Franklin'] },
    { id: 'mlk', level: 1, q: 'Who gave the famous "I Have a Dream" speech?', a: 'Martin Luther King Jr.', wrong: ['George Washington', 'Abraham Lincoln', 'Thomas Edison'] },
    { id: 'wright', level: 1, q: 'Who flew the first airplane?', a: 'the Wright brothers', wrong: ['Thomas Edison', 'Benjamin Franklin', 'George Washington'] },
    { id: 'parks', level: 2, q: 'Who refused to give up her bus seat in Montgomery, Alabama?', a: 'Rosa Parks', wrong: ['Harriet Tubman', 'Amelia Earhart', 'Sally Ride'] },
    { id: 'tubman', level: 2, q: 'Who helped many enslaved people escape on the Underground Railroad?', a: 'Harriet Tubman', wrong: ['Rosa Parks', 'Amelia Earhart', 'Sally Ride'] },
    { id: 'ride', level: 2, q: 'Who was the first American woman in space?', a: 'Sally Ride', wrong: ['Rosa Parks', 'Harriet Tubman', 'Amelia Earhart'] },
    { id: 'earhart', level: 2, q: 'Who was the first woman to fly solo across the Atlantic Ocean?', a: 'Amelia Earhart', wrong: ['Sally Ride', 'Rosa Parks', 'Harriet Tubman'] },
  ],
)

const timeline = factSkill(
  'timeline',
  ['What comes first', 'Then and now', 'Timelines'],
  [
    { id: 'wakeUp', level: 1, q: 'Which comes first in a morning: waking up or going to bed?', a: 'waking up', wrong: ['going to bed', 'eating dinner', 'turning out the lights'] },
    { id: 'sandwichLast', level: 1, q: 'What comes last when you make a sandwich?', a: 'eat it', wrong: ['spread the jelly', 'get out the bread', 'put the bread on the plate'] },
    { id: 'seedFirst', level: 1, q: 'When a plant grows, which comes first: a seed or a flower?', a: 'a seed', wrong: ['a flower', 'a fruit', 'a tall tree'] },
    { id: 'horse', level: 2, q: 'Long ago, what did people often ride to travel far?', a: 'a horse', wrong: ['an airplane', 'a helicopter', 'a spaceship'] },
    { id: 'telephone', level: 2, q: 'Which of these was invented first?', a: 'the telephone', wrong: ['the airplane', 'the smartphone', 'the television'] },
    { id: 'woodenTop', level: 2, q: 'Which is an older toy?', a: 'a wooden top', wrong: ['a video game', 'a tablet', 'a smartphone'] },
    { id: 'timelineDef', level: 3, q: 'What is a timeline?', a: 'a list of events in the order they happened', wrong: ['a list of animals', 'a map of the stars', 'a kind of cake'] },
    { id: 'finally', level: 3, q: 'Which word tells you the last thing that happened in a story?', a: 'finally', wrong: ['first', 'before', 'earlier'] },
  ],
)

const physicalGeography = factSkill(
  'physicalGeography',
  ['Land and water', 'Landforms'],
  [
    { id: 'desert', level: 1, q: 'Which place gets very little rain?', a: 'a desert', wrong: ['a rainforest', 'an ocean', 'a lake'] },
    { id: 'river', level: 1, q: 'Which one is a body of water that flows?', a: 'a river', wrong: ['a lake', 'a desert', 'a mountain'] },
    { id: 'mountain', level: 1, q: 'Which landform is very tall and rises high above the land?', a: 'a mountain', wrong: ['a valley', 'a desert', 'a river'] },
    { id: 'island', level: 2, q: 'Which landform has water all around it?', a: 'an island', wrong: ['a mountain', 'a desert', 'a valley'] },
    { id: 'plains', level: 2, q: 'Which landform is a large, flat area of grassland?', a: 'the plains', wrong: ['a canyon', 'a glacier', 'a volcano'] },
    { id: 'canyon', level: 2, q: 'Which landform is a deep valley with steep sides, carved by a river?', a: 'a canyon', wrong: ['an island', 'the plains', 'a mountain'] },
  ],
)

const earlyAmerica = factSkill(
  'earlyAmerica',
  ['Native homes', 'The 13 colonies', 'The Revolution', 'Early English colonies'],
  [
    { id: 'tipi', level: 1, q: 'What kind of home did many Plains peoples live in?', a: 'a tipi', wrong: ['an igloo', 'an adobe house', 'a longhouse'] },
    { id: 'igloo', level: 1, q: 'Which kind of home is made of snow blocks?', a: 'an igloo', wrong: ['a tipi', 'a longhouse', 'an adobe house'] },
    { id: 'thirteen', level: 2, q: 'How many original colonies became the first states?', a: '13', wrong: ['10', '12', '15'] },
    { id: 'penn', level: 2, q: 'Which colony did William Penn start?', a: 'Pennsylvania', wrong: ['Virginia', 'Georgia', 'New York'] },
    { id: 'britain', level: 3, q: 'Which country did the colonies fight for independence from?', a: 'Great Britain', wrong: ['Spain', 'France', 'Mexico'] },
    { id: 'declaration', level: 3, q: 'Which document declared independence in 1776?', a: 'the Declaration of Independence', wrong: ['the Constitution', 'the Bill of Rights', 'the Mayflower Compact'] },
    { id: 'washingtonArmy', level: 3, q: 'Who was the commander of the Continental Army?', a: 'George Washington', wrong: ['Thomas Edison', 'Abraham Lincoln', 'Benjamin Franklin'] },
    { id: 'pilgrims', level: 4, q: 'Which group sailed on the Mayflower to Plymouth in 1620?', a: 'the Pilgrims', wrong: ['the Vikings', 'the Spanish explorers', 'the French trappers'] },
    { id: 'jamestown', level: 4, q: 'What was Jamestown?', a: 'the first permanent English colony', wrong: ['a Spanish mission', 'a French fort', 'a Dutch trading post'] },
  ],
  [{ skill: 'famousPeople', level: 2 }],
)

export const socialStudies: Subject = {
  id: 'social',
  name: 'Social Studies',
  emoji: '🗺️',
  skills: [community, symbols, holidays, maps, government, economics, famousPeople, timeline, physicalGeography, earlyAmerica],
}

// ============================================================================================
// IXL: which IXL topic each level practices (index 0 = level 1).
// ============================================================================================

const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })
const soc = (grade: number, category: string): IxlRef => ({ subject: 'social-studies', grade, category })

export const SCIENCE_SOCIAL_IXL: Record<string, IxlRef[]> = {
  'science.livingThings': [sci(0, 'Living things'), sci(1, 'Living things')],
  'science.plants': [sci(0, 'Plants'), sci(1, 'Plants'), sci(2, 'Plants')],
  'science.animals': [sci(0, 'Animals'), sci(1, 'Animals'), sci(2, 'Animals')],
  'science.ecosystems': [sci(0, 'Ecosystems'), sci(1, 'Ecosystems'), sci(2, 'Ecosystems')],
  'science.weather': [sci(0, 'Weather'), sci(1, 'Weather'), sci(2, 'Weather')],
  'science.statesOfMatter': [sci(0, 'States of matter'), sci(1, 'States of matter'), sci(2, 'Changes of state')],
  'science.forces': [sci(0, 'Force and motion'), sci(1, 'Force and motion')],
  'science.forcesAdvanced': [sci(3, 'Force and motion'), sci(3, 'Force and motion')],
  'science.magnets': [sci(2, 'Magnets'), sci(2, 'Magnets')],
  'science.lightSound': [sci(0, 'Light and sound'), sci(1, 'Light and sound')],
  'science.earthResources': [sci(0, "Earth's resources"), sci(1, 'Human impacts')],
  'science.conservation': [sci(4, 'Conservation and natural resources'), sci(5, 'Conservation and natural resources')],

  'social.community': [soc(0, 'Community'), soc(1, 'Community')],
  'social.symbols': [soc(0, 'American symbols and landmarks'), soc(1, 'American symbols and landmarks'), soc(2, 'American symbols, landmarks, and monuments')],
  'social.holidays': [soc(0, 'Read along about holidays'), soc(1, 'Read along about holidays'), soc(2, 'Read about holidays')],
  'social.maps': [soc(0, 'Maps'), soc(1, 'Maps'), soc(2, 'Read maps')],
  'social.government': [soc(1, 'Civics'), soc(2, 'Government')],
  'social.economics': [soc(0, 'Economics'), soc(3, 'Basic economic principles'), soc(3, 'Supply and demand')],
  'social.famousPeople': [soc(0, 'Read along about famous people'), soc(2, 'Read about historical figures')],
  'social.timeline': [soc(0, 'Order events'), soc(1, 'Then and now'), soc(2, 'Chronology and causation')],
  'social.physicalGeography': [soc(0, 'Physical geography'), soc(2, 'Physical geography')],
  'social.earlyAmerica': [soc(4, 'Native peoples of North America'), soc(4, 'The Thirteen Colonies'), soc(4, 'The American Revolution'), soc(5, 'Early English colonies in North America')],
}
