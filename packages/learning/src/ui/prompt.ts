import type { Prompt } from '../core/types'
import { canSpeak, speak } from './speak'

/** "7 + 5" → HTML with the operator wrapped in <span class="op">, for colorful sums. */
export const problemHTML = (text: string) =>
  escapeHTML(text).replace(/[+−×÷=]/g, (op) => `<span class="op">${op}</span>`)

export const escapeHTML = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

let styled = false
const CSS = `
.lp-visual { display: flex; justify-content: center; align-items: center; margin: 2px 0 6px; }
.lp-emoji { font-size: clamp(3rem, 14vw, 4.5rem); line-height: 1.1; filter: drop-shadow(0 4px 0 rgba(0,0,0,.15)); }
.lp-svg svg { width: min(46vw, 170px); height: auto; display: block; }
.lp-svg.wide svg { width: min(80vw, 300px); }
.lp-text { font-size: clamp(1.15rem, 4.6vw, 1.45rem); font-weight: 700; line-height: 1.3; white-space: pre-line; }
.lp-text.sum { font-size: clamp(2rem, 9vw, 2.6rem); white-space: nowrap; }
.lp-text .op { color: #8a5cf6; }
.lp-say { font: inherit; font-size: 1.3rem; border: 0; border-radius: 999px; background: #ece6ff; box-shadow: 0 3px 0 #c5b8f0;
  padding: .15em .7em; cursor: pointer; margin: 4px 0 2px; }
.lp-say:active { transform: translateY(2px); box-shadow: 0 1px 0 #c5b8f0; }
`

/**
 * Show a question: picture or drawing, text, and a 🔊 button if it can be read aloud.
 * Listen-only questions are spoken right away.
 */
export function renderPrompt(p: Prompt, { listen = false, sumSuffix = '' } = {}): HTMLElement {
  if (!styled) {
    styled = true
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.append(style)
  }
  const box = document.createElement('div')
  box.className = 'lp-prompt'
  if (p.emoji || p.svg) {
    const v = document.createElement('div')
    v.className = 'lp-visual'
    if (p.svg) {
      v.innerHTML = `<div class="lp-svg${p.svg.includes('Coins') ? ' wide' : ''}">${p.svg}</div>`
    } else {
      v.innerHTML = `<span class="lp-emoji">${escapeHTML(p.emoji!)}</span>`
    }
    box.append(v)
  }
  const t = document.createElement('div')
  t.className = p.sum ? 'lp-text sum' : 'lp-text'
  t.innerHTML = p.sum ? problemHTML(p.text) + sumSuffix : escapeHTML(p.text)
  box.append(t)
  if (p.say && canSpeak(p.say)) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'lp-say'
    b.textContent = '🔊 Hear it'
    b.addEventListener('click', () => speak(p.say!))
    box.append(b)
    if (listen) setTimeout(() => speak(p.say!), 250)
  }
  return box
}
