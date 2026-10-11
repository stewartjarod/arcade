import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { upToLevel, wrongFrom } from './util'

/**
 * The last IXL science categories that had no practice yet: grade 2 physical and chemical change
 * and mixtures, grade 3 animals, grade 4 ecosystems, and grade 5 animals, ecosystems, and fossils.
 * Every question is a multiple-choice fact from a hand-checked list; wrong answers are listed per fact
 * and never count as right.
 * Skill ids here must not collide with scienceSocial.ts, scienceSocialMore.ts, scienceSocialUpper.ts,
 * scienceSocialRound3.ts, scienceSocialRound4.ts, or scienceSocialRound5.ts.
 */

interface Fact {
  /** Unique inside its skill. It becomes part of the item key, so never rename it. */
  id: string
  /** The first level this fact shows up at (1 = the first level). */
  level: number
  q: string
  a: string
  /** Believable wrong answers from the same kind of thing. At least 3, none of them correct. */
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
function factSkill(id: string, labels: string[], facts: Fact[], unlocksAfter: { skill: string; level: number }[] = []): Skill {
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: labels.length,
    formats: ['choice'],
    ...(unlocksAfter.length ? { unlocksAfter } : {}),
    generate: (L) => factItem(id, upToLevel(facts, L)),
    fromKey: (key) => {
      const f = facts.find((x) => `${id}:${x.id}` === key)
      return f ? factItem(id, f) : null
    },
  }
}

// ============================================================================================
// GRADE 2
// ============================================================================================

// Physical and chemical change. A physical change keeps the same kind of stuff; a chemical change makes new stuff.
const physicalOrChemical = factSkill(
  'physicalOrChemical',
  ['Identify physical changes', 'Identify chemical changes', 'Identify physical and chemical changes'],
  [
    // Level 1: physical changes. The stuff is still the same kind of stuff afterward.
    { id: 'tearPaper', level: 1, q: 'Which one is a physical change?', a: 'tearing a piece of paper', wrong: ['burning a log', 'rusting a nail', 'baking a cake'] },
    { id: 'meltIce', level: 1, q: 'Which one is a physical change?', a: 'melting an ice cube', wrong: ['cooking an egg', 'rusting a bike', 'burning a match'] },
    { id: 'crushCan', level: 1, q: 'Which one is a physical change?', a: 'crushing a soda can', wrong: ['baking bread', 'burning wood', 'rusting iron'] },
    { id: 'dissolveSugar', level: 1, q: 'Which one is a physical change?', a: 'dissolving sugar in water', wrong: ['cooking an egg', 'burning a candle', 'baking a cake'] },
    { id: 'cutBoard', level: 1, q: 'Which one is a physical change?', a: 'cutting a board in two', wrong: ['frying an egg', 'burning paper', 'rusting a fence'] },
    { id: 'boilWater', level: 1, q: 'Which one is a physical change?', a: 'boiling water into steam', wrong: ['baking bread', 'burning a log', 'rusting iron'] },
    { id: 'stretchBand', level: 1, q: 'Which one is a physical change?', a: 'stretching a rubber band', wrong: ['cooking spaghetti', 'burning a candle', 'baking a cake'] },
    { id: 'foldPaper', level: 1, q: 'Which one is a physical change?', a: 'folding a paper airplane', wrong: ['rusting a bike', 'toasting bread', 'burning paper'] },
    // Level 2: chemical changes. Something new is made, and it can't be undone by just cooling or stretching it.
    { id: 'burnLog', level: 2, q: 'Which one is a chemical change?', a: 'burning a log', wrong: ['tearing a piece of paper', 'melting an ice cube', 'crushing a soda can'] },
    { id: 'bakeCake', level: 2, q: 'Which one is a chemical change?', a: 'baking a cake', wrong: ['cutting a board in two', 'dissolving sugar in water', 'stretching a rubber band'] },
    { id: 'rustNail', level: 2, q: 'Which one is a chemical change?', a: 'rusting an iron nail', wrong: ['boiling water into steam', 'folding a paper airplane', 'melting an ice cube'] },
    { id: 'cookEgg', level: 2, q: 'Which one is a chemical change?', a: 'cooking an egg', wrong: ['tearing a piece of paper', 'crushing a soda can', 'dissolving sugar in water'] },
    { id: 'burnCandle', level: 2, q: 'Which one is a chemical change?', a: 'burning a candle', wrong: ['stretching a rubber band', 'cutting a board in two', 'boiling water into steam'] },
    { id: 'fizz', level: 2, q: 'Which one is a chemical change?', a: 'baking soda fizzing in vinegar', wrong: ['folding a paper airplane', 'melting an ice cube', 'bending a paper clip'] },
    { id: 'firework', level: 2, q: 'Which one is a chemical change?', a: 'a firework exploding in the sky', wrong: ['a ball bouncing', 'a glass breaking', 'an ice cube melting'] },
    { id: 'toast', level: 2, q: 'Which one is a chemical change?', a: 'toasting bread', wrong: ['tearing a napkin', 'shaking salt from a jar', 'bending a straw'] },
    // Level 3: name the kind of change for a whole sentence.
    { id: 'butterMelt', level: 3, q: 'What kind of change is melting butter in a pan?', a: 'a physical change', wrong: ['a chemical change', 'a mixture', 'a new substance'] },
    { id: 'bikeRust', level: 3, q: 'What kind of change is a bike getting rusty?', a: 'a chemical change', wrong: ['a physical change', 'a mixture', 'a change in shape'] },
    { id: 'campfire', level: 3, q: 'What kind of change is a campfire burning wood?', a: 'a chemical change', wrong: ['a physical change', 'a mixture', 'a change in shape'] },
    { id: 'sawBoard', level: 3, q: 'What kind of change is sawing a board in half?', a: 'a physical change', wrong: ['a chemical change', 'a mixture', 'a new substance'] },
    { id: 'balloonAir', level: 3, q: 'What kind of change is a balloon filling with air?', a: 'a physical change', wrong: ['a chemical change', 'a mixture', 'a new substance'] },
    { id: 'breadBake', level: 3, q: 'What kind of change is bread baking in the oven?', a: 'a chemical change', wrong: ['a physical change', 'a mixture', 'a change in shape'] },
    { id: 'frostMelt', level: 3, q: 'What kind of change is frost melting off a window?', a: 'a physical change', wrong: ['a chemical change', 'a mixture', 'a new substance'] },
    { id: 'spoonBlack', level: 3, q: 'What kind of change is a silver spoon turning black?', a: 'a chemical change', wrong: ['a physical change', 'a mixture', 'a change in shape'] },
  ],
)

