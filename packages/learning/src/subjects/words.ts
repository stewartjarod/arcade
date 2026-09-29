/**
 * Word lists shared by Reading and Writing.
 * Picture words have an emoji so kids can read or spell them from a picture.
 * `near` = real words that look alike, for "which word is this?" choices.
 * Levels: 1 short vowel (cat), 2 blends & digraphs (ship, frog), 3 long vowels (cake, boat),
 * 4 r-controlled & ou/ow/oy (star, house, cow).
 */
export interface PictureWord {
  word: string
  emoji: string
  level: number
  near: string[]
}

export const PICTURE_WORDS: PictureWord[] = [
  // 1 — short vowels
  { word: 'cat', emoji: '🐱', level: 1, near: ['cot', 'cap', 'can'] },
  { word: 'dog', emoji: '🐶', level: 1, near: ['dig', 'dot', 'log'] },
  { word: 'pig', emoji: '🐷', level: 1, near: ['pin', 'peg', 'big'] },
  { word: 'bus', emoji: '🚌', level: 1, near: ['bun', 'bug', 'but'] },
  { word: 'sun', emoji: '☀️', level: 1, near: ['sum', 'run', 'bun'] },
  { word: 'hat', emoji: '🎩', level: 1, near: ['hot', 'ham', 'bat'] },
  { word: 'bed', emoji: '🛏️', level: 1, near: ['bad', 'bud', 'red'] },
  { word: 'fox', emoji: '🦊', level: 1, near: ['fix', 'box', 'fog'] },
  { word: 'bat', emoji: '🦇', level: 1, near: ['bit', 'bag', 'hat'] },
  { word: 'bug', emoji: '🐛', level: 1, near: ['big', 'bag', 'rug'] },
  { word: 'hen', emoji: '🐔', level: 1, near: ['pen', 'hot', 'ten'] },
  { word: 'van', emoji: '🚐', level: 1, near: ['fan', 'vet', 'man'] },
  { word: 'web', emoji: '🕸️', level: 1, near: ['wet', 'wed', 'tub'] },
  { word: 'pen', emoji: '🖊️', level: 1, near: ['pin', 'pan', 'hen'] },
  { word: 'map', emoji: '🗺️', level: 1, near: ['mop', 'cap', 'mad'] },
  { word: 'nut', emoji: '🥜', level: 1, near: ['net', 'not', 'cut'] },
  { word: 'net', emoji: '🥅', level: 1, near: ['nut', 'nap', 'wet'] },
  { word: 'cup', emoji: '🥤', level: 1, near: ['cap', 'cut', 'pup'] },
  { word: 'egg', emoji: '🥚', level: 1, near: ['leg', 'beg', 'add'] },
  { word: 'ram', emoji: '🐏', level: 1, near: ['rum', 'ran', 'jam'] },
  { word: 'six', emoji: '6️⃣', level: 1, near: ['sit', 'fix', 'sax'] },
  { word: 'ten', emoji: '🔟', level: 1, near: ['tan', 'tin', 'hen'] },
  { word: 'leg', emoji: '🦵', level: 1, near: ['log', 'lag', 'beg'] },
  // 2 — blends and digraphs
  { word: 'ship', emoji: '🚢', level: 2, near: ['chip', 'shop', 'sip'] },
  { word: 'fish', emoji: '🐟', level: 2, near: ['fist', 'wish', 'fit'] },
  { word: 'shell', emoji: '🐚', level: 2, near: ['shall', 'spell', 'sell'] },
  { word: 'sheep', emoji: '🐑', level: 2, near: ['sleep', 'sheet', 'cheep'] },
  { word: 'chick', emoji: '🐤', level: 2, near: ['check', 'click', 'thick'] },
  { word: 'cheese', emoji: '🧀', level: 2, near: ['chase', 'these', 'chess'] },
  { word: 'chair', emoji: '🪑', level: 2, near: ['chain', 'hair', 'share'] },
  { word: 'three', emoji: '3️⃣', level: 2, near: ['tree', 'free', 'there'] },
  { word: 'thumb', emoji: '👍', level: 2, near: ['thump', 'drum', 'them'] },
  { word: 'whale', emoji: '🐋', level: 2, near: ['while', 'shale', 'tale'] },
  { word: 'frog', emoji: '🐸', level: 2, near: ['fog', 'from', 'flag'] },
  { word: 'crab', emoji: '🦀', level: 2, near: ['crib', 'grab', 'cab'] },
  { word: 'snake', emoji: '🐍', level: 2, near: ['snack', 'stake', 'shake'] },
  { word: 'drum', emoji: '🥁', level: 2, near: ['drip', 'rum', 'dump'] },
  { word: 'flag', emoji: '🚩', level: 2, near: ['flap', 'flat', 'bag'] },
  { word: 'clock', emoji: '🕐', level: 2, near: ['click', 'block', 'lock'] },
  { word: 'swan', emoji: '🦢', level: 2, near: ['swim', 'span', 'scan'] },
  { word: 'plant', emoji: '🌱', level: 2, near: ['plane', 'pant', 'planet'] },
  { word: 'sled', emoji: '🛷', level: 2, near: ['slid', 'led', 'shed'] },
  { word: 'truck', emoji: '🚚', level: 2, near: ['trick', 'track', 'tuck'] },
  // 3 — long vowels: magic e and vowel teams
  { word: 'cake', emoji: '🎂', level: 3, near: ['coke', 'lake', 'cage'] },
  { word: 'kite', emoji: '🪁', level: 3, near: ['kit', 'bite', 'cute'] },
  { word: 'bike', emoji: '🚲', level: 3, near: ['bake', 'bite', 'like'] },
  { word: 'rose', emoji: '🌹', level: 3, near: ['rise', 'nose', 'rope'] },
  { word: 'bone', emoji: '🦴', level: 3, near: ['bun', 'cone', 'bond'] },
  { word: 'nose', emoji: '👃', level: 3, near: ['note', 'rose', 'nods'] },
  { word: 'boat', emoji: '⛵', level: 3, near: ['bait', 'beat', 'coat'] },
  { word: 'rain', emoji: '🌧️', level: 3, near: ['ran', 'ruin', 'train'] },
  { word: 'tree', emoji: '🌳', level: 3, near: ['three', 'free', 'try'] },
  { word: 'bee', emoji: '🐝', level: 3, near: ['bet', 'see', 'beet'] },
  { word: 'snail', emoji: '🐌', level: 3, near: ['snake', 'nail', 'sail'] },
  { word: 'train', emoji: '🚆', level: 3, near: ['trail', 'rain', 'tray'] },
  { word: 'goat', emoji: '🐐', level: 3, near: ['gate', 'coat', 'got'] },
  { word: 'leaf', emoji: '🍃', level: 3, near: ['loaf', 'leap', 'lead'] },
  { word: 'moon', emoji: '🌙', level: 3, near: ['man', 'moan', 'noon'] },
  { word: 'book', emoji: '📖', level: 3, near: ['back', 'look', 'hook'] },
  { word: 'snow', emoji: '❄️', level: 3, near: ['show', 'now', 'slow'] },
  { word: 'soap', emoji: '🧼', level: 3, near: ['sap', 'soup', 'seep'] },
  { word: 'feet', emoji: '🦶', level: 3, near: ['fat', 'feel', 'meet'] },
  { word: 'pie', emoji: '🥧', level: 3, near: ['pig', 'tie', 'pea'] },
  // 4 — r-controlled vowels and ou / ow / oy
  { word: 'star', emoji: '⭐', level: 4, near: ['stir', 'stair', 'tar'] },
  { word: 'car', emoji: '🚗', level: 4, near: ['cart', 'cur', 'jar'] },
  { word: 'bird', emoji: '🐦', level: 4, near: ['bard', 'burn', 'word'] },
  { word: 'horse', emoji: '🐴', level: 4, near: ['house', 'hose', 'horn'] },
  { word: 'shark', emoji: '🦈', level: 4, near: ['share', 'sharp', 'shirt'] },
  { word: 'corn', emoji: '🌽', level: 4, near: ['cone', 'horn', 'core'] },
  { word: 'fork', emoji: '🍴', level: 4, near: ['fort', 'pork', 'frock'] },
  { word: 'shirt', emoji: '👕', level: 4, near: ['short', 'skirt', 'shut'] },
  { word: 'mouse', emoji: '🐭', level: 4, near: ['moose', 'house', 'mice'] },
  { word: 'house', emoji: '🏠', level: 4, near: ['horse', 'mouse', 'hose'] },
  { word: 'cloud', emoji: '☁️', level: 4, near: ['clod', 'loud', 'could'] },
  { word: 'owl', emoji: '🦉', level: 4, near: ['bowl', 'awl', 'own'] },
  { word: 'cow', emoji: '🐄', level: 4, near: ['cot', 'crow', 'how'] },
  { word: 'crown', emoji: '👑', level: 4, near: ['crow', 'clown', 'brown'] },
  { word: 'boy', emoji: '👦', level: 4, near: ['bay', 'toy', 'buy'] },
]

/** Dolch sight words by list: 1 pre-primer, 2 primer, 3 first grade, 4 second grade. */
export const SIGHT_WORDS: string[][] = [
  'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you'.split(' '),
  'all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes'.split(' '),
  'after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when'.split(' '),
  "always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your".split(' '),
]
