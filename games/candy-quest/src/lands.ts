// ------------------------------------------------------------------
//  The lands of Candy Quest, in order. Just data: colors, the story,
//  and the landmarks that each map piece shows.
//
//  The big story: Queen Sprinkle's crown is lost! Each land has a treasure
//  chest at the end of its map. The last chest (in the Candy Castle) has the crown.
// ------------------------------------------------------------------

/** Something you can win from a chest: a new color for Buddy, or a hat. */
export type Reward = { kind: 'color'; color: string; name: string } | { kind: 'hat'; hat: Hat; name: string }
export type Hat = 'party' | 'top' | 'crown'

/** What a map piece shows. You'll pass it on the path right after you find the piece. */
export interface Landmark {
  emoji: string
  /** Said out loud when you find the map piece. Short, so a 1st grader can follow. */
  clue: string
}

/** Which kind of scenery grows beside the path. */
export type Scenery = 'clouds' | 'chocolate' | 'gumdrops' | 'lollipops' | 'castle'

export interface Land {
  id: string
  name: string
  emoji: string
  sky: string
  ground: string
  path: string
  /** Candy colors for bouncers and scenery. */
  candy: string[]
  scenery: Scenery
  /** Said when the land starts. */
  intro: string
  /** One per map piece, in order. Every land has six, the most any grade needs. */
  landmarks: Landmark[]
  /** Said when the chest opens. */
  treasure: string
  reward: Reward
}

