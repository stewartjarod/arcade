import { music, type Track } from '@arcade/engine'

// The synth and sound effects are shared by every game (@arcade/engine audio).
// This file just picks Mouse Maze Math's background music for each moment.
export { sfx, unlockAudio } from '@arcade/engine'

type Mood = 'menu' | 'maze' | 'trap'

const TRACKS: Record<Mood, Track> = {
  menu: { chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], note: 0.42 },
  maze: { chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], note: 0.3, sparkle: true },
  trap: { chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-2, 2, 5]], note: 0.36 },
}

type RealmSound = { wave: OscillatorType; tempo: number; chords?: number[][]; tick?: boolean }
let mood: Mood = 'menu'
let realmSound: RealmSound = { wave: 'triangle', tempo: 1 }

// In a maze, each realm flavors the music with its own chords, instrument and pace.
const update = () => {
  const base = TRACKS[mood]
  music.play(
    mood === 'maze'
      ? { ...base, chords: realmSound.chords ?? base.chords, note: base.note * realmSound.tempo, wave: realmSound.wave, tick: realmSound.tick }
      : base,
  )
}

export const setMood = (m: Mood) => {
  mood = m
  update()
}
export const setRealmSound = (m: RealmSound) => {
  realmSound = m
  update()
}
