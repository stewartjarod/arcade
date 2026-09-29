/**
 * Read things aloud with the browser's built-in voice — for kids still learning to read,
 * and for "spell the word you hear" questions.
 */
export const canSpeak = () => typeof speechSynthesis !== 'undefined'

let voice: SpeechSynthesisVoice | undefined
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
  // Prefer a natural-sounding US English voice when there is one.
  voice =
    voices.find((v) => /natural|neural|google us|samantha|aria|jenny/i.test(v.name) && v.lang === 'en-US') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0]
}
if (canSpeak()) {
  pickVoice()
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

/** Say something (stops anything already being said). A little slower than normal, for kids. */
export function speak(text: string, { rate = 0.85 } = {}) {
  if (!canSpeak()) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  u.lang = 'en-US'
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
}
