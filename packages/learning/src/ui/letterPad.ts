import { sfx } from '@arcade/engine'
import type { Prompt } from '../core/types'
import { shake, styleCard } from './card'
import { renderPrompt } from './prompt'

/**
 * A pop-up letter keyboard for spelling — ABC order (easier than QWERTY for young kids),
 * and a real keyboard works too.
 *
 *   const word = await letterPad().ask({ title: 'Spell it!', prompt: q.prompt, listen: true })
 */
export interface LetterPad {
  ask(o: { title: string; prompt: Prompt; listen?: boolean; msg?: string }): Promise<string>
  feedback(msg: string): void
  close(): void
  readonly element: HTMLElement
}

let pad: LetterPad | undefined
export const letterPad = (): LetterPad => (pad ??= create())

const KEYS = "abcdefghijklmnopqrstuvwxyz'".split('')
const MAX = 14

function create(): LetterPad {
  styleCard()
  const style = document.createElement('style')
  style.textContent = `
.letter-pad-word { min-height: 1.5em; margin: 6px auto 0; padding: .1em .5em; width: fit-content; min-width: 5em; font-size: clamp(1.8rem, 8vw, 2.3rem);
  font-weight: 700; letter-spacing: .08em; border-radius: 16px; border: 4px solid var(--pad-accent); background: #fff; }
.letter-pad-word:empty::after { content: '…'; opacity: .3; }
.letter-pad-keys { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 10px; }
.letter-pad-keys button { font-size: clamp(1.05rem, 4.4vw, 1.35rem); padding: .3em 0; }
.letter-pad-keys .wide { grid-column: span 2; }`
  document.head.append(style)

  const el = document.createElement('div')
  el.className = 'lp-card letter-pad'
  el.hidden = true
  const keys = KEYS.map((k) => `<button type="button" class="lp-key" data-key="${k}">${k}</button>`).join('')
  el.innerHTML = `<div class="lp-title"></div><div class="letter-pad-prompt"></div><div class="letter-pad-word" aria-live="polite"></div>
    <div class="letter-pad-keys">${keys}<button type="button" class="lp-key" data-key="back" aria-label="Delete">⌫</button><button type="button" class="lp-key go wide" data-key="go" aria-label="Check">✓</button></div>
    <div class="lp-msg"></div>`
  document.body.append(el)
  const $ = (sel: string) => el.querySelector(sel) as HTMLElement
  const word = $('.letter-pad-word')
  let resolve: ((v: string) => void) | null = null

  const press = (key: string) => {
    if (!resolve) return
    if (key === 'go') {
      if (!word.textContent) return
      const r = resolve
      resolve = null
      return r(word.textContent)
    }
    if (key === 'back') word.textContent = word.textContent!.slice(0, -1)
    else if (word.textContent!.length < MAX) word.textContent += key
    sfx.pop()
  }
  $('.letter-pad-keys').addEventListener('click', (ev) => {
    const key = (ev.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key
    if (key) press(key)
  })
  window.addEventListener('keydown', (ev) => {
    if (el.hidden || !resolve) return
    const k = ev.key.toLowerCase()
    if (KEYS.includes(k) || k === '’') press(k === '’' ? "'" : k)
    else if (ev.key === 'Backspace') press('back')
    else if (ev.key === 'Enter') press('go')
    else return
    ev.preventDefault()
  })

  return {
    element: el,
    ask(o) {
      return new Promise((res) => {
        $('.lp-title').textContent = o.title
        $('.letter-pad-prompt').replaceChildren(renderPrompt(o.prompt, { listen: o.listen }))
        $('.lp-msg').textContent = o.msg ?? ''
        word.textContent = ''
        el.hidden = false
        resolve = res
      })
    },
    feedback(msg) {
      $('.lp-msg').textContent = msg
      shake(el)
    },
    close() {
      resolve = null
      el.hidden = true
    },
  }
}