// Mixtures: two or more things mixed together but not joined, so you can usually pull them apart.
const mixturesEarly = factSkill(
  'mixturesEarly',
  ['Identify mixtures', 'Separate mixtures', 'Mixtures and solutions'],
  [
    // Level 1: which one is a mixture? The wrong ones are single kinds of stuff.
    { id: 'cerealMilk', level: 1, q: 'Which one is a mixture?', a: 'cereal with milk', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'sandWaterMix', level: 1, q: 'Which one is a mixture?', a: 'sand mixed with water', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'trailMix', level: 1, q: 'Which one is a mixture?', a: 'trail mix', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'fruitSalad', level: 1, q: 'Which one is a mixture?', a: 'a fruit salad', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'lemonade', level: 1, q: 'Which one is a mixture?', a: 'lemonade', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'soup', level: 1, q: 'Which one is a mixture?', a: 'a bowl of chicken noodle soup', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'pebbleSand', level: 1, q: 'Which one is a mixture?', a: 'a handful of pebbles and sand', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    { id: 'granola', level: 1, q: 'Which one is a mixture?', a: 'a bowl of granola', wrong: ['a block of ice', 'a bottle of plain water', 'a bag of white sugar'] },
    // Level 2: how to pull a mixture apart.
    { id: 'ironSand', level: 2, q: 'How can you pull iron filings out of sand?', a: 'use a magnet', wrong: ['use a hammer', 'add more sand', 'shake the bowl hard'] },
    { id: 'saltWater', level: 2, q: 'How can you get the salt back out of salt water?', a: 'let the water evaporate', wrong: ['use a magnet', 'use a hammer', 'shake the bowl hard'] },
    { id: 'pasta', level: 2, q: 'How do you get the pasta out of the boiling water?', a: 'pour it through a strainer', wrong: ['use a magnet', 'use a hammer', 'shake the bowl hard'] },
    { id: 'pebblesSand', level: 2, q: 'How do you take the pebbles out of a bowl of sand?', a: 'shake it through a sieve', wrong: ['use a magnet', 'use a hammer', 'let it evaporate'] },
    { id: 'beans', level: 2, q: 'How can you sort red beans from white beans?', a: 'pick out the red ones by hand', wrong: ['use a magnet', 'let them evaporate', 'boil them in water'] },
    { id: 'sandWater', level: 2, q: 'How do you separate sand from water?', a: 'let the sand settle, then pour off the water', wrong: ['use a magnet', 'use a hammer', 'shake the bowl hard'] },
    { id: 'coffee', level: 2, q: 'How do you keep the coffee grounds out of your coffee?', a: 'use a paper filter', wrong: ['use a magnet', 'use a hammer', 'shake the bowl hard'] },
    { id: 'paperClips', level: 2, q: 'How can you pull paper clips out of a pile of paper?', a: 'use a magnet', wrong: ['use a hammer', 'add more paper', 'shake the pile hard'] },
    // Level 3: solutions and a few famous mixtures.
    { id: 'solution', level: 3, q: 'What do we call a mixture where one thing dissolves into another, like salt in water?', a: 'a solution', wrong: ['a suspension', 'a compound', 'an element'] },
    { id: 'solvent', level: 3, q: 'What is the substance that does the dissolving in a solution called?', a: 'a solvent', wrong: ['a solute', 'a crystal', 'a filter'] },
    { id: 'solute', level: 3, q: 'What is the substance that gets dissolved in a solution called?', a: 'a solute', wrong: ['a solvent', 'a crystal', 'a filter'] },
    { id: 'muddy', level: 3, q: 'Muddy water has mud that falls to the bottom. What is this kind of mixture called?', a: 'a suspension', wrong: ['a solution', 'a compound', 'an element'] },
    { id: 'air', level: 3, q: 'Air is a mixture. Which gas makes up most of the air?', a: 'nitrogen', wrong: ['oxygen', 'carbon dioxide', 'helium'] },
    { id: 'alloy', level: 3, q: 'What do we call a mixture of two or more metals?', a: 'an alloy', wrong: ['a compound', 'a gas', 'a crystal'] },
    { id: 'solutionExample', level: 3, q: 'Which one is a solution?', a: 'sugar dissolved in water', wrong: ['sand mixed with water', 'cereal in milk', 'gravel and sand'] },
    { id: 'notMixture', level: 3, q: 'Which one is NOT a mixture?', a: 'a block of ice', wrong: ['trail mix', 'a bowl of soup', 'sand and water'] },
  ],
)

// ============================================================================================
// GRADE 3
// ============================================================================================

// Animal life cycle stages, read from diagrams, put in order, and compared between animals.
const lifeStages = factSkill(
  'lifeStages',
  ['Read animal life cycle diagrams', 'Put life cycle stages in order', "Compare stages of an animal's life cycle"],
  [
    // Level 1: read a diagram. What comes next?
    { id: 'mosquitoEgg', level: 1, q: "In a mosquito's life cycle, what comes right after the egg?", a: 'a larva', wrong: ['a pupa', 'an adult mosquito', 'a nymph'], emoji: '🦟' },
    { id: 'mosquitoPupa', level: 1, q: "What comes right after the larva in a mosquito's life cycle?", a: 'a pupa', wrong: ['an egg', 'a nymph', 'an adult mosquito'], emoji: '🦟' },
    { id: 'ladybugHatch', level: 1, q: "In a ladybug's life cycle, what hatches from the egg?", a: 'a larva', wrong: ['a pupa', 'a tadpole', 'a chick'], emoji: '🐞' },
    { id: 'grasshopperHatch', level: 1, q: "What hatches from a grasshopper's egg?", a: 'a nymph', wrong: ['a tadpole', 'a caterpillar', 'a chick'], emoji: '🦗' },
    { id: 'chickenHatch', level: 1, q: "What hatches from a chicken's egg?", a: 'a chick', wrong: ['a tadpole', 'a caterpillar', 'a nymph'], emoji: '🐥' },
    { id: 'turtleHatch', level: 1, q: "What hatches from a sea turtle's egg?", a: 'a hatchling', wrong: ['a tadpole', 'a larva', 'a froglet'], emoji: '🐢' },
    { id: 'humanStart', level: 1, q: 'What is the first stage of a human life cycle?', a: 'a baby', wrong: ['a teenager', 'an adult', 'a child'] },
    { id: 'frogLast', level: 1, q: "What is the last stage of a frog's life cycle?", a: 'an adult frog', wrong: ['a tadpole', 'a froglet', 'an egg'], emoji: '🐸' },
    // Level 2: put a whole life cycle in order. The wrong orders are shuffled versions of the same stages.
    { id: 'frogOrder', level: 2, q: "Put a frog's life stages in order.", a: 'egg, tadpole, froglet, adult frog', wrong: ['egg, froglet, tadpole, adult frog', 'tadpole, egg, adult frog, froglet', 'adult frog, tadpole, froglet, egg'] },
    { id: 'butterflyOrder', level: 2, q: "Put a butterfly's life stages in order.", a: 'egg, caterpillar, chrysalis, adult butterfly', wrong: ['egg, chrysalis, caterpillar, adult butterfly', 'caterpillar, egg, chrysalis, adult butterfly', 'adult butterfly, chrysalis, caterpillar, egg'] },
    { id: 'mosquitoOrder', level: 2, q: "Put a mosquito's life stages in order.", a: 'egg, larva, pupa, adult mosquito', wrong: ['egg, pupa, larva, adult mosquito', 'larva, egg, pupa, adult mosquito', 'adult mosquito, pupa, larva, egg'] },
    { id: 'grasshopperOrder', level: 2, q: "Put a grasshopper's life stages in order.", a: 'egg, nymph, adult grasshopper', wrong: ['egg, adult grasshopper, nymph', 'nymph, egg, adult grasshopper', 'adult grasshopper, nymph, egg'] },
    { id: 'chickenOrder', level: 2, q: "Put a chicken's life stages in order.", a: 'egg, chick, adult chicken', wrong: ['chick, egg, adult chicken', 'adult chicken, chick, egg', 'egg, adult chicken, chick'] },
    { id: 'humanOrder', level: 2, q: "Put a human's life stages in order.", a: 'baby, child, teenager, adult', wrong: ['adult, teenager, child, baby', 'child, baby, adult, teenager', 'baby, adult, child, teenager'] },
    { id: 'ladybugOrder', level: 2, q: "Put a ladybug's life stages in order.", a: 'egg, larva, pupa, adult ladybug', wrong: ['larva, egg, adult ladybug, pupa', 'egg, pupa, larva, adult ladybug', 'adult ladybug, pupa, larva, egg'] },
    { id: 'turtleOrder', level: 2, q: "Put a sea turtle's life stages in order.", a: 'egg, hatchling, juvenile, adult turtle', wrong: ['hatchling, egg, adult turtle, juvenile', 'egg, adult turtle, juvenile, hatchling', 'adult turtle, juvenile, hatchling, egg'] },
    // Level 3: compare animals and their stages.
    { id: 'mothPupa', level: 3, q: 'Which animal goes through a pupa stage?', a: 'a moth', wrong: ['a frog', 'a chicken', 'a human'], emoji: '🦋' },
    { id: 'frogNoPupa', level: 3, q: 'Which animal does NOT have a pupa stage?', a: 'a frog', wrong: ['a butterfly', 'a ladybug', 'a mosquito'], emoji: '🐸' },
    { id: 'nymphGrasshopper', level: 3, q: "Which animal's young is called a nymph?", a: 'a grasshopper', wrong: ['a butterfly', 'a mosquito', 'a frog'], emoji: '🦗' },
    { id: 'butterflyChange', level: 3, q: 'Which animal changes from a caterpillar into an adult?', a: 'a butterfly', wrong: ['a frog', 'a chicken', 'a grasshopper'], emoji: '🦋' },
    { id: 'sharedEgg', level: 3, q: 'What stage do a frog and a butterfly both start with?', a: 'an egg', wrong: ['a tadpole', 'a caterpillar', 'a chick'] },
    { id: 'humanTeen', level: 3, q: 'Which stage comes after a child in a human life cycle?', a: 'a teenager', wrong: ['a baby', 'an egg', 'a pupa'] },
    { id: 'frogWater', level: 3, q: "Which animal's eggs are laid in water?", a: 'a frog', wrong: ['a chicken', 'a butterfly', 'a human'], emoji: '🐸' },
    { id: 'butterflyYoung', level: 3, q: 'What do we call the young of a butterfly?', a: 'a caterpillar', wrong: ['a nymph', 'a tadpole', 'a chick'], emoji: '🐛' },
  ],
  [{ skill: 'animals', level: 2 }],
)

// ============================================================================================
// GRADE 4
// ============================================================================================

// Ecosystems in more detail: the living and nonliving parts, and where matter and energy go in a food chain.
const ecosystemLife = factSkill(
  'ecosystemLife',
  ['Identify ecosystems', 'Describe ecosystems', 'Roles in food chains'],
  [
    // Level 1: which one is an ecosystem? The wrong ones are objects, not places with living and nonliving parts.
    { id: 'coralReef', level: 1, q: 'Which one is an ecosystem?', a: 'a coral reef', wrong: ['a bicycle', 'a toaster', 'a dictionary'] },
    { id: 'pond', level: 1, q: 'Which one is an ecosystem?', a: 'a pond', wrong: ['a bicycle', 'a pencil', 'a dictionary'] },
    { id: 'desert', level: 1, q: 'Which one is an ecosystem?', a: 'a desert', wrong: ['a toaster', 'a pencil', 'a dictionary'] },
    { id: 'rainForest', level: 1, q: 'Which one is an ecosystem?', a: 'a rain forest', wrong: ['a bicycle', 'a toaster', 'a pencil'] },
    { id: 'tidePool', level: 1, q: 'Which one is an ecosystem?', a: 'a tide pool', wrong: ['a dictionary', 'a pencil', 'a toaster'] },
    { id: 'grassland', level: 1, q: 'Which one is an ecosystem?', a: 'a grassland', wrong: ['a bicycle', 'a dictionary', 'a pencil'] },
    { id: 'saltMarsh', level: 1, q: 'Which one is an ecosystem?', a: 'a salt marsh', wrong: ['a toaster', 'a bicycle', 'a dictionary'] },
    { id: 'meadow', level: 1, q: 'Which one is an ecosystem?', a: 'a mountain meadow', wrong: ['a pencil', 'a toaster', 'a bicycle'] },
    // Level 2: the nonliving and living parts of an ecosystem.
    { id: 'forestSoil', level: 2, q: 'Which part of a forest ecosystem is nonliving?', a: 'the soil', wrong: ['oak trees', 'deer', 'mushrooms'] },
    { id: 'pondWater', level: 2, q: 'Which part of a pond ecosystem is nonliving?', a: 'the water', wrong: ['frogs', 'algae', 'snails'] },
    { id: 'desertSand', level: 2, q: 'Which part of a desert ecosystem is nonliving?', a: 'the sand', wrong: ['cacti', 'lizards', 'beetles'] },
    { id: 'reefSun', level: 2, q: 'Which part of a coral reef ecosystem is nonliving?', a: 'sunlight', wrong: ['the coral', 'parrotfish', 'sea stars'] },
    { id: 'grasslandRain', level: 2, q: 'Which part of a grassland ecosystem is nonliving?', a: 'rain', wrong: ['prairie grass', 'bison', 'prairie dogs'] },
    { id: 'tideSeawater', level: 2, q: 'Which part of a tide pool ecosystem is nonliving?', a: 'the seawater', wrong: ['sea stars', 'anemones', 'crabs'] },
    { id: 'pondSnail', level: 2, q: 'Which one is a living part of a pond ecosystem?', a: 'a snail', wrong: ['the water', 'the rocks', 'the air'] },
    { id: 'forestAir', level: 2, q: 'Which one is a nonliving part of a forest ecosystem?', a: 'the air', wrong: ['a squirrel', 'a fern', 'a fungus'] },
    // Level 3: roles in food chains, and how matter and energy move.
    { id: 'producer', level: 3, q: 'Which one is a producer?', a: 'grass', wrong: ['a rabbit', 'a hawk', 'a mushroom'] },
    { id: 'decomposer', level: 3, q: 'Which one is a decomposer?', a: 'a mushroom', wrong: ['a rabbit', 'a tree', 'a snake'] },
    { id: 'plantEater', level: 3, q: 'Which one eats only plants in a food chain?', a: 'a grasshopper', wrong: ['a hawk', 'a snake', 'a frog'] },
    { id: 'mouseConsumer', level: 3, q: 'In the food chain grass, mouse, hawk, what is the mouse?', a: 'a consumer', wrong: ['a producer', 'a decomposer', 'the Sun'] },
    { id: 'energyStart', level: 3, q: 'Where does the energy in a food chain start?', a: 'the Sun', wrong: ['the soil', 'the ocean', 'the wind'] },
    { id: 'matterMoves', level: 3, q: 'How does matter move through a food chain?', a: 'as food, from one living thing to the next', wrong: ['as sound, from one animal to another', 'as light, from the Sun to the soil', 'as heat, from the soil to the air'] },
    { id: 'decompSoil', level: 3, q: 'What do decomposers put back into the soil?', a: 'nutrients', wrong: ['sunlight', 'rocks', 'lightning'] },
    { id: 'hawkPredator', level: 3, q: 'Which one is a predator?', a: 'a hawk', wrong: ['a grass plant', 'a mushroom', 'a tree'] },
  ],
  [{ skill: 'ecosystems', level: 2 }],
)

// ============================================================================================
// GRADE 5
// ============================================================================================

// The body systems that move food, blood, and air around. Gated behind the grade 4 animals skill.
const bodySystems = factSkill(
  'bodySystems',
  ['Human organs and their functions', 'Body systems: circulation', 'Body systems: respiration'],
  [
    // Level 1: what each organ does.
    { id: 'heart', level: 1, q: 'What is the main job of the heart?', a: 'to pump blood around the body', wrong: ['to break down food', 'to help us smell', 'to make new bones'], emoji: '🫀' },
    { id: 'lungs', level: 1, q: 'What do the lungs do?', a: 'take in oxygen and let out carbon dioxide', wrong: ['pump blood around the body', 'break down food', 'help us hear'], emoji: '🫁' },
    { id: 'stomach', level: 1, q: 'What does the stomach do?', a: 'break down food with strong acid', wrong: ['filter waste from the blood', 'help us see', 'pump blood to the lungs'] },
    { id: 'brain', level: 1, q: "What is the brain's main job?", a: 'control the body and let us think', wrong: ['pump blood', 'break down food', 'store water'], emoji: '🧠' },
    { id: 'kidneys', level: 1, q: 'What do the kidneys do?', a: 'filter waste out of the blood', wrong: ['pump blood around the body', 'help us hear', 'store the food we eat'] },
    { id: 'skin', level: 1, q: 'What is the largest organ of the human body?', a: 'the skin', wrong: ['the liver', 'the heart', 'the brain'] },
    { id: 'eyes', level: 1, q: 'Which organs help us see?', a: 'the eyes', wrong: ['the ears', 'the nose', 'the tongue'], emoji: '👀' },
    { id: 'smallIntestine', level: 1, q: 'Where is most food absorbed into the blood?', a: 'the small intestine', wrong: ['the stomach', 'the mouth', 'the large intestine'] },
    // Level 2: circulation, the blood and the blood vessels.
    { id: 'arteries', level: 2, q: 'Which blood vessels carry blood away from the heart?', a: 'arteries', wrong: ['veins', 'capillaries', 'nerves'], emoji: '🩸' },
    { id: 'veins', level: 2, q: 'Which blood vessels carry blood back to the heart?', a: 'veins', wrong: ['arteries', 'nerves', 'bones'], emoji: '🩸' },
    { id: 'redCells', level: 2, q: 'Which blood cells carry oxygen?', a: 'red blood cells', wrong: ['white blood cells', 'platelets', 'nerve cells'], emoji: '🩸' },
    { id: 'whiteCells', level: 2, q: 'What do white blood cells help the body do?', a: 'fight germs', wrong: ['carry oxygen', 'help blood clot', 'carry food'] },
    { id: 'platelets', level: 2, q: 'Which blood part helps stop bleeding by clotting?', a: 'platelets', wrong: ['red blood cells', 'white blood cells', 'nerve cells'] },
    { id: 'plasma', level: 2, q: 'What is the liquid part of blood called?', a: 'plasma', wrong: ['platelets', 'red blood cells', 'white blood cells'] },
    { id: 'leftVentricle', level: 2, q: 'Which heart chamber pumps blood to the whole body?', a: 'the left ventricle', wrong: ['the right ventricle', 'the right atrium', 'the left atrium'] },
    { id: 'capillaries', level: 2, q: 'Which tiny blood vessels let food and oxygen pass into body cells?', a: 'capillaries', wrong: ['arteries', 'veins', 'nerves'] },
    // Level 3: respiration, breathing, and the systems that do it.
    { id: 'oxygenNeed', level: 3, q: 'Which gas do our bodies need to live?', a: 'oxygen', wrong: ['carbon dioxide', 'helium', 'neon'] },
    { id: 'co2Out', level: 3, q: 'Which waste gas do we breathe out?', a: 'carbon dioxide', wrong: ['oxygen', 'helium', 'neon'] },
    { id: 'trachea', level: 3, q: 'What is the windpipe called?', a: 'the trachea', wrong: ['the alveoli', 'the bronchi', 'the esophagus'] },
    { id: 'alveoli', level: 3, q: 'Where does oxygen pass into the blood inside the lungs?', a: 'the alveoli', wrong: ['the trachea', 'the diaphragm', 'the stomach'] },
    { id: 'diaphragm', level: 3, q: 'Which muscle under the lungs helps us breathe in?', a: 'the diaphragm', wrong: ['the biceps', 'the stomach', 'the bladder'] },
    { id: 'bloodCarry', level: 3, q: 'What carries oxygen from the lungs around the body?', a: 'the blood', wrong: ['the stomach', 'the skin', 'the bones'] },
    { id: 'respSystem', level: 3, q: 'Which body system brings in oxygen and sends out carbon dioxide?', a: 'the respiratory system', wrong: ['the digestive system', 'the nervous system', 'the skeletal system'] },
    { id: 'circSystem', level: 3, q: 'Which body system moves blood around the body?', a: 'the circulatory system', wrong: ['the digestive system', 'the nervous system', 'the muscular system'] },
  ],
  [{ skill: 'lifeCycles', level: 2 }],
)

// Food webs: reading them, the energy and matter that move through them, and what happens when parts change.
const foodWebs = factSkill(
  'foodWebs',
  ['Read food webs', 'Energy and matter in food webs', 'Ecosystem balance'],
  [
    // Level 1: read a food web.
    { id: 'arrowDir', level: 1, q: 'In a food web, an arrow points from what to what?', a: 'from the food to the one that eats it', wrong: ['from the eater to its food', 'from the Sun to the soil', 'from the rocks to the water'] },
    { id: 'producers', level: 1, q: 'What do we call the plants and algae at the bottom of a food web?', a: 'producers', wrong: ['consumers', 'decomposers', 'predators'] },
    { id: 'deerHerbivore', level: 1, q: 'Which animal in a food web eats only plants?', a: 'a deer', wrong: ['a hawk', 'a wolf', 'a snake'] },
    { id: 'carnivore', level: 1, q: 'What do we call an animal that eats only other animals?', a: 'a carnivore', wrong: ['a herbivore', 'an omnivore', 'a producer'] },
    { id: 'omnivore', level: 1, q: 'What do we call an animal that eats both plants and animals?', a: 'an omnivore', wrong: ['a herbivore', 'a carnivore', 'a decomposer'] },
    { id: 'decompBacteria', level: 1, q: 'Which living things break down dead matter in a food web?', a: 'bacteria and fungi', wrong: ['grass', 'deer', 'hawks'] },
    { id: 'webMade', level: 1, q: 'What is a food web made of?', a: 'many food chains linked together', wrong: ['one long line of animals', 'only plants', 'one predator and its prey'] },
    { id: 'chainOrder', level: 1, q: 'Which list is in the right order for a food chain?', a: 'grass, rabbit, fox', wrong: ['fox, rabbit, grass', 'rabbit, grass, fox', 'fox, grass, rabbit'] },
    // Level 2: energy and matter.
    { id: 'sunEnergy', level: 2, q: 'Where does almost all the energy in a food web come from?', a: 'the Sun', wrong: ['the soil', 'the ocean', 'the wind'] },
    { id: 'lessEnergy', level: 2, q: 'Why is there less energy at the top of a food web?', a: 'energy is lost as heat at each step', wrong: ['top animals are bigger', 'plants make less energy', 'top animals never eat'] },
    { id: 'preyGrow', level: 2, q: 'If a predator is removed from a food web, what can happen to its prey?', a: 'their numbers can grow', wrong: ['they disappear from Earth', 'they stop eating', 'they become predators'] },
    { id: 'nutrients', level: 2, q: 'What do decomposers return to the soil?', a: 'nutrients', wrong: ['sunlight', 'rocks', 'lightning'] },
    { id: 'plantGas', level: 2, q: 'Which gas do plants take in to make their food?', a: 'carbon dioxide', wrong: ['helium', 'neon', 'hydrogen'] },
    { id: 'plantRelease', level: 2, q: 'Which gas do plants release when they make food?', a: 'oxygen', wrong: ['helium', 'neon', 'nitrogen'] },
    { id: 'sugarFood', level: 2, q: 'What do plants make from sunlight, water, and air?', a: 'sugar, a kind of food', wrong: ['salt', 'rocks', 'metal'] },
    { id: 'decompNeed', level: 2, q: 'Why do most ecosystems need decomposers?', a: 'to return nutrients to the soil', wrong: ['to make rain', 'to pollinate flowers', 'to make the wind blow'] },
    // Level 3: places and balance.
    { id: 'speciesRemoved', level: 3, q: 'What can happen when one species is removed from a food web?', a: 'the food web can be thrown off balance', wrong: ['nothing ever changes', 'the Sun gets hotter', 'the rocks grow'] },
    { id: 'community', level: 3, q: 'What do we call a group of different living things in one area?', a: 'a community', wrong: ['a population', 'a habitat', 'a single species'] },
    { id: 'estuary', level: 3, q: 'Where does a river meet the ocean and mix fresh and salt water?', a: 'an estuary', wrong: ['a desert', 'a tundra', 'a rain forest'] },
    { id: 'desertLeast', level: 3, q: 'Which biome gets the least rain?', a: 'a desert', wrong: ['a rain forest', 'a wetland', 'a grassland'] },
    { id: 'tundra', level: 3, q: 'Which cold biome has very few trees?', a: 'the tundra', wrong: ['the taiga', 'the savanna', 'the desert'] },
    { id: 'reef', level: 3, q: 'Which ocean ecosystem is built by tiny animals and has many colorful fish?', a: 'a coral reef', wrong: ['a tundra', 'a desert', 'a grassland'] },
    { id: 'wetland', level: 3, q: 'Which ecosystem is often covered with water and full of cattails?', a: 'a wetland', wrong: ['a desert', 'a tundra', 'a coral reef'] },
    { id: 'biome', level: 3, q: 'What is a biome?', a: 'a large region with a similar climate', wrong: ['a single animal species', 'a kind of rock', 'a type of cloud'] },
  ],
  [{ skill: 'ecosystemRoles', level: 2 }],
)

// Fossils: what they show, how to tell body fossils from trace fossils, and how they compare to living things.
const fossilEvidence = factSkill(
  'fossilEvidence',
  ['Introduction to fossils', 'Identify and classify fossils', 'Compare fossils to modern organisms'],
  [
    // Level 1: what fossils can tell us.
    { id: 'topYoungest', level: 1, q: 'In undisturbed rock layers, which fossils are youngest?', a: 'the ones in the top layers', wrong: ['the ones in the bottom layers', 'the ones in the deepest layer', 'the ones found in lava'] },
    { id: 'sedimentLayers', level: 1, q: 'Where are fossils found most often?', a: 'in layers of sedimentary rock', wrong: ['inside lava rock', 'inside metal pipes', 'inside a glass jar'] },
    { id: 'amberInsect', level: 1, q: 'What kind of fossil is a whole insect preserved in amber?', a: 'a body fossil', wrong: ['a trace fossil', 'a burrow', 'a footprint'] },
    { id: 'footprintFossil', level: 1, q: 'Which of these is a trace fossil?', a: 'a dinosaur footprint', wrong: ['a fossil tooth', 'a fossil leaf', 'a fossil shell'] },
    { id: 'buriedQuick', level: 1, q: 'What usually happens first when a fossil forms?', a: 'it is buried quickly', wrong: ['it dries out in the sun', 'it is left out in the open', 'it is burned in a fire'] },
    { id: 'canFossil', level: 1, q: 'Which of these can become a fossil?', a: 'a shell', wrong: ['a sunbeam', 'a rainbow', 'a breeze'] },
    { id: 'paleontology', level: 1, q: 'What is the study of fossils called?', a: 'paleontology', wrong: ['astronomy', 'meteorology', 'ecology'] },
    { id: 'oldFossils', level: 1, q: 'How old are many fossils?', a: 'many thousands to millions of years old', wrong: ['only a few years old', 'made last week', 'less than one year old'] },
    // Level 2: identify and classify.
    { id: 'wormTunnel', level: 2, q: 'A fossil worm tunnel in rock is what kind of fossil?', a: 'a trace fossil', wrong: ['a body fossil', 'a cast fossil', 'a mold fossil'] },
    { id: 'shellHollow', level: 2, q: 'A hollow shape left in rock by a shell is called what?', a: 'a mold fossil', wrong: ['a cast fossil', 'a trace fossil', 'a compression fossil'] },
    { id: 'shellFilled', level: 2, q: 'A rock filled with minerals in the shape of a shell is called what?', a: 'a cast fossil', wrong: ['a mold fossil', 'a trace fossil', 'a compression fossil'] },
    { id: 'coprolite', level: 2, q: 'What is fossilized animal dung called?', a: 'a coprolite', wrong: ['a fossil tooth', 'a fossil leaf', 'a fossil shell'] },
    { id: 'amberSap', level: 2, q: 'An insect trapped in hardened tree sap is preserved in what?', a: 'amber', wrong: ['coal', 'chalk', 'salt'] },
    { id: 'fossilTooth', level: 2, q: 'A fossil tooth is what kind of fossil?', a: 'a body fossil', wrong: ['a trace fossil', 'a coprolite', 'a burrow'] },
    // Level 3: compare fossils to living things.
    { id: 'mammothRelative', level: 3, q: 'Which living animal is the closest relative of the woolly mammoth?', a: 'the Asian elephant', wrong: ['a giraffe', 'a rhinoceros', 'a camel'] },
    { id: 'smallDinos', level: 3, q: 'Birds are living relatives of which ancient animals?', a: 'small feathered dinosaurs', wrong: ['trilobites', 'ammonites', 'woolly mammoths'] },
    { id: 'nautilus', level: 3, q: 'Which living animal is a close relative of ammonites?', a: 'the nautilus', wrong: ['the starfish', 'the sea urchin', 'the jellyfish'] },
    { id: 'livingFossil', level: 3, q: 'What do we call a living animal that looks much like its ancient fossil relatives?', a: 'a living fossil', wrong: ['a trace fossil', 'a mold fossil', 'a fossil fuel'] },
    { id: 'marineShells', level: 3, q: 'Seashell fossils found high on a mountain suggest what?', a: 'the land was once under the sea', wrong: ['the land was always a desert', 'the mountain was made of ice', 'the ground was once lava'] },
    { id: 'coalFerns', level: 3, q: 'Coal beds full of fern fossils suggest the land was once what?', a: 'warm and swampy', wrong: ['icy and dry', 'covered in sand dunes', 'frozen all year'] },
    { id: 'archaeopteryx', level: 3, q: 'Which fossil shows feathers on a dinosaur-like animal?', a: 'Archaeopteryx', wrong: ['ammonites', 'trilobites', 'woolly mammoths'] },
    { id: 'microfossil', level: 3, q: 'What do we call fossils that are too tiny to see without a microscope?', a: 'microfossils', wrong: ['trace fossils', 'mold fossils', 'cast fossils'] },
  ],
  [{ skill: 'fossils', level: 2 }],
)

/** The seven science skills that close the IXL K-5 science map. Each is wired into the subject by the caller. */
export const SCIENCE_FINAL: Skill[] = [physicalOrChemical, mixturesEarly, lifeStages, ecosystemLife, bodySystems, foodWebs, fossilEvidence]

const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })

/** IXL topic per level (index 0 = level 1) for every skill in this file. */
export const SCIENCE_FINAL_IXL: Record<string, IxlRef[]> = {
  'science.physicalOrChemical': [sci(2, 'Physical and chemical change'), sci(2, 'Physical and chemical change'), sci(2, 'Physical and chemical change')],
  'science.mixturesEarly': [sci(2, 'Mixtures'), sci(2, 'Mixtures'), sci(2, 'Mixtures')],
  'science.lifeStages': [sci(3, 'Animals'), sci(3, 'Animals'), sci(3, 'Animals')],
  'science.ecosystemLife': [sci(4, 'Ecosystems'), sci(4, 'Ecosystems'), sci(4, 'Ecosystems')],
  'science.bodySystems': [sci(5, 'Animals'), sci(5, 'Animals'), sci(5, 'Animals')],
  'science.foodWebs': [sci(5, 'Ecosystems'), sci(5, 'Ecosystems'), sci(5, 'Ecosystems')],
  'science.fossilEvidence': [sci(5, 'Fossils'), sci(5, 'Fossils'), sci(5, 'Fossils')],
}
