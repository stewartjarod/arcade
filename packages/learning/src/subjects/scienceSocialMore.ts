import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { upToLevel, wrongFrom } from './util'

/**
 * More Science and Social Studies, aimed at IXL grades 3 to 5 (plus a few K-2 gaps).
 * Skill ids here must not collide with scienceSocial.ts. Every question is a multiple-choice
 * fact from a hand-checked list; wrong answers are listed per fact and never count as right.
 */

interface Fact {
  /** Unique inside its skill. It becomes part of the item key, so never rename it. */
  id: string
  /** The first level this fact shows up at (1 = the first level). */
  level: number
  q: string
  a: string
  /** Believable wrong answers. At least 3, none of them correct. */
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

const rocks = factSkill(
  'rocks',
  ['Rocks and minerals', 'Kinds of rock', 'How rocks form', 'The rock cycle'],
  [
    { id: 'minerals', level: 1, q: 'Rocks are made of tiny pieces called what?', a: 'minerals', wrong: ['seeds', 'feathers', 'bubbles'] },
    { id: 'quartz', level: 1, q: 'Which one is a mineral?', a: 'quartz', wrong: ['a leaf', 'a puppy', 'a bicycle'] },
    { id: 'diamond', level: 1, q: 'Which mineral is the hardest of all?', a: 'diamond', wrong: ['gold', 'chalk', 'salt'] },
    { id: 'gold', level: 1, q: 'Which shiny yellow mineral is very valuable?', a: 'gold', wrong: ['chalk', 'a sponge', 'a cloud'] },
    { id: 'granite', level: 1, q: 'Which rock has sparkly crystals and is used for kitchen counters?', a: 'granite', wrong: ['pumice', 'chalk', 'a sponge'] },
    { id: 'pumice', level: 1, q: 'Which rock is so light that it can float on water?', a: 'pumice', wrong: ['granite', 'marble', 'basalt'] },
    { id: 'marble', level: 1, q: 'Michelangelo carved his statue David from which white rock?', a: 'marble', wrong: ['pumice', 'coal', 'obsidian'] },
    { id: 'sand', level: 1, q: 'What do we call tiny bits of rock on a beach?', a: 'sand', wrong: ['seeds', 'feathers', 'leaves'] },
    { id: 'igneous', level: 2, q: 'Which kind of rock forms when melted rock cools and hardens?', a: 'igneous rock', wrong: ['sedimentary rock', 'metamorphic rock', 'a mineral'] },
    { id: 'sedimentary', level: 2, q: 'Which kind of rock forms from layers of sand, mud, and shells pressed together?', a: 'sedimentary rock', wrong: ['igneous rock', 'metamorphic rock', 'a mineral'] },
    { id: 'metamorphic', level: 2, q: 'Which kind of rock forms when heat and pressure change an old rock?', a: 'metamorphic rock', wrong: ['igneous rock', 'sedimentary rock', 'a mineral'] },
    { id: 'basalt', level: 2, q: 'Basalt is which kind of rock?', a: 'igneous rock', wrong: ['sedimentary rock', 'metamorphic rock', 'a mineral'] },
    { id: 'sandstone', level: 2, q: 'Sandstone is which kind of rock?', a: 'sedimentary rock', wrong: ['igneous rock', 'metamorphic rock', 'a mineral'] },
    { id: 'marbleKind', level: 2, q: 'Marble is which kind of rock?', a: 'metamorphic rock', wrong: ['igneous rock', 'sedimentary rock', 'a mineral'] },
    { id: 'obsidian', level: 2, q: 'Obsidian is shiny black glass made when lava cools very fast. Which kind of rock is it?', a: 'igneous rock', wrong: ['sedimentary rock', 'metamorphic rock', 'a mineral'] },
    { id: 'limestone', level: 2, q: 'Limestone is made from shells and bits of sea life. Which kind of rock is it?', a: 'sedimentary rock', wrong: ['igneous rock', 'metamorphic rock', 'a mineral'] },
    { id: 'weathering', level: 3, q: 'What breaks big rocks into smaller pieces over a very long time?', a: 'weathering', wrong: ['shadows', 'rainbows', 'echoes'] },
    { id: 'erosion', level: 3, q: 'What moves rock and soil pieces from one place to another?', a: 'erosion', wrong: ['shadows', 'rainbows', 'echoes'] },
    { id: 'cementation', level: 3, q: 'Sand grains get glued together by minerals to make rock. What is this called?', a: 'cementation', wrong: ['erosion', 'melting', 'freezing'] },
    { id: 'magmaUnder', level: 3, q: 'Melted rock under the ground is called what?', a: 'magma', wrong: ['sand', 'ice', 'pebbles'] },
    { id: 'lavaTop', level: 3, q: 'Melted rock that flows out onto the ground is called what?', a: 'lava', wrong: ['sand', 'ice', 'pebbles'] },
    { id: 'bigCrystals', level: 3, q: 'Granite cools slowly deep underground. What size crystals does it have?', a: 'big crystals', wrong: ['small crystals', 'tiny bubbles', 'sand grains'] },
    { id: 'smallCrystals', level: 3, q: 'Basalt cools quickly on the ground. What size crystals does it have?', a: 'small crystals', wrong: ['big crystals', 'tiny bubbles', 'sand grains'] },
    { id: 'metamorphism', level: 3, q: 'What do we call it when heat and pressure change one kind of rock into another?', a: 'metamorphism', wrong: ['weathering', 'erosion', 'cementation'] },
    { id: 'rockCycle', level: 4, q: 'What do we call the never-ending process that changes rocks from one kind into another?', a: 'the rock cycle', wrong: ['the water cycle', 'the food chain', 'the life cycle'] },
    { id: 'limestoneShells', level: 4, q: 'Which rock is made from the shells of tiny sea creatures?', a: 'limestone', wrong: ['granite', 'basalt', 'obsidian'] },
    { id: 'oldestLayer', level: 4, q: 'In a stack of undisturbed rock layers, which layer is the oldest?', a: 'the bottom layer', wrong: ['the top layer', 'the middle layer', 'the side layer'] },
    { id: 'mohs', level: 4, q: 'Which scale measures how hard a mineral is?', a: 'the Mohs scale', wrong: ['the Richter scale', 'the Fahrenheit scale', 'the Beaufort scale'] },
    { id: 'slate', level: 4, q: 'Slate is a metamorphic rock made from which older rock?', a: 'shale', wrong: ['granite', 'basalt', 'pumice'] },
    { id: 'fossilRock', level: 4, q: 'Fossils are most often found in which kind of rock?', a: 'sedimentary rock', wrong: ['igneous rock', 'metamorphic rock', 'a mineral'] },
  ],
)

const earthEvents = factSkill(
  'earthEvents',
  ['Earthquakes, volcanoes, and waves', 'How Earth changes', 'Inside the Earth'],
  [
    { id: 'lavaOut', level: 1, q: 'What comes out of a volcano when it erupts?', a: 'lava', wrong: ['snow', 'ice cubes', 'rainbows'] },
    { id: 'shakeEvent', level: 1, q: 'Which natural event shakes the ground?', a: 'an earthquake', wrong: ['a rainbow', 'a rainstorm', 'a snowstorm'] },
    { id: 'eqCause', level: 1, q: 'What makes the ground shake in an earthquake?', a: 'rocks moving deep underground', wrong: ['a loud truck', 'a big wind', 'a flood'] },
    { id: 'tsunami', level: 1, q: 'A giant wave caused by an earthquake under the ocean is called what?', a: 'a tsunami', wrong: ['a hurricane', 'a blizzard', 'a tornado'] },
    { id: 'erosion', level: 1, q: 'What is it called when wind and water wear away rock and soil?', a: 'erosion', wrong: ['a volcano', 'an earthquake', 'a rainbow'] },
    { id: 'dropCover', level: 1, q: 'What should you do during an earthquake?', a: 'drop, cover, and hold on', wrong: ['run outside', 'stand by a window', 'take the elevator'] },
    { id: 'volcanoLand', level: 1, q: 'Which landform is built up when lava piles up over time?', a: 'a volcano', wrong: ['a canyon', 'a valley', 'a lake'] },
    { id: 'fault', level: 1, q: 'What is a large crack in Earth where rocks slip called?', a: 'a fault', wrong: ['a valley', 'a canyon', 'a tunnel'] },
    { id: 'magmaWord', level: 1, q: 'What is very hot melted rock under the ground called?', a: 'magma', wrong: ['ice', 'sand', 'pebbles'] },
    { id: 'plates', level: 2, q: "Earth's outer shell is broken into big pieces called what?", a: 'tectonic plates', wrong: ['sheets of paper', 'bricks', 'blankets'] },
    { id: 'mountains', level: 2, q: 'What can happen when two tectonic plates push together?', a: 'mountains rise up', wrong: ['the ocean dries up', 'the Moon gets closer', 'the sky turns green'] },
    { id: 'canyon', level: 2, q: 'What carved the Grand Canyon over millions of years?', a: 'a river', wrong: ['a volcano', 'an earthquake', 'a snowstorm'] },
    { id: 'glacier', level: 2, q: 'What is a huge, slow-moving sheet of ice called?', a: 'a glacier', wrong: ['a waterfall', 'a volcano', 'a sand dune'] },
    { id: 'dune', level: 2, q: 'What is a hill of sand shaped by the wind called?', a: 'a sand dune', wrong: ['a valley', 'a volcano', 'a lake'] },
    { id: 'crust', level: 2, q: 'What is the thin, rocky outer layer of Earth called?', a: 'the crust', wrong: ['the core', 'the mantle', 'the atmosphere'] },
    { id: 'mantle', level: 2, q: "Which thick layer of hot rock lies under Earth's crust?", a: 'the mantle', wrong: ['the crust', 'the core', 'the atmosphere'] },
    { id: 'seismograph', level: 2, q: 'Which tool records the shaking of an earthquake?', a: 'a seismograph', wrong: ['a thermometer', 'a rain gauge', 'a compass'] },
    { id: 'epicenter', level: 3, q: "What is the point on Earth's surface right above where an earthquake starts?", a: 'the epicenter', wrong: ['the crater', 'the equator', 'the summit'] },
    { id: 'plateEdges', level: 3, q: 'Where do most earthquakes happen?', a: 'along the edges of tectonic plates', wrong: ['in the middle of deserts', 'at the bottom of lakes', 'on top of tall icebergs'] },
    { id: 'ringFire', level: 3, q: 'Which area around the Pacific Ocean has many volcanoes and earthquakes?', a: 'the Ring of Fire', wrong: ['the Sahara', 'the Great Plains', 'the Arctic'] },
    { id: 'landslide', level: 3, q: 'What is a fast slide of rock or soil down a hill called?', a: 'a landslide', wrong: ['a glacier', 'a sand dune', 'a tsunami'] },
    { id: 'hotSpring', level: 3, q: 'What is hot underground water that bubbles up at the surface called?', a: 'a hot spring', wrong: ['a glacier', 'a canyon', 'a sand dune'] },
    { id: 'meander', level: 3, q: 'What is the curvy bend in a river called?', a: 'a meander', wrong: ['a delta', 'a fault', 'a volcano'] },
  ],
)

const waterCycle = factSkill(
  'waterCycle',
  ['Evaporation, condensation, and rain', 'Water underground and in the air', "Earth's four systems"],
  [
    { id: 'evap', level: 1, q: 'When the Sun heats water and it turns into a gas, what is this called?', a: 'evaporation', wrong: ['condensation', 'precipitation', 'freezing'] },
    { id: 'cond', level: 1, q: 'When water vapor cools and forms tiny droplets in the sky, what is this called?', a: 'condensation', wrong: ['evaporation', 'melting', 'boiling'] },
    { id: 'precip', level: 1, q: 'Water that falls from clouds as rain, snow, sleet, or hail is called what?', a: 'precipitation', wrong: ['evaporation', 'condensation', 'melting'] },
    { id: 'collect', level: 1, q: "Where is most of Earth's water stored?", a: 'in the oceans', wrong: ['in the clouds', 'in the deserts', 'in the rivers'] },
    { id: 'sun', level: 1, q: 'What powers the water cycle?', a: 'the Sun', wrong: ['the Moon', 'a campfire', 'a flashlight'] },
    { id: 'transp', level: 1, q: 'What do we call water that plants release from their leaves into the air?', a: 'transpiration', wrong: ['condensation', 'erosion', 'precipitation'] },
    { id: 'runoff', level: 1, q: 'What do we call water that flows over land back into rivers and oceans?', a: 'runoff', wrong: ['condensation', 'evaporation', 'pollen'] },
    { id: 'groundwater', level: 2, q: 'Water stored underground in soil and rock is called what?', a: 'groundwater', wrong: ['runoff', 'condensation', 'a glacier'] },
    { id: 'infiltration', level: 2, q: 'What is it called when water soaks into the soil?', a: 'infiltration', wrong: ['evaporation', 'condensation', 'precipitation'] },
    { id: 'dew', level: 2, q: 'What are the tiny drops of water on grass in the morning called?', a: 'dew', wrong: ['frost', 'hail', 'sleet'] },
    { id: 'humidity', level: 2, q: 'What is the amount of water vapor in the air called?', a: 'humidity', wrong: ['pressure', 'temperature', 'visibility'] },
    { id: 'vapor', level: 2, q: 'What is water vapor?', a: 'water in the form of a gas', wrong: ['water in the form of ice', 'a kind of rock', 'a kind of cloud'] },
    { id: 'hydro', level: 3, q: 'Which Earth system is all the oceans, lakes, and rivers?', a: 'the hydrosphere', wrong: ['the atmosphere', 'the biosphere', 'the lithosphere'] },
    { id: 'atmo', level: 3, q: 'Which Earth system is the layer of air that surrounds Earth?', a: 'the atmosphere', wrong: ['the hydrosphere', 'the biosphere', 'the lithosphere'] },
    { id: 'bio', level: 3, q: 'Which Earth system includes all living things?', a: 'the biosphere', wrong: ['the hydrosphere', 'the atmosphere', 'the lithosphere'] },
    { id: 'litho', level: 3, q: 'Which Earth system is the solid rock and soil of the land?', a: 'the lithosphere', wrong: ['the hydrosphere', 'the atmosphere', 'the biosphere'] },
  ],
)

const adaptations = factSkill(
  'adaptations',
  ['Body parts that help animals survive', 'How animals and plants survive', 'Adaptations for hard places'],
  [
    { id: 'camelFat', level: 1, q: "A camel's hump stores what?", a: 'fat', wrong: ['water', 'sand', 'air'] },
    { id: 'polarFur', level: 1, q: "A polar bear's white fur helps it do what?", a: 'blend in with the snow', wrong: ['swim faster on land', 'fly away', 'glow in the dark'] },
    { id: 'cactusStem', level: 1, q: 'Why does a cactus have a thick, fleshy stem?', a: 'to store water', wrong: ['to float on water', 'to catch snow', 'to make shade for bugs'] },
    { id: 'duckFeet', level: 1, q: 'What helps a duck paddle through water?', a: 'webbed feet', wrong: ['sharp claws', 'a long tail', 'a long neck'] },
    { id: 'owlEyes', level: 1, q: 'What helps an owl hunt at night?', a: 'big eyes that see well in the dark', wrong: ['a bright beak', 'a strong tail', 'a long tongue'] },
    { id: 'giraffeNeck', level: 1, q: "A giraffe's long neck helps it do what?", a: 'reach leaves high in trees', wrong: ['swim fast', 'hide in tall grass', 'fly'] },
    { id: 'gills', level: 2, q: 'How do fish breathe under water?', a: 'with gills', wrong: ['with fur', 'with wings', 'with feathers'] },
    { id: 'cactusSpines', level: 2, q: 'Why do many cactuses have spines instead of wide leaves?', a: 'to lose less water', wrong: ['to catch more sunlight', 'to look pretty', 'to scare away rain'] },
    { id: 'migration', level: 2, q: 'What is it called when animals travel to a warmer place for winter?', a: 'migration', wrong: ['camouflage', 'hibernation', 'molting'] },
    { id: 'hibernation', level: 2, q: 'What is it called when an animal sleeps through the cold winter?', a: 'hibernation', wrong: ['migration', 'camouflage', 'molting'] },
    { id: 'warningColors', level: 2, q: 'Some frogs have bright colors that warn predators to stay away. What is this called?', a: 'warning colors', wrong: ['camouflage', 'migration', 'molting'] },
    { id: 'adaptationName', level: 3, q: 'What do we call a body part or behavior that helps a living thing survive where it lives?', a: 'an adaptation', wrong: ['a habitat', 'a food chain', 'a fossil'] },
    { id: 'camouflage', level: 3, q: "What is it called when an animal's color helps it blend in with its surroundings?", a: 'camouflage', wrong: ['migration', 'hibernation', 'warning colors'] },
    { id: 'desertRoots', level: 3, q: 'Why do some desert plants grow very deep roots?', a: 'to reach water deep underground', wrong: ['to float on water', 'to hide from bugs', 'to stay cold'] },
    { id: 'mimicry', level: 3, q: 'What is it called when a harmless animal looks like a dangerous one?', a: 'mimicry', wrong: ['migration', 'hibernation', 'molting'] },
  ],
)

const traits = factSkill(
  'traits',
  ['Traits we inherit', 'Genes and traits', 'Heredity'],
  [
    { id: 'trait', level: 1, q: 'What do we call a feature like eye color or hair color?', a: 'a trait', wrong: ['a toy', 'a feeling', 'a season'] },
    { id: 'eyeInherit', level: 1, q: 'Which one is inherited from your parents?', a: 'eye color', wrong: ['riding a bike', 'reading a book', 'swimming'] },
    { id: 'bikeLearn', level: 1, q: 'Which one is learned, not inherited?', a: 'riding a bike', wrong: ['eye color', 'hair color', 'freckles'] },
    { id: 'freckles', level: 1, q: 'Which one is a physical trait?', a: 'freckles', wrong: ['a favorite song', 'a favorite food', 'a school subject'] },
    { id: 'kittens', level: 1, q: 'Why do kittens often look like their parents?', a: 'they inherit traits from them', wrong: ['they learn their looks', 'they eat the same food', 'they live in the same house'] },
    { id: 'fetch', level: 1, q: 'Which dog behavior is learned?', a: 'fetching a ball', wrong: ['floppy ears', 'a curly tail', 'brown fur'] },
    { id: 'hairColor', level: 1, q: 'Which trait is passed from parents to children?', a: 'hair color', wrong: ['a favorite sport', 'a favorite song', 'a school lunch'] },
    { id: 'writeName', level: 1, q: 'Which skill do people learn by practicing?', a: 'writing their name', wrong: ['eye color', 'hair color', 'ear shape'] },
    { id: 'genes', level: 2, q: 'What tiny parts carry traits from parents to children?', a: 'genes', wrong: ['shadows', 'muscles', 'magnets'] },
    { id: 'bothParents', level: 2, q: 'Children get their traits from which people?', a: 'both parents', wrong: ['only their teachers', 'their neighbors', 'their pets'] },
    { id: 'furColor', level: 2, q: 'Which trait does a dog get from its parents?', a: 'the color of its fur', wrong: ['knowing how to sit', 'a favorite toy', 'knowing tricks'] },
    { id: 'littermates', level: 2, q: 'Why do puppies from the same litter look a little different?', a: 'they inherit different mixes of traits', wrong: ['they were fed different food', 'they live in different houses', 'they have different birthdays'] },
    { id: 'heredity', level: 3, q: 'What do we call passing traits from parents to their children?', a: 'heredity', wrong: ['evaporation', 'migration', 'erosion'] },
    { id: 'mendel', level: 3, q: 'Which scientist studied pea plants to learn how traits are passed on?', a: 'Gregor Mendel', wrong: ['Thomas Edison', 'Isaac Newton', 'Charles Darwin'] },
    { id: 'catFur', level: 3, q: 'A black cat has kittens. Which trait can the kittens inherit from it?', a: 'fur color', wrong: ['a favorite nap spot', 'a love of water', 'a favorite toy'] },
  ],
)

const electricity = factSkill(
  'electricity',
  ['Electric circuits', 'Conductors and insulators', 'Series and parallel'],
  [
    { id: 'closed', level: 1, q: 'A circuit only works when it is what?', a: 'closed', wrong: ['open', 'broken', 'cut'] },
    { id: 'battery', level: 1, q: 'What gives a simple circuit its energy?', a: 'a battery', wrong: ['a sponge', 'a cloud', 'a pencil'] },
    { id: 'wires', level: 1, q: 'What carries electricity around a circuit?', a: 'wires', wrong: ['pillows', 'feathers', 'sand'] },
    { id: 'bulb', level: 1, q: 'Which part of a circuit makes light?', a: 'a light bulb', wrong: ['a battery', 'a wire', 'a switch'] },
    { id: 'switch', level: 1, q: 'Which part of a circuit turns the light on and off?', a: 'a switch', wrong: ['a battery', 'a wire', 'a light bulb'] },
    { id: 'current', level: 1, q: 'What do we call the flow of electricity through a circuit?', a: 'electric current', wrong: ['a shadow', 'a rainbow', 'a magnet'] },
    { id: 'openStop', level: 1, q: 'What happens when a circuit is open?', a: 'the light stays off', wrong: ['the light gets brighter', 'the light turns green', 'the battery grows'] },
    { id: 'copper', level: 2, q: 'Which material lets electricity flow through it easily?', a: 'copper', wrong: ['rubber', 'plastic', 'wood'] },
    { id: 'rubber', level: 2, q: 'Which material stops electricity from flowing through it?', a: 'rubber', wrong: ['copper', 'aluminum', 'iron'] },
    { id: 'plasticCover', level: 2, q: 'Why are electric wires covered with plastic?', a: 'to keep people safe from shocks', wrong: ['to make them shiny', 'to make them lighter', 'to make them colorful'] },
    { id: 'foil', level: 2, q: 'Which material is a good conductor of electricity?', a: 'aluminum foil', wrong: ['a plastic cup', 'a wooden stick', 'a rubber glove'] },
    { id: 'woodInsulator', level: 2, q: 'Is dry wood a conductor or an insulator?', a: 'an insulator', wrong: ['a conductor', 'a switch', 'a battery'] },
    { id: 'series', level: 3, q: 'In a series circuit, what happens if one bulb burns out?', a: 'all the bulbs go out', wrong: ['the others get brighter', 'the battery explodes', 'nothing happens at all'] },
    { id: 'parallel', level: 3, q: 'In a parallel circuit, what happens if one bulb burns out?', a: 'the other bulbs stay on', wrong: ['all the bulbs go out', 'the battery gets hot', 'the wires melt'] },
    { id: 'batteryChem', level: 3, q: 'A battery changes stored chemical energy into what?', a: 'electrical energy', wrong: ['sound energy', 'wind energy', 'tide energy'] },
    { id: 'motor', level: 3, q: 'An electric motor changes electrical energy into what?', a: 'motion', wrong: ['shadows', 'rainbows', 'darkness'] },
    { id: 'electromagnet', level: 3, q: 'An electromagnet is made by wrapping a wire around what?', a: 'an iron nail', wrong: ['a rubber ball', 'a wooden stick', 'a paper cup'] },
  ],
  [{ skill: 'magnets', level: 2 }],
)

const heat = factSkill(
  'heat',
  ['Hot and cold', 'How heat moves', 'Temperature and particles'],
  [
    { id: 'hotCold', level: 1, q: 'Heat always moves from what to what?', a: 'hot to cold', wrong: ['cold to hot', 'it stays in one place', 'it only goes up'] },
    { id: 'iceMelts', level: 1, q: 'What happens to ice when it gets warm?', a: 'it melts', wrong: ['it grows bigger', 'it turns purple', 'it gets louder'], emoji: '🧊' },
    { id: 'sunHeat', level: 1, q: 'What gives us heat from very far away?', a: 'the Sun', wrong: ['the Moon', 'a rock', 'a cloud'] },
    { id: 'stove', level: 1, q: 'Which one gives off heat when you cook food?', a: 'a stove', wrong: ['a pillow', 'a book', 'a pencil'] },
    { id: 'thermo', level: 1, q: 'Which tool measures how hot or cold something is?', a: 'a thermometer', wrong: ['a ruler', 'a clock', 'a scale'] },
    { id: 'cocoa', level: 1, q: 'What happens to hot cocoa left on the table for a long time?', a: 'it gets cooler', wrong: ['it gets hotter', 'it freezes solid', 'it boils harder'] },
    { id: 'mitten', level: 1, q: 'Which one keeps you warm in winter?', a: 'a wool mitten', wrong: ['a metal spoon', 'a plastic bag', 'a rock'], emoji: '🧤' },
    { id: 'temperature', level: 1, q: 'What is the word for how hot or cold something is?', a: 'temperature', wrong: ['weight', 'color', 'sound'] },
    { id: 'conduction', level: 2, q: 'Heat moves through a metal spoon from hot soup to your hand. What is this called?', a: 'conduction', wrong: ['convection', 'radiation', 'evaporation'] },
    { id: 'convection', level: 2, q: 'Hot air and water rise while cool air and water sink. What is this way of moving heat called?', a: 'convection', wrong: ['conduction', 'radiation', 'condensation'] },
    { id: 'radiation', level: 2, q: 'Heat from a campfire reaches you through the air, traveling in waves. What is this kind of heat movement called?', a: 'radiation', wrong: ['conduction', 'convection', 'insulation'] },
    { id: 'metal', level: 2, q: 'Which material is a good conductor of heat?', a: 'metal', wrong: ['wool', 'foam', 'cork'] },
    { id: 'wool', level: 2, q: 'Which material keeps heat from moving out?', a: 'wool', wrong: ['a metal pan', 'an iron spoon', 'a steel bowl'] },
    { id: 'thermalEnergy', level: 3, q: 'What do we call the energy of moving particles that makes something warm?', a: 'thermal energy', wrong: ['sound energy', 'light energy', 'chemical energy'] },
    { id: 'fasterParticles', level: 3, q: 'When a substance gets hotter, its particles move how?', a: 'faster', wrong: ['slower', 'not at all', 'backward'] },
    { id: 'bridgeGaps', level: 3, q: 'Why do long bridges have gaps between their sections?', a: 'so they can expand when it gets hot', wrong: ['so boats can float by', 'so birds can nest', 'so cars can drive faster'] },
    { id: 'thermoLiquid', level: 3, q: 'Why does the liquid in a thermometer rise when it gets hot?', a: 'the liquid expands', wrong: ['the liquid shrinks', 'the liquid disappears', 'the liquid turns to ice'] },
    { id: 'freezeC', level: 3, q: 'At sea level, what temperature in Celsius does water freeze?', a: '0 degrees Celsius', wrong: ['10 degrees Celsius', '50 degrees Celsius', '100 degrees Celsius'] },
    { id: 'boilC', level: 3, q: 'At sea level, what temperature in Celsius does water boil?', a: '100 degrees Celsius', wrong: ['0 degrees Celsius', '10 degrees Celsius', '50 degrees Celsius'] },
  ],
)

const energy = factSkill(
  'energy',
  ['Energy all around', 'Energy changes form', 'Energy and motion'],
  [
    { id: 'energyWord', level: 1, q: 'What do we call the ability to do work or make things change?', a: 'energy', wrong: ['a color', 'a shadow', 'a cloud'] },
    { id: 'kinetic', level: 1, q: 'A rolling ball has which kind of energy?', a: 'kinetic energy', wrong: ['potential energy', 'chemical energy', 'sound energy'] },
    { id: 'sunSource', level: 1, q: "Where does almost all of Earth's energy come from?", a: 'the Sun', wrong: ['the Moon', 'the wind alone', 'the ocean floor'] },
    { id: 'plantFood', level: 1, q: 'What do plants use sunlight to make?', a: 'food', wrong: ['sand', 'rocks', 'air'] },
    { id: 'chemicalFood', level: 1, q: 'What kind of energy is stored in food?', a: 'chemical energy', wrong: ['sound energy', 'light energy', 'wind energy'] },
    { id: 'drumSound', level: 1, q: 'When you hit a drum, what kind of energy does it make?', a: 'sound', wrong: ['light', 'a magnet', 'a shadow'] },
    { id: 'potential', level: 2, q: 'A stretched rubber band stores what kind of energy?', a: 'potential energy', wrong: ['kinetic energy', 'sound energy', 'light energy'] },
    { id: 'toaster', level: 2, q: 'A toaster changes electrical energy into what?', a: 'heat', wrong: ['shadows', 'magnetism', 'rain'] },
    { id: 'flashlight', level: 2, q: 'A flashlight changes stored chemical energy into what?', a: 'light', wrong: ['sound', 'magnetism', 'shadows'] },
    { id: 'conservation', level: 2, q: 'Energy is never made from nothing or destroyed. It only changes form. What is this rule called?', a: 'conservation of energy', wrong: ['gravity', 'friction', 'the water cycle'] },
    { id: 'fastKinetic', level: 3, q: 'Which moving object has more kinetic energy: a slow one or a fast one of the same weight?', a: 'the fast one', wrong: ['the slow one', 'they have the same', 'neither has any energy'] },
    { id: 'slowingHeat', level: 3, q: 'When a rolling ball slows down on the ground, where does its kinetic energy go?', a: 'into heat', wrong: ['it disappears completely', 'it turns into water', 'it turns into shadows'] },
    { id: 'batteryChemical', level: 3, q: 'What kind of energy is stored inside a battery?', a: 'chemical energy', wrong: ['sound energy', 'kinetic energy', 'wind energy'] },
    { id: 'potentialHill', level: 3, q: 'A ball at the top of a hill has which kind of energy?', a: 'potential energy', wrong: ['kinetic energy', 'sound energy', 'light energy'] },
  ],
  [{ skill: 'forcesAdvanced', level: 2 }],
)

const simpleMachines = factSkill(
  'simpleMachines',
  ['Simple machines help us', 'Levers and ramps', 'Mechanical advantage'],
  [
    { id: 'lever', level: 1, q: 'A seesaw is an example of which simple machine?', a: 'a lever', wrong: ['a ramp', 'a wheel', 'a screw'] },
    { id: 'ramp', level: 1, q: 'A slide is a kind of which simple machine?', a: 'a ramp', wrong: ['a lever', 'a pulley', 'a wedge'] },
    { id: 'wheelAxle', level: 1, q: 'Which simple machine helps a car roll along?', a: 'a wheel and axle', wrong: ['a lever', 'a screw', 'a wedge'] },
    { id: 'pulley', level: 1, q: 'Which simple machine lifts a flag up a pole?', a: 'a pulley', wrong: ['a lever', 'a ramp', 'a screw'] },
    { id: 'screw', level: 1, q: 'Which simple machine is a spiral that holds boards together?', a: 'a screw', wrong: ['a ramp', 'a lever', 'a wheel'] },
    { id: 'wedge', level: 1, q: 'An axe or a knife blade is which simple machine?', a: 'a wedge', wrong: ['a pulley', 'a lever', 'a wheel'] },
    { id: 'workEase', level: 1, q: 'What does a simple machine help us do?', a: 'do work with less effort', wrong: ['make more noise', 'change color', 'make things heavier'] },
    { id: 'fulcrum', level: 2, q: 'What is the point a lever turns around called?', a: 'the fulcrum', wrong: ['the handle', 'the axle', 'the pulley'] },
    { id: 'bottleOpener', level: 2, q: 'A bottle opener is a kind of which simple machine?', a: 'a lever', wrong: ['a ramp', 'a pulley', 'a screw'] },
    { id: 'rampForce', level: 2, q: 'Why is it easier to push a box up a ramp than to lift it straight up?', a: 'it needs less force', wrong: ['it needs more force', 'it makes the box heavier', 'it needs no force at all'] },
    { id: 'rampDistance', level: 2, q: 'To save force, a ramp makes you use more of what?', a: 'distance', wrong: ['force', 'muscles', 'heat'] },
    { id: 'compound', level: 3, q: 'A machine made from two or more simple machines is called what?', a: 'a compound machine', wrong: ['a magnet', 'a battery', 'a telescope'] },
    { id: 'mechAdv', level: 3, q: 'What do we call how much a machine multiplies the force put into it?', a: 'mechanical advantage', wrong: ['friction', 'gravity', 'momentum'] },
    { id: 'nutcracker', level: 3, q: 'A nutcracker is a type of which simple machine?', a: 'a lever', wrong: ['a pulley', 'a screw', 'a wheel'] },
  ],
  [{ skill: 'forcesAdvanced', level: 2 }],
)

const measurement = factSkill(
  'measurement',
  ['Tools that measure', 'Units we measure with', 'Liquids and time', 'Lab tools'],
  [
    { id: 'ruler', level: 1, q: 'Which tool measures how long something is?', a: 'a ruler', wrong: ['a thermometer', 'a clock', 'a scale'] },
    { id: 'scale', level: 1, q: 'Which tool measures how heavy something is?', a: 'a scale', wrong: ['a ruler', 'a thermometer', 'a clock'] },
    { id: 'clock', level: 1, q: 'Which tool tells us the time?', a: 'a clock', wrong: ['a ruler', 'a scale', 'a thermometer'] },
    { id: 'inches', level: 1, q: 'Which unit measures length?', a: 'inches', wrong: ['pounds', 'degrees', 'liters'] },
    { id: 'liters', level: 1, q: 'Which unit measures how much liquid is in a bottle?', a: 'liters', wrong: ['pounds', 'inches', 'degrees'] },
    { id: 'degrees', level: 1, q: 'Which unit measures temperature?', a: 'degrees', wrong: ['pounds', 'inches', 'liters'] },
    { id: 'pounds', level: 1, q: 'Which unit measures weight?', a: 'pounds', wrong: ['inches', 'degrees', 'liters'] },
    { id: 'measuringCup', level: 1, q: 'Which tool measures how much liquid you have?', a: 'a measuring cup', wrong: ['a ruler', 'a scale', 'a clock'] },
    { id: 'minutesHour', level: 1, q: 'How many minutes are in one hour?', a: '60', wrong: ['30', '12', '100'] },
    { id: 'inchesFoot', level: 1, q: 'How many inches are in one foot?', a: '12', wrong: ['10', '24', '100'] },
    { id: 'cm', level: 2, q: 'How many centimeters are in one meter?', a: '100', wrong: ['10', '1000', '50'] },
    { id: 'grams', level: 2, q: 'Which metric unit measures mass, or how much stuff is in something?', a: 'grams', wrong: ['liters', 'meters', 'degrees Celsius'] },
    { id: 'volumeL', level: 2, q: 'Which unit measures how much space a liquid fills?', a: 'liters', wrong: ['grams', 'meters', 'seconds'] },
    { id: 'seconds', level: 2, q: 'Which unit measures how long a race takes?', a: 'seconds', wrong: ['grams', 'degrees', 'liters'] },
    { id: 'celsius', level: 2, q: 'Which temperature scale is used by most countries around the world?', a: 'Celsius', wrong: ['Fahrenheit', 'Richter', 'Mohs'] },
    { id: 'mlLiter', level: 3, q: 'How many milliliters are in one liter?', a: '1000', wrong: ['100', '10', '500'] },
    { id: 'secMin', level: 3, q: 'How many seconds are in one minute?', a: '60', wrong: ['100', '30', '12'] },
    { id: 'gramKg', level: 3, q: 'How many grams are in one kilogram?', a: '1000', wrong: ['100', '10', '500'] },
    { id: 'cylinder', level: 3, q: 'Which lab tool measures liquid volume most precisely?', a: 'a graduated cylinder', wrong: ['a ruler', 'a balance', 'a stopwatch'] },
    { id: 'stopwatch', level: 3, q: 'Which tool times how long something takes?', a: 'a stopwatch', wrong: ['a graduated cylinder', 'a thermometer', 'a ruler'] },
    { id: 'beaker', level: 4, q: 'Which lab container holds liquids and can be heated?', a: 'a beaker', wrong: ['a microscope', 'a magnet', 'a ruler'] },
    { id: 'microscope', level: 4, q: 'Which lab tool makes very tiny things look much bigger?', a: 'a microscope', wrong: ['a balance', 'a beaker', 'a thermometer'] },
    { id: 'burner', level: 4, q: 'Which lab tool is used to heat things safely?', a: 'a Bunsen burner', wrong: ['a magnet', 'a stopwatch', 'a ruler'] },
    { id: 'rack', level: 4, q: 'What holds test tubes upright in a lab?', a: 'a test tube rack', wrong: ['a beaker', 'a stopwatch', 'a microscope'] },
    { id: 'balance', level: 4, q: 'Which lab tool measures mass very precisely?', a: 'a balance', wrong: ['a thermometer', 'a stopwatch', 'a ruler'] },
    { id: 'goggles', level: 4, q: 'What should you wear to protect your eyes in a lab?', a: 'safety goggles', wrong: ['a ruler', 'a magnet', 'a stopwatch'] },
  ],
)

const engineeringDesign = factSkill(
  'engineeringDesign',
  ['Engineers solve problems', 'Build and test', 'Test and improve', 'Design a solution'],
  [
    { id: 'engineer', level: 1, q: 'Who designs and builds bridges, cars, and robots to solve problems?', a: 'an engineer', wrong: ['a farmer', 'a dentist', 'a librarian'] },
    { id: 'figureOut', level: 1, q: 'What is the first thing to do when you want to solve a problem?', a: 'figure out what the problem is', wrong: ['take a nap', 'eat a snack', 'go outside and play'] },
    { id: 'blocks', level: 1, q: 'Which material could you use to build a tall, strong tower?', a: 'blocks', wrong: ['water', 'air', 'sand'] },
    { id: 'improve', level: 1, q: 'What do engineers do when a design does not work?', a: 'make it better and try again', wrong: ['give up forever', 'stop asking questions', 'throw it in the trash'] },
    { id: 'bridgeSupports', level: 1, q: 'What does a bridge need so it can hold up cars?', a: 'strong supports', wrong: ['soft cushions', 'loud music', 'bright paint'] },
    { id: 'model', level: 1, q: 'What is a small copy of a design called?', a: 'a model', wrong: ['a mirror', 'a shadow', 'a rainbow'] },
    { id: 'blueprint', level: 1, q: 'What is a drawn plan for building something called?', a: 'a blueprint', wrong: ['a song', 'a shadow', 'a sandwich'] },
    { id: 'prototype', level: 2, q: 'What do we call the first test version of a new design?', a: 'a prototype', wrong: ['a mistake', 'a puzzle', 'a poster'] },
    { id: 'oneThing', level: 2, q: 'When you test a design, what should you change?', a: 'only one thing at a time', wrong: ['everything at once', 'nothing at all', 'the name of the test'] },
    { id: 'trialError', level: 2, q: 'What is it called when you keep testing and trying things until something works?', a: 'trial and error', wrong: ['luck only', 'guessing once', 'copying a book'] },
    { id: 'sketch', level: 2, q: 'What is a quick drawing of an idea called?', a: 'a sketch', wrong: ['a song', 'a number', 'a shadow'] },
    { id: 'variable', level: 3, q: 'In an experiment, what is a thing that can change called?', a: 'a variable', wrong: ['a type of rock', 'a kind of plant', 'a unit of time'] },
    { id: 'data', level: 3, q: 'What do scientists and engineers write down when they test something?', a: 'data', wrong: ['jokes', 'sounds', 'colors'] },
    { id: 'reasonTest', level: 3, q: 'Why do engineers test their designs?', a: 'to find problems and fix them', wrong: ['to waste time', 'to make the design heavier', 'to hide the design'] },
    { id: 'hypothesis', level: 3, q: 'What is a smart guess that you test in an experiment called?', a: 'a hypothesis', wrong: ['a shadow', 'a recipe', 'a fossil'] },
    { id: 'constraints', level: 4, q: 'What do we call the rules and limits a design must meet?', a: 'constraints', wrong: ['shadows', 'colors', 'candy'] },
    { id: 'sameTest', level: 4, q: 'When comparing two designs fairly, what should you do?', a: 'test both with the same test', wrong: ['test only one of them', 'guess which is better', 'use different tests for each'] },
    { id: 'improveAfter', level: 4, q: 'What comes after testing a design and finding a problem?', a: 'improve the design', wrong: ['throw it away forever', 'stop and go home', 'paint it blue'] },
    { id: 'users', level: 4, q: 'When designing something for people, what should an engineer think about first?', a: 'what the people need', wrong: ['the color of the sky', 'the weather on the Moon', 'the price of a pencil'] },
  ],
)

export const SCIENCE_MORE: Skill[] = [
  rocks,
  earthEvents,
  waterCycle,
  adaptations,
  traits,
  electricity,
  heat,
  energy,
  simpleMachines,
  measurement,
  engineeringDesign,
]

// ============================================================================================
// SOCIAL STUDIES
// ============================================================================================

const usRegions = factSkill(
  'usRegions',
  ['Big regions of the U.S.', 'Regions and what they are known for', 'Landmarks in each region'],
  [
    { id: 'grandCanyon', level: 1, q: 'The Grand Canyon is in which region?', a: 'the Southwest', wrong: ['New England', 'the Southeast', 'the Midwest'] },
    { id: 'everglades', level: 1, q: 'The Everglades is a large wetland in which region?', a: 'the Southeast', wrong: ['New England', 'the Midwest', 'the Southwest'] },
    { id: 'newEngland', level: 1, q: 'Which region has six states, including Maine and Vermont?', a: 'New England', wrong: ['the Southwest', 'the Midwest', 'the Southeast'] },
    { id: 'hawaii', level: 1, q: 'Which state is an island state in the Pacific Ocean?', a: 'Hawaii', wrong: ['Florida', 'Texas', 'Vermont'] },
    { id: 'sonoran', level: 1, q: 'Which large desert is in Arizona?', a: 'the Sonoran Desert', wrong: ['the Sahara', 'the Gobi', 'the Atacama'] },
    { id: 'sunshine', level: 1, q: 'Which state is known as the Sunshine State?', a: 'Florida', wrong: ['Alaska', 'Maine', 'Nevada'] },
    { id: 'lakes', level: 1, q: 'Which state is known as the Land of 10,000 Lakes?', a: 'Minnesota', wrong: ['Texas', 'Vermont', 'California'] },
    { id: 'alaska', level: 1, q: 'Which is the largest state by area?', a: 'Alaska', wrong: ['Texas', 'California', 'Montana'] },
    { id: 'anchorage', level: 2, q: 'What is the largest city in Alaska?', a: 'Anchorage', wrong: ['Juneau', 'Fairbanks', 'Nome'] },
    { id: 'texasBig', level: 2, q: 'Which state is the largest of the lower 48 states?', a: 'Texas', wrong: ['California', 'Montana', 'New York'] },
    { id: 'hollywood', level: 2, q: 'Which state is home to Hollywood?', a: 'California', wrong: ['Texas', 'Ohio', 'Maine'] },
    { id: 'rockies', level: 2, q: 'Which mountain range runs through several western states, including Colorado?', a: 'the Rocky Mountains', wrong: ['the Appalachian Mountains', 'the Adirondacks', 'the Smoky Mountains'] },
    { id: 'libertyBell', level: 3, q: 'In which state is the Liberty Bell?', a: 'Pennsylvania', wrong: ['New York', 'Virginia', 'Ohio'] },
    { id: 'yellowstone', level: 3, q: 'Which national park has the geyser called Old Faithful?', a: 'Yellowstone', wrong: ['Yosemite', 'Glacier', 'Grand Canyon'] },
    { id: 'goldenGate', level: 3, q: 'Which state has the Golden Gate Bridge?', a: 'California', wrong: ['Oregon', 'Florida', 'Texas'] },
    { id: 'superior', level: 3, q: 'Which Great Lake is the largest by surface area?', a: 'Lake Superior', wrong: ['Lake Michigan', 'Lake Erie', 'Lake Ontario'] },
    { id: 'spaceNeedle', level: 3, q: 'Which city has the Space Needle?', a: 'Seattle', wrong: ['Portland', 'Boise', 'Anchorage'] },
    { id: 'rushmore', level: 3, q: 'Which state has Mount Rushmore?', a: 'South Dakota', wrong: ['Montana', 'Colorado', 'Idaho'] },
    { id: 'alamo', level: 3, q: 'Which state has the Alamo?', a: 'Texas', wrong: ['Florida', 'Ohio', 'Maine'] },
  ],
  [{ skill: 'maps', level: 2 }],
)

const nativePeoples = factSkill(
  'nativePeoples',
  ['Homes and food', 'Native peoples in different places', 'Native nations and their names'],
  [
    { id: 'pueblo', level: 1, q: 'Which Native peoples built homes of adobe, a mud brick, in the Southwest?', a: 'the Pueblo peoples', wrong: ['the Inuit', 'the Iroquois', 'the Lakota'] },
    { id: 'longhouse', level: 1, q: 'Which Native people lived in long houses in the Northeast woodlands?', a: 'the Iroquois', wrong: ['the Pueblo peoples', 'the Inuit', 'the Lakota'] },
    { id: 'bison', level: 1, q: 'Many Plains peoples depended on which large animal for food and clothing?', a: 'bison', wrong: ['salmon', 'seaweed', 'cactus'] },
    { id: 'salmon', level: 1, q: 'Which fish was very important to peoples of the Pacific Northwest?', a: 'salmon', wrong: ['bison', 'seaweed', 'cactus'] },
    { id: 'kayak', level: 1, q: 'Which boat did Inuit hunters use in the Arctic?', a: 'a kayak', wrong: ['a sailboat', 'a steamboat', 'a raft'] },
    { id: 'threeSisters', level: 1, q: 'Many eastern peoples grew corn, beans, and what third crop together?', a: 'squash', wrong: ['potatoes', 'wheat', 'rice'] },
    { id: 'totem', level: 2, q: 'Peoples of the Northwest Coast are known for carving what tall wooden poles?', a: 'totem poles', wrong: ['tipis', 'adobe towers', 'stone circles'] },
    { id: 'mounds', level: 2, q: 'Who built large earthen mounds in the Mississippi River valley, including Cahokia?', a: 'the Mississippian peoples', wrong: ['the Inuit', 'the Pueblo peoples', 'the Apache'] },
    { id: 'sequoyah', level: 2, q: 'Sequoyah created a writing system for which language?', a: 'Cherokee', wrong: ['Lakota', 'Navajo', 'Inuit'] },
    { id: 'arcticInuit', level: 2, q: 'Which people have lived for thousands of years along the Arctic coasts?', a: 'the Inuit', wrong: ['the Pueblo peoples', 'the Cherokee', 'the Apache'] },
    { id: 'dine', level: 3, q: 'What name do the Navajo use for themselves?', a: 'Diné', wrong: ['Lakota', 'Cherokee', 'Inuit'] },
    { id: 'greatLaw', level: 3, q: 'Which Native confederacy follows the Great Law of Peace?', a: 'the Haudenosaunee', wrong: ['the Pueblo peoples', 'the Inuit', 'the Lakota'] },
  ],
  [{ skill: 'physicalGeography', level: 2 }],
)

const explorers = factSkill(
  'explorers',
  ['Famous explorers', 'Explorers of the West', 'Early explorers of North America'],
  [
    { id: 'columbus', level: 1, q: 'Which explorer sailed across the Atlantic in 1492 for Spain?', a: 'Christopher Columbus', wrong: ['Neil Armstrong', 'Amelia Earhart', 'Marco Polo'] },
    { id: 'lewisClark', level: 1, q: 'Which two explorers led a trip from St. Louis to the Pacific Ocean?', a: 'Lewis and Clark', wrong: ['the Wright brothers', 'Rosa Parks and Harriet Tubman', 'Thomas Edison and Ben Franklin'] },
    { id: 'sacagawea', level: 1, q: 'Which woman helped Lewis and Clark as a guide and translator?', a: 'Sacagawea', wrong: ['Harriet Tubman', 'Rosa Parks', 'Amelia Earhart'] },
    { id: 'marcoPolo', level: 1, q: 'Which explorer traveled from Italy to China and wrote about it?', a: 'Marco Polo', wrong: ['Christopher Columbus', 'Leif Erikson', 'Ferdinand Magellan'] },
    { id: 'leif', level: 1, q: 'Which explorer from Norway reached North America about 1,000 years ago?', a: 'Leif Erikson', wrong: ['Christopher Columbus', 'Marco Polo', 'Meriwether Lewis'] },
    { id: 'magellan', level: 1, q: 'Which explorer led a fleet around the world, though he died during the trip?', a: 'Ferdinand Magellan', wrong: ['Marco Polo', 'Leif Erikson', 'Sacagawea'] },
    { id: 'louisianaPurchase', level: 2, q: 'What did the United States buy from France in 1803?', a: 'the Louisiana Territory', wrong: ['Alaska', 'Florida', 'Texas'] },
    { id: 'corps', level: 2, q: "What was the name of Lewis and Clark's expedition?", a: 'the Corps of Discovery', wrong: ['the Pony Express', 'the Oregon Trail', 'the Erie Canal'] },
    { id: 'pike', level: 2, q: 'Which explorer has a famous mountain in Colorado named after him?', a: 'Zebulon Pike', wrong: ['Meriwether Lewis', 'William Clark', 'Sacagawea'] },
    { id: 'doubled', level: 2, q: 'What did the Louisiana Purchase do to the size of the United States?', a: 'it roughly doubled it', wrong: ['it made it smaller', 'it did not change it', 'it cut it in half'] },
    { id: 'roanoke', level: 3, q: 'Which English colony on Roanoke Island mysteriously disappeared?', a: 'the Lost Colony', wrong: ['Jamestown', 'Plymouth', 'Boston'] },
    { id: 'hudson', level: 3, q: 'Which explorer sailed up the river named after him in 1609?', a: 'Henry Hudson', wrong: ['Walter Raleigh', 'John Cabot', 'Samuel de Champlain'] },
    { id: 'cabot', level: 3, q: 'Which Italian-born explorer sailed for England and reached North America in 1497?', a: 'John Cabot', wrong: ['Christopher Columbus', 'Henry Hudson', 'Jacques Cartier'] },
    { id: 'champlain', level: 3, q: 'Which French explorer founded Quebec City in 1608?', a: 'Samuel de Champlain', wrong: ['Jacques Cartier', 'Henry Hudson', 'Hernando de Soto'] },
    { id: 'desoto', level: 3, q: 'Which Spanish explorer traveled through the Southeast looking for gold?', a: 'Hernando de Soto', wrong: ['Ponce de León', 'Ferdinand Magellan', 'Francisco Coronado'] },
    { id: 'coronado', level: 3, q: 'Which Spanish explorer searched for the Seven Cities of Gold in the Southwest?', a: 'Francisco Coronado', wrong: ['Hernando de Soto', 'Ponce de León', 'Christopher Columbus'] },
  ],
  [{ skill: 'famousPeople', level: 1 }],
)

const westward = factSkill(
  'westward',
  ['Trails west', 'Trains, canals, and new lands', 'Life on the trail'],
  [
    { id: 'oregon', level: 1, q: 'Which trail took settlers from Missouri to Oregon?', a: 'the Oregon Trail', wrong: ['the Erie Canal', 'the Silk Road', 'the Chisholm Trail'] },
    { id: 'wagons', level: 1, q: 'What did many pioneers cross the plains in?', a: 'covered wagons', wrong: ['steamboats', 'hot air balloons', 'canoes'] },
    { id: 'gold', level: 1, q: 'What drew many people to California in 1849?', a: 'gold', wrong: ['silver', 'oil', 'diamonds'] },
    { id: 'sod', level: 1, q: 'Many settlers on the plains lived in homes made of blocks of earth. What were these homes called?', a: 'sod houses', wrong: ['igloos', 'longhouses', 'tipis'] },
    { id: 'homestead', level: 1, q: 'Which law gave free land to settlers who farmed it for five years?', a: 'the Homestead Act', wrong: ['the Pony Express', 'the Erie Canal', 'the Louisiana Purchase'] },
    { id: 'pony', level: 1, q: 'Which mail service used riders on horses to carry mail quickly in 1860?', a: 'the Pony Express', wrong: ['the Oregon Trail', 'the transcontinental railroad', 'the Erie Canal'] },
    { id: 'transcon', level: 2, q: 'What was completed in 1869 to link the East and West coasts by rail?', a: 'the transcontinental railroad', wrong: ['the Erie Canal', 'the Panama Canal', 'the Interstate Highway'] },
    { id: 'mexicanWar', level: 2, q: 'Which war with Mexico ended in 1848 with the United States gaining much of the Southwest?', a: 'the Mexican-American War', wrong: ['the Civil War', 'the Revolutionary War', 'the Spanish-American War'] },
    { id: 'erie', level: 2, q: 'Which canal opened in 1825 to link Lake Erie with the Hudson River?', a: 'the Erie Canal', wrong: ['the Panama Canal', 'the Suez Canal', 'the Mississippi River'] },
    { id: 'morse', level: 2, q: 'Who helped develop the telegraph, which sent messages by electric wire?', a: 'Samuel Morse', wrong: ['Paul Revere', 'Alexander Graham Bell', 'the Wright brothers'] },
    { id: 'cholera', level: 3, q: 'What deadly illness did many travelers on the Oregon Trail catch?', a: 'cholera', wrong: ['measles', 'chicken pox', 'the flu'] },
    { id: 'platte', level: 3, q: 'Which river did many Oregon Trail travelers follow across Nebraska?', a: 'the Platte River', wrong: ['the Hudson River', 'the Ohio River', 'the Colorado River'] },
    { id: 'chimney', level: 3, q: 'Which tall rock in Nebraska was a famous landmark on the Oregon Trail?', a: 'Chimney Rock', wrong: ['Pikes Peak', 'Devils Tower', 'Stone Mountain'] },
  ],
  [{ skill: 'earlyAmerica', level: 2 }],
)

const civilWar = factSkill(
  'civilWar',
  ['North and South', 'Key events of the war', 'After the war'],
  [
    { id: 'begin', level: 1, q: 'In what year did the Civil War begin?', a: '1861', wrong: ['1776', '1812', '1865'] },
    { id: 'end', level: 1, q: 'In what year did the Civil War end?', a: '1865', wrong: ['1861', '1776', '1914'] },
    { id: 'union', level: 1, q: 'What was the name for the Northern side in the Civil War?', a: 'the Union', wrong: ['the Confederacy', 'the Colonies', 'the Territory'] },
    { id: 'confed', level: 1, q: 'What was the name for the Southern states that broke away from the country?', a: 'the Confederacy', wrong: ['the Union', 'the Colonies', 'the Territory'] },
    { id: 'lincoln', level: 1, q: 'Who was president of the United States during the Civil War?', a: 'Abraham Lincoln', wrong: ['George Washington', 'Thomas Jefferson', 'Andrew Jackson'] },
    { id: 'gettysburg', level: 1, q: 'Which battle in Pennsylvania in 1863 was a turning point of the war?', a: 'Gettysburg', wrong: ['Yorktown', 'Bunker Hill', 'Fort Sumter'] },
    { id: 'emancipation', level: 2, q: 'Which 1863 order by Lincoln declared freedom for enslaved people in the Confederate states?', a: 'the Emancipation Proclamation', wrong: ['the Declaration of Independence', 'the Bill of Rights', 'the Monroe Doctrine'] },
    { id: 'sumter', level: 2, q: 'Where did the first shots of the Civil War take place in 1861?', a: 'Fort Sumter', wrong: ['Gettysburg', 'Yorktown', 'the Alamo'] },
    { id: 'antietam', level: 2, q: 'Which battle in 1862 was the bloodiest single day in American history?', a: 'Antietam', wrong: ['Gettysburg', 'Bull Run', 'Shiloh'] },
    { id: 'address', level: 2, q: 'Which speech did Lincoln give at a battlefield cemetery in Pennsylvania in 1863?', a: 'the Gettysburg Address', wrong: ['the Pledge of Allegiance', 'the Preamble', 'the Emancipation Proclamation'] },
    { id: 'appomattox', level: 2, q: 'Where did General Lee surrender in 1865?', a: 'Appomattox Court House', wrong: ['Gettysburg', 'Fort Sumter', 'Yorktown'] },
    { id: 'grant', level: 2, q: "Who was the Union general who accepted Lee's surrender at Appomattox?", a: 'Ulysses S. Grant', wrong: ['George Washington', 'Robert E. Lee', 'Andrew Jackson'] },
    { id: 'thirteenth', level: 3, q: 'Which amendment abolished slavery?', a: 'the 13th Amendment', wrong: ['the 1st Amendment', 'the 19th Amendment', 'the 2nd Amendment'] },
    { id: 'reconstruction', level: 3, q: 'What was the period of rebuilding the South after the Civil War called?', a: 'Reconstruction', wrong: ['the Renaissance', 'the Gold Rush', 'the Great Depression'] },
    { id: 'fifteenth', level: 3, q: 'Which amendment says the right to vote cannot be denied because of race?', a: 'the 15th Amendment', wrong: ['the 14th Amendment', 'the 19th Amendment', 'the 1st Amendment'] },
  ],
  [{ skill: 'earlyAmerica', level: 3 }],
)

const constitution = factSkill(
  'constitution',
  ['The Constitution', 'The Bill of Rights', 'Checks and balances'],
  [
    { id: 'y1787', level: 1, q: 'In what year was the United States Constitution written?', a: '1787', wrong: ['1776', '1812', '1865'] },
    { id: 'philly', level: 1, q: 'In which city was the Constitution signed?', a: 'Philadelphia', wrong: ['Boston', 'New York City', 'Richmond'] },
    { id: 'wethepeople', level: 1, q: 'What are the first three words of the Constitution?', a: 'We the People', wrong: ['Life, liberty, happiness', 'In God we trust', 'Four score and'] },
    { id: 'plan', level: 1, q: 'What does the Constitution set up?', a: 'a plan for the national government', wrong: ['a school schedule', 'a national holiday', 'a new language'] },
    { id: 'amend', level: 1, q: 'What is it called when a part of the Constitution is changed?', a: 'an amendment', wrong: ['a holiday', 'a parade', 'a map'] },
    { id: 'washPresided', level: 1, q: 'Who presided over the Constitutional Convention?', a: 'George Washington', wrong: ['Thomas Jefferson', 'Benjamin Franklin', 'John Adams'] },
    { id: 'ten', level: 2, q: 'How many amendments make up the Bill of Rights?', a: '10', wrong: ['5', '12', '20'] },
    { id: 'speech', level: 2, q: 'Which right is protected by the First Amendment?', a: 'freedom of speech', wrong: ['the right to ignore laws', 'free lunch at school', 'a day off school'] },
    { id: 'third', level: 2, q: 'The Third Amendment protects people from what?', a: 'soldiers living in their homes', wrong: ['high taxes', 'losing their school', 'being forced to vote'] },
    { id: 'sixth', level: 2, q: 'Which amendment gives people accused of crimes the right to a speedy trial by a jury?', a: 'the Sixth Amendment', wrong: ['the First Amendment', 'the Second Amendment', 'the Tenth Amendment'] },
    { id: 'nineteenth', level: 2, q: 'Which amendment gave women the right to vote?', a: 'the 19th Amendment', wrong: ['the 15th Amendment', 'the 26th Amendment', 'the 1st Amendment'] },
    { id: 'checks', level: 3, q: 'What is it called when each branch of government can limit the other branches?', a: 'checks and balances', wrong: ['a sales tax', 'a parade', 'a coin toss'] },
    { id: 'veto', level: 3, q: 'What can the President do to a bill passed by Congress?', a: 'veto it', wrong: ['sing it', 'erase it from the Constitution', 'make it a holiday'] },
    { id: 'twoParts', level: 3, q: 'What are the two parts of Congress?', a: 'the Senate and the House of Representatives', wrong: ['the Supreme Court and the White House', 'the Army and the Navy', 'the mayor and the city council'] },
    { id: 'nine', level: 3, q: 'How many justices sit on the Supreme Court?', a: '9', wrong: ['5', '7', '12'] },
    { id: 'twoSenators', level: 3, q: 'How many senators does each state have?', a: '2', wrong: ['1', '3', '50'] },
  ],
  [{ skill: 'government', level: 2 }],
)

const citizenship = factSkill(
  'citizenship',
  ['Being a good neighbor', 'Rights and responsibilities', 'Citizens of our country'],
  [
    { id: 'turns', level: 1, q: 'Which one shows you are a good neighbor?', a: 'taking turns', wrong: ['cutting in line', 'grabbing toys', 'yelling at friends'] },
    { id: 'trash', level: 1, q: 'Where should trash go?', a: 'in the trash can', wrong: ['on the ground', 'in the creek', 'in the park'] },
    { id: 'rules', level: 1, q: 'Why do we have rules at school?', a: 'to keep everyone safe and fair', wrong: ['to make school boring', 'so no one can have fun', 'to stop kids from learning'] },
    { id: 'litter', level: 1, q: 'Which one helps your neighborhood look nice?', a: 'picking up litter', wrong: ['drawing on the fence', 'leaving toys in the street', 'breaking the bench'] },
    { id: 'listen', level: 1, q: 'Which one shows respect when someone is talking?', a: 'listening', wrong: ['interrupting', 'shouting', 'ignoring them'] },
    { id: 'citizenWord', level: 1, q: 'What do we call a person who belongs to a country?', a: 'a citizen', wrong: ['a tourist', 'a leader', 'a helper'] },
    { id: 'sharing', level: 1, q: 'Which one shows fairness?', a: 'sharing with friends', wrong: ['taking all the crayons', 'hiding the ball', 'pushing in line'] },
    { id: 'tellAdult', level: 1, q: 'If you see someone get hurt, what should you do?', a: 'tell a grown-up', wrong: ['walk away and never tell', 'laugh at them', 'take a photo instead'] },
    { id: 'taxes', level: 2, q: 'Paying taxes is a what for citizens?', a: 'a responsibility', wrong: ['a prize', 'a secret', 'a vacation'] },
    { id: 'speechK', level: 2, q: 'What is it called when you can say what you think without being punished by the government?', a: 'freedom of speech', wrong: ['the right to ignore laws', 'free lunch at school', 'a day off school'] },
    { id: 'volunteer', level: 2, q: 'What is one way to help your community?', a: 'volunteering', wrong: ['sleeping all day', 'hiding from neighbors', 'never going outside'] },
    { id: 'followLaws', level: 2, q: 'What is a responsibility of citizens?', a: 'following the laws', wrong: ['breaking the laws', 'ignoring the laws', 'making up your own laws'] },
    { id: 'born', level: 3, q: 'Which is one way to become a United States citizen?', a: 'being born in the United States', wrong: ['winning a race', 'owning a big house', 'moving to a new state'] },
    { id: 'lawLand', level: 3, q: 'Which document is the supreme law of the United States?', a: 'the Constitution', wrong: ['a school handbook', 'a cookbook', 'a comic book'] },
    { id: 'country', level: 3, q: 'What is the name of our country?', a: 'the United States of America', wrong: ['Canada', 'Mexico', 'Brazil'] },
  ],
)

const mapSkills = factSkill(
  'mapSkills',
  ['Scale and legend', 'Latitude and longitude', 'Maps that show more'],
  [
    { id: 'scale', level: 1, q: 'What does the scale on a map tell you?', a: 'how far apart places are in real life', wrong: ['what the weather is like', 'how many people live there', 'the price of the map'] },
    { id: 'legend', level: 1, q: 'What is another name for a map key?', a: 'a legend', wrong: ['a title', 'a compass rose', 'a border'] },
    { id: 'grid', level: 1, q: 'What do the letters and numbers on the edges of a map grid help you do?', a: 'find places quickly', wrong: ['count the trees', 'draw pictures', 'measure the sky'] },
    { id: 'ruler', level: 1, q: 'Which tool helps you measure distance on a paper map?', a: 'a ruler', wrong: ['a thermometer', 'a clock', 'a stopwatch'] },
    { id: 'globe', level: 1, q: 'What is a round model of Earth called?', a: 'a globe', wrong: ['a flat map', 'a flag', 'a compass'] },
    { id: 'roadMap', level: 1, q: 'What kind of map shows roads and highways?', a: 'a road map', wrong: ['a weather map', 'a star chart', 'a bone chart'] },
    { id: 'equator', level: 2, q: 'What is the imaginary line halfway between the North Pole and the South Pole called?', a: 'the equator', wrong: ['the prime meridian', 'the Arctic Circle', 'the Tropic of Capricorn'] },
    { id: 'latitude', level: 2, q: 'Lines that run east and west and measure how far north or south a place is are called what?', a: 'latitude', wrong: ['longitude', 'elevation', 'time zones'] },
    { id: 'longitude', level: 2, q: 'Lines that run north and south and measure how far east or west a place is are called what?', a: 'longitude', wrong: ['latitude', 'the equator', 'a scale bar'] },
    { id: 'prime', level: 2, q: 'Which line of longitude is marked as 0 degrees?', a: 'the prime meridian', wrong: ['the equator', 'the Tropic of Cancer', 'the Arctic Circle'] },
    { id: 'parallel', level: 2, q: 'Are lines of latitude parallel to each other?', a: 'yes', wrong: ['no', 'only in summer', 'only near the poles'] },
    { id: 'hemispheres', level: 2, q: 'The equator splits Earth into northern and southern parts. What are these parts called?', a: 'hemispheres', wrong: ['continents', 'oceans', 'time zones'] },
    { id: 'compass', level: 3, q: 'Which tool shows which direction you are facing?', a: 'a compass', wrong: ['a ruler', 'a thermometer', 'a scale'] },
    { id: 'topo', level: 3, q: 'Which kind of map shows how high the land is?', a: 'a topographic map', wrong: ['a weather map', 'a road map', 'a star chart'] },
    { id: 'contour', level: 3, q: 'What do contour lines on a topographic map show?', a: 'the height of the land', wrong: ['the names of towns', 'only where the rivers are', "tomorrow's weather"] },
    { id: 'coordinates', level: 3, q: 'What do we call a pair of latitude and longitude numbers that show a place?', a: 'coordinates', wrong: ['colors', 'shapes', 'songs'] },
  ],
  [{ skill: 'maps', level: 2 }],
)

export const SOCIAL_MORE: Skill[] = [
  usRegions,
  nativePeoples,
  explorers,
  westward,
  civilWar,
  constitution,
  citizenship,
  mapSkills,
]

// ============================================================================================
// IXL: which IXL topic each level practices (index 0 = level 1).
// ============================================================================================

const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })
const soc = (grade: number, category: string): IxlRef => ({ subject: 'social-studies', grade, category })

