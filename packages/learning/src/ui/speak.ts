import { audioContext } from '@arcade/engine'
import { clipsFor, hasAnyClips, mathWords } from './clips'

/**
 * Read things aloud — for kids still learning to read, and for "spell the word you hear" questions.
 *
 * First choice: our recorded clips (they sound the same on every device and work with no system
 * voice installed). If a sentence has no clip yet, we fall back to the browser's built-in voice.
 */
const hasBrowserVoice = () => typeof speechSynthesis !== 'undefined'

let voice: SpeechSynthesisVoice | undefined
let voiceCount = 0
function pickVoice() {
  const all = speechSynthesis.getVoices()
  voiceCount = all.length
  const voices = all.filter((v) => v.lang.startsWith('en'))
  // Prefer a natural-sounding US English voice when there is one.
  voice =
    voices.find((v) => /natural|neural|google us|samantha|aria|jenny/i.test(v.name) && v.lang === 'en-US') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0]
}
if (hasBrowserVoice()) {
  pickVoice()
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

/**
 * Can we make sound for this? Pass the text to be sure: a browser with no voices (common on
 * Linux) can still play our clips, but can't read a sentence we have no clip for.
 */
export function canSpeak(text?: string): boolean {
  if (text ? clipsFor(mathWords(text)) : hasAnyClips()) return true
  return hasBrowserVoice() && voiceCount > 0
}

let playing: { stop(): void } | undefined
let playId = 0 // lets a newer speak() cancel an older one that is still mid-list

function stopAll() {
  playId++
  playing?.stop()
  playing = undefined
  if (hasBrowserVoice()) speechSynthesis.cancel()
}

// Clips are played through the game's Web Audio (switched on by the first tap), not with new Audio().
// iPad Safari blocks new Audio().play() unless it happens right inside a tap, and then we fell back to
// the robot voice: so a word read when a question pops up sounded bad even though we had a clip.
const decoded = new Map<string, Promise<AudioBuffer>>()
function loadClip(ctx: AudioContext, url: string) {
  let p = decoded.get(url)
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('no clip')))).then((b) => ctx.decodeAudioData(b))
    p.catch(() => decoded.delete(url)) // try again next time
    decoded.set(url, p)
  }
  return p
}

/** Play one clip; resolves when it ends. Web Audio if it's running, else an <audio> element. */
async function playOne(url: string): Promise<void> {
  const ctx = audioContext()
  if (ctx && ctx.state === 'running') {
    const buffer = await loadClip(ctx, url)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    const ended = new Promise<void>((done) => (src.onended = () => done()))
    playing = { stop: () => src.stop() }
    src.start()
    return ended
  }
  const audio = new Audio(url)
  playing = { stop: () => audio.pause() }
  await audio.play()
  await new Promise<void>((done, fail) => {
    audio.onended = () => done()
    audio.onerror = () => fail(new Error('clip failed'))
  })
}

/** Play clips one after another; if one fails, say the whole thing with the browser voice. */
async function playClips(urls: string[], id: number, fallback: () => void) {
  for (const url of urls) {
    if (id !== playId) return
    try {
      await playOne(url)
    } catch {
      if (id === playId) fallback()
      return
    }
  }
}

/** Say something (stops anything already being said). A little slower than normal, for kids. */
export function speak(words: string, { rate = 0.85 } = {}) {
  const text = mathWords(words) // "7 − 3" → "7 minus 3", for the clips and the browser voice alike
  stopAll()
  const id = playId
  const say = () => {
    if (!hasBrowserVoice()) return
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.lang = 'en-US'
    if (voice) u.voice = voice
    speechSynthesis.speak(u)
  }
  const clips = clipsFor(text)
  if (clips) void playClips(clips, id, say)
  else say()
}
