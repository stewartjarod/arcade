import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { upToLevel, wrongFrom } from './util'

/**
 * Round 4 of Science and Social Studies: IXL categories the earlier files never touched at that grade
 * (mostly kindergarten to grade 2, plus a few grade 3 to 5 gaps). Every question is a multiple-choice
 * fact from a hand-checked list; wrong answers are listed per fact and never count as right.
 * Skill ids here must not collide with scienceSocial.ts, scienceSocialMore.ts, scienceSocialUpper.ts,
 * or scienceSocialRound3.ts.
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
// SCIENCE
// ============================================================================================

const madeOf = factSkill(
  'madeOf',
  ['What things are made of', 'See-through, floating, and magnetic materials', 'Natural and made-by-people materials'],
  [
    { id: 'pencil', level: 1, q: 'What is a pencil mostly made of?', a: 'wood', wrong: ['glass', 'cloth', 'rubber'], emoji: '✏️' },
    { id: 'can', level: 1, q: 'What is a soup can mostly made of?', a: 'metal', wrong: ['paper', 'wool', 'sponge'], emoji: '🥫' },
    { id: 'bottle', level: 1, q: 'What is a water bottle often made of?', a: 'plastic', wrong: ['wood', 'cotton', 'straw'], emoji: '🥤' },
    { id: 'tshirt', level: 1, q: 'What is a T-shirt often made of?', a: 'cotton', wrong: ['glass', 'metal', 'rock'], emoji: '👕' },
    { id: 'sweater', level: 1, q: 'What is a warm sweater often made of?', a: 'wool', wrong: ['glass', 'plastic', 'stone'], emoji: '🧶' },
    { id: 'book', level: 1, q: 'What are the pages of a book made of?', a: 'paper', wrong: ['rubber', 'metal', 'cloth'], emoji: '📖' },
    { id: 'tire', level: 1, q: 'What is a car tire made of?', a: 'rubber', wrong: ['wood', 'glass', 'paper'], emoji: '🛞' },
    { id: 'jar', level: 1, q: 'What is a jar you can see through usually made of?', a: 'glass', wrong: ['wool', 'cotton', 'wood'], emoji: '🫙' },
    { id: 'sandcastle', level: 1, q: 'What is a sandcastle made of?', a: 'sand', wrong: ['wool', 'glass', 'paper'], emoji: '🏰' },
    { id: 'stretch', level: 2, q: 'Which material stretches a lot and then snaps back?', a: 'rubber', wrong: ['glass', 'wood', 'brick'], emoji: '🎈' },
    { id: 'floats', level: 2, q: 'Which of these floats on water?', a: 'a wooden block', wrong: ['an iron nail', 'a glass marble', 'a rock'], emoji: '🌊' },
    { id: 'soak', level: 2, q: 'Which material soaks up water easily, like a towel?', a: 'cotton', wrong: ['glass', 'metal', 'plastic'], emoji: '🧽' },
    { id: 'magnetic', level: 2, q: 'Which metal does a magnet pick up?', a: 'iron', wrong: ['copper', 'aluminum', 'gold'], emoji: '🧲' },
    { id: 'seeLight', level: 2, q: 'Which material lets most light pass through it?', a: 'glass', wrong: ['wood', 'cardboard', 'a brick'] },
    { id: 'bridgeSteel', level: 2, q: 'Which strong metal is used to build bridges and skyscrapers?', a: 'steel', wrong: ['cotton', 'wool', 'paper'], emoji: '🌉' },
    { id: 'cottonPlant', level: 3, q: 'Which material comes from a plant?', a: 'cotton', wrong: ['nylon', 'plastic', 'steel'], emoji: '🌱' },
    { id: 'silk', level: 3, q: 'Which material comes from silkworms?', a: 'silk', wrong: ['wool', 'nylon', 'cotton'], emoji: '🐛' },
    { id: 'nylon', level: 3, q: 'Which human-made fiber is used for ropes and socks?', a: 'nylon', wrong: ['wool', 'cotton', 'silk'], emoji: '🧦' },
    { id: 'steelCarbon', level: 3, q: 'Steel is made by mixing iron with what?', a: 'carbon', wrong: ['salt', 'sand', 'water'], emoji: '⚙️' },
    { id: 'woolSheep', level: 3, q: 'Where does wool come from?', a: 'sheep', wrong: ['cows', 'trees', 'cotton plants'], emoji: '🐑' },
    { id: 'glassSand', level: 3, q: 'Glass is mostly made by melting what?', a: 'sand', wrong: ['clay', 'wood', 'wool'], emoji: '🫙' },
  ],
)

const colorsShapes = factSkill(
  'colorsShapes',
  ['Colors of everyday things', 'Mixing paint colors', 'Shapes of everyday things'],
  [
    { id: 'grass', level: 1, q: 'What color is fresh grass?', a: 'green', wrong: ['purple', 'orange', 'pink'], emoji: '🌿' },
    { id: 'banana', level: 1, q: 'What color is a ripe banana?', a: 'yellow', wrong: ['blue', 'black', 'red'], emoji: '🍌' },
    { id: 'sky', level: 1, q: 'What color is the sky on a sunny day?', a: 'blue', wrong: ['brown', 'green', 'black'], emoji: '🌤️' },
    { id: 'stopSign', level: 1, q: 'What color is a stop sign?', a: 'red', wrong: ['green', 'yellow', 'white'], emoji: '🛑' },
    { id: 'snow', level: 1, q: 'What color is fresh snow?', a: 'white', wrong: ['black', 'red', 'orange'], emoji: '❄️' },
    { id: 'carrot', level: 1, q: 'What color is a carrot?', a: 'orange', wrong: ['purple', 'blue', 'white'], emoji: '🥕' },
    { id: 'eggplant', level: 1, q: 'What color is an eggplant?', a: 'purple', wrong: ['yellow', 'brown', 'pink'], emoji: '🍆' },
    { id: 'dirt', level: 1, q: 'What color is dirt?', a: 'brown', wrong: ['blue', 'pink', 'white'], emoji: '🪱' },
    { id: 'blueYellow', level: 2, q: 'What color do you get by mixing blue and yellow paint?', a: 'green', wrong: ['purple', 'orange', 'brown'], emoji: '🎨' },
    { id: 'redYellow', level: 2, q: 'What color do you get by mixing red and yellow paint?', a: 'orange', wrong: ['green', 'purple', 'pink'], emoji: '🎨' },
    { id: 'redBlue', level: 2, q: 'What color do you get by mixing red and blue paint?', a: 'purple', wrong: ['orange', 'green', 'black'], emoji: '🎨' },
    { id: 'redWhite', level: 2, q: 'What color do you get by mixing red and white paint?', a: 'pink', wrong: ['purple', 'brown', 'orange'], emoji: '🎨' },
    { id: 'blackWhite', level: 2, q: 'What color do you get by mixing black and white paint?', a: 'gray', wrong: ['pink', 'yellow', 'green'], emoji: '🎨' },
    { id: 'primary', level: 2, q: 'What are the three primary colors of paint?', a: 'red, yellow, and blue', wrong: ['red, green, and purple', 'orange, green, and brown', 'pink, black, and white'], emoji: '🖍️' },
    { id: 'ball', level: 3, q: 'What shape is a ball?', a: 'sphere', wrong: ['cube', 'triangle', 'cylinder'], emoji: '⚽' },
    { id: 'can3', level: 3, q: 'What shape is a soup can?', a: 'cylinder', wrong: ['sphere', 'cone', 'cube'], emoji: '🥫' },
    { id: 'die', level: 3, q: 'What shape is a die?', a: 'cube', wrong: ['sphere', 'cone', 'pyramid'], emoji: '🎲' },
    { id: 'cone', level: 3, q: 'What shape is an ice cream cone?', a: 'cone', wrong: ['cube', 'cylinder', 'sphere'], emoji: '🍦' },
    { id: 'pizza', level: 3, q: 'What shape is a slice of pizza?', a: 'triangle', wrong: ['square', 'circle', 'rectangle'], emoji: '🍕' },
    { id: 'clock', level: 3, q: 'What shape is a clock face?', a: 'circle', wrong: ['triangle', 'square', 'star'], emoji: '⏰' },
    { id: 'door', level: 3, q: 'What shape is a door?', a: 'rectangle', wrong: ['circle', 'triangle', 'star'], emoji: '🚪' },
    { id: 'egg', level: 3, q: 'What shape is an egg?', a: 'oval', wrong: ['cube', 'star', 'cylinder'], emoji: '🥚' },
  ],
)

const heatingCooling = factSkill(
  'heatingCooling',
  ['Things that make us warm', 'Things that help us cool down', 'Heating and cooling at home'],
  [
    { id: 'heater', level: 1, q: 'What warms a cold room in winter?', a: 'a heater', wrong: ['a fan', 'a freezer', 'an ice cube'], emoji: '🏠' },
    { id: 'hairDryer', level: 1, q: 'What machine blows warm air to dry your hair?', a: 'a hair dryer', wrong: ['a fan', 'a freezer', 'an ice pack'], emoji: '💇' },
    { id: 'sidewalk', level: 1, q: 'What warms a sidewalk on a sunny day?', a: 'the Sun', wrong: ['the Moon', 'the wind', 'the rain'] },
    { id: 'campfire', level: 1, q: 'What fuel is burning to keep a campfire warm?', a: 'wood', wrong: ['ice', 'sand', 'cotton'], emoji: '🔥' },
    { id: 'blanket', level: 1, q: 'How does a blanket keep you warm?', a: 'it keeps your body heat in', wrong: ['it makes its own heat', 'it pulls in cold air', 'it melts the snow'], emoji: '🛏️' },
    { id: 'rubHands', level: 1, q: 'What happens when you rub your hands together fast?', a: 'they get warm', wrong: ['they get cold', 'they freeze', 'they turn blue'], emoji: '🙌' },
    { id: 'microwave', level: 1, q: 'What oven heats up food in a few seconds?', a: 'a microwave', wrong: ['a freezer', 'a fan', 'a cooler'], emoji: '🍲' },
    { id: 'carHeater', level: 1, q: 'What warms a cold car on a winter morning?', a: 'the car heater', wrong: ['the air conditioner', 'a freezer', 'an ice pack'], emoji: '🚗' },
    { id: 'fan', level: 2, q: 'What spins blades to push air around and cool you down?', a: 'a fan', wrong: ['a heater', 'a blanket', 'a campfire'], emoji: '🌬️' },
    { id: 'freezer', level: 2, q: 'What keeps ice cream frozen?', a: 'a freezer', wrong: ['a stove', 'a hair dryer', 'a campfire'], emoji: '🍦' },
    { id: 'airCon', level: 2, q: 'What machine cools the air inside a house?', a: 'an air conditioner', wrong: ['a heater', 'a toaster', 'a blanket'], emoji: '❄️' },
    { id: 'iceCubes', level: 2, q: 'What cools a glass of lemonade quickly?', a: 'ice cubes', wrong: ['hot coals', 'a blanket', 'a hair dryer'], emoji: '🍋' },
    { id: 'shade', level: 2, q: 'What does shade block to keep you cooler?', a: 'sunlight', wrong: ['wind', 'rain', 'snow'], emoji: '⛱️' },
    { id: 'sweat', level: 2, q: 'What happens when sweat dries on your skin?', a: 'it helps cool your body', wrong: ['it makes you warmer', 'it freezes your skin', 'it turns into snow'], emoji: '💦' },
    { id: 'blowSoup', level: 2, q: 'Why do people blow on hot soup?', a: 'moving air helps it cool faster', wrong: ['it adds heat to the soup', 'it makes the soup freeze', 'it turns the soup into ice'], emoji: '🥣' },
    { id: 'fridge', level: 2, q: 'Why does milk last longer in a fridge?', a: 'cold slows down germs', wrong: ['the fridge adds sugar', 'the milk turns to ice', 'the fridge heats it up'], emoji: '🥛' },
    { id: 'thermostat', level: 3, q: 'What tool controls how warm a house gets?', a: 'a thermostat', wrong: ['a faucet', 'a ruler', 'a compass'], emoji: '🌡️' },
    { id: 'insulation', level: 3, q: 'What keeps heat from leaving a house?', a: 'insulation', wrong: ['ice cubes', 'a sprinkler', 'a window fan'], emoji: '🏠' },
    { id: 'lid', level: 3, q: 'What keeps a cup of tea warm for longer?', a: 'a lid', wrong: ['a straw', 'a spoon', 'a napkin'], emoji: '☕' },
    { id: 'lightClothes', level: 3, q: 'Which color of clothes reflects sunlight and keeps you cooler?', a: 'white', wrong: ['black', 'dark blue', 'dark brown'], emoji: '👕' },
    { id: 'acJob', level: 3, q: 'What does an air conditioner take out of a room?', a: 'heat', wrong: ['light', 'sound', 'snow'], emoji: '❄️' },
    { id: 'warmRises', level: 3, q: 'Which way does warm air move?', a: 'up', wrong: ['down', 'sideways only', 'it stays still'] },
  ],
)

const humanImpacts = factSkill(
  'humanImpacts',
  ['Taking care of our Earth', 'Keeping air and water clean', 'Protecting Earth from pollution'],
  [
    { id: 'trash', level: 1, q: 'Where should trash go so animals stay safe?', a: 'in a trash can', wrong: ['on the sidewalk', 'in the river', 'in the woods'] },
    { id: 'plantTree', level: 1, q: 'Which one helps clean the air?', a: 'planting a tree', wrong: ['cutting down trees', 'burning trash', 'leaving lights on'], emoji: '🌳' },
    { id: 'lights', level: 1, q: 'What saves electricity at home?', a: 'turning off lights when you leave', wrong: ['leaving every light on', 'running the heater with the door open', 'opening the fridge all day'], emoji: '💡' },
    { id: 'jar', level: 1, q: 'What can you do with a glass jar instead of throwing it away?', a: 'use it again', wrong: ['throw it in a lake', 'leave it on the grass', 'break it on the road'], emoji: '🫙' },
    { id: 'bike', level: 1, q: 'Which is a good way to help keep the air clean?', a: 'riding a bike or walking', wrong: ['burning piles of trash', 'leaving the car running', 'lighting fires in the woods'], emoji: '🚲' },
    { id: 'tap', level: 1, q: 'What should you do with the water when you brush your teeth?', a: 'turn it off', wrong: ['let it run the whole time', 'fill a pool with it', 'pour it on the floor'], emoji: '🪥' },
    { id: 'newspaper', level: 1, q: 'Where should old newspapers go so they can be used again?', a: 'the recycling bin', wrong: ['the lake', 'the playground', 'the bushes'], emoji: '📰' },
    { id: 'pollution', level: 2, q: 'What is pollution?', a: 'harmful stuff put into air, water, or land', wrong: ['clean fresh air', 'a kind of rainbow', 'a pile of snow'], emoji: '🏭' },
    { id: 'oilSpill', level: 2, q: 'What does an oil spill in the ocean harm?', a: 'birds and fish', wrong: ['rocks and sand', 'clouds and wind', 'trees on land'], emoji: '🛢️' },
    { id: 'carsFactories', level: 2, q: 'What are two big causes of air pollution?', a: 'car exhaust and factory smoke', wrong: ['rain and snow', 'sunlight and wind', 'fresh spring water'], emoji: '🚗' },
    { id: 'trashRiver', level: 2, q: 'What can trash in a river do?', a: 'hurt fish and other animals', wrong: ['make the water sweeter', 'help fish grow', 'clean the river'], emoji: '🐟' },
    { id: 'recycle', level: 2, q: 'What does recycling help keep out of landfills?', a: 'materials that can be reused', wrong: ['water from lakes', 'new trees', 'rain clouds'], emoji: '♻️' },
    { id: 'landfill', level: 3, q: 'What do we call a place where trash is buried in the ground?', a: 'a landfill', wrong: ['a farm', 'a playground', 'a greenhouse'], emoji: '🗑️' },
    { id: 'refuge', level: 3, q: 'What is a wildlife refuge?', a: 'a protected place for animals', wrong: ['a place to sell animals', 'a road for trucks', 'a factory for toys'], emoji: '🦌' },
    { id: 'reduceFirst', level: 3, q: 'In "reduce, reuse, recycle," which step comes first?', a: 'reduce', wrong: ['recycle', 'throw away', 'burn'], emoji: '♻️' },
    { id: 'riverTrees', level: 3, q: 'Why do people plant trees along a river?', a: 'to keep soil from washing into the water', wrong: ['to make the river dry', 'to block the fish', 'to make the water salty'], emoji: '🌲' },
  ],
)

const ecosystemRoles = factSkill(
  'ecosystemRoles',
  ['Predators, prey, and scavengers', 'Herbivores, carnivores, and omnivores', 'Niches and partnerships'],
  [
    { id: 'predator', level: 1, q: 'What do we call an animal that hunts other animals for food?', a: 'a predator', wrong: ['a prey', 'a decomposer', 'a producer'], emoji: '🦉' },
    { id: 'prey', level: 1, q: 'What do we call an animal that is hunted by other animals?', a: 'prey', wrong: ['a predator', 'a scavenger', 'a producer'], emoji: '🐭' },
    { id: 'snakeHawk', level: 1, q: 'When a hawk eats a snake, which one is the prey?', a: 'the snake', wrong: ['the hawk', 'the grass', 'the sun'] },
    { id: 'scavenger', level: 1, q: 'What do we call an animal that eats dead animals it finds?', a: 'a scavenger', wrong: ['a predator', 'a producer', 'a herbivore'], emoji: '🦅' },
    { id: 'habitat', level: 1, q: 'What is a habitat?', a: 'the place where a living thing lives', wrong: ['a kind of food', 'a type of weather', 'a pile of rocks'], emoji: '🏡' },
    { id: 'population', level: 1, q: 'What is a population?', a: 'all of one kind of living thing in an area', wrong: ['a group of different animals', 'a type of weather', 'a stack of rocks'], emoji: '🐜' },
    { id: 'community', level: 1, q: 'What is a community in an ecosystem?', a: 'all the different living things in one place', wrong: ['only one kind of animal', 'a pile of rocks', 'a kind of weather'], emoji: '🌳' },
    { id: 'ecosystem', level: 1, q: 'What is an ecosystem?', a: 'living and nonliving things in one place', wrong: ['only the animals in a zoo', 'a list of rocks', 'a kind of weather'], emoji: '🌿' },
    { id: 'herbivore', level: 2, q: 'What do we call an animal that eats only plants?', a: 'a herbivore', wrong: ['a carnivore', 'an omnivore', 'a predator'], emoji: '🐄' },
    { id: 'carnivore', level: 2, q: 'What do we call an animal that eats only other animals?', a: 'a carnivore', wrong: ['a herbivore', 'an omnivore', 'a plant'], emoji: '🦁' },
    { id: 'omnivore', level: 2, q: 'What do we call an animal that eats both plants and animals?', a: 'an omnivore', wrong: ['a herbivore', 'a carnivore', 'a decomposer'], emoji: '🐻' },
    { id: 'foodWeb', level: 2, q: 'What is a food web?', a: 'many food chains linked together', wrong: ['one animal and its home', 'a kind of plant', 'a pile of seeds'], emoji: '🕸️' },
    { id: 'consumer', level: 2, q: 'What do we call a living thing that cannot make its own food?', a: 'a consumer', wrong: ['a producer', 'a plant', 'a rock'], emoji: '🐛' },
    { id: 'niche', level: 3, q: 'What is a niche?', a: 'the job a living thing has in its ecosystem', wrong: ['its favorite food', 'its home address', 'its size and color'], emoji: '🐝' },
    { id: 'nocturnal', level: 3, q: 'What do we call an animal that is active at night?', a: 'nocturnal', wrong: ['diurnal', 'hibernating', 'migrating'], emoji: '🦉' },
    { id: 'diurnal', level: 3, q: 'What do we call an animal that is active during the day?', a: 'diurnal', wrong: ['nocturnal', 'asleep all year', 'living in the sea'], emoji: '☀️' },
    { id: 'mutualism', level: 3, q: 'Bees get nectar and flowers get pollinated. What is this partnership called?', a: 'mutualism', wrong: ['parasitism', 'competition', 'predation'], emoji: '🐝' },
    { id: 'parasitism', level: 3, q: 'What is it called when one living thing lives on another and harms it?', a: 'parasitism', wrong: ['mutualism', 'competition', 'camouflage'], emoji: '🪱' },
    { id: 'competition', level: 3, q: 'What is it called when animals fight over the same food or water?', a: 'competition', wrong: ['camouflage', 'migration', 'hibernation'], emoji: '🐺' },
  ],
  [{ skill: 'ecosystems', level: 2 }],
)

const plantScience = factSkill(
  'plantScience',
  ['Flower parts', 'What plants take in and let out', 'Tubes inside plants'],
  [
    { id: 'stamen', level: 1, q: 'Which part of a flower makes pollen?', a: 'the stamen', wrong: ['the pistil', 'the sepal', 'the root'], emoji: '🌼' },
    { id: 'pistil', level: 1, q: 'Which part of a flower receives pollen?', a: 'the pistil', wrong: ['the stamen', 'the sepal', 'the stem'], emoji: '🌸' },
    { id: 'ovary', level: 1, q: 'Which part of a flower grows into the fruit?', a: 'the ovary', wrong: ['the petal', 'the sepal', 'the root'], emoji: '🍎' },
    { id: 'sepal', level: 1, q: 'What are the small green leaves under a flower called?', a: 'sepals', wrong: ['petals', 'stamens', 'roots'], emoji: '🌱' },
    { id: 'anther', level: 1, q: 'What is the tip of a stamen that holds pollen called?', a: 'the anther', wrong: ['the stigma', 'the sepal', 'the ovary'], emoji: '🌼' },
    { id: 'pollen', level: 1, q: 'What is the yellow powder on a flower called?', a: 'pollen', wrong: ['nectar', 'sap', 'rainwater'], emoji: '🌻' },
    { id: 'nectar', level: 1, q: 'What sweet liquid do bees drink from flowers?', a: 'nectar', wrong: ['sap', 'rainwater', 'dew'], emoji: '🐝' },
    { id: 'dispersal', level: 1, q: 'What can carry seeds away from the parent plant?', a: 'wind, water, or animals', wrong: ['sunlight', 'rain clouds', 'soil'], emoji: '🌬️' },
    { id: 'co2', level: 2, q: 'What gas do plants take in from the air to make food?', a: 'carbon dioxide', wrong: ['oxygen', 'nitrogen', 'helium'], emoji: '🌿' },
    { id: 'o2', level: 2, q: 'What gas do plants give off when they make food?', a: 'oxygen', wrong: ['carbon dioxide', 'helium', 'hydrogen'], emoji: '🌳' },
    { id: 'chlorophyll', level: 2, q: 'What green material in leaves captures sunlight?', a: 'chlorophyll', wrong: ['xylem', 'pollen', 'stomata'], emoji: '🍃' },
    { id: 'stomata', level: 2, q: 'What tiny holes on a leaf let gases move in and out?', a: 'stomata', wrong: ['chlorophyll', 'xylem', 'phloem'], emoji: '🍃' },
    { id: 'glucose', level: 2, q: 'What sugar do plants make during photosynthesis?', a: 'glucose', wrong: ['salt', 'vinegar', 'baking soda'] },
    { id: 'photosynthesis', level: 2, q: 'What is the name for how plants make food from light?', a: 'photosynthesis', wrong: ['respiration', 'decomposition', 'condensation'], emoji: '☀️' },
    { id: 'roots', level: 2, q: 'What do roots take up from the soil?', a: 'water and minerals', wrong: ['air and light', 'salt and sand', 'oil and gas'], emoji: '🌱' },
    { id: 'xylem', level: 3, q: 'Which tubes carry water and minerals up from the roots?', a: 'xylem', wrong: ['phloem', 'stomata', 'chlorophyll'], emoji: '🌲' },
    { id: 'phloem', level: 3, q: 'Which tubes carry sugar from the leaves to the rest of the plant?', a: 'phloem', wrong: ['xylem', 'stomata', 'pollen'], emoji: '🌲' },
    { id: 'vascular', level: 3, q: 'Which two tube systems make up a plant\'s vascular system?', a: 'xylem and phloem', wrong: ['roots and seeds', 'leaves and petals', 'stomata and pollen'], emoji: '🌿' },
    { id: 'conifers', level: 3, q: 'Which plants make seeds inside cones?', a: 'conifers', wrong: ['ferns', 'mosses', 'algae'], emoji: '🌲' },
    { id: 'spores', level: 3, q: 'What do ferns and mosses make instead of seeds?', a: 'spores', wrong: ['flowers', 'fruit', 'pollen'], emoji: '🌿' },
  ],
  [{ skill: 'plants', level: 2 }],
)

const magnetPoles = factSkill(
  'magnetPoles',
  ['What magnets attract', 'Poles and compasses', 'Electromagnets and Earth'],
  [
    { id: 'nickel', level: 1, q: 'Which metal besides iron is attracted to a magnet?', a: 'nickel', wrong: ['copper', 'zinc', 'tin'], emoji: '🪙' },
    { id: 'cobalt', level: 1, q: 'Which metal, besides iron and nickel, is magnetic?', a: 'cobalt', wrong: ['tin', 'lead', 'zinc'], emoji: '🧲' },
    { id: 'aluminum', level: 1, q: 'Which of these is NOT attracted to a magnet?', a: 'aluminum', wrong: ['iron', 'nickel', 'cobalt'], emoji: '🥫' },
    { id: 'steelSpoon', level: 1, q: 'Which one would a magnet pick up?', a: 'an iron nail', wrong: ['a plastic cup', 'a wooden block', 'a rubber ball'] },
    { id: 'plasticSpoon', level: 1, q: 'Which one would a magnet NOT stick to?', a: 'a plastic spoon', wrong: ['an iron nail', 'a steel paper clip', 'a steel nail'] },
    { id: 'magnetism', level: 1, q: 'What is the pull of a magnet called?', a: 'magnetism', wrong: ['gravity', 'friction', 'electricity'], emoji: '🧲' },
    { id: 'paperThrough', level: 1, q: 'Can a magnet pull a paper clip through a sheet of paper?', a: 'yes', wrong: ['no, paper blocks it', 'only if it is wet', 'only if it is wood'], emoji: '📄' },
    { id: 'clipMetal', level: 1, q: 'What metal is a paper clip usually made of?', a: 'steel', wrong: ['gold', 'silver', 'aluminum'], emoji: '📎' },
    { id: 'poles', level: 2, q: 'What are the two ends of a magnet called?', a: 'poles', wrong: ['corners', 'edges', 'tips'], emoji: '🧲' },
    { id: 'compass', level: 2, q: 'What does a compass needle point toward?', a: 'magnetic north', wrong: ['the Sun', 'the Moon', 'the ocean floor'], emoji: '🧭' },
    { id: 'earthMagnet', level: 2, q: 'Why does a compass point north?', a: 'Earth acts like a giant magnet', wrong: ['the needle is heavier on one side', 'the Sun pulls the needle', 'the needle is painted north'], emoji: '🌍' },
    { id: 'strongest', level: 2, q: 'Where is a magnet\'s pull strongest?', a: 'at its poles', wrong: ['in the middle', 'on its sides', 'far from the magnet'], emoji: '🧲' },
    { id: 'cutHalf', level: 2, q: 'If you cut a magnet in half, what do you get?', a: 'two smaller magnets', wrong: ['one magnet and one piece of iron', 'two pieces that are not magnets', 'a pile of iron dust'], emoji: '✂️' },
    { id: 'electromagnet', level: 3, q: 'What do we call a magnet that gets its pull from electricity?', a: 'an electromagnet', wrong: ['a compass', 'a battery', 'a radio'], emoji: '⚡' },
    { id: 'coilCopper', level: 3, q: 'What do you wrap around an iron nail to make an electromagnet?', a: 'copper wire', wrong: ['rubber bands', 'paper clips', 'string'], emoji: '🔌' },
    { id: 'offStops', level: 3, q: 'What happens to an electromagnet when the electricity is turned off?', a: 'it stops being a magnet', wrong: ['it gets stronger', 'it turns into gold', 'it floats away'], emoji: '🔋' },
    { id: 'field', level: 3, q: 'What is the area around a magnet where its pull can be felt?', a: 'a magnetic field', wrong: ['an electric circuit', 'a sound wave', 'a rainbow'], emoji: '🧲' },
    { id: 'earthShield', level: 3, q: 'What does Earth\'s magnetic field help protect us from?', a: 'harmful particles from the Sun', wrong: ['cold winds from the north', 'rain and snow', 'strong ocean waves'], emoji: '🌍' },
  ],
  [{ skill: 'magnets', level: 2 }],
)

const climateWind = factSkill(
  'climateWind',
  ['Climate, tools, and storms', 'What makes wind and rain', 'Clouds and air pressure'],
  [
    { id: 'climate', level: 1, q: 'What is climate?', a: 'the usual weather of a place over many years', wrong: ['what you wear on a sunny day', 'a single storm in one afternoon', 'a map of the stars'], emoji: '🌍' },
    { id: 'barometer', level: 1, q: 'What tool measures air pressure?', a: 'a barometer', wrong: ['a thermometer', 'a rain gauge', 'a compass'], emoji: '🌡️' },
    { id: 'anemometer', level: 1, q: 'What tool measures wind speed?', a: 'an anemometer', wrong: ['a barometer', 'a thermometer', 'a rain gauge'], emoji: '💨' },
    { id: 'windVane', level: 1, q: 'What tool shows which way the wind is blowing?', a: 'a wind vane', wrong: ['a rain gauge', 'a barometer', 'a ruler'], emoji: '🌬️' },
    { id: 'hurricane', level: 1, q: 'What is a hurricane?', a: 'a giant spinning storm over warm ocean', wrong: ['a cold, dry wind', 'a quiet snowfall', 'a small puddle'], emoji: '🌀' },
    { id: 'tornado', level: 1, q: 'What do we call a funnel-shaped windstorm that touches the ground?', a: 'a tornado', wrong: ['a hurricane', 'a blizzard', 'a drought'], emoji: '🌪️' },
    { id: 'drought', level: 1, q: 'What do we call a long time with very little rain?', a: 'a drought', wrong: ['a flood', 'a blizzard', 'a heat wave'], emoji: '🏜️' },
    { id: 'blizzard', level: 1, q: 'What is a blizzard?', a: 'a snowstorm with strong winds', wrong: ['a sunny breeze', 'a hot desert day', 'a light rain shower'], emoji: '❄️' },
    { id: 'windCause', level: 2, q: 'What causes wind?', a: 'differences in air pressure', wrong: ['the Moon pulling the air', 'rain falling fast', 'trees breathing'], emoji: '💨' },
    { id: 'warmAir', level: 2, q: 'Why does air over hot ground rise?', a: 'it is warmer and lighter', wrong: ['it is colder and heavier', 'it is made of ice', 'it is pushed by fish'], emoji: '☀️' },
    { id: 'thunder', level: 2, q: 'What causes thunder?', a: 'lightning heating the air quickly', wrong: ['clouds crashing together', 'rain hitting the roof', 'wind blowing the trees'], emoji: '⚡' },
    { id: 'highPressure', level: 2, q: 'Which kind of air pressure brings clear, calm weather?', a: 'high pressure', wrong: ['low pressure', 'a thick fog', 'heavy snow'], emoji: '🌤️' },
    { id: 'lowPressure', level: 2, q: 'Which kind of air pressure often brings clouds and rain?', a: 'low pressure', wrong: ['high pressure', 'dry air', 'cold ice'], emoji: '🌧️' },
    { id: 'cumulus', level: 3, q: 'What are big, puffy, white clouds called?', a: 'cumulus clouds', wrong: ['cirrus clouds', 'stratus clouds', 'fog'], emoji: '☁️' },
    { id: 'cirrus', level: 3, q: 'What are thin, wispy clouds high in the sky called?', a: 'cirrus clouds', wrong: ['cumulus clouds', 'stratus clouds', 'nimbus clouds'], emoji: '🌥️' },
    { id: 'stratus', level: 3, q: 'What are flat, gray clouds that cover the whole sky called?', a: 'stratus clouds', wrong: ['cirrus clouds', 'cumulus clouds', 'cumulonimbus clouds'], emoji: '🌫️' },
    { id: 'cumulonimbus', level: 3, q: 'What are tall storm clouds that can bring thunder called?', a: 'cumulonimbus clouds', wrong: ['cirrus clouds', 'stratus clouds', 'cumulus clouds'], emoji: '⛈️' },
    { id: 'fog', level: 3, q: 'What is fog?', a: 'a cloud touching the ground', wrong: ['smoke from a campfire', 'rain falling slowly', 'frozen rain'], emoji: '🌫️' },
  ],
  [{ skill: 'weather', level: 2 }],
)

// ============================================================================================
// SOCIAL STUDIES
// ============================================================================================

const famousFirsts = factSkill(
  'famousFirsts',
  ['Famous firsts', 'Helpers who changed things', 'Leaders and writers in history'],
  [
    { id: 'moon', level: 1, q: 'Who was the first person to walk on the Moon?', a: 'Neil Armstrong', wrong: ['Abraham Lincoln', 'George Washington', 'Martin Luther King Jr.'], emoji: '🌕' },
    { id: 'declaration', level: 1, q: 'Who was the main writer of the Declaration of Independence?', a: 'Thomas Jefferson', wrong: ['Christopher Columbus', 'Rosa Parks', 'Harriet Tubman'], emoji: '📜' },
    { id: 'ruby', level: 1, q: 'Which girl bravely went to an all-white school in New Orleans in 1960?', a: 'Ruby Bridges', wrong: ['Amelia Earhart', 'Helen Keller', 'Sacagawea'], emoji: '🎒' },
    { id: 'jackie', level: 1, q: 'Who broke the color barrier in Major League Baseball in 1947?', a: 'Jackie Robinson', wrong: ['Babe Ruth', 'Abraham Lincoln', 'Sally Ride'], emoji: '⚾' },
    { id: 'helen', level: 1, q: 'Who was a famous writer and speaker who could not see or hear?', a: 'Helen Keller', wrong: ['Booker T. Washington', 'Thomas Edison', 'Clara Barton'], emoji: '📚' },
    { id: 'booker', level: 1, q: 'Who started the Tuskegee Institute, a school in Alabama?', a: 'Booker T. Washington', wrong: ['Harriet Tubman', 'Sally Ride', 'Amelia Earhart'], emoji: '🏫' },
    { id: 'frederick', level: 1, q: 'Who escaped slavery and became a famous speaker and writer for freedom?', a: 'Frederick Douglass', wrong: ['Booker T. Washington', 'Thomas Jefferson', 'Neil Armstrong'], emoji: '🗣️' },
    { id: 'cesar', level: 1, q: 'Who helped start the farm workers union in California?', a: 'Cesar Chavez', wrong: ['Rosa Parks', 'Ruby Bridges', 'Sacagawea'], emoji: '🍇' },
    { id: 'marshall', level: 2, q: 'Who was the first African American to serve on the Supreme Court?', a: 'Thurgood Marshall', wrong: ['Martin Luther King Jr.', 'Ruby Bridges', 'Rosa Parks'], emoji: '⚖️' },
    { id: 'eleanor', level: 2, q: 'Which First Lady led the group that wrote the Universal Declaration of Human Rights?', a: 'Eleanor Roosevelt', wrong: ['Martha Washington', 'Dolley Madison', 'Abigail Adams'], emoji: '🕊️' },
    { id: 'susan', level: 2, q: 'Which woman worked for women\'s right to vote and has a dollar coin named for her?', a: 'Susan B. Anthony', wrong: ['Clara Barton', 'Helen Keller', 'Ruby Bridges'], emoji: '🪙' },
    { id: 'clara', level: 2, q: 'Who founded the American Red Cross?', a: 'Clara Barton', wrong: ['Helen Keller', 'Booker T. Washington', 'Jackie Robinson'], emoji: '🩹' },
    { id: 'paine', level: 2, q: 'Who wrote the pamphlet Common Sense in 1776?', a: 'Thomas Paine', wrong: ['Patrick Henry', 'John Adams', 'George Washington'], emoji: '📝' },
    { id: 'fdr', level: 3, q: 'Who was president during most of World War II?', a: 'Franklin D. Roosevelt', wrong: ['Woodrow Wilson', 'Theodore Roosevelt', 'Abraham Lincoln'], emoji: '🌎' },
    { id: 'johnAdams', level: 3, q: 'Who was the first president to live in the White House?', a: 'John Adams', wrong: ['Thomas Jefferson', 'George Washington', 'James Madison'], emoji: '🏠' },
    { id: 'laura', level: 3, q: 'Who wrote the book Little House on the Prairie?', a: 'Laura Ingalls Wilder', wrong: ['Mark Twain', 'Dr. Seuss', 'Louisa May Alcott'], emoji: '📖' },
    { id: 'twain', level: 3, q: 'Who wrote the book Huckleberry Finn?', a: 'Mark Twain', wrong: ['Laura Ingalls Wilder', 'Dr. Seuss', 'Louisa May Alcott'], emoji: '🛶' },
    { id: 'gandhi', level: 3, q: 'Who led the nonviolent movement for India\'s independence?', a: 'Mahatma Gandhi', wrong: ['Nelson Mandela', 'Winston Churchill', 'Simon Bolivar'], emoji: '🇮🇳' },
  ],
)

const moneyChoices = factSkill(
  'moneyChoices',
  ['Earning money', 'Saving and spending wisely', 'Producers and consumers'],
  [
    { id: 'wages', level: 1, q: 'What do we call the money you earn for doing a job?', a: 'wages', wrong: ['a tax', 'a loan', 'a gift'], emoji: '💵' },
    { id: 'bills', level: 1, q: 'What do we call paper money?', a: 'bills', wrong: ['coins', 'checks', 'cards'], emoji: '💵' },
    { id: 'quarter', level: 1, q: 'Which is worth more: a quarter or a dime?', a: 'a quarter', wrong: ['a dime', 'a nickel', 'a penny'], emoji: '🪙' },
    { id: 'store', level: 1, q: 'What is a store?', a: 'a place where people buy and sell things', wrong: ['a place to swim', 'a school for animals', 'a kind of farm'], emoji: '🏪' },
    { id: 'budget', level: 1, q: 'What is a budget?', a: 'a plan for how to spend money', wrong: ['a list of toys to buy', 'a kind of coin', 'a bank building'], emoji: '📋' },
    { id: 'workWhy', level: 1, q: 'Why do most people go to work?', a: 'to earn money for things they need', wrong: ['to get free toys', 'to win prizes', 'to play games all day'], emoji: '👷' },
    { id: 'buyStore', level: 1, q: 'When you buy a toy, what do you give the store?', a: 'money', wrong: ['a rock', 'a song', 'a bike'], emoji: '🧸' },
    { id: 'bank', level: 1, q: 'What is a bank for?', a: 'keeping money safe', wrong: ['growing plants', 'making toys', 'baking bread'], emoji: '🏦' },
    { id: 'save', level: 2, q: 'What does it mean to save money?', a: 'to keep some for later', wrong: ['to spend it all today', 'to give it all away', 'to hide it under a rug'], emoji: '🐷' },
    { id: 'piggy', level: 2, q: 'What is a piggy bank for?', a: 'saving coins at home', wrong: ['keeping toys', 'holding food', 'growing plants'], emoji: '🐷' },
    { id: 'needsFirst', level: 2, q: 'When you make a budget, what should you pay for first?', a: 'needs', wrong: ['wants', 'toys', 'candy'], emoji: '🥕' },
    { id: 'allowance', level: 2, q: 'What is an allowance?', a: 'money a parent gives a child regularly', wrong: ['a bill from a store', 'a kind of coin', 'a prize for winning'], emoji: '💰' },
    { id: 'receipt', level: 2, q: 'What is a receipt?', a: 'proof that you bought something', wrong: ['a kind of coin', 'a new toy', 'a bill for the future'], emoji: '🧾' },
    { id: 'producer', level: 3, q: 'What do we call a person or company that makes goods or grows food?', a: 'a producer', wrong: ['a consumer', 'a customer', 'a banker'], emoji: '🌾' },
    { id: 'consumer', level: 3, q: 'What do we call a person who buys and uses goods and services?', a: 'a consumer', wrong: ['a farmer', 'a banker', 'a teacher'], emoji: '🛒' },
    { id: 'trade', level: 3, q: 'What is trade?', a: 'swapping one thing for another', wrong: ['buying with coins only', 'giving a gift', 'saving for later'], emoji: '🔁' },
    { id: 'business', level: 3, q: 'How does a business make money?', a: 'by selling goods or services', wrong: ['by giving everything away', 'by hiding its money', 'by never selling anything'], emoji: '🏢' },
  ],
)

const humanMade = factSkill(
  'humanMade',
  ['Natural or human-made', 'How people adapt to places', 'Why people settle in places'],
  [
    { id: 'bridge', level: 1, q: 'Which one is human-made?', a: 'a bridge', wrong: ['a waterfall', 'a volcano', 'a lake'] },
    { id: 'waterfall', level: 1, q: 'Which one is a natural feature?', a: 'a waterfall', wrong: ['a dam', 'a highway', 'a skyscraper'], emoji: '🌊' },
    { id: 'city', level: 1, q: 'What do we call a large place where many people live and work?', a: 'a city', wrong: ['a canyon', 'a glacier', 'a desert'] },
    { id: 'canal', level: 1, q: 'Which one is human-made and carries boats?', a: 'a canal', wrong: ['a river', 'a lake', 'a valley'], emoji: '🛶' },
    { id: 'meadow', level: 1, q: 'Which one is a natural grassy field?', a: 'a meadow', wrong: ['a playground', 'a parking lot', 'a farm'], emoji: '🌾' },
    { id: 'humanGeo', level: 1, q: 'What do we call the study of how people use and change the land?', a: 'human geography', wrong: ['physical geography', 'astronomy', 'weather'], emoji: '🌍' },
    { id: 'skyscraper', level: 1, q: 'What is a skyscraper?', a: 'a very tall building', wrong: ['a kind of rock', 'a type of tree', 'a wild animal'], emoji: '🏢' },
    { id: 'dam', level: 1, q: 'What is a dam?', a: 'a wall that holds back water', wrong: ['a kind of waterfall', 'a small island', 'a mountain pass'], emoji: '🚧' },
    { id: 'stilts', level: 2, q: 'Why do some people in flood-prone areas build houses on stilts?', a: 'to stay above floodwater', wrong: ['to be closer to the stars', 'to hide from animals', 'to catch more rain'], emoji: '🏠' },
    { id: 'coat', level: 2, q: 'Why do people in very cold places wear thick coats?', a: 'to hold in body heat', wrong: ['to look fancy', 'to keep bugs away', 'to swim faster'], emoji: '🧥' },
    { id: 'canoe', level: 2, q: 'Why is a canoe useful in a place with many lakes and rivers?', a: 'it can travel on water', wrong: ['it can fly over mountains', 'it runs on rails', 'it digs tunnels'], emoji: '🛶' },
    { id: 'irrigation', level: 2, q: 'Why do farmers in very dry places use irrigation?', a: 'to bring water to their crops', wrong: ['to make it rain', 'to keep crops frozen', 'to remove sand from soil'], emoji: '🚜' },
    { id: 'riverCity', level: 3, q: 'Why did many early cities grow up near rivers?', a: 'water for drinking and travel', wrong: ['sand for building', 'ice for winter', 'gold to dig up'], emoji: '🏙️' },
    { id: 'portCity', level: 3, q: 'What is a port city?', a: 'a city on a coast or river used for shipping', wrong: ['a city in a desert', 'a city inside a mountain', 'a city with no water'], emoji: '⚓' },
    { id: 'suburb', level: 3, q: 'What is a suburb?', a: 'an area just outside a city', wrong: ['the middle of a desert', 'a small island', 'a deep cave'], emoji: '🏘️' },
    { id: 'village', level: 3, q: 'What is a village?', a: 'a small group of homes', wrong: ['a very large city', 'a shopping mall', 'a deep lake'], emoji: '🏡' },
    { id: 'cityJobs', level: 3, q: 'Why do many people move to cities?', a: 'to find jobs', wrong: ['to find dinosaurs', 'to grow more snow', 'to hide from the sun'], emoji: '💼' },
  ],
)

const thenNow = factSkill(
  'thenNow',
  ['Long ago and today', 'Old tools and new tools', 'Homes, travel, and messages'],
  [
    { id: 'washing', level: 1, q: 'Long ago, people washed clothes by hand. What do many people use today?', a: 'a washing machine', wrong: ['a bicycle', 'a kite', 'a telescope'] },
    { id: 'candles', level: 1, q: 'Long ago, people used candles at night. What do we use today?', a: 'light bulbs', wrong: ['a rock', 'a drum', 'a sled'] },
    { id: 'letters', level: 1, q: 'Long ago, people sent letters by hand. How do many people send messages today?', a: 'by phone or computer', wrong: ['by drum beats', 'by sending a rock', 'by painting a wall'] },
    { id: 'schoolhouse', level: 1, q: 'Long ago, one room held all the grades in a school. What was it called?', a: 'a one-room schoolhouse', wrong: ['a skyscraper', 'an igloo', 'a castle'] },
    { id: 'icebox', level: 1, q: 'Long ago, people kept food cold in an icebox. What do we use today?', a: 'a refrigerator', wrong: ['a campfire', 'a cave', 'a sled'] },
    { id: 'faucet', level: 1, q: 'Long ago, people carried water from a well. What do many people use today?', a: 'a faucet', wrong: ['a sled', 'a kite', 'a drum'] },
    { id: 'quill', level: 1, q: 'Long ago, people wrote with a quill pen. What do many kids use today?', a: 'a pencil or pen', wrong: ['a stone tablet', 'a candle', 'a drum'] },
    { id: 'airplane', level: 1, q: 'Long ago, ships took weeks to cross the ocean. What is much faster today?', a: 'an airplane', wrong: ['a sled', 'a wagon', 'a camel'] },
    { id: 'tractor', level: 2, q: 'Long ago, farmers plowed fields with oxen. What do many farmers use today?', a: 'a tractor', wrong: ['a kite', 'a rocking chair', 'a bathtub'] },
    { id: 'clock', level: 2, q: 'Long ago, people told time with a sundial. What do we use today?', a: 'a clock or watch', wrong: ['a sled', 'a bucket', 'a kite'] },
    { id: 'stove', level: 2, q: 'Long ago, people cooked over an open fire. What do many homes use today?', a: 'a stove or oven', wrong: ['a snowbank', 'a cave wall', 'a sandbox'] },
    { id: 'computer', level: 2, q: 'Long ago, people typed letters on a typewriter. What do many people use today?', a: 'a computer', wrong: ['a drum', 'a sled', 'a kite'] },
    { id: 'factoryClothes', level: 2, q: 'Long ago, families sewed all their own clothes. What do many families buy today?', a: 'clothes made in factories', wrong: ['clothes that grow on trees', 'clothes made of stone', 'clothes they never wear'] },
    { id: 'railroad', level: 3, q: 'What spread across the land in the 1800s to carry people and goods?', a: 'railroads', wrong: ['sea roads', 'ice tunnels', 'airports'] },
    { id: 'runningWater', level: 3, q: 'Long ago, many homes had no running water. What do most homes have today?', a: 'running water', wrong: ['a stream in the yard', 'a rain barrel', 'a bucket by the door'] },
    { id: 'telegraph', level: 3, q: 'What did the telegraph send over wires?', a: 'messages in code', wrong: ['water', 'electric lights', 'wind'] },
  ],
)

const governmentBranches = factSkill(
  'governmentBranches',
  ['The three branches', 'The Senate and the House', 'Checks and balances'],
  [
    { id: 'executive', level: 1, q: 'Which branch carries out the laws?', a: 'the executive branch', wrong: ['the legislative branch', 'the judicial branch', 'the military branch'], emoji: '🏛️' },
    { id: 'judicial', level: 1, q: 'Which branch is the court system?', a: 'the judicial branch', wrong: ['the executive branch', 'the legislative branch', 'the military branch'] },
    { id: 'twoSenators', level: 1, q: 'How many senators does each state have?', a: 'two', wrong: ['one', 'three', 'four'], emoji: '🏛️' },
    { id: 'presidentTerm', level: 1, q: 'How many years is one term for a U.S. president?', a: 'four years', wrong: ['two years', 'six years', 'eight years'], emoji: '🇺🇸' },
    { id: 'senatorTerm', level: 1, q: 'How many years is one term for a U.S. senator?', a: 'six years', wrong: ['two years', 'four years', 'ten years'], emoji: '🏛️' },
    { id: 'houseTerm', level: 1, q: 'How many years is one term for a member of the House of Representatives?', a: 'two years', wrong: ['one year', 'four years', 'six years'], emoji: '🏛️' },
    { id: 'veto', level: 1, q: 'Who can veto, or say no to, a bill passed by Congress?', a: 'the president', wrong: ['the Supreme Court', 'a senator', 'the mayor'], emoji: '✋' },
    { id: 'constitution', level: 1, q: 'What is the highest law of the United States?', a: 'the Constitution', wrong: ['the Pledge of Allegiance', 'a state flag', 'school rules'], emoji: '📜' },
    { id: 'twoParts', level: 2, q: 'What are the two parts of Congress?', a: 'the Senate and the House', wrong: ['the Senate and the Court', 'the House and the President', 'the Court and the Army'], emoji: '🏛️' },
    { id: 'senate100', level: 2, q: 'Which part of Congress has 100 members?', a: 'the Senate', wrong: ['the House of Representatives', 'the Supreme Court', 'the Cabinet'], emoji: '💯' },
    { id: 'vicePresident', level: 2, q: 'Who leads the Senate as its presiding officer?', a: 'the vice president', wrong: ['the mayor', 'the governor', 'the first lady'], emoji: '🏛️' },
    { id: 'bill', level: 2, q: 'What do we call a proposed law before it is passed?', a: 'a bill', wrong: ['a coin', 'a vote', 'a ballot'], emoji: '📝' },
    { id: 'electedSenators', level: 2, q: 'How are U.S. senators chosen?', a: 'voters in their state elect them', wrong: ['the president picks them', 'a lottery picks them', 'the Supreme Court appoints them'], emoji: '🗳️' },
    { id: 'judicialReview', level: 3, q: 'Which branch can decide that a law goes against the Constitution?', a: 'the Supreme Court', wrong: ['the President', 'the House', 'the Army'], emoji: '⚖️' },
    { id: 'nominate', level: 3, q: 'Who nominates Supreme Court justices?', a: 'the president', wrong: ['a mayor', 'a governor', 'the Speaker'], emoji: '🧑‍⚖️' },
    { id: 'confirm', level: 3, q: 'Who must approve a Supreme Court nominee?', a: 'the Senate', wrong: ['a judge', 'the mayor', 'the army'], emoji: '✅' },
    { id: 'whyCheck', level: 3, q: 'Why do the three branches check each other?', a: 'so no branch gets too much power', wrong: ['so laws are longer', 'so the president can be a senator', 'so courts can make money'], emoji: '⚖️' },
  ],
  [{ skill: 'government', level: 2 }],
)

const supplyDemand = factSkill(
  'supplyDemand',
  ['Scarcity and choices', 'Supply and demand', 'Shortages and surpluses'],
  [
    { id: 'scarcity', level: 1, q: 'What do we call having only a limited amount of something people want?', a: 'scarcity', wrong: ['abundance', 'profit', 'a tax'], emoji: '💎' },
    { id: 'opportunity', level: 1, q: 'What is the best thing you give up when you make a choice?', a: 'opportunity cost', wrong: ['profit', 'a budget', 'a tax'], emoji: '⚖️' },
    { id: 'specialization', level: 1, q: 'When each person focuses on what they do best, what is it called?', a: 'specialization', wrong: ['competition', 'scarcity', 'a surplus'], emoji: '🔧' },
    { id: 'profit', level: 1, q: 'What is profit?', a: 'money left after paying costs', wrong: ['money a business borrows', 'the price of a toy', 'a tax on stores'], emoji: '💰' },
    { id: 'tax', level: 1, q: 'What is a tax?', a: 'money people pay to the government', wrong: ['money paid to a friend', 'a gift to a store', 'a loan from a bank'], emoji: '🧾' },
    { id: 'business', level: 1, q: 'What is a business?', a: 'a group that sells things to make money', wrong: ['a school', 'a park', 'a charity'], emoji: '🏪' },
    { id: 'price', level: 1, q: 'What is a price?', a: 'the amount of money you pay for something', wrong: ['how heavy something is', 'what color it is', 'how old it is'], emoji: '🏷️' },
    { id: 'competition', level: 1, q: 'When many businesses try to sell the same thing, what is it called?', a: 'competition', wrong: ['specialization', 'scarcity', 'profit'], emoji: '🏁' },
    { id: 'demand', level: 2, q: 'What is demand?', a: 'how much people want to buy something', wrong: ['how much is made', 'how much a store weighs', 'how many stores are open'], emoji: '🛍️' },
    { id: 'supply', level: 2, q: 'What is supply?', a: 'how much of something businesses make or sell', wrong: ['how much people want', 'the price of a store', 'how old a product is'], emoji: '📦' },
    { id: 'market', level: 2, q: 'What is a market?', a: 'a place where buyers and sellers meet', wrong: ['a school for shoppers', 'a bank for kids', 'a kind of coin'], emoji: '🛒' },
    { id: 'demandCheap', level: 2, q: 'When a product gets cheaper, what usually happens to how much people want it?', a: 'it goes up', wrong: ['it goes down', 'it stays exactly the same', 'it disappears'], emoji: '📉' },
    { id: 'supplyPrice', level: 2, q: 'When a price rises, what usually happens to how much businesses make?', a: 'it goes up', wrong: ['it goes down', 'it disappears', 'it stays at zero'], emoji: '📈' },
    { id: 'shortage', level: 3, q: 'What is a shortage?', a: 'when demand is more than supply', wrong: ['when supply is more than demand', 'when a store is closed', 'when money is lost'], emoji: '🚫' },
    { id: 'surplus', level: 3, q: 'What is a surplus?', a: 'when supply is more than demand', wrong: ['when demand is more than supply', 'when a store has no customers', 'when a product is brand new'], emoji: '📦' },
    { id: 'surplusLower', level: 3, q: 'If a store has too many toys, what might it do to sell them?', a: 'lower the price', wrong: ['raise the price', 'hide them in a closet', 'stop selling them forever'], emoji: '🏷️' },
    { id: 'equilibrium', level: 3, q: 'What do we call the price where supply and demand meet?', a: 'equilibrium price', wrong: ['a sale price', 'a markup', 'a free price'], emoji: '⚖️' },
    { id: 'shortageUp', level: 3, q: 'When there is a shortage, what usually happens to the price?', a: 'it goes up', wrong: ['it goes down', 'it stays the same', 'it becomes zero'], emoji: '📈' },
  ],
  [{ skill: 'economics', level: 3 }],
)

const revolutionEvents = factSkill(
  'revolutionEvents',
  ['Events before the war', 'The fighting begins', 'How the war ended'],
  [
    { id: 'teaParty', level: 1, q: 'What happened at the Boston Tea Party?', a: 'colonists dumped tea into Boston Harbor', wrong: ['colonists built a new ship', 'the king visited Boston', 'soldiers sailed home'], emoji: '🫖' },
    { id: 'stampAct', level: 1, q: 'Which tax on printed paper angered colonists in 1765?', a: 'the Stamp Act', wrong: ['the Sugar Act', 'the Tea Act', 'the Quartering Act'], emoji: '📄' },
    { id: 'noTaxes', level: 1, q: 'Colonists said "no taxation without representation." What did they mean?', a: 'they should have a say in the taxes', wrong: ['only kings should pay taxes', 'taxes should be paid in tea', 'taxes are not needed'], emoji: '🗳️' },
    { id: 'king', level: 1, q: 'Who was king of Britain during the American Revolution?', a: 'King George III', wrong: ['King Henry VIII', 'King Louis XIV', 'Queen Victoria'], emoji: '👑' },
    { id: 'lexington', level: 1, q: 'Which battles in 1775 started the Revolutionary War?', a: 'Lexington and Concord', wrong: ['Gettysburg and Antietam', 'Pearl Harbor and Midway', 'Yorktown and Saratoga'], emoji: '🔔' },
    { id: 'revere', level: 1, q: 'What did Paul Revere do in 1775?', a: 'warned colonists the British were coming', wrong: ['sailed a tea ship', 'wrote the Constitution', 'led an army in New York'], emoji: '🐎' },
    { id: 'patriot', level: 1, q: 'What was a Patriot in the Revolution?', a: 'a colonist who wanted independence', wrong: ['a soldier for the king', 'a tax collector', 'a ship captain'], emoji: '🇺🇸' },
    { id: 'loyalist', level: 1, q: 'What was a Loyalist in the Revolution?', a: 'a colonist who stayed loyal to the king', wrong: ['a colonist who wanted freedom', 'a French explorer', 'a new American president'], emoji: '🫡' },
    { id: 'bunkerHill', level: 2, q: 'Which battle near Boston in June 1775 cost the British many soldiers?', a: 'Bunker Hill', wrong: ['Gettysburg', 'Antietam', 'Pearl Harbor'], emoji: '⛰️' },
    { id: 'saratoga', level: 2, q: 'Which 1777 battle was a turning point because the Americans won?', a: 'Saratoga', wrong: ['Yorktown', 'Bunker Hill', 'Valley Forge'], emoji: '🏁' },
    { id: 'valleyForge', level: 2, q: 'Where did the Continental Army camp through a cold winter in 1777 and 1778?', a: 'Valley Forge', wrong: ['Gettysburg', 'Fort Sumter', 'Plymouth Rock'], emoji: '❄️' },
    { id: 'steuben', level: 2, q: 'Which Prussian officer trained American soldiers at Valley Forge?', a: 'Baron von Steuben', wrong: ['Lafayette', 'Rochambeau', 'Cornwallis'], emoji: '🎖️' },
    { id: 'france', level: 2, q: 'Which country sent money, ships, and soldiers to help the Americans?', a: 'France', wrong: ['Russia', 'Japan', 'Canada'], emoji: '🇫🇷' },
    { id: 'yorktown', level: 3, q: 'Where did British general Cornwallis surrender in 1781?', a: 'Yorktown', wrong: ['Saratoga', 'Boston', 'Philadelphia'], emoji: '🏳️' },
    { id: 'treatyParis', level: 3, q: 'Which treaty officially ended the Revolutionary War in 1783?', a: 'the Treaty of Paris', wrong: ['the Treaty of Versailles', 'the Treaty of Ghent', 'the Stamp Act'], emoji: '📜' },
    { id: 'recognized', level: 3, q: 'What did Britain agree to do in the 1783 treaty?', a: 'recognize American independence', wrong: ['give the colonies back to France', 'keep all the colonies', 'pay the colonists a tax'], emoji: '🤝' },
    { id: 'articles', level: 3, q: 'What was the first plan of government for the United States?', a: 'the Articles of Confederation', wrong: ['the Bill of Rights', 'the Monroe Doctrine', 'the Emancipation Proclamation'], emoji: '📜' },
  ],
  [{ skill: 'earlyAmerica', level: 3 }],
)

const landWater = factSkill(
  'landWater',
  ['Hills, lakes, and forests', 'Land by the water', 'Big land types'],
  [
    { id: 'lake', level: 1, q: 'What is a lake?', a: 'a large body of water with land all around', wrong: ['a tall pile of rock', 'a flat grassy field', 'a dry valley'], emoji: '🏞️' },
    { id: 'hill', level: 1, q: 'Which landform is lower and rounder than a mountain?', a: 'a hill', wrong: ['a glacier', 'a canyon', 'an ocean'], emoji: '⛰️' },
    { id: 'valley', level: 1, q: 'What is a low area of land between hills or mountains?', a: 'a valley', wrong: ['a plateau', 'an island', 'a sand dune'], emoji: '🏞️' },
    { id: 'forest', level: 1, q: 'What is a large area covered with many trees?', a: 'a forest', wrong: ['a desert', 'a prairie', 'a glacier'] },
    { id: 'waterfall', level: 1, q: 'Where a river drops steeply over rocks, what do we see?', a: 'a waterfall', wrong: ['a delta', 'a dune', 'a meadow'], emoji: '🌊' },
    { id: 'meadow', level: 1, q: 'What is a meadow?', a: 'a grassy field', wrong: ['a deep lake', 'a sandy dune', 'a snowy peak'], emoji: '🌾' },
    { id: 'pond', level: 1, q: 'What is a pond?', a: 'a small body of still water', wrong: ['a huge ocean', 'a steep cliff', 'a sand dune'], emoji: '🐸' },
    { id: 'cliff', level: 1, q: 'What is a cliff?', a: 'a very steep wall of rock', wrong: ['a flat plain', 'a small stream', 'a sandy beach'], emoji: '🧗' },
    { id: 'coast', level: 2, q: 'What do we call the land along the edge of the ocean?', a: 'the coast', wrong: ['the desert', 'the tundra', 'the summit'], emoji: '🏖️' },
    { id: 'harbor', level: 2, q: 'What is a harbor?', a: 'a sheltered place where ships can dock', wrong: ['a deep cave', 'a tall tower', 'a dry riverbed'], emoji: '⚓' },
    { id: 'beach', level: 2, q: 'What is a beach?', a: 'sand or pebbles at the edge of water', wrong: ['a deep valley', 'a tall glacier', 'a dry plain'], emoji: '🏖️' },
    { id: 'riverMouth', level: 2, q: 'Where does a river empty into a lake or sea?', a: 'the river mouth', wrong: ['the river source', 'the river bank', 'the river bed'], emoji: '🌊' },
    { id: 'lighthouse', level: 2, q: 'What is a lighthouse for?', a: 'to guide ships safely near the coast', wrong: ['to store food', 'to grow crops', 'to keep bees'], emoji: '🗼' },
    { id: 'tundra', level: 3, q: 'What is a cold, treeless land near the Arctic called?', a: 'tundra', wrong: ['rainforest', 'prairie', 'savanna'], emoji: '🧊' },
    { id: 'rainforest', level: 3, q: 'What is a warm, very wet forest full of tall trees called?', a: 'a rainforest', wrong: ['a tundra', 'a prairie', 'a desert'] },
    { id: 'prairie', level: 3, q: 'What is a large grassland with few trees called?', a: 'a prairie', wrong: ['a rainforest', 'a tundra', 'a swamp'], emoji: '🌾' },
    { id: 'savanna', level: 3, q: 'Which grassland has scattered trees, like in parts of Africa?', a: 'a savanna', wrong: ['a tundra', 'a rainforest', 'a glacier'], emoji: '🦒' },
    { id: 'taiga', level: 3, q: 'What is a snowy forest of evergreen trees called?', a: 'a taiga', wrong: ['a prairie', 'a rainforest', 'a tundra'], emoji: '🌲' },
  ],
)

export const SCIENCE_R4: Skill[] = [madeOf, colorsShapes, heatingCooling, humanImpacts, ecosystemRoles, plantScience, magnetPoles, climateWind]

export const SOCIAL_R4: Skill[] = [famousFirsts, moneyChoices, humanMade, thenNow, governmentBranches, supplyDemand, revolutionEvents, landWater]

// ============================================================================================
// IXL: which IXL topic each level practices (index 0 = level 1).
// ============================================================================================

const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })
const soc = (grade: number, category: string): IxlRef => ({ subject: 'social-studies', grade, category })

export const SCIENCE_SOCIAL_R4_IXL: Record<string, IxlRef[]> = {
  'science.madeOf': [sci(0, 'Materials'), sci(1, 'Materials'), sci(2, 'Materials')],
  'science.colorsShapes': [sci(0, 'Shapes and colors'), sci(0, 'Shapes and colors'), sci(1, 'Shapes and colors')],
  'science.heatingCooling': [sci(1, 'Heating and cooling'), sci(1, 'Heating and cooling'), sci(1, 'Heating and cooling')],
  'science.humanImpacts': [sci(0, 'Human impacts'), sci(2, 'Human impacts'), sci(2, 'Human impacts')],
  'science.ecosystemRoles': [sci(3, 'Ecosystems'), sci(3, 'Ecosystems'), sci(3, 'Ecosystems')],
  'science.plantScience': [sci(3, 'Plants'), sci(4, 'Plants'), sci(5, 'Plants')],
  'science.magnetPoles': [sci(3, 'Magnets'), sci(4, 'Magnets'), sci(5, 'Magnets')],
  'science.climateWind': [sci(5, 'Weather and climate'), sci(5, 'Weather and climate'), sci(5, 'Weather and climate')],

  'social.famousFirsts': [soc(1, 'Read along about famous people'), soc(2, 'Read about historical figures'), soc(2, 'Read about historical figures')],
  'social.moneyChoices': [soc(1, 'Economics'), soc(1, 'Economics'), soc(2, 'Economics')],
  'social.humanMade': [soc(2, 'Human geography'), soc(2, 'Human geography'), soc(2, 'Human geography')],
  'social.thenNow': [soc(0, 'Then and now'), soc(0, 'Then and now'), soc(1, 'Then and now')],
  'social.governmentBranches': [soc(3, 'Government'), soc(3, 'Government'), soc(3, 'Government')],
  'social.supplyDemand': [soc(4, 'Basic economic principles'), soc(4, 'Supply and demand'), soc(5, 'Supply and demand')],
  'social.revolutionEvents': [soc(5, 'The American Revolution'), soc(5, 'The American Revolution'), soc(5, 'The American Revolution')],
  'social.landWater': [soc(1, 'Physical geography'), soc(1, 'Physical geography'), soc(1, 'Physical geography')],
}
