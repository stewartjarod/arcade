import type { ItemSpec, Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { upToLevel, wrongFrom } from './util'

/**
 * Science and Social Studies for IXL grades 3 to 5, on the categories the earlier files don't cover yet.
 * Each level adds its own new facts (8 or more), so a kid who reaches a level keeps meeting new things.
 * Answers are short and wrong choices come from the same kind of thing as the right one, but are never
 * also right. Facts are standard textbook facts that do not change over time.
 */

interface Fact {
  /** Unique inside its skill. It becomes part of the item key, so never rename it. */
  id: string
  /** The first level this fact shows up at (1 = the first level). */
  level: number
  q: string
  a: string
  /** Believable wrong answers: at least 3, none of them correct, all from the same kind of thing. */
  wrong: string[]
}

function factItem(skillId: string, f: Fact): ItemSpec {
  return {
    key: `${skillId}:${f.id}`,
    prompt: { text: f.q, say: f.q },
    answer: f.a,
    wrong: (n) => wrongFrom(f.a, n, f.wrong),
  }
}

/** A skill made of facts. Each level asks its own facts and the ones from the levels below it. */
function factSkill(id: string, labels: string[], facts: Fact[], unlocksAfter: { skill: string; level: number }[]): Skill {
  return {
    id,
    label: (L) => labels[L - 1]!,
    maxLevel: labels.length,
    formats: ['choice'],
    unlocksAfter,
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

const materials = factSkill(
  'materials',
  ['Materials and their uses', 'Picking the right material', 'Properties of matter'],
  [
    { id: 'window', level: 1, q: 'What material are most windows made of?', a: 'glass', wrong: ['wool', 'sponge', 'cardboard'] },
    { id: 'raincoat', level: 1, q: 'Which material keeps rain from soaking through?', a: 'plastic', wrong: ['a paper bag', 'a sponge', 'cotton yarn'] },
    { id: 'spills', level: 1, q: 'Which material soaks up spills best?', a: 'a paper towel', wrong: ['a glass', 'a metal spoon', 'a plastic toy'] },
    { id: 'bounce', level: 1, q: 'Which material makes a ball that bounces?', a: 'rubber', wrong: ['glass', 'a brick', 'a steel rod'] },
    { id: 'house', level: 1, q: 'Which material is often used to frame a house?', a: 'wood', wrong: ['water', 'air', 'sand'] },
    { id: 'bends', level: 1, q: 'Which material bends easily without breaking?', a: 'a rubber band', wrong: ['a brick', 'a glass plate', 'a concrete wall'] },
    { id: 'cans', level: 1, q: 'Soda cans are often made of which metal?', a: 'aluminum', wrong: ['cotton', 'wood', 'rubber'] },
    { id: 'towel', level: 1, q: 'Why are towels often made of cotton?', a: 'it soaks up water', wrong: ['it is see-through', 'it is very shiny', 'it floats on water'] },
    { id: 'mittens', level: 2, q: 'Why is wool good for winter mittens?', a: 'it traps warm air', wrong: ['it is see-through', 'it is very shiny', 'it sinks in water'] },
    { id: 'pot', level: 2, q: 'Why are pot handles often plastic or wood?', a: 'they stay cool enough to hold', wrong: ['they are very shiny', 'they make the pot float', 'they are very bouncy'] },
    { id: 'bikeTire', level: 2, q: 'Why are bike tires made of rubber?', a: 'it grips the road and absorbs bumps', wrong: ['it is see-through', 'it is very heavy', 'it melts in the sun'] },
    { id: 'umbrella', level: 2, q: 'Why are umbrellas made of waterproof fabric?', a: 'so water runs off them', wrong: ['so they float', 'so they glow in the dark', 'so they stretch in the rain'] },
    { id: 'foil', level: 2, q: 'Why is aluminum foil good for wrapping food in the oven?', a: 'it handles heat and is easy to shape', wrong: ['it can read the time', 'it makes food sing', 'it changes color'] },
    { id: 'sunglasses', level: 2, q: 'Why are some sunglass lenses made of plastic?', a: 'they are light and do not shatter easily', wrong: ['they make the sun brighter', 'they are made of sand', 'they stop all sound'] },
    { id: 'helmet', level: 2, q: 'Why are bike helmets made of hard plastic?', a: 'it protects your head from bumps', wrong: ['it makes you float', 'it makes you glow', 'it keeps your hair dry'] },
    { id: 'sole', level: 2, q: 'Why do shoes have rubber soles?', a: 'it grips the ground so you do not slip', wrong: ['it makes you taller', 'it glows in the dark', 'it makes your feet smell'] },
    { id: 'mass', level: 3, q: 'What do we call how much matter is in an object?', a: 'mass', wrong: ['volume', 'color', 'temperature'] },
    { id: 'volume', level: 3, q: 'What do we call how much space an object takes up?', a: 'volume', wrong: ['mass', 'hardness', 'color'] },
    { id: 'hardness', level: 3, q: 'What property tells how well a material resists scratches?', a: 'hardness', wrong: ['volume', 'mass', 'magnetism'] },
    { id: 'magnetism', level: 3, q: 'Which property tells whether a material is pulled by a magnet?', a: 'magnetism', wrong: ['hardness', 'volume', 'color'] },
    { id: 'colorProp', level: 3, q: 'Is color a physical property of matter?', a: 'yes', wrong: ['no', 'only for liquids', 'only for metals'] },
    { id: 'conductivity', level: 3, q: 'Which property tells how easily heat moves through a material?', a: 'conductivity', wrong: ['magnetism', 'volume', 'color'] },
    { id: 'density', level: 3, q: 'What do we call mass divided by volume?', a: 'density', wrong: ['hardness', 'magnetism', 'conductivity'] },
    { id: 'flexibility', level: 3, q: 'What property describes how easily a material bends?', a: 'flexibility', wrong: ['hardness', 'magnetism', 'volume'] },
  ],
  [{ skill: 'statesOfMatter', level: 2 }],
)

const physicalChange = factSkill(
  'physicalChange',
  ['Physical change', 'Chemical change', 'Clues of a chemical change'],
  [
    { id: 'tear', level: 1, q: 'Which one is a physical change?', a: 'tearing a sheet of paper', wrong: ['burning a piece of wood', 'a nail rusting', 'baking a cake'] },
    { id: 'meltIce', level: 1, q: 'Which one is a physical change?', a: 'melting ice into water', wrong: ['cooking an egg until it hardens', 'striking a match to light it', 'a banana turning brown'] },
    { id: 'crayon', level: 1, q: 'Which one is a physical change?', a: 'breaking a crayon in half', wrong: ['a nail rusting', 'baking a cake', 'digesting a sandwich'] },
    { id: 'sugar', level: 1, q: 'Which one is a physical change?', a: 'dissolving sugar in tea', wrong: ['burning a piece of wood', 'cooking an egg until it hardens', 'a firework exploding'] },
    { id: 'crumple', level: 1, q: 'Which one is a physical change?', a: 'crumpling a piece of paper', wrong: ['a banana turning brown', 'striking a match to light it', 'a nail rusting'] },
    { id: 'steam', level: 1, q: 'Which one is a physical change?', a: 'boiling water into steam', wrong: ['baking a cake', 'burning a piece of wood', 'digesting a sandwich'] },
    { id: 'sponge', level: 1, q: 'Which one is a physical change?', a: 'cutting a sponge into pieces', wrong: ['a nail rusting', 'a firework exploding', 'cooking an egg until it hardens'] },
    { id: 'sandGravel', level: 1, q: 'Which one is a physical change?', a: 'mixing sand and gravel', wrong: ['striking a match to light it', 'a banana turning brown', 'baking a cake'] },
    { id: 'burnWood', level: 2, q: 'Which one is a chemical change?', a: 'burning a piece of wood', wrong: ['tearing a sheet of paper', 'melting ice into water', 'dissolving sugar in tea'] },
    { id: 'rust', level: 2, q: 'Which one is a chemical change?', a: 'a nail rusting', wrong: ['breaking a crayon in half', 'boiling water into steam', 'crumpling a piece of paper'] },
    { id: 'bake', level: 2, q: 'Which one is a chemical change?', a: 'baking a cake', wrong: ['mixing sand and gravel', 'cutting a sponge into pieces', 'stretching a rubber band'] },
    { id: 'egg', level: 2, q: 'Which one is a chemical change?', a: 'cooking an egg until it hardens', wrong: ['cutting a sponge into pieces', 'melting ice into water', 'tearing a sheet of paper'] },
    { id: 'banana', level: 2, q: 'Which one is a chemical change?', a: 'a banana turning brown', wrong: ['boiling water into steam', 'breaking a crayon in half', 'dissolving sugar in tea'] },
    { id: 'match', level: 2, q: 'Which one is a chemical change?', a: 'striking a match to light it', wrong: ['stretching a rubber band', 'mixing sand and gravel', 'melting ice into water'] },
    { id: 'digest', level: 2, q: 'Which one is a chemical change?', a: 'digesting a sandwich in your stomach', wrong: ['crumpling a piece of paper', 'cutting a sponge into pieces', 'tearing a sheet of paper'] },
    { id: 'firework', level: 2, q: 'Which one is a chemical change?', a: 'a firework exploding in the sky', wrong: ['freezing water into ice', 'mixing sand and gravel', 'melting ice into water'] },
    { id: 'clueColor', level: 3, q: 'Which one is a clue that a chemical change happened?', a: 'a new color, smell, or gas appears', wrong: ['it only changes shape', 'it only gets smaller', 'it sinks in water'] },
    { id: 'newSubstance', level: 3, q: 'Can a physical change make a brand-new substance?', a: 'no', wrong: ['yes, always', 'only sometimes', 'only in the dark'] },
    { id: 'undo', level: 3, q: 'Are chemical changes usually easy to undo?', a: 'no, usually not', wrong: ['yes, by cooling it', 'yes, by shaking it', 'yes, with a magnet'] },
    { id: 'atoms', level: 3, q: 'In a chemical change, what happens to the atoms?', a: 'they rearrange into new substances', wrong: ['they disappear', 'they stop moving', 'they turn into sound'] },
    { id: 'butter', level: 3, q: 'Which one is a physical change: melting butter or burning a log?', a: 'melting butter', wrong: ['burning a log', 'rusting a bike', 'baking a loaf'] },
    { id: 'makesNew', level: 3, q: 'Does a chemical change make new substances?', a: 'yes', wrong: ['no, never', 'only in winter', 'only with a magnet'] },
    { id: 'chemName', level: 3, q: 'What is a change that makes a new substance called?', a: 'a chemical change', wrong: ['a physical change', 'a sound change', 'no change at all'] },
    { id: 'ash', level: 3, q: 'Does burning wood leave behind ash, a new substance?', a: 'yes', wrong: ['no, it only changes shape', 'no, it only gets wet', 'no, it only gets colder'] },
  ],
  [{ skill: 'statesOfMatter', level: 3 }],
)

const mixtures = factSkill(
  'mixtures',
  ['Mixing things together', 'Separating mixtures', 'Solutions'],
  [
    { id: 'fruitSalad', level: 1, q: 'Which of these is a mixture?', a: 'a fruit salad', wrong: ['a bar of pure gold', 'a single sugar cube', 'a glass of distilled water'] },
    { id: 'trailMix', level: 1, q: 'Is trail mix a mixture or a pure substance?', a: 'a mixture', wrong: ['a pure substance', 'a single element', 'a chemical reaction'] },
    { id: 'paint', level: 1, q: 'What color do you get when you mix blue and yellow paint?', a: 'green', wrong: ['purple', 'orange', 'black'] },
    { id: 'define', level: 1, q: 'What is a mixture?', a: 'two or more things mixed, not joined', wrong: ['one kind of thing by itself', 'a thing that only glows', 'a kind of weather'] },
    { id: 'keepProps', level: 1, q: 'In a mixture, do the things keep their own properties?', a: 'yes', wrong: ['no, they always change', 'no, they always melt', 'no, they always disappear'] },
    { id: 'riceBeans', level: 1, q: 'Which one is a mixture of solid pieces?', a: 'a bowl of rice and beans', wrong: ['a single marble', 'a bar of pure gold', 'a sugar cube'] },
    { id: 'airMix', level: 1, q: 'Is air a mixture?', a: 'yes', wrong: ['no', 'only at night', 'only at the beach'] },
    { id: 'fixedRecipe', level: 1, q: 'Does a mixture have to have a fixed amount of each part?', a: 'no', wrong: ['yes, always', 'only in a lab', 'only for solids'] },
    { id: 'sieve', level: 2, q: 'What tool can sift sand out from small pebbles?', a: 'a sieve', wrong: ['a magnet', 'a thermometer', 'a balloon'] },
    { id: 'magnetIron', level: 2, q: 'What can pull iron filings out of a pile of sand?', a: 'a magnet', wrong: ['a feather', 'a spoon', 'a cup of water'] },
    { id: 'evaporate', level: 2, q: 'How can you get salt back out of salty water?', a: 'let the water evaporate', wrong: ['freeze it into a rock', 'shake it very hard', 'add more water'] },
    { id: 'strainer', level: 2, q: 'How can you separate rice from water?', a: 'pour it through a strainer', wrong: ['heat it until it sings', 'shine a light on it', 'put a magnet in it'] },
    { id: 'oilWater', level: 2, q: 'What do oil and water do when they are left alone?', a: 'separate into layers', wrong: ['mix completely', 'turn into gas', 'freeze together'] },
    { id: 'coffee', level: 2, q: 'What does a coffee filter do?', a: 'separates the grounds from the liquid', wrong: ['makes the coffee sweeter', 'turns the coffee into gas', 'makes the coffee colder'] },
    { id: 'saltSand', level: 2, q: 'How can you separate salt from sand?', a: 'add water, filter, then evaporate', wrong: ['add a magnet', 'freeze it solid', 'shake it in the sun'] },
    { id: 'ironSand', level: 2, q: 'Which mixture can a magnet help you sort?', a: 'iron filings and sand', wrong: ['sugar and water', 'rice and beans', 'milk and cereal'] },
    { id: 'corkPebble', level: 2, q: 'Cork floats and pebbles sink. What happens when both go in water?', a: 'they separate', wrong: ['both sink to the bottom', 'both float on top', 'both turn into gas'] },
    { id: 'solution', level: 3, q: 'When sugar dissolves in water, what do we call the mix?', a: 'a solution', wrong: ['a gas', 'a pure element', 'a solid rock'] },
    { id: 'solute', level: 3, q: 'What is the substance that dissolves in a solution called?', a: 'the solute', wrong: ['the solvent', 'the filter', 'the magnet'] },
    { id: 'solvent', level: 3, q: 'In salt water, which is the solvent?', a: 'water', wrong: ['salt', 'air', 'sand'] },
    { id: 'disappear', level: 3, q: 'When sugar dissolves in water, does it disappear?', a: 'no, it is still there, spread out', wrong: ['yes, it turns into air', 'yes, it is gone completely', 'yes, it turns into a gas'] },
    { id: 'solutionMix', level: 3, q: 'Is a solution a mixture?', a: 'yes', wrong: ['no', 'only for sugar', 'only in winter'] },
    { id: 'warmWater', level: 3, q: 'Does more sugar dissolve in warm water or cold water?', a: 'warm water', wrong: ['cold water', 'neither dissolves', 'the amount is always the same'] },
    { id: 'seeSugar', level: 3, q: 'Can you see sugar particles once sugar has dissolved in water?', a: 'no', wrong: ['yes, as tiny crystals', 'yes, it sinks to the bottom', 'only in the dark'] },
    { id: 'bestDissolve', level: 3, q: 'Which of these dissolves best in water?', a: 'sugar', wrong: ['sand', 'pebbles', 'pepper'] },
  ],
  [{ skill: 'statesOfMatter', level: 2 }],
)

const lightReflect = factSkill(
  'lightReflect',
  ['Light goes through', 'Light bounces back', 'Light splits into colors'],
  [
    { id: 'transparent', level: 1, q: 'A window lets light pass through. What kind of material is it?', a: 'transparent', wrong: ['opaque', 'translucent', 'reflective'] },
    { id: 'opaque', level: 1, q: 'A wooden door blocks all light. What kind of material is it?', a: 'opaque', wrong: ['transparent', 'translucent', 'glowing'] },
    { id: 'translucent', level: 1, q: 'Frosted glass lets light through but blurs what is behind it. What kind is it?', a: 'translucent', wrong: ['transparent', 'opaque', 'glowing'] },
    { id: 'brick', level: 1, q: 'Which one is opaque?', a: 'a brick wall', wrong: ['a clean window', 'a glass of water', 'a sheet of plastic wrap'] },
    { id: 'water', level: 1, q: 'Which one is transparent?', a: 'a glass of water', wrong: ['a wooden block', 'a brick', 'a metal can'] },
    { id: 'waxPaper', level: 1, q: 'Which one is translucent?', a: 'wax paper', wrong: ['a steel pan', 'a cardboard box', 'a stone'] },
    { id: 'straight', level: 1, q: 'Does light travel in a straight line?', a: 'yes', wrong: ['no, it bends around corners', 'no, it only goes up', 'no, it only goes down'] },
    { id: 'source', level: 1, q: 'What do we call an object that gives off its own light?', a: 'a light source', wrong: ['a mirror', 'a shadow', 'a rainbow'] },
    { id: 'candle', level: 1, q: 'Which one is a light source?', a: 'a candle flame', wrong: ['a mirror', 'a window', 'a cloud'] },
    { id: 'clearGlass', level: 1, q: 'Which material lets the most light through?', a: 'clear glass', wrong: ['wood', 'a towel', 'cardboard'] },
    { id: 'towelBlock', level: 1, q: 'Which one blocks light from passing through?', a: 'a towel', wrong: ['a clear bottle', 'a window', 'wax paper'] },
    { id: 'mirror', level: 2, q: 'What is a shiny surface that bounces light back called?', a: 'a mirror', wrong: ['a window', 'a shadow', 'a blanket'] },
    { id: 'bounces', level: 2, q: 'When light hits a mirror, what happens?', a: 'it bounces back', wrong: ['it soaks in', 'it turns into sound', 'it disappears'] },
    { id: 'reflection', level: 2, q: 'What do we call light bouncing off a surface?', a: 'reflection', wrong: ['absorption', 'shadow', 'echo'] },
    { id: 'spoon', level: 2, q: 'Why can you see yourself in a spoon?', a: 'the spoon reflects light into your eyes', wrong: ['the spoon makes its own light', 'the spoon is see-through', 'the spoon is magnetic'] },
    { id: 'moon', level: 2, q: 'Why can we see the Moon at night?', a: 'it reflects sunlight', wrong: ['it makes its own light', 'it is made of glass', 'it glows from heat'] },
    { id: 'rough', level: 2, q: 'How does light bounce off a rough surface?', a: 'in many directions', wrong: ['in one straight line only', 'not at all', 'backward into the Sun'] },
    { id: 'angle', level: 2, q: 'When light bounces off a flat mirror, what is true about the angles?', a: 'the angle in equals the angle out', wrong: ['the angle in is always zero', 'the light stops at the angle', 'the angle doubles each time'] },
    { id: 'polished', level: 2, q: 'Which one is a good reflector of light?', a: 'a polished metal spoon', wrong: ['a wooden block', 'a wool sweater', 'a sheet of black paper'] },
    { id: 'darkShirt', level: 2, q: 'Why does a dark shirt feel hotter in sunlight?', a: 'it absorbs more light', wrong: ['it reflects all light', 'it glows at night', 'it is made of glass'] },
    { id: 'prism', level: 3, q: 'What is a clear, triangle-shaped glass that splits light into colors?', a: 'a prism', wrong: ['a window', 'a magnet', 'a blanket'] },
    { id: 'white', level: 3, q: 'Which colors make up white light?', a: 'all the colors of the rainbow', wrong: ['only red', 'only black', 'only blue'] },
    { id: 'rainbowTop', level: 3, q: 'Which color is at the top of a rainbow?', a: 'red', wrong: ['violet', 'green', 'blue'] },
    { id: 'faster', level: 3, q: 'Which of these travels fastest?', a: 'light', wrong: ['sound', 'a train', 'a bicycle'] },
    { id: 'rainbowForm', level: 3, q: 'How do rainbows form in the sky?', a: 'sunlight shining through raindrops', wrong: ['moonlight on a rock', 'a fire burning in the rain', 'snow melting on a hill'] },
    { id: 'straw', level: 3, q: 'What does a straw look like in a glass of water?', a: 'it looks bent', wrong: ['it turns into light', 'it disappears', 'it gets warmer'] },
    { id: 'spectrum', level: 3, q: 'What do we call the band of colors made when light splits?', a: 'a spectrum', wrong: ['an echo', 'a shadow', 'a reflection'] },
    { id: 'violet', level: 3, q: 'Which color of visible light has the shortest wavelength?', a: 'violet', wrong: ['red', 'orange', 'yellow'] },
    { id: 'redLong', level: 3, q: 'Which color of visible light has the longest wavelength?', a: 'red', wrong: ['violet', 'blue', 'green'] },
  ],
  [{ skill: 'lightSound', level: 2 }],
)

const waves = factSkill(
  'waves',
  ['How sound travels', 'Pitch and volume', 'Light and radio waves'],
  [
    { id: 'soundWave', level: 1, q: 'Sound travels to your ears as what?', a: 'a wave', wrong: ['a solid block', 'a smell', 'a flash of color'] },
    { id: 'emptySpace', level: 1, q: 'Can sound travel through empty space?', a: 'no', wrong: ['yes, very fast', 'yes, but only at night', 'yes, if it is loud'] },
    { id: 'needs', level: 1, q: 'What does sound need in order to travel?', a: 'something to travel through, like air', wrong: ['an empty space with no air', 'a bright light', 'a magnet'] },
    { id: 'waterFaster', level: 1, q: 'Which of these lets sound travel fastest?', a: 'steel', wrong: ['air', 'water', 'a vacuum'] },
    { id: 'particles', level: 1, q: 'How does a sound wave move through air?', a: 'particles bump into each other', wrong: ['tiny stars fly by', 'bright colors spread', 'sugar crystals melt'] },
    { id: 'vibrate', level: 1, q: 'What do we call the back-and-forth motion that makes sound?', a: 'vibration', wrong: ['an echo', 'a shadow', 'a magnet'] },
    { id: 'echo', level: 1, q: 'What is an echo?', a: 'sound bouncing off a surface', wrong: ['a shadow on the wall', 'a color that fades', 'a rainbow after rain'] },
    { id: 'drum', level: 1, q: 'Why does a drum make sound?', a: 'its skin vibrates', wrong: ['its skin turns green', 'it turns into water', 'it stops moving'] },
    { id: 'eardrum', level: 1, q: 'Which part of your ear picks up sound waves?', a: 'the eardrum', wrong: ['the nose', 'the tongue', 'the elbow'] },
    { id: 'cushion', level: 1, q: 'What happens to sound waves when they hit a soft cushion?', a: 'they get absorbed', wrong: ['they get brighter', 'they turn into light', 'they multiply'] },
    { id: 'higher', level: 2, q: 'What makes a sound higher in pitch?', a: 'faster vibrations', wrong: ['slower vibrations', 'a bigger room', 'a cooler day'] },
    { id: 'louder', level: 2, q: 'What makes a sound louder?', a: 'bigger vibrations', wrong: ['slower vibrations', 'a smaller drum', 'a higher pitch'] },
    { id: 'whistle', level: 2, q: 'Which makes a higher-pitched sound: a tiny whistle or a big drum?', a: 'a tiny whistle', wrong: ['a big drum', 'a thunderclap', 'a foghorn'] },
    { id: 'pitch', level: 2, q: 'What do we call how high or low a sound is?', a: 'pitch', wrong: ['volume', 'echo', 'speed'] },
    { id: 'volume', level: 2, q: 'What do we call how loud a sound is?', a: 'volume', wrong: ['pitch', 'echo', 'frequency'] },
    { id: 'guitar', level: 2, q: 'A guitar string that is pulled tighter makes what kind of sound?', a: 'a higher pitch', wrong: ['a lower pitch', 'no sound at all', 'an echo'] },
    { id: 'frequency', level: 2, q: 'What do we call the number of vibrations per second?', a: 'frequency', wrong: ['volume', 'echo', 'distance'] },
    { id: 'bass', level: 2, q: 'Which sound has the lowest pitch?', a: 'a large bass drum', wrong: ['a tiny whistle', 'a bird chirp', 'a squeaky toy'] },
    { id: 'loudVib', level: 2, q: 'Does a bigger vibration make a louder sound?', a: 'yes', wrong: ['no', 'only in the dark', 'only at the beach'] },
    { id: 'radioWave', level: 3, q: 'Which kind of wave carries radio stations to your radio?', a: 'radio waves', wrong: ['sound waves', 'water waves', 'ocean tides'] },
    { id: 'lightSpace', level: 3, q: 'Can light travel through empty space?', a: 'yes', wrong: ['no, never', 'only at night', 'only through water'] },
    { id: 'allThree', level: 3, q: 'Which travel as waves: light, sound, or radio?', a: 'all three', wrong: ['only sound', 'only light', 'none of them'] },
    { id: 'phones', level: 3, q: 'Cell phones send information using what?', a: 'radio waves', wrong: ['light bulbs', 'a bicycle', 'a drum'] },
    { id: 'eyesSee', level: 3, q: 'What kind of wave do we see with our eyes?', a: 'light', wrong: ['sound', 'radio', 'water'] },
    { id: 'electromag', level: 3, q: 'Are light waves and radio waves both electromagnetic waves?', a: 'yes', wrong: ['no', 'only in summer', 'only inside a house'] },
    { id: 'fastest', level: 3, q: 'Which travels fastest: light, sound, or a car?', a: 'light', wrong: ['sound', 'a car', 'a bird'] },
    { id: 'wavelength', level: 3, q: 'What do we call the distance from one wave peak to the next?', a: 'wavelength', wrong: ['volume', 'echo', 'pitch'] },
    { id: 'microwave', level: 3, q: 'Which kind of wave heats food in a microwave oven?', a: 'microwaves', wrong: ['sound waves', 'earthquake waves', 'water waves'] },
  ],
  [{ skill: 'lightSound', level: 2 }],
)

const classification = factSkill(
  'classification',
  ['Backbones and no backbones', 'Plants, fungi, and animals', 'Groups of animals'],
  [
    { id: 'frog', level: 1, q: 'Which animal has a backbone?', a: 'a frog', wrong: ['a snail', 'a jellyfish', 'a starfish'] },
    { id: 'turtle', level: 1, q: 'Which animal has a backbone?', a: 'a turtle', wrong: ['an earthworm', 'a crab', 'a squid'] },
    { id: 'trout', level: 1, q: 'Which animal has a backbone?', a: 'a trout', wrong: ['a sea star', 'a butterfly', 'an octopus'] },
    { id: 'spider', level: 1, q: 'Which animal does NOT have a backbone?', a: 'a spider', wrong: ['a lizard', 'a robin', 'a shark'] },
    { id: 'jellyfish', level: 1, q: 'Which animal does NOT have a backbone?', a: 'a jellyfish', wrong: ['a bat', 'a cat', 'a lizard'] },
    { id: 'vertebrates', level: 1, q: 'Animals with backbones are called what?', a: 'vertebrates', wrong: ['arthropods', 'mollusks', 'fungi'] },
    { id: 'invertebrates', level: 1, q: 'Animals without backbones are called what?', a: 'invertebrates', wrong: ['reptiles', 'fungi', 'plants'] },
    { id: 'bird', level: 1, q: 'Which animal is a vertebrate?', a: 'a bird', wrong: ['a worm', 'a clam', 'a snail'] },
    { id: 'mosquito', level: 1, q: 'Does a mosquito have a backbone?', a: 'no', wrong: ['yes, a small one', 'only when it is old', 'only in summer'] },
    { id: 'fungi', level: 2, q: 'What group do mushrooms belong to?', a: 'fungi', wrong: ['plants', 'animals', 'minerals'] },
    { id: 'ferns', level: 2, q: 'Which group do ferns belong to?', a: 'plants', wrong: ['fungi', 'animals', 'minerals'] },
    { id: 'mushFood', level: 2, q: 'Do mushrooms make their own food from sunlight?', a: 'no', wrong: ['yes', 'only at night', 'only in the rain'] },
    { id: 'plantFood', level: 2, q: 'Do plants make their own food?', a: 'yes', wrong: ['no', 'only at night', 'only in winter'] },
    { id: 'mold', level: 2, q: 'What kind of living thing is mold?', a: 'a fungus', wrong: ['a plant', 'an animal', 'a mineral'] },
    { id: 'animalsEat', level: 2, q: 'Which group eats food to get energy and moves around?', a: 'animals', wrong: ['plants', 'ferns', 'mosses'] },
    { id: 'producers', level: 2, q: 'What do we call living things that make their own food?', a: 'producers', wrong: ['consumers', 'decomposers', 'minerals'] },
    { id: 'decomposers', level: 2, q: 'What do we call living things that break down dead plants and animals?', a: 'decomposers', wrong: ['producers', 'consumers', 'minerals'] },
    { id: 'milk', level: 3, q: 'What do mammal mothers make to feed their babies?', a: 'milk', wrong: ['nectar', 'sap', 'seeds'] },
    { id: 'feathers', level: 3, q: 'What do birds have that other animals do not?', a: 'feathers', wrong: ['scales', 'fur', 'shells'] },
    { id: 'crocodile', level: 3, q: 'Which animal is a reptile?', a: 'a crocodile', wrong: ['a toad', 'a salamander', 'a whale'] },
    { id: 'frogWater', level: 3, q: 'Why do frogs need water?', a: 'to lay their eggs and grow', wrong: ['to make their own food', 'to grow feathers', 'to build nests'] },
    { id: 'tuna', level: 3, q: 'Which animal is a fish?', a: 'a tuna', wrong: ['a whale', 'a seal', 'a bat'] },
    { id: 'bat', level: 3, q: 'Which animal is a mammal that can fly?', a: 'a bat', wrong: ['a robin', 'a bee', 'an owl'] },
    { id: 'salamander', level: 3, q: 'Which animal is an amphibian?', a: 'a salamander', wrong: ['a lizard', 'a snake', 'a hawk'] },
    { id: 'beetle', level: 3, q: 'Which animal is an insect?', a: 'a beetle', wrong: ['a spider', 'a crab', 'a worm'] },
  ],
  [{ skill: 'animals', level: 2 }],
)

const scientificNames = factSkill(
  'scientificNames',
  ['Why scientists use Latin names', 'Two-part names', 'Famous scientific names'],
  [
    { id: 'latin', level: 1, q: 'What language are most scientific names based on?', a: 'Latin', wrong: ['Spanish', 'English', 'French'] },
    { id: 'sameAnimal', level: 1, q: 'Why do scientists use scientific names?', a: 'so everyone means the same animal', wrong: ['to make the name sound fancy', 'to hide it from other scientists', 'to say how old it is'] },
    { id: 'commonNames', level: 1, q: 'Do all languages use the same common name for an animal?', a: 'no', wrong: ['yes, always', 'yes, but only for birds', 'only in the ocean'] },
    { id: 'twoParts', level: 1, q: 'How many parts does a scientific name have?', a: 'two', wrong: ['one', 'three', 'four'] },
    { id: 'genusFirst', level: 1, q: 'What is the first part of a scientific name called?', a: 'the genus', wrong: ['the kingdom', 'the family', 'the habitat'] },
    { id: 'speciesSecond', level: 1, q: 'What is the second part of a scientific name called?', a: 'the species', wrong: ['the habitat', 'the kingdom', 'the diet'] },
    { id: 'commonNot', level: 1, q: 'Which of these is a common name, not a scientific name?', a: 'gray wolf', wrong: ['Canis lupus', 'Felis catus', 'Homo sapiens'] },
    { id: 'italics', level: 1, q: 'In print, scientific names are usually written in what?', a: 'italics', wrong: ['bold capitals', 'a secret code', 'all numbers'] },
    { id: 'speciesDef', level: 1, q: 'What is a species?', a: 'living things that can make babies together', wrong: ['a type of rock', 'a kind of weather', 'a large body of water'] },
    { id: 'humans', level: 2, q: 'What is the scientific name for humans?', a: 'Homo sapiens', wrong: ['Canis lupus', 'Felis catus', 'Ursus arctos'] },
    { id: 'wolf', level: 2, q: 'What animal is Canis lupus?', a: 'a gray wolf', wrong: ['a house cat', 'a lion', 'a tiger'] },
    { id: 'cat', level: 2, q: 'What animal is Felis catus?', a: 'a house cat', wrong: ['a gray wolf', 'a lion', 'a tiger'] },
    { id: 'lion', level: 2, q: 'What animal is Panthera leo?', a: 'a lion', wrong: ['a tiger', 'a leopard', 'a house cat'] },
    { id: 'bear', level: 2, q: 'What animal is Ursus arctos?', a: 'a brown bear', wrong: ['a polar bear', 'a panda', 'a gray wolf'] },
    { id: 'horse', level: 2, q: 'What animal is Equus caballus?', a: 'a horse', wrong: ['a zebra', 'a donkey', 'a camel'] },
    { id: 'elephant', level: 2, q: 'Which animal is Elephas maximus?', a: 'an Asian elephant', wrong: ['an African elephant', 'a woolly mammoth', 'a rhinoceros'] },
    { id: 'tiger', level: 2, q: 'Which animal has the scientific name Panthera tigris?', a: 'a tiger', wrong: ['a lion', 'a leopard', 'a house cat'] },
    { id: 'maple', level: 3, q: 'Acer is the genus name for which tree?', a: 'maple', wrong: ['oak', 'pine', 'birch'] },
    { id: 'oak', level: 3, q: 'Quercus is the genus name for which tree?', a: 'oak', wrong: ['maple', 'pine', 'birch'] },
    { id: 'panthera', level: 3, q: 'What is the genus name for the tiger?', a: 'Panthera', wrong: ['Felis', 'Ursus', 'Canis'] },
    { id: 'tigris', level: 3, q: 'What is the species name in Panthera tigris?', a: 'tigris', wrong: ['leo', 'catus', 'sapiens'] },
    { id: 'genusMeans', level: 3, q: 'What does the genus name in Homo sapiens tell us?', a: 'the group it belongs to', wrong: ['its favorite food', 'its color', 'how fast it runs'] },
    { id: 'grayWolf', level: 3, q: 'Which scientific name is for the gray wolf?', a: 'Canis lupus', wrong: ['Felis catus', 'Homo sapiens', 'Ursus arctos'] },
    { id: 'houseCat', level: 3, q: 'Which scientific name is for a house cat?', a: 'Felis catus', wrong: ['Canis lupus', 'Panthera leo', 'Equus caballus'] },
    { id: 'lionName', level: 3, q: 'Which scientific name is for a lion?', a: 'Panthera leo', wrong: ['Canis lupus', 'Felis catus', 'Ursus arctos'] },
  ],
  [{ skill: 'classification', level: 2 }],
)

const cells = factSkill(
  'cells',
  ['The basics of cells', 'Parts of a cell', 'Plant and animal cells'],
  [
    { id: 'smallest', level: 1, q: 'What is the smallest unit of life?', a: 'a cell', wrong: ['a bone', 'a leaf', 'a drop of water'] },
    { id: 'microscope', level: 1, q: 'What do we need to see most cells?', a: 'a microscope', wrong: ['a telescope', 'a ruler', 'a thermometer'] },
    { id: 'allCells', level: 1, q: 'Are all living things made of cells?', a: 'yes', wrong: ['no', 'only plants', 'only animals'] },
    { id: 'hooke', level: 1, q: 'Who first saw cells in cork under an early microscope in 1665?', a: 'Robert Hooke', wrong: ['Charles Darwin', 'Isaac Newton', 'Gregor Mendel'] },
    { id: 'oneCell', level: 1, q: 'What is a living thing made of only one cell called?', a: 'a single-celled organism', wrong: ['a multicellular plant', 'a mineral', 'a fossil'] },
    { id: 'grow', level: 1, q: 'How do living things grow bigger?', a: 'their cells grow and divide', wrong: ['their cells shrink', 'their cells turn into rock', 'their cells stop working'] },
    { id: 'division', level: 1, q: 'What is it called when one cell splits into two?', a: 'cell division', wrong: ['photosynthesis', 'evaporation', 'erosion'] },
    { id: 'amoeba', level: 1, q: 'Which living thing is made of just one cell?', a: 'an amoeba', wrong: ['a whale', 'a tree', 'a human'] },
    { id: 'bacteria', level: 1, q: 'Most bacteria are made of how many cells?', a: 'one', wrong: ['two', 'many', 'none'] },
    { id: 'nucleusControl', level: 2, q: 'Which part of a cell controls what the cell does?', a: 'the nucleus', wrong: ['the cell wall', 'the chloroplast', 'the membrane'] },
    { id: 'membrane', level: 2, q: 'Which part of a cell lets things in and out?', a: 'the cell membrane', wrong: ['the nucleus', 'the chloroplast', 'the cell wall'] },
    { id: 'dna', level: 2, q: 'Which part of a cell holds its DNA?', a: 'the nucleus', wrong: ['the cell membrane', 'the cell wall', 'the vacuole'] },
    { id: 'mitochondria', level: 2, q: 'Which part of a cell releases energy from food?', a: 'mitochondria', wrong: ['the nucleus', 'the cell wall', 'the chloroplast'] },
    { id: 'cytoplasm', level: 2, q: 'What is the jelly-like inside of a cell called?', a: 'cytoplasm', wrong: ['sap', 'bone', 'the cell wall'] },
    { id: 'ribosome', level: 2, q: 'Which tiny part of a cell makes proteins?', a: 'ribosomes', wrong: ['mitochondria', 'the nucleus', 'the cell wall'] },
    { id: 'vacuole', level: 2, q: 'Which part of a plant cell stores water?', a: 'the vacuole', wrong: ['the chloroplast', 'the cell membrane', 'the nucleus'] },
    { id: 'organelle', level: 2, q: 'What do we call a tiny part inside a cell that has a job?', a: 'an organelle', wrong: ['a cell wall', 'a fossil', 'an atom'] },
    { id: 'plantWall', level: 3, q: 'Which kind of cell has a cell wall?', a: 'plant cells', wrong: ['animal cells', 'blood cells', 'nerve cells'] },
    { id: 'captures', level: 3, q: 'Which cell part captures sunlight to make food?', a: 'chloroplasts', wrong: ['mitochondria', 'the nucleus', 'the cell wall'] },
    { id: 'animalChloro', level: 3, q: 'Do animal cells have chloroplasts?', a: 'no', wrong: ['yes, always', 'yes, but only in fish', 'only in the dark'] },
    { id: 'wallJob', level: 3, q: 'What does a cell wall give a plant cell?', a: 'strength and shape', wrong: ['the power to fly', 'the ability to glow', 'the power to swim'] },
    { id: 'common', level: 3, q: 'Which part do plant and animal cells have in common?', a: 'a cell membrane', wrong: ['a cell wall', 'chloroplasts', 'a tail'] },
    { id: 'plantMito', level: 3, q: 'Do plant cells have mitochondria too?', a: 'yes', wrong: ['no', 'only at night', 'only in leaves'] },
    { id: 'foodSun', level: 3, q: 'Which cells can make their own food from sunlight?', a: 'plant cells', wrong: ['animal cells', 'nerve cells', 'blood cells'] },
    { id: 'animalWall', level: 3, q: 'Do animal cells have a cell wall?', a: 'no', wrong: ['yes, always', 'yes, but thin ones', 'only in fish'] },
  ],
  [{ skill: 'livingThings', level: 2 }],
)

const fossils = factSkill(
  'fossils',
  ['What fossils are', 'How fossils form', 'Fossils over time'],
  [
    { id: 'fossilWhat', level: 1, q: 'What is a fossil?', a: 'the remains or traces of ancient life', wrong: ['a new kind of rock', 'a type of cloud', 'a tool for measuring'] },
    { id: 'where', level: 1, q: 'Where are fossils most often found?', a: 'in layers of rock', wrong: ['only in the ocean', 'only on mountaintops', 'only in deserts'] },
    { id: 'trace', level: 1, q: 'What kind of fossil is a footprint preserved in rock?', a: 'a trace fossil', wrong: ['a mold fossil', 'a cast fossil', 'a whole body fossil'] },
    { id: 'amber', level: 1, q: 'What is amber?', a: 'hardened tree resin', wrong: ['melted glass', 'frozen water', 'a kind of sand'] },
    { id: 'stone', level: 1, q: 'Over millions of years, a bone can slowly turn into what?', a: 'stone', wrong: ['sugar', 'soap', 'butter'] },
    { id: 'petrified', level: 1, q: 'What do we call wood that has slowly turned into stone over millions of years?', a: 'petrified wood', wrong: ['driftwood', 'plywood', 'sawdust'] },
    { id: 'paleo', level: 1, q: 'What do we call a scientist who studies fossils?', a: 'a paleontologist', wrong: ['a meteorologist', 'a dentist', 'a chef'] },
    { id: 'shell', level: 1, q: 'Which of these is a body fossil?', a: 'a fossil seashell', wrong: ['a fossil footprint', 'a fossil nest', 'a fossil burrow'] },
    { id: 'buried', level: 2, q: 'What usually buries a body so it can become a fossil?', a: 'mud, sand, or ash', wrong: ['warm sunshine', 'dry grass', 'open air'] },
    { id: 'mold', level: 2, q: 'What is a mold fossil?', a: 'a hollow shape left in rock', wrong: ['a seed inside a fruit', 'a rock that floats', 'a bone of a fish'] },
    { id: 'cast', level: 2, q: 'What is a cast fossil?', a: 'a mold that was filled in with minerals', wrong: ['a leaf print', 'a seed shell', 'a shark tooth'] },
    { id: 'paleoStudy', level: 2, q: 'What is the study of fossils and ancient life called?', a: 'paleontology', wrong: ['astronomy', 'botany', 'meteorology'] },
    { id: 'layersWhy', level: 2, q: 'Why do scientists study fossils in rock layers?', a: 'the layers show which fossils are older', wrong: ['the layers show the weather today', 'the layers are made of sugar', 'the layers glow at night'] },
    { id: 'indexFossil', level: 2, q: 'What is an index fossil?', a: 'a fossil that helps date a rock layer', wrong: ['a fossil from a fish only', 'a fossil of a flower only', 'a fossil that is always in ice'] },
    { id: 'impression', level: 2, q: 'What is a flat fossil print of a leaf in rock called?', a: 'an impression', wrong: ['a coprolite', 'a cast', 'a fossil footprint'] },
    { id: 'coprolite', level: 2, q: 'What is a fossil of animal poop called?', a: 'a coprolite', wrong: ['a fossil footprint', 'a fossil egg', 'a fossil nest'] },
    { id: 'trilobite', level: 3, q: 'Which sea creature is a common fossil in many rock layers?', a: 'trilobites', wrong: ['dinosaurs', 'woolly mammoths', 'pterosaurs'] },
    { id: 'fuels', level: 3, q: 'Fossil fuels like coal and oil formed from what?', a: 'ancient plants and tiny sea animals', wrong: ['ancient sand dunes', 'ancient ice sheets', 'melted volcano rock'] },
    { id: 'seaMountain', level: 3, q: 'Sea fossils found on a mountaintop show what?', a: 'the land was once under the sea', wrong: ['the mountain grew from ice', 'the sea was on fire', 'the fish learned to climb'] },
    { id: 'importance', level: 3, q: 'Why are fossils important to scientists?', a: 'they show what life was like long ago', wrong: ['they make rocks heavier', 'they make rain stop', 'they change the Moon\'s path'] },
    { id: 'oldestBottom', level: 3, q: 'In undisturbed rock layers, which layer usually has the oldest fossils?', a: 'the bottom layer', wrong: ['the top layer', 'the middle layer', 'the side layer'] },
    { id: 'traceExample', level: 3, q: 'Which of these is an example of a trace fossil?', a: 'a dinosaur footprint', wrong: ['a fossil shell', 'a fossil tooth', 'a fossil leaf'] },
    { id: 'nonrenew', level: 3, q: 'Are fossil fuels renewable or nonrenewable?', a: 'nonrenewable', wrong: ['renewable', 'unlimited', 'endless'] },
    { id: 'dinoRock', level: 3, q: 'Dinosaur bones are usually found in which kind of rock?', a: 'sedimentary rock', wrong: ['granite', 'basalt', 'marble'] },
  ],
  [{ skill: 'rocks', level: 2 }],
)

const earthFeatures = factSkill(
  'earthFeatures',
  ['Land shapes', 'Land next to water', 'Landforms that rise and dip'],
  [
    { id: 'peninsula', level: 1, q: 'A piece of land with water on three sides is called what?', a: 'a peninsula', wrong: ['an island', 'an isthmus', 'a valley'] },
    { id: 'island', level: 1, q: 'A piece of land with water all around it is called what?', a: 'an island', wrong: ['a peninsula', 'a plateau', 'a valley'] },
    { id: 'valley', level: 1, q: 'A low area between hills or mountains is called what?', a: 'a valley', wrong: ['a plateau', 'a delta', 'a peninsula'] },
    { id: 'plateau', level: 1, q: 'A large, flat area high above sea level is called what?', a: 'a plateau', wrong: ['a valley', 'a bay', 'a delta'] },
    { id: 'bay', level: 1, q: 'A body of water partly surrounded by land is called what?', a: 'a bay', wrong: ['an island', 'a canyon', 'a glacier'] },
    { id: 'mesa', level: 1, q: 'A flat-topped hill with steep sides is called what?', a: 'a mesa', wrong: ['a sand dune', 'a delta', 'a ridge'] },
    { id: 'isthmus', level: 1, q: 'A narrow strip of land that connects two larger pieces of land is called what?', a: 'an isthmus', wrong: ['a peninsula', 'an island', 'a canyon'] },
    { id: 'range', level: 1, q: 'A group of mountains in a line is called what?', a: 'a mountain range', wrong: ['a plateau', 'a delta', 'a bay'] },
    { id: 'delta', level: 2, q: 'Where a river meets the sea and drops mud to make fan-shaped land, what is it called?', a: 'a delta', wrong: ['a canyon', 'a fjord', 'a mesa'] },
    { id: 'fjord', level: 2, q: 'A narrow inlet of the sea with steep cliffs, carved by glaciers, is called what?', a: 'a fjord', wrong: ['a lagoon', 'a plateau', 'a canyon'] },
    { id: 'beach', level: 2, q: 'The sandy land at the edge of a lake or ocean is called what?', a: 'a beach', wrong: ['a glacier', 'a volcano', 'a canyon'] },
    { id: 'atoll', level: 2, q: 'A ring of coral islands around a lagoon is called what?', a: 'an atoll', wrong: ['a peninsula', 'a mesa', 'a delta'] },
    { id: 'lagoon', level: 2, q: 'A calm, shallow body of water separated from the sea by a sandbar or reef is what?', a: 'a lagoon', wrong: ['a fjord', 'a mesa', 'a glacier'] },
    { id: 'strait', level: 2, q: 'A narrow body of water between two landmasses is called what?', a: 'a strait', wrong: ['a bay', 'a cape', 'a plateau'] },
    { id: 'cape', level: 2, q: 'A pointed piece of land that sticks out into the sea is called what?', a: 'a cape', wrong: ['a strait', 'a lagoon', 'a delta'] },
    { id: 'sandbar', level: 2, q: 'A long ridge of sand built up in a river or sea is called what?', a: 'a sandbar', wrong: ['a glacier', 'a volcano', 'a canyon'] },
    { id: 'ridge', level: 3, q: 'A long, narrow, high stretch of land is called what?', a: 'a ridge', wrong: ['a lagoon', 'a fjord', 'a delta'] },
    { id: 'crater', level: 3, q: 'A bowl-shaped hollow in the ground made by an impact is called what?', a: 'a crater', wrong: ['a ridge', 'a plateau', 'a delta'] },
    { id: 'cave', level: 3, q: 'What landform forms when water slowly dissolves limestone underground?', a: 'a cave', wrong: ['a delta', 'a mesa', 'a volcano'] },
    { id: 'stalactite', level: 3, q: 'Stalactites hang from where?', a: 'the ceiling of a cave', wrong: ['the floor of the ocean', 'the top of a volcano', 'the side of a glacier'] },
    { id: 'stalagmite', level: 3, q: 'Stalagmites grow up from where?', a: 'the floor of a cave', wrong: ['the top of a mountain', 'the bottom of a river', 'the top of a sand dune'] },
    { id: 'sinkhole', level: 3, q: 'A deep hole that forms when ground above dissolved rock collapses is called what?', a: 'a sinkhole', wrong: ['a crater', 'a delta', 'a mesa'] },
    { id: 'pass', level: 3, q: 'A low gap between mountains that a road can cross is called what?', a: 'a mountain pass', wrong: ['a fjord', 'a lagoon', 'a strait'] },
    { id: 'source', level: 3, q: 'Where does a river begin?', a: 'its source', wrong: ['its mouth', 'its delta', 'its floodplain'] },
    { id: 'floodplain', level: 3, q: 'What is a floodplain?', a: 'flat land beside a river that floods', wrong: ['a high ridge above a lake', 'a dry desert', 'a pile of volcanic ash'] },
  ],
  [{ skill: 'earthEvents', level: 2 }],
)

// ============================================================================================
// SOCIAL STUDIES
// ============================================================================================

const humanGeography = factSkill(
  'humanGeography',
  ['Changing the land', 'Culture and communities', 'Regions and people'],
  [
    { id: 'bridge', level: 1, q: 'Which one is a human-made feature?', a: 'a bridge', wrong: ['a mountain', 'a river', 'a lake'] },
    { id: 'waterfall', level: 1, q: 'Which one is a natural feature?', a: 'a waterfall', wrong: ['a highway', 'a dam', 'a city park'] },
    { id: 'road', level: 1, q: 'Which one is a human-made feature?', a: 'a road', wrong: ['a forest', 'a canyon', 'a glacier'] },
    { id: 'population', level: 1, q: 'What do we call the number of people who live in a place?', a: 'population', wrong: ['culture', 'climate', 'erosion'] },
    { id: 'culture', level: 1, q: 'What do we call a group\'s language, food, and customs?', a: 'culture', wrong: ['population', 'climate', 'terrain'] },
    { id: 'community', level: 1, q: 'What do we call a place where people live and work together?', a: 'a community', wrong: ['a desert', 'a glacier', 'a volcano'] },
    { id: 'landUse', level: 1, q: 'What do we call how people use land for homes, farms, and roads?', a: 'land use', wrong: ['weather', 'climate', 'erosion'] },
    { id: 'dam', level: 1, q: 'Which one is a human change to a river?', a: 'a dam', wrong: ['a meander', 'a waterfall', 'a delta'] },
    { id: 'farm', level: 1, q: 'A farm is an example of what kind of feature?', a: 'a human-made feature', wrong: ['a natural feature', 'a volcano', 'a glacier'] },
    { id: 'desertHome', level: 2, q: 'Why do desert homes look different from rainforest homes?', a: 'the climate and materials are different', wrong: ['they all follow the same plan', 'the homes never change', 'the rain builds them'] },
    { id: 'neighborhood', level: 2, q: 'What is a neighborhood?', a: 'a small area within a town or city', wrong: ['a large ocean', 'a mountain range', 'a kind of weather'] },
    { id: 'migration', level: 2, q: 'What is migration?', a: 'people moving from one place to another', wrong: ['a fish swimming upstream', 'a rock crumbling', 'a cloud forming'] },
    { id: 'urban', level: 2, q: 'Which word describes places with many buildings and people, like a big city?', a: 'urban', wrong: ['rural', 'arid', 'alpine'] },
    { id: 'city', level: 2, q: 'What is a big town with many buildings called?', a: 'a city', wrong: ['a village', 'a canyon', 'a glacier'] },
    { id: 'suburb', level: 2, q: 'What is a suburb?', a: 'a community just outside a city', wrong: ['a deep ocean trench', 'a large desert', 'a river delta'] },
    { id: 'hotClothes', level: 2, q: 'Why do people in hot places often wear light clothes?', a: 'it helps them stay cool', wrong: ['it makes them float', 'it makes them invisible', 'it helps them run faster'] },
    { id: 'settlement', level: 2, q: 'What is a settlement?', a: 'a place where people build homes', wrong: ['a place with no people', 'a type of rock', 'a bolt of lightning'] },
    { id: 'region', level: 3, q: 'What do we call an area that has common features, like climate or language?', a: 'a region', wrong: ['a route', 'a compass', 'a clock'] },
    { id: 'border', level: 3, q: 'What is a border?', a: 'a line that separates places', wrong: ['a type of rock', 'a song', 'a river delta'] },
    { id: 'scale', level: 3, q: 'Which map feature shows how much smaller a map is than real life?', a: 'the scale', wrong: ['the title', 'the compass rose', 'the legend'] },
    { id: 'density', level: 3, q: 'What does population density tell us?', a: 'how many people live in an area', wrong: ['what food people eat', 'how old people are', 'what language people speak'] },
    { id: 'tradeRoute', level: 3, q: 'What is a trade route?', a: 'a path that goods travel between places', wrong: ['a path for only one town', 'a line on a weather map', 'a river that dries up'] },
    { id: 'capital', level: 3, q: 'What is a capital city?', a: 'the city where the government sits', wrong: ['a town with no government', 'a village by a river', 'a farm with many animals'] },
    { id: 'country', level: 3, q: 'What is a country?', a: 'a place with its own government and borders', wrong: ['a type of ocean', 'a kind of weather', 'a fancy hat'] },
    { id: 'immigrant', level: 3, q: 'What is an immigrant?', a: 'a person who moves to a new country', wrong: ['a person who studies stars', 'a person who builds ships', 'a person who grows rice'] },
  ],
  [{ skill: 'physicalGeography', level: 2 }],
)

const evaluateSources = factSkill(
  'evaluateSources',
  ['Firsthand and secondhand', 'Checking a source', 'Facts and opinions'],
  [
    { id: 'diary', level: 1, q: 'A diary written by someone at the time is what kind of source?', a: 'a primary source', wrong: ['a secondary source', 'a made-up story', 'a rumor'] },
    { id: 'textbook', level: 1, q: 'A history textbook written today is what kind of source?', a: 'a secondary source', wrong: ['a primary source', 'a rumor', 'a guess'] },
    { id: 'photo', level: 1, q: 'A photo taken during an event is what kind of source?', a: 'a primary source', wrong: ['a secondary source', 'a made-up story', 'a rumor'] },
    { id: 'letter', level: 1, q: 'Which one is a primary source?', a: 'a letter written by a soldier in 1865', wrong: ['a textbook written in 2020', 'an encyclopedia article', 'a movie based on history'] },
    { id: 'eyewitness', level: 1, q: 'What is an eyewitness?', a: 'someone who saw an event happen', wrong: ['someone who wrote a textbook', 'someone who draws maps', 'someone who studies rocks'] },
    { id: 'goodQ', level: 1, q: 'What is a good question to ask about a source?', a: 'who wrote it and when', wrong: ['what color is the cover', 'how many pages are there', 'is the font big'] },
    { id: 'secondary', level: 1, q: 'What is a secondary source?', a: 'a source made later that describes events', wrong: ['a source made during the event', 'a photo taken during the event', 'a diary written by a witness'] },
    { id: 'primary', level: 1, q: 'What is a primary source?', a: 'made at the time, like a diary or photo', wrong: ['a book written about the past', 'a summary of a whole era', 'a map of a future city'] },
    { id: 'oldNews', level: 1, q: 'Is an old newspaper from the event a primary source?', a: 'yes', wrong: ['no', 'only if it is funny', 'only in a museum'] },
    { id: 'compare', level: 2, q: 'Why do historians compare two sources?', a: 'to check whether the facts match', wrong: ['to make the story shorter', 'to find the cheapest book', 'to choose a favorite color'] },
    { id: 'when', level: 2, q: 'Why check when a source was written?', a: 'to see if it was written close to the event', wrong: ['to see if it has a nice cover', 'to count the pictures', 'to learn the price'] },
    { id: 'author', level: 2, q: 'What is an author?', a: 'the person who wrote or made the source', wrong: ['the place it was printed', 'the person who bought it', 'the size of the book'] },
    { id: 'bias', level: 2, q: 'What is bias?', a: 'a strong leaning toward one side', wrong: ['a type of map', 'a kind of rock', 'a kind of clock'] },
    { id: 'origin', level: 2, q: 'Why is it useful to know where a source came from?', a: 'to learn how much to trust it', wrong: ['to make it cost less', 'to change its color', 'to find the page count'] },
    { id: 'expertFact', level: 2, q: 'Which is usually more reliable: a fact checked by experts or a rumor?', a: 'a fact checked by experts', wrong: ['a rumor', 'a story someone heard', 'a guess'] },
    { id: 'oneSide', level: 2, q: 'What clue suggests a source may be biased?', a: 'it tells only one side of the story', wrong: ['it has a table of contents', 'it has a map inside', 'it has many colorful pictures'] },
    { id: 'citation', level: 2, q: 'What is a source citation?', a: 'a note saying where information came from', wrong: ['a song written for a movie', 'a photo of a teacher', 'a secret code'] },
    { id: 'fact', level: 3, q: 'What is a fact?', a: 'something that can be checked and proved true', wrong: ['an opinion or feeling', 'a guess about the future', 'your favorite thing'] },
    { id: 'opinion', level: 3, q: 'What is an opinion?', a: 'what someone thinks or feels', wrong: ['a fact that can be measured', 'a date on a calendar', 'a distance on a map'] },
    { id: 'factSentence', level: 3, q: 'Which sentence is a fact?', a: 'Philadelphia is in Pennsylvania', wrong: ['Philadelphia is the best city', 'Pennsylvania has the tastiest food', 'Philadelphia is too cold for kids'] },
    { id: 'opinionSentence', level: 3, q: 'Which sentence is an opinion?', a: 'Pizza is the best food', wrong: ['Pizza is made with dough and cheese', 'Pizza is sold in many stores', 'Pizza is cooked in an oven'] },
    { id: 'careful', level: 3, q: 'When reading history, what helps you be careful?', a: 'comparing sources and checking facts', wrong: ['believing the first thing you read', 'only reading the title', 'skipping the dates'] },
    { id: 'thinkWord', level: 3, q: 'Which phrase often signals an opinion?', a: 'I think', wrong: ['In 1776', 'According to records', 'The census counted'] },
    { id: 'sunFact', level: 3, q: 'Which is a fact about the Sun?', a: 'it is a star', wrong: ['it is the best color', 'it is too cold to visit', 'it tastes sweet'] },
    { id: 'dogOpinion', level: 3, q: 'Is "dogs are the best pets" a fact or an opinion?', a: 'an opinion', wrong: ['a fact', 'a measurement', 'a date'] },
  ],
  [{ skill: 'timeline', level: 3 }],
)

const banking = factSkill(
  'banking',
  ['Saving and spending', 'Banks and interest', 'Loans and budgets'],
  [
    { id: 'bank', level: 1, q: 'Where can you keep money safe?', a: 'a bank', wrong: ['a library', 'a bakery', 'a bus stop'] },
    { id: 'saving', level: 1, q: 'What is saving money?', a: 'keeping some money for later', wrong: ['spending it all right away', 'giving it all away', 'hiding it in the grass'] },
    { id: 'spending', level: 1, q: 'What is spending money?', a: 'paying for goods or services', wrong: ['keeping it in a jar forever', 'earning it at a job', 'counting it for fun'] },
    { id: 'wages', level: 1, q: 'What do we call money you earn for work?', a: 'wages', wrong: ['a loan', 'a tax', 'a gift card'] },
    { id: 'piggy', level: 1, q: 'What is a piggy bank for?', a: 'saving coins', wrong: ['growing money', 'making a loan', 'buying a car'] },
    { id: 'wallet', level: 1, q: 'What is a wallet used for?', a: 'holding money and cards', wrong: ['growing food', 'playing music', 'lighting a room'] },
    { id: 'whySave', level: 1, q: 'Why do people save money?', a: 'for emergencies and future goals', wrong: ['so they can throw it away', 'so it stops being money', 'so the bank keeps it forever'] },
    { id: 'bill', level: 1, q: 'What do we call a request to pay for a service you got?', a: 'a bill', wrong: ['a savings goal', 'a kind of stock', 'a loan from a friend'] },
    { id: 'checking', level: 1, q: 'What is a checking account used for?', a: 'paying bills and everyday spending', wrong: ['storing gold bars', 'growing plants', 'playing video games'] },
    { id: 'interest', level: 2, q: 'What is interest?', a: 'extra money for keeping or borrowing money', wrong: ['a fee for losing a card', 'a kind of coin', 'the price of a car'] },
    { id: 'savingsPay', level: 2, q: 'What can happen when you put money in a savings account?', a: 'the bank may pay you interest', wrong: ['the bank turns it into toys', 'the bank hides it in a wall', 'the bank gives it away'] },
    { id: 'lend', level: 2, q: 'What do banks do with the money people deposit?', a: 'lend some of it to others', wrong: ['burn it', 'put it in the ocean', 'hide it under the floor'] },
    { id: 'deposit', level: 2, q: 'What is a deposit?', a: 'putting money into an account', wrong: ['taking money out of an account', 'paying a bill in cash', 'borrowing money from a bank'] },
    { id: 'withdrawal', level: 2, q: 'What is a withdrawal?', a: 'taking money out of an account', wrong: ['putting money into an account', 'a gift from a relative', 'a sale at a store'] },
    { id: 'atm', level: 2, q: 'What is an ATM?', a: 'a machine for getting cash from your account', wrong: ['a machine that makes ice cream', 'a machine that washes cars', 'a type of savings jar'] },
    { id: 'debit', level: 2, q: 'What does a debit card take money from?', a: 'your bank account', wrong: ['a loan you owe', 'a gift card', 'a coin jar'] },
    { id: 'credit', level: 2, q: 'What is a credit card?', a: 'a card that lets you borrow to pay', wrong: ['a card that opens doors', 'a card for a library book', 'a card that holds coins'] },
    { id: 'loan', level: 3, q: 'What is a loan?', a: 'money you borrow and must pay back', wrong: ['money you get as a gift', 'money you never have to repay', 'money you keep forever'] },
    { id: 'budget', level: 3, q: 'What is a budget?', a: 'a plan for spending and saving money', wrong: ['a list of toys to buy', 'a map of a bank', 'a secret code for a safe'] },
    { id: 'whyInterest', level: 3, q: 'Why do banks charge interest on loans?', a: 'it is extra money the bank earns', wrong: ['to make the loan smaller', 'to pay the borrower back', 'to stop people from saving'] },
    { id: 'buyBig', level: 3, q: 'What should you do before buying something big?', a: 'make a plan and compare prices', wrong: ['buy it right away', 'borrow every dollar', 'ignore the price'] },
    { id: 'statement', level: 3, q: 'What is a bank statement?', a: 'a list of money in and out of an account', wrong: ['a letter from a teacher', 'a receipt from a bakery', 'a bill for a car'] },
    { id: 'goal', level: 3, q: 'What is a financial goal?', a: 'something you plan to save money for', wrong: ['a card you cannot use', 'a toy you already own', 'a loan you forgot'] },
    { id: 'paycheck', level: 3, q: 'What is a paycheck?', a: 'money paid to you for your work', wrong: ['money you borrow from a bank', 'money a store gives back', 'money found on the street'] },
    { id: 'emergency', level: 3, q: 'What is an emergency fund?', a: 'savings for surprise costs', wrong: ['money for a new toy', 'a loan from a friend', 'money for a vacation'] },
  ],
  [{ skill: 'economics', level: 3 }],
)

const modernHistory = factSkill(
  'modernHistory',
  ['World War I', 'The Great Depression', 'World War II'],
  [
    { id: 'wwiStart', level: 1, q: 'In what year did World War I begin?', a: '1914', wrong: ['1912', '1917', '1939'] },
    { id: 'wwiEnd', level: 1, q: 'In what year did World War I end?', a: '1918', wrong: ['1920', '1941', '1865'] },
    { id: 'franz', level: 1, q: 'Whose assassination in 1914 helped start World War I?', a: 'Archduke Franz Ferdinand', wrong: ['Napoleon Bonaparte', 'Queen Victoria', 'King Louis XIV'] },
    { id: 'usEnter', level: 1, q: 'In what year did the United States enter World War I?', a: '1917', wrong: ['1910', '1939', '1941'] },
    { id: 'trenches', level: 1, q: 'Much of World War I was fought from long ditches called what?', a: 'trenches', wrong: ['tunnels of ice', 'castle walls', 'caves'] },
    { id: 'armistice', level: 1, q: 'On what date did the fighting of World War I end?', a: 'November 11, 1918', wrong: ['July 4, 1918', 'December 7, 1941', 'June 6, 1944'] },
    { id: 'allies', level: 1, q: 'In World War I, which alliance included Britain, France, and Russia?', a: 'the Allies', wrong: ['the Axis', 'the Confederacy', 'the Union'] },
    { id: 'versailles', level: 1, q: 'What did the Treaty of Versailles do?', a: 'set the peace terms after World War I', wrong: ['started the Gold Rush', 'ended the Civil War', 'made peace between Britain and Spain'] },
    { id: 'tanks', level: 1, q: 'What new armored vehicle was first used in battle in World War I?', a: 'tanks', wrong: ['castles', 'sailing ships', 'covered wagons'] },
    { id: 'crash', level: 2, q: 'When did the stock market crash that began the Great Depression?', a: '1929', wrong: ['1921', '1933', '1941'] },
    { id: 'depressionName', level: 2, q: 'What was the long period of hard times in the 1930s called?', a: 'the Great Depression', wrong: ['the Gold Rush', 'the Renaissance', 'Reconstruction'] },
    { id: 'breadLines', level: 2, q: 'What were the long lines for free food called?', a: 'bread lines', wrong: ['ticket lines', 'tax lines', 'fishing lines'] },
    { id: 'dustBowl', level: 2, q: 'What was the Dust Bowl?', a: 'huge dust storms on the Great Plains', wrong: ['a flood on the coast', 'a city built on sand', 'a giant desert in Asia'] },
    { id: 'ccc', level: 2, q: 'Which New Deal group put young men to work planting trees and building parks?', a: 'the Civilian Conservation Corps', wrong: ['the Pony Express', 'the Erie Canal', 'the Peace Corps'] },
    { id: 'fdr', level: 2, q: 'Who was president when the New Deal began in 1933?', a: 'Franklin D. Roosevelt', wrong: ['Calvin Coolidge', 'Abraham Lincoln', 'George Washington'] },
    { id: 'lostJobs', level: 2, q: 'What did many families lose during the Great Depression?', a: 'their jobs and homes', wrong: ['their pet dogs', 'their favorite books', 'their summer vacations'] },
    { id: 'newDeal', level: 2, q: 'What was the New Deal?', a: 'programs to help people during the Depression', wrong: ['a plan to build a canal', 'a new kind of car', 'a trade deal with Japan'] },
    { id: 'wwiiStart', level: 3, q: 'In what year did World War II begin?', a: '1939', wrong: ['1914', '1941', '1945'] },
    { id: 'pearl', level: 3, q: 'What attack brought the United States into World War II?', a: 'the attack on Pearl Harbor', wrong: ['the Battle of Gettysburg', 'the Boston Tea Party', 'the Battle of the Alamo'] },
    { id: 'pearlYear', level: 3, q: 'In what year did the attack on Pearl Harbor happen?', a: '1941', wrong: ['1939', '1943', '1925'] },
    { id: 'dday', level: 3, q: 'What was D-Day?', a: 'the Allied invasion of Normandy in 1944', wrong: ['the day the war began in Europe', 'a parade in London', 'the first day of school in Paris'] },
    { id: 'churchill', level: 3, q: 'Which British leader led the country through most of World War II?', a: 'Winston Churchill', wrong: ['Margaret Thatcher', 'Queen Victoria', 'Napoleon Bonaparte'] },
    { id: 'wwiiSides', level: 3, q: 'What were the two sides of World War II called?', a: 'the Allies and the Axis', wrong: ['the Union and the Confederacy', 'the Colonies and Britain', 'the Federalists and the Whigs'] },
    { id: 'wwiiEnd', level: 3, q: 'In what year did World War II end?', a: '1945', wrong: ['1943', '1950', '1955'] },
    { id: 'pacific', level: 3, q: 'Which ocean was the main place of fighting between the United States and Japan?', a: 'the Pacific Ocean', wrong: ['the Arctic Ocean', 'the Indian Ocean', 'the Atlantic Ocean'] },
  ],
  [{ skill: 'civilWar', level: 3 }],
)

export const SCIENCE_UPPER: Skill[] = [
  materials,
  physicalChange,
  mixtures,
  lightReflect,
  waves,
  classification,
  scientificNames,
  cells,
  fossils,
  earthFeatures,
]

export const SOCIAL_UPPER: Skill[] = [humanGeography, evaluateSources, banking, modernHistory]

// ============================================================================================
// IXL: which IXL topic each level practices (index 0 = level 1).
// ============================================================================================

const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })
const soc = (grade: number, category: string): IxlRef => ({ subject: 'social-studies', grade, category })

export const SCIENCE_SOCIAL_UPPER_IXL: Record<string, IxlRef[]> = {
  'science.materials': [sci(3, 'Materials'), sci(3, 'Materials'), sci(4, 'Properties of matter')],
  'science.physicalChange': [sci(3, 'Physical and chemical change'), sci(4, 'Physical and chemical change'), sci(5, 'Physical and chemical change')],
  'science.mixtures': [sci(3, 'Mixtures'), sci(3, 'Mixtures'), sci(3, 'Mixtures')],
  'science.lightReflect': [sci(3, 'Light'), sci(4, 'Light'), sci(5, 'Light')],
  'science.waves': [sci(4, 'Waves and information'), sci(4, 'Waves and information'), sci(5, 'Waves and information')],
  'science.classification': [sci(3, 'Classification'), sci(4, 'Classification'), sci(5, 'Classification')],
  'science.scientificNames': [sci(4, 'Scientific names'), sci(4, 'Scientific names'), sci(5, 'Scientific names')],
  'science.cells': [sci(4, 'Cells'), sci(4, 'Cells'), sci(5, 'Cells')],
  'science.fossils': [sci(3, 'Fossils'), sci(3, 'Fossils'), sci(4, 'Fossils')],
  'science.earthFeatures': [sci(3, "Earth's features"), sci(4, "Earth's features"), sci(4, "Earth's features")],

  'social.humanGeography': [soc(3, 'Human geography'), soc(3, 'Human geography'), soc(3, 'Human geography')],
  'social.evaluateSources': [soc(3, 'Evaluate sources'), soc(4, 'Evaluate sources'), soc(5, 'Evaluate sources')],
  'social.banking': [soc(4, 'Banking and finance'), soc(4, 'Banking and finance'), soc(5, 'Banking and finance')],
  'social.modernHistory': [soc(4, 'World War I'), soc(4, 'The Great Depression'), soc(5, 'World War II')],
}
