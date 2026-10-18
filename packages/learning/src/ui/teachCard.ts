import { sfx } from '@arcade/engine'
import type { Teach } from '../core/types'
import { styleCard } from './card'
import { renderPrompt, escapeHTML } from './prompt'
import { speak } from './speak'

/**
 * A short "here's how it works" card, shown before a question on a topic the kid hasn't tried yet.
 * It reads itself aloud once (young readers), has a 🔊 to hear it again, shows a worked example with
 * its answer, and waits for one big "Got it!" tap.
 *
 *   await teachCard(lessonFor(item))
 */
export interface TeachCardOptions {
  /** The little heading. */
  title?: string
  /** Where to put the card. Default: the page. */
  parent?: HTMLElement
}

let styled = false
const CSS = `
.teach-card .teach-example { margin-top: 10px; padding: 8px 10px 10px; border-radius: 18px; background: #eef7ff; box-shadow: inset 0 0 0 2px #cfe6ff; }
.teach-card .teach-label { font-size: .95rem; font-weight: 700; color: #6b5f99; }
.teach-card .teach-answer { font-size: clamp(1.8rem, 8vw, 2.4rem); font-weight: 800; color: var(--pad-good); margin-top: 2px; line-height: 1.2; }
.teach-card .teach-tools { display: flex; justify-content: center; margin-top: 6px; }
.teach-card .teach-go { width: 100%; margin-top: 10px; font-size: clamp(1.3rem, 5.5vw, 1.7rem); padding: .5em .6em; }
`

function injectCss() {
  if (styled) return
  styled = true
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)
}

/** Show the card and wait for "Got it!". Resolves once it's closed. */
export function teachCard(teach: Teach, { title = '✨ Something new!', parent = document.body }: TeachCardOptions = {}): Promise<void> {
  styleCard()
  injectCss()
  return new Promise((done) => {
    const el = document.createElement('div')
    el.className = 'lp-card teach-card'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', title)

    const heading = document.createElement('div')
    heading.className = 'lp-title'
    heading.textContent = title

    // The picture and the words. The 🔊 below reads the whole card, so renderPrompt gets no `say` here.
    const body = renderPrompt({ text: teach.text, emoji: teach.emoji, svg: teach.svg })
    el.append(heading, body)

    if (teach.example) el.append(exampleBox(teach.example))

    const tools = document.createElement('div')
    tools.className = 'teach-tools'
    if (teach.say) {
      const hear = document.createElement('button')
      hear.type = 'button'
      hear.className = 'lp-say'
      hear.textContent = '🔊 Hear it'
      hear.addEventListener('click', () => speak(teach.say!))
      tools.append(hear)
    }
    el.append(tools)

    const got = document.createElement('button')
    got.type = 'button'
    got.className = 'lp-key go teach-go'
    got.textContent = 'Got it! 👍'
    got.addEventListener('click', () => {
      sfx.pop()
      el.remove()
      done()
    })
    el.append(got)

    parent.append(el)
    if (teach.say) speak(teach.say) // read it once, as soon as it shows
  })
}

/** The worked example: a question like the one coming, then its answer big and green. */
function exampleBox(example: NonNullable<Teach['example']>): HTMLElement {
  const box = document.createElement('div')
  box.className = 'teach-example'
  const label = document.createElement('div')
  label.className = 'teach-label'
  label.textContent = 'Like this:'
  const answer = document.createElement('div')
  answer.className = 'teach-answer'
  answer.innerHTML = `→ ${escapeHTML(example.answer)}`
  box.append(label, renderPrompt(example.prompt), answer)
  return box
}
