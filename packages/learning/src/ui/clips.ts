/**
 * Recorded voice clips (made by `pnpm voices`). Each sentence we can say has an mp3 in
 * packages/learning/audio/. The file name comes from the text, so the game can find a clip
 * without a big lookup table — and the script that makes the clips uses the same function.
 */

/** Break text into sentences, keeping the ending marks ("Yes! Mars!" → ["Yes!", "Mars!"]). */
export function sentences(text: string): string[] {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) ?? []
  return parts.map((p) => p.trim()).filter((p) => /[a-z0-9]/i.test(p))
}

/** A small, stable number made from text — keeps "Yes!" and "Yes?" from sharing a file. */
function shortHash(text: string): string {
  let h = 5381
  for (const ch of text) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return h.toString(36)
}

/** The mp3 file name (no folder) for one sentence: readable start + hash, e.g. "the-cat-sat-1x2y3z.mp3". */
export function clipName(sentence: string): string {
  const slug = sentence.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${slug || 'clip'}-${shortHash(sentence)}.mp3`
}

// Vite turns every mp3 in the audio folder into a URL. If there are none yet, this is just empty.
const urls = import.meta.glob('../../audio/*.mp3', { query: '?url', import: 'default', eager: true }) as Record<string, string>

const byName = new Map<string, string>()
for (const [path, url] of Object.entries(urls)) byName.set(path.slice(path.lastIndexOf('/') + 1), url)

/** The clip URLs for this text, one per sentence — or null if any sentence has no clip yet. */
export function clipsFor(text: string): string[] | null {
  const parts = sentences(text)
  if (!parts.length) return null
  const found = parts.map((s) => byName.get(clipName(s)))
  return found.every(Boolean) ? (found as string[]) : null
}

export const hasAnyClips = () => byName.size > 0
