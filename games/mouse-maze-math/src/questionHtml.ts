import { emojiRem, escapeHTML, isWideSvg, problemHTML, type Prompt } from '@arcade/learning'

/**
 * The question banner's contents: a picture first if the question has one (dots to count, a shape,
 * an emoji), then the words. Sums get "= ?"; other questions ("What digit is in the tens place of 47?") show as they are.
 */
export function questionHTML(prompt: Prompt): string {
  const picture = prompt.svg
    ? `<span class="qpic${isWideSvg(prompt.svg) ? ' wide' : ''}">${prompt.svg}</span>`
    : prompt.emoji
      ? `<span class="qpic emoji" style="font-size:${emojiRem(prompt.emoji) * 0.75}rem">${escapeHTML(prompt.emoji)}</span>`
      : ''
  const words = prompt.sum
    ? `${problemHTML(prompt.text)} <span class="op">=</span> <span class="qmark">?</span>`
    : problemHTML(prompt.text).replace('__', '<span class="qmark">?</span>')
  return picture + words
}
