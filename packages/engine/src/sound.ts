import { audioContext, audioOutput, isMuted, noise, setMuted, sfx, tone, type ToneOptions } from './audio'

/**
 * game.sound — play effects by name: game.sound.play('coin')
 * Also loads real files: await game.sound.load('boom', url)
 * All the shared effects (sfx.good, sfx.levelUp...) are available as game.sound.sfx.
 */
type Preset = { type: OscillatorType; from: number; to: number; time: number; volume?: number; noise?: boolean }

const PRESETS: Record<string, Preset | (() => void)> = {
  coin: { type: 'square', from: 880, to: 1760, time: 0.12, volume: 0.15 },
  jump: { type: 'square', from: 300, to: 700, time: 0.18, volume: 0.12 },
  hit: { type: 'sawtooth', from: 400, to: 60, time: 0.25, volume: 0.2 },
  boom: { type: 'sawtooth', from: 120, to: 30, time: 0.6, volume: 0.3, noise: true },
  powerup: { type: 'triangle', from: 300, to: 1500, time: 0.5, volume: 0.2 },
  click: { type: 'sine', from: 600, to: 600, time: 0.05, volume: 0.15 },
  lose: { type: 'triangle', from: 500, to: 80, time: 0.9, volume: 0.25 },
  win: sfx.win,
  good: () => sfx.good(),
  bad: sfx.bad,
  pop: sfx.pop,
  levelUp: sfx.levelUp,
}

export class Sound {
  /** Every shared effect: game.sound.sfx.good(streak), .bonk(), .chest()... */
  readonly sfx = sfx
  private buffers = new Map<string, AudioBuffer>()

  get muted() {
    return isMuted()
  }
  set muted(on: boolean) {
    setMuted(on)
  }

  /** Load a real sound file under a name. */
  async load(name: string, url: string) {
    const ctx = audioContext()
    if (!ctx) return
    const data = await (await fetch(url)).arrayBuffer()
    this.buffers.set(name, await ctx.decodeAudioData(data))
  }

  /** Invent your own bleep: sound.define('laser', { type: 'sawtooth', from: 1500, to: 200, time: 0.2 }) */
  define(name: string, preset: Preset) {
    PRESETS[name] = preset
  }

  play(name: string, { volume = 1, pitch = 1 } = {}) {
    if (isMuted()) return
    const buffer = this.buffers.get(name)
    const ctx = audioContext()
    const out = audioOutput()
    if (buffer && ctx && out) {
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      src.buffer = buffer
      src.playbackRate.value = pitch
      gain.gain.value = volume
      src.connect(gain).connect(out)
      src.start()
      return
    }

    const p = PRESETS[name]
    if (!p) return console.warn(`No sound called "${name}"`)
    if (typeof p === 'function') return p()
    const opts: ToneOptions = { type: p.type, vol: (p.volume ?? 0.2) * volume, to: Math.max(p.to * pitch, 1) }
    tone(p.from * pitch, 0, p.time, opts)
    if (p.noise) noise(0, p.time, (p.volume ?? 0.2) * volume, 2000, 200)
  }
}
