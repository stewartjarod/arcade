import { save } from './save'

let ctx: AudioContext | undefined
let master: GainNode | undefined
let noiseBuf: AudioBuffer | undefined

export const unlockAudio = () => {
  try {
    if (!ctx) {
      ctx = new AudioContext()
      const comp = ctx.createDynamicsCompressor()
      master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(comp).connect(ctx.destination)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      startMusic()
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {}
}

type Tone = { type?: OscillatorType; vol?: number; to?: number; lp?: number }
const tone = (freq: number, at: number, dur: number, o: Tone = {}) => {
  if (save.muted || !ctx || !master) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.16, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur)
  let node: AudioNode = osc
  if (o.lp) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.lp
    osc.connect(f)
    node = f
  }
  node.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const noise = (at: number, dur: number, vol: number, from: number, to = from, kind: BiquadFilterType = 'bandpass') => {
  if (save.muted || !ctx || !master || !noiseBuf) return
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = kind
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.05)
}

const PENT = [0, 2, 4, 7, 9]
const hz = (semi: number) => 261.63 * 2 ** (semi / 12)
const scale = (i: number) => PENT[i % 5]! + 12 * Math.floor(i / 5)

let stepFlip = false

export const sfx = {
  good: (streak = 0) => {
    const base = scale(Math.min(streak, 6))
    tone(hz(base + 12), 0, 0.14, { type: 'triangle' })
    tone(hz(base + 19), 0.09, 0.28, { type: 'triangle' })
    tone(hz(base + 31), 0.12, 0.2, { vol: 0.04 })
    if (streak >= 3) tone(hz(base + 24), 0.2, 0.3, { type: 'triangle', vol: 0.08 })
  },
  bad: () => {
    tone(330, 0, 0.32, { type: 'sawtooth', vol: 0.07, to: 200, lp: 900 })
    tone(247, 0.2, 0.42, { type: 'sawtooth', vol: 0.07, to: 130, lp: 800 })
  },
  pop: () => {
    tone(700, 0, 0.09, { type: 'triangle', vol: 0.1, to: 1300 })
    noise(0, 0.05, 0.05, 3000)
  },
  door: (open: boolean) => {
    tone(open ? 95 : 130, 0, 0.35, { type: 'sawtooth', vol: 0.05, to: open ? 150 : 80, lp: 500 })
    noise(0, 0.3, 0.04, open ? 400 : 900, open ? 900 : 300)
    tone(70, open ? 0.3 : 0.28, 0.12, { vol: 0.14, to: 45 })
  },
  step: () => {
    stepFlip = !stepFlip
    noise(0, 0.045, 0.05, stepFlip ? 1800 : 1400, 600)
  },
  bonk: () => {
    tone(180, 0, 0.18, { vol: 0.24, to: 55 })
    noise(0, 0.1, 0.12, 900, 200)
    tone(500, 0.12, 0.35, { type: 'triangle', vol: 0.1, to: 180 })
  },
  whoosh: (down = true) => noise(0, 0.32, 0.09, down ? 2500 : 500, down ? 300 : 2500),
  snap: () => {
    noise(0, 0.25, 0.22, 2200, 500)
    for (const f of [420, 610, 950, 1490]) tone(f, 0, 0.7, { type: 'square', vol: 0.05, to: f * 0.985, lp: 3000 })
    tone(65, 0, 0.4, { vol: 0.3, to: 40 })
  },
  free: () => {
    sfx.whoosh(false)
    ;[0, 2, 4, 5].forEach((i) => tone(hz(scale(i) + 12), 0.05 + i * 0.05, 0.22, { type: 'triangle' }))
  },
  boing: () => tone(220, 0, 0.35, { vol: 0.14, to: 700 }),
  chest: () => {
    tone(110, 0, 0.45, { type: 'sawtooth', vol: 0.05, to: 220, lp: 500 })
    for (let i = 0; i < 9; i++) tone(hz(scale(i + 5)), 0.35 + i * 0.05, 0.3, { type: 'triangle', vol: 0.08 })
  },
  win: () => {
    const notes = [0, 4, 7, 12, 7, 12, 16, 19]
    notes.forEach((n, i) => tone(hz(n + 12), i * 0.13, 0.32, { type: 'triangle', vol: 0.15 }))
    ;[0, 7].forEach((n) => tone(hz(n), 0, 1.4, { type: 'sine', vol: 0.1 }))
    tone(hz(24), 1.1, 0.9, { type: 'triangle', vol: 0.12 })
  },
  sticker: () => [0, 4, 7, 11, 16].forEach((n, i) => tone(hz(n + 24), i * 0.07, 0.25, { vol: 0.06 })),
  levelUp: () => [0, 2, 4, 7, 9, 12].forEach((n, i) => tone(hz(n + 12), i * 0.09, 0.22, { type: 'square', vol: 0.05, lp: 2500 })),
}

type Mood = 'menu' | 'maze' | 'trap'
let mood: Mood = 'menu'
export const setMood = (m: Mood) => (mood = m)

const CHORDS: Record<Mood, number[][]> = {
  menu: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
  maze: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
  trap: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-2, 2, 5]],
}
const TEMPO: Record<Mood, number> = { menu: 0.42, maze: 0.3, trap: 0.36 }

let beat = 0
let realmSound: { wave: OscillatorType; tempo: number; chords?: number[][]; tick?: boolean } = { wave: 'triangle', tempo: 1 }
export const setRealmSound = (m: typeof realmSound) => (realmSound = m)
function startMusic() {
  setInterval(() => {
    if (save.muted || !ctx || ctx.state !== 'running') return
    const set = mood === 'maze' && realmSound.chords ? realmSound.chords : CHORDS[mood]
    const chord = set[Math.floor(beat / 8) % 4]!
    const i = beat % 8
    const note = chord[[0, 1, 2, 1, 2, 1, 0, 2][i]! % chord.length]!
    const t = TEMPO[mood] * (mood === 'maze' ? realmSound.tempo : 1)
    tone(hz(note), 0, t * 1.6, { type: mood === 'maze' ? realmSound.wave : 'triangle', vol: 0.028 })
    if (mood === 'maze' && realmSound.tick && i % 2 === 0) noise(0, 0.03, 0.03, 3500, 3000)
    if (i === 0) tone(hz(chord[0]! - 12), 0, t * 7, { vol: 0.03 })
    if (mood === 'maze' && i % 4 === 2) tone(hz(note + 12), 0, t, { vol: 0.012 })
    beat++
  }, 300)
}