export const LANDS: Land[] = [
  {
    id: 'cotton-candy',
    name: 'Cotton Candy Clouds',
    emoji: '☁️',
    sky: '#ffd6ec',
    ground: '#fff0f8',
    path: '#ff9ccf',
    candy: ['#ff8fc8', '#a5d8ff', '#e599f7', '#fff3bf'],
    scenery: 'clouds',
    intro: "Oh no! Queen Sprinkle's crown is lost! Spell words to find map pieces. They lead to the treasure!",
    landmarks: [
      { emoji: '🐰', clue: 'The map shows a bunny cloud. Run past it!' },
      { emoji: '🌈', clue: 'The map shows a rainbow. Follow it!' },
      { emoji: '🎈', clue: 'The map shows a big balloon. Keep going!' },
      { emoji: '🦄', clue: 'The map shows a unicorn. Say hi!' },
      { emoji: '🌙', clue: 'The map shows a sleepy moon. Almost there!' },
      { emoji: '⭐', clue: 'The map shows a shiny star. The treasure is close!' },
    ],
    treasure: 'You found the treasure! A new color for Buddy!',
    reward: { kind: 'color', color: '#63e6be', name: 'Mint' },
  },
  {
    id: 'chocolate-river',
    name: 'Chocolate River',
    emoji: '🍫',
    sky: '#ffe8cc',
    ground: '#e8c39e',
    path: '#d9a066',
    candy: ['#ff6b6b', '#ffd43b', '#fff', '#ffa94d'],
    scenery: 'chocolate',
    intro: 'Welcome to the Chocolate River! The crown is not here. But a map is!',
    landmarks: [
      { emoji: '🦆', clue: 'The map shows a duck on the river. Find it!' },
      { emoji: '🍪', clue: 'The map shows a giant cookie. Keep running!' },
      { emoji: '⛵', clue: 'The map shows a little boat. Wave to it!' },
      { emoji: '🐸', clue: 'The map shows a chocolate frog. Hop along!' },
      { emoji: '🌉', clue: 'The map shows a bridge. Cross it!' },
      { emoji: '🍩', clue: 'The map shows a donut. The treasure is close!' },
    ],
    treasure: 'You found the treasure! A party hat for Buddy!',
    reward: { kind: 'hat', hat: 'party', name: 'Party hat' },
  },
  {
    id: 'gumdrop-mountains',
    name: 'Gumdrop Mountains',
    emoji: '⛰️',
    sky: '#d0ebff',
    ground: '#d3f9d8',
    path: '#ffe066',
    candy: ['#ff6b6b', '#51cf66', '#ffd43b', '#9775fa', '#ff922b'],
    scenery: 'gumdrops',
    intro: 'Up we go! The Gumdrop Mountains are big and bouncy!',
    landmarks: [
      { emoji: '🐐', clue: 'The map shows a mountain goat. Climb on!' },
      { emoji: '🗻', clue: 'The map shows a snowy top. Brrr!' },
      { emoji: '🦅', clue: 'The map shows an eagle. Look up!' },
      { emoji: '🏕️', clue: 'The map shows a tent. Keep going!' },
      { emoji: '🌻', clue: 'The map shows a sunflower. Almost there!' },
      { emoji: '🔔', clue: 'The map shows a bell. The treasure is close!' },
    ],
    treasure: 'You found the treasure! Buddy can be lemon yellow!',
    reward: { kind: 'color', color: '#ffd43b', name: 'Lemon' },
  },
  {
    id: 'lollipop-forest',
    name: 'Lollipop Forest',
    emoji: '🍭',
    sky: '#e5dbff',
    ground: '#c3fae8',
    path: '#b197fc',
    candy: ['#f783ac', '#74c0fc', '#ffd43b', '#69db7c'],
    scenery: 'lollipops',
    intro: 'Shh! The Lollipop Forest. The castle is just past the trees!',
    landmarks: [
      { emoji: '🦉', clue: 'The map shows an owl. Hoo hoo!' },
      { emoji: '🍄', clue: 'The map shows a mushroom. Keep running!' },
      { emoji: '🦋', clue: 'The map shows a butterfly. Follow it!' },
      { emoji: '🐿️', clue: 'The map shows a squirrel. Say hi!' },
      { emoji: '🏡', clue: 'The map shows a little house. Almost there!' },
      { emoji: '🗝️', clue: 'The map shows a key. The treasure is close!' },
    ],
    treasure: 'You found the treasure! A top hat for Buddy!',
    reward: { kind: 'hat', hat: 'top', name: 'Top hat' },
  },
  {
    id: 'candy-castle',
    name: 'Candy Castle',
    emoji: '🏰',
    sky: '#ffc9c9',
    ground: '#fff5f5',
    path: '#ffd8a8',
    candy: ['#ff8787', '#ffd43b', '#e599f7', '#fff'],
    scenery: 'castle',
    intro: 'The Candy Castle! The last map leads to the crown. You can do it!',
    landmarks: [
      { emoji: '🛡️', clue: 'The map shows a shield. Be brave!' },
      { emoji: '🐉', clue: 'The map shows a friendly dragon. Wave!' },
      { emoji: '🎺', clue: 'The map shows a trumpet. Toot toot!' },
      { emoji: '🚪', clue: 'The map shows a big door. Go in!' },
      { emoji: '🕯️', clue: 'The map shows a candle. Almost there!' },
      { emoji: '👸', clue: 'The map shows the queen. The crown is close!' },
    ],
    treasure: 'You found the crown! Queen Sprinkle says thank you! Buddy gets a crown too!',
    reward: { kind: 'hat', hat: 'crown', name: 'Crown' },
  },
]

/** What the Candy Monster chase says out loud. */
export const MONSTER_LINES = {
  wake: 'Oh no! The Candy Monster! Answer fast to run away!',
  escaped: 'You got away!',
  chomp: 'Chomp! The Candy Monster ate some of your candy!',
  hungry: 'You had no candy, so the Candy Monster went home hungry!',
  burp: 'Burp! Now it is full. Keep running!',
}

/** The first-time lesson on how to play (said out loud, since little kids won't guess the controls). */
export const COACH_LINES = {
  drag: 'Put your finger down and slide it to move Buddy!',
  tap: 'Now tap to jump!',
  ready: 'Great! Bounce on gumdrops. Jump over sticky taffy. Here we go!',
  jumpHint: 'Tap to jump!',
}
