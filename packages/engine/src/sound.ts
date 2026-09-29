/**
 * Sounds without any audio files: little synthesized bleeps.
 * sound.play('coin') — or load real files with sound.load('boom', url).
 */
type Preset = { type: OscillatorType; from: number; to: number; time: number; volume?: number; noise?: boolean }

const PRESETS: Record<string, Preset> = {
  coin: { type: 'square', from: 880, to: 1760, time: 0.12, volume: 0.15 },
  jump: { type: 'square', from: 300, to: 700, time: 0.18, volume: 0.12 },
  hit: { type: 'sawtooth', from: 400, to: 60, time: 0.25, volume: 0.2 },
  boom: { type: 'sawtooth', from: 120, to: 30, time: 0.6, volume: 0.3, noise: true },
  powerup: { type: 'triangle', from: 300, to: 1500, time: 0.5, volume: 0.2 },
  click: { type: 'sine', from: 600, to: 600, time: 0.05, volume: 0.15 },
  lose: { type: 'triangle', from: 500, to: 80, time: 0.9, volume: 0.25 },
  win: { type: 'square', from: 500, to: 1200, time: 0.7, volume: 0.15 },
}

export class Sound {
  muted = false
  private ctx?: AudioContext
  private buffers = new Map<string, AudioBuffer>()

  private get audio() {
    // Browsers only allow audio after a user gesture; create lazily.
    this.ctx ??= new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /** Load a real sound file under a name. */
  async load(name: string, url: string) {
    const data = await (await fetch(url)).arrayBuffer()
    this.buffers.set(name, await this.audio.decodeAudioData(data))
  }

  /** Invent your own bleep: sound.define('laser', { type: 'sawtooth', from: 1500, to: 200, time: 0.2 }) */
  define(name: string, preset: Preset) {
    PRESETS[name] = preset
  }

  play(name: string, { volume = 1, pitch = 1 } = {}) {
    if (this.muted) return
    const ctx = this.audio
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const buffer = this.buffers.get(name)
    if (buffer) {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.playbackRate.value = pitch
      gain.gain.value = volume
      src.connect(gain)
      src.start()
      return
    }

    const p = PRESETS[name]
    if (!p) return console.warn(`No sound called "${name}"`)
    const now = ctx.currentTime
    const v = (p.volume ?? 0.2) * volume
    gain.gain.setValueAtTime(v, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.time)

    const osc = ctx.createOscillator()
    osc.type = p.type
    osc.frequency.setValueAtTime(p.from * pitch, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(p.to * pitch, 1), now + p.time)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + p.time)

    if (p.noise) {
      const len = ctx.sampleRate * p.time
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      const n = ctx.createBufferSource()
      n.buffer = buf
      n.connect(gain)
      n.start(now)
    }
  }
}
