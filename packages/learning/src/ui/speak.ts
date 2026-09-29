import { clipsFor, hasAnyClips } from './clips'

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
  if (text ? clipsFor(text) : hasAnyClips()) return true
  return hasBrowserVoice() && voiceCount > 0
}

let playing: HTMLAudioElement | undefined
let playId = 0 // lets a newer speak() cancel an older one that is still mid-list

function stopAll() {
  playId++
  playing?.pause()
  playing = undefined
  if (hasBrowserVoice()) speechSynthesis.cancel()
}

/** Play clips one after another; if one fails to load, say the whole thing with the browser voice. */
async function playClips(urls: string[], id: number, fallback: () => void) {
  for (const url of urls) {
    if (id !== playId) return
    const audio = new Audio(url)
    playing = audio
    try {
      await audio.play()
      await new Promise<void>((done, fail) => {
        audio.onended = () => done()
        audio.onerror = () => fail(new Error('clip failed'))
      })
    } catch {
      if (id === playId) fallback()
      return
    }
  }
}

/** Say something (stops anything already being said). A little slower than normal, for kids. */
export function speak(text: string, { rate = 0.85 } = {}) {
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
