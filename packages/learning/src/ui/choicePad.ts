import { sfx } from '@arcade/engine'
import type { Prompt } from '../core/types'
import { shake, styleCard } from './card'
import { renderPrompt } from './prompt'

/**
 * A pop-up question with big answer buttons.
 *
 *   const pad = choicePad()
 *   let picked = await pad.ask({ title: 'Quick!', prompt: q.prompt, options: q.options(3) })
 *   while (picked !== q.answer) { pad.mark(picked, false); picked = await pad.again() }
 *   pad.mark(picked, true)
 */
export interface ChoicePad {
  /** Show a question and wait for a pick. */
  ask(o: { title: string; prompt: Prompt; options: string[]; listen?: boolean; msg?: string }): Promise<string>
  /** Wait for another pick on the same question (after marking a wrong one). */
  again(): Promise<string>
  /** Color an option green (right) or red and disabled (wrong). */
  mark(option: string, right: boolean): void
  feedback(msg: string): void
  close(): void
  readonly element: HTMLElement
}

let pad: ChoicePad | undefined
export const choicePad = (): ChoicePad => (pad ??= create())

function create(): ChoicePad {
  styleCard()
  const style = document.createElement('style')
  style.textContent = `
.choice-pad-options { display: grid; gap: 8px; margin-top: 10px; }
.choice-pad-options.cols-2 { grid-template-columns: 1fr 1fr; }
.choice-pad-options button { font-size: clamp(1.1rem, 4.6vw, 1.5rem); padding: .45em .5em; line-height: 1.2; }
.choice-pad-options button.good { background: var(--pad-good); color: #fff; box-shadow: 0 4px 0 #15803d; }
.choice-pad-options button.bad { background: var(--pad-bad); color: #fff; box-shadow: none; opacity: .55; cursor: default; }`
  document.head.append(style)

  const el = document.createElement('div')
  el.className = 'lp-card choice-pad'
  el.hidden = true
  el.innerHTML = `<div class="lp-title"></div><div class="choice-pad-prompt"></div><div class="choice-pad-options"></div><div class="lp-msg"></div>`
  document.body.append(el)
  const $ = (sel: string) => el.querySelector(sel) as HTMLElement
  let resolve: ((v: string) => void) | null = null
  const buttons = new Map<string, HTMLButtonElement>()

  // Number keys 1–4 pick an option too.
  window.addEventListener('keydown', (ev) => {
    if (el.hidden || !resolve) return
    const b = [...buttons.values()][Number(ev.key) - 1]
    if (b && !b.disabled) {
      ev.preventDefault()
      b.click()
    }
  })

  return {
    element: el,
    ask(o) {
      return new Promise((res) => {
        $('.lp-title').textContent = o.title
        $('.choice-pad-prompt').replaceChildren(renderPrompt(o.prompt, { listen: o.listen }))
        $('.lp-msg').textContent = o.msg ?? ''
        const list = $('.choice-pad-options')
        const short = o.options.every((x) => x.length <= 12)
        list.className = `choice-pad-options${short ? ' cols-2' : ''}`
        buttons.clear()
        list.replaceChildren(
          ...o.options.map((opt) => {
            const b = document.createElement('button')
            b.type = 'button'
            b.className = 'lp-key'
            b.textContent = opt
            b.addEventListener('click', () => {
              sfx.pop()
              const r = resolve
              resolve = null
              r?.(opt)
            })
            buttons.set(opt, b)
            return b
          }),
        )
        el.hidden = false
        resolve = res
      })
    },
    again() {
      return new Promise((res) => (resolve = res))
    },
    mark(option, right) {
      const b = buttons.get(option)
      if (!b) return
      b.classList.add(right ? 'good' : 'bad')
      if (!right) b.disabled = true
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
