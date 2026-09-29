export type Style = 'plain' | 'hedge' | 'stone' | 'crystal' | 'brass' | 'neon'
export type Realm = {
  id: string
  name: string
  emoji: string
  blurb: string
  from: number
  bg: number
  fog: [number, number, number]
  hemi: [number, number, number]
  sun: [number, number]
  floor: [number, number]
  pad: number
  wall: number
  wallTop: number
  frame: number
  doors: [number, number, number]
  style: Style
  glow: number
  particles: { color: number; size: number; motion: 'float' | 'rise' | 'fall'; count: number }
  runs: [number, number]
  len: [number, number]
  music: { wave: OscillatorType; tempo: number; chords?: number[][]; tick?: boolean }
}

export const REALMS: Realm[] = [
  {
    id: 'cupboard', name: 'Cheese Cupboards', emoji: '🧀', blurb: 'Cozy kitchen corridors', from: 0,
    bg: 0x2a2540, fog: [0x2a2540, 12, 30], hemi: [0xffffff, 0x8a7a9a, 1.5], sun: [0xfff1d6, 1.4],
    floor: [0xe8d5b0, 0xdcc59a], pad: 0xf6d365, wall: 0xb4634b, wallTop: 0xd98b6f, frame: 0x6b4423,
    doors: [0xe4572e, 0x17a398, 0xf2a900], style: 'plain', glow: 0xffd447,
    particles: { color: 0xffe9a8, size: 0.09, motion: 'float', count: 40 },
    runs: [1, 2], len: [2, 3], music: { wave: 'triangle', tempo: 1 },
  },
  {
    id: 'garden', name: 'Hedge Labyrinth', emoji: '🌿', blurb: 'Long leafy twists under the sun', from: 2.5,
    bg: 0x9fd6f2, fog: [0x9fd6f2, 14, 34], hemi: [0xffffff, 0x6fa35a, 1.7], sun: [0xfff6d0, 1.5],
    floor: [0x7fbf5a, 0x74b352], pad: 0xe9d9a0, wall: 0x2f7d3a, wallTop: 0x3f9a49, frame: 0x8a5a2b,
    doors: [0xd9482f, 0x2f8fd6, 0xf0b400], style: 'hedge', glow: 0xfff07a,
    particles: { color: 0xfff07a, size: 0.14, motion: 'float', count: 60 },
    runs: [2, 3], len: [2, 3], music: { wave: 'triangle', tempo: 0.95, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]] },
  },
  {
    id: 'cellar', name: 'Torch Cellars', emoji: '🔥', blurb: 'Old stone halls lit by torches', from: 4.5,
    bg: 0x14100f, fog: [0x14100f, 8, 24], hemi: [0xffd9b0, 0x2a1d18, 0.85], sun: [0xff9d5c, 0.55],
    floor: [0x6e6660, 0x625b55], pad: 0x8a7a68, wall: 0x7d756e, wallTop: 0x5d5650, frame: 0x3b2a1e,
    doors: [0xb8412a, 0x3a7ca5, 0xd9a01f], style: 'stone', glow: 0xffa040,
    particles: { color: 0xff8a3d, size: 0.1, motion: 'rise', count: 50 },
    runs: [1, 2], len: [3, 4], music: { wave: 'sine', tempo: 1.25, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-4, 0, 3]] },
  },
  {
    id: 'crystal', name: 'Crystal Caves', emoji: '💎', blurb: 'Glittering caverns that hum', from: 6,
    bg: 0x0d0b24, fog: [0x140f36, 8, 26], hemi: [0xb8b0ff, 0x2a1f5a, 1.1], sun: [0x9fd8ff, 0.7],
    floor: [0x3b2f6b, 0x352a60], pad: 0x6d5ccf, wall: 0x4a3d94, wallTop: 0x7e6ee0, frame: 0x2a2060,
    doors: [0xff5fa2, 0x35d0ba, 0xffd166], style: 'crystal', glow: 0x7df9ff,
    particles: { color: 0x9ffcff, size: 0.12, motion: 'float', count: 70 },
    runs: [2, 3], len: [2, 3], music: { wave: 'sine', tempo: 1.1, chords: [[0, 4, 7, 11], [2, 6, 9], [5, 9, 12, 16], [7, 11, 14]] },
  },
  {
    id: 'clockwork', name: 'Clockwork Tower', emoji: '⚙️', blurb: 'Brass gears, ticking walls', from: 7.5,
    bg: 0x2b1d0e, fog: [0x3a2611, 10, 28], hemi: [0xffe3a3, 0x4a3212, 1.25], sun: [0xffd27a, 1.0],
    floor: [0x8c6a2f, 0x7f6029], pad: 0xd8a93a, wall: 0xb08a3e, wallTop: 0xe0b85a, frame: 0x4a3212,
    doors: [0xc0392b, 0x2a9d8f, 0xe9c46a], style: 'brass', glow: 0xffd166,
    particles: { color: 0xffd166, size: 0.08, motion: 'fall', count: 60 },
    runs: [1, 2], len: [3, 4], music: { wave: 'square', tempo: 0.9, tick: true, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]] },
  },
  {
    id: 'star', name: 'Star Labyrinth', emoji: '🌌', blurb: 'Neon paths between the stars', from: 9.5,
    bg: 0x05030f, fog: [0x05030f, 10, 30], hemi: [0xa8a0ff, 0x1a0f3a, 0.9], sun: [0xff8cf0, 0.6],
    floor: [0x1b1440, 0x171038], pad: 0x2a1f66, wall: 0x241a52, wallTop: 0x3a2c8a, frame: 0x12092e,
    doors: [0xff3d81, 0x27e1c1, 0xffe14d], style: 'neon', glow: 0x39f0ff,
    particles: { color: 0xffffff, size: 0.11, motion: 'float', count: 110 },
    runs: [2, 3], len: [2, 4], music: { wave: 'sine', tempo: 1.5, chords: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-2, 5, 10]] },
  },
]

export const realmForDepth = (depth: number) => {
  let i = 0
  REALMS.forEach((r, k) => {
    if (depth >= r.from) i = k
  })
  return i
}