export const SCIENCE_SOCIAL_MORE_IXL: Record<string, IxlRef[]> = {
  'science.rocks': [sci(2, 'Rocks and minerals'), sci(3, 'Rocks and minerals'), sci(4, 'Rocks and minerals'), sci(5, 'Rocks')],
  'science.earthEvents': [sci(2, 'Earth events'), sci(3, 'Earth events'), sci(4, 'Earth events')],
  'science.waterCycle': [sci(3, 'Weather and climate'), sci(4, 'Weather and climate'), sci(5, "Earth's systems")],
  'science.adaptations': [sci(3, 'Adaptations'), sci(4, 'Adaptations'), sci(5, 'Adaptations')],
  'science.traits': [sci(2, 'Traits'), sci(3, 'Traits'), sci(4, 'Traits and heredity')],
  'science.electricity': [sci(3, 'Electricity'), sci(4, 'Electricity'), sci(5, 'Electricity')],
  'science.heat': [sci(2, 'Heat'), sci(3, 'Heat and thermal energy'), sci(5, 'Heat and thermal energy')],
  'science.energy': [sci(4, 'Energy'), sci(4, 'Energy'), sci(5, 'Energy')],
  'science.simpleMachines': [sci(3, 'Force and motion'), sci(4, 'Force and motion'), sci(5, 'Force and motion')],
  'science.measurement': [sci(2, 'Units and measurement'), sci(3, 'Units and measurement'), sci(4, 'Units and measurement'), sci(5, 'Lab tools and equipment')],
  'science.engineeringDesign': [sci(0, 'Engineering practices'), sci(2, 'Engineering practices'), sci(3, 'Engineering practices'), sci(5, 'Engineering practices')],

  'social.usRegions': [soc(4, 'Regions of the United States'), soc(4, 'Regions of the United States'), soc(5, 'Regions of the United States')],
  'social.nativePeoples': [soc(4, 'Native peoples of North America'), soc(4, 'Native peoples of North America'), soc(5, 'Native peoples of North America')],
  'social.explorers': [soc(3, 'Read about historical figures'), soc(4, 'Early 19th-century American history'), soc(5, 'Early English colonies in North America')],
  'social.westward': [soc(4, 'Early 19th-century American history'), soc(5, 'Early 19th-century American history'), soc(5, 'Early 19th-century American history')],
  'social.civilWar': [soc(4, 'The Civil War and Reconstruction'), soc(5, 'The Civil War and Reconstruction'), soc(5, 'The Civil War and Reconstruction')],
  'social.constitution': [soc(4, 'Government'), soc(4, 'Government'), soc(5, 'Government')],
  'social.citizenship': [soc(0, 'Civics'), soc(1, 'Civics'), soc(2, 'Government')],
  'social.mapSkills': [soc(3, 'Read maps'), soc(4, 'Read maps'), soc(5, 'Read maps')],
}
