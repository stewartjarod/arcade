import { emojiHTML, emojiRem, isWideSvg, problemHTML, type Prompt } from '@arcade/learning'

/**
 * The question banner's contents: a picture first if the question has one (dots to count, a shape,
 * an emoji), then the words. Sums get "= ?"; other questions ("What digit is in the tens place of 47?") show as they are.
 */
/**
 * How wide (px) a drawing needs to be so its smallest text is about 11px tall, or 0 if it has no text.
 * Capped so a big diagram never grows tall enough to cover the doors.
 */
export function svgWidthFor(svg: string): number {
  const box = svg.match(/viewBox="0 0 ([\d.]+) [\d.]+"/)
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]))
  if (!box || !sizes.length) return 0
  const need = (11 * Number(box[1])) / Math.min(...sizes)
  return Math.round(Math.min(need, isWideSvg(svg) ? 360 : 250))
}

export function questionHTML(prompt: Prompt): string {
  const picture = prompt.svg
    ? `<span class="qpic${isWideSvg(prompt.svg) ? ' wide' : prompt.svg.includes('<text') ? ' labeled' : ''}" style="--svg-w:${svgWidthFor(prompt.svg)}px">${prompt.svg}</span>`
    : prompt.emoji
      ? `<span class="qpic emoji" style="font-size:${emojiRem(prompt.emoji) * 0.75}rem">${emojiHTML(prompt.emoji)}</span>`
      : ''
  const words = prompt.sum
    ? `${problemHTML(prompt.text)} <span class="op">=</span> <span class="qmark">?</span>`
    : problemHTML(prompt.text).replace(/_{2,}/g, '<span class="qmark">?</span>')
  // The words are one box so a side-by-side layout (landscape phones) sees exactly: picture, words.
  return `${picture}<span class="qwords">${words}</span>`
}
