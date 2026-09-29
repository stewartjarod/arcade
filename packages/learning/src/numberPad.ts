import { sfx } from '@arcade/engine'

/**
 * A pop-up number pad for typed answers — works with touch, mouse and keyboard.
 *
 *   const pad = numberPad()
 *   const value = await pad.ask({ title: 'Solve it!', text: q.text })
 *   if (!moment.check(q, value)) pad.feedback('Not quite, try again!')
 *   pad.close()
 *
 * Restyle it with CSS variables: --pad-accent, --pad-ink, --pad-good, --pad-bad, --pad-border.
 */
export interface NumberPad {
  ask(o: { title: string; text: string; msg?: string }): Promise<number>
  /** Show a message and give the pad a little shake. */
  feedback(msg: string): void
  close(): void
  readonly isOpen: boolean
  readonly element: HTMLFormElement
}

let pad: NumberPad | undefined

/** The page's number pad (created the first time you ask for it). */
export function numberPad(): NumberPad {
  return (pad ??= createPad())
}

const CSS = `
.num-pad { --pad-accent: #ffc93c; --pad-ink: #2a2150; --pad-good: #22c55e; --pad-bad: #ef4444; --pad-border: #9aa4b4;
  position: fixed; left: 50%; bottom: max(12px, env(safe-area-inset-bottom)); transform: translateX(-50%);
  width: min(94vw, 380px); background: #fffaf0; color: var(--pad-ink); border: 5px solid var(--pad-border);
  border-radius: 28px; padding: 10px 14px 12px; text-align: center; box-shadow: 0 8px 0 rgba(0,0,0,.3);
  z-index: 10; font-family: Fredoka, ui-rounded, system-ui, sans-serif; font-weight: 600;
  animation: num-pad-rise .35s cubic-bezier(.3,1.5,.5,1); }
.num-pad[hidden] { display: none !important; }
@keyframes num-pad-rise { from { transform: translate(-50%, 60px); opacity: 0; } }
.num-pad-title { font-weight: 700; font-size: 1rem; color: #6b5f99; }
.num-pad-row { display: flex; gap: 10px; justify-content: center; align-items: center; margin-top: 6px; }
.num-pad-q { font-size: clamp(2rem, 9vw, 2.6rem); font-weight: 700; white-space: nowrap; }
.num-pad input { width: 3.6em; min-width: 0; font: inherit; font-size: 2rem; font-weight: 700; text-align: center;
  border-radius: 18px; border: 4px solid var(--pad-accent); background: #fff; color: var(--pad-ink); padding: .05em;
  caret-color: #8a5cf6; -webkit-user-select: text; user-select: text; outline: none; }
.num-pad-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-top: 10px; }
.num-pad-keys button { font-family: inherit; font-size: 1.5rem; font-weight: 700; padding: .15em 0; border: 0; border-radius: 16px;
  background: #ece6ff; color: var(--pad-ink); box-shadow: 0 4px 0 #c5b8f0; cursor: pointer; transition: transform .06s, box-shadow .06s; }
.num-pad-keys button:active { transform: translateY(3px); box-shadow: 0 1px 0 #c5b8f0; }
.num-pad-keys .go { background: var(--pad-good); color: #fff; box-shadow: 0 4px 0 #15803d; }
.num-pad-keys .go:active { box-shadow: 0 1px 0 #15803d; }
.num-pad-msg { min-height: 1.3em; margin-top: 6px; font-weight: 700; color: var(--pad-bad); }
.num-pad.shake { animation: num-pad-shake .35s; }
@keyframes num-pad-shake { 20% { transform: translateX(calc(-50% - 10px)); } 50% { transform: translateX(calc(-50% + 10px)); } 80% { transform: translateX(calc(-50% - 6px)); } }
@media (max-height: 520px) { .num-pad-keys button { font-size: 1.3rem; padding: .1em 0; } }
`

function createPad(): NumberPad {
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)

  const form = document.createElement('form')
  form.className = 'num-pad'
  form.hidden = true
  form.autocomplete = 'off'
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    .map((k) => `<button type="button" data-key="${k}">${k}</button>`)
    .join('')
  form.innerHTML = `
    <div class="num-pad-title"></div>
    <div class="num-pad-row"><div class="num-pad-q"></div><input inputmode="none" autocomplete="off" aria-label="Your answer" /></div>
    <div class="num-pad-keys">${keys}
      <button type="button" data-key="back" aria-label="Delete">⌫</button><button type="button" data-key="0">0</button><button type="submit" class="go" aria-label="Check">✓</button>
    </div>
    <div class="num-pad-msg"></div>`
  document.body.append(form)

  const $ = <T extends HTMLElement>(sel: string) => form.querySelector(sel) as T
  const input = $<HTMLInputElement>('input')
  let resolve: ((n: number) => void) | null = null

  form.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const text = input.value.trim()
    const v = Number(text)
    if (text === '' || Number.isNaN(v)) return
    const r = resolve
    resolve = null
    r?.(v)
  })
  const press = (key: string) => {
    if (key === 'back') input.value = input.value.slice(0, -1)
    else if (input.value.length < 6) input.value += key
    sfx.pop()
  }
  $('.num-pad-keys').addEventListener('click', (ev) => {
    const key = (ev.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key
    if (key) press(key)
  })
  // Typing works even if the answer box isn't focused (e.g. after clicking the game).
  window.addEventListener('keydown', (ev) => {
    if (form.hidden || document.activeElement === input) return
    if (/^[0-9]$/.test(ev.key)) press(ev.key)
    else if (ev.key === 'Backspace') press('back')
    else if (ev.key === 'Enter') form.requestSubmit()
    else return
    ev.preventDefault()
  })

  return {
    element: form,
    get isOpen() {
      return !form.hidden
    },
    ask(o) {
      return new Promise<number>((res) => {
        $('.num-pad-title').textContent = o.title
        $('.num-pad-q').textContent = `${o.text} =`
        $('.num-pad-msg').textContent = o.msg ?? ''
        input.value = ''
        form.hidden = false
        resolve = res
        // Only grab focus with a real mouse/keyboard, so phones don't pop up their own keyboard.
        if (matchMedia('(pointer: fine)').matches) setTimeout(() => input.focus(), 50)
      })
    },
    feedback(msg) {
      $('.num-pad-msg').textContent = msg
      form.classList.remove('shake')
      void form.offsetWidth // restart the animation
      form.classList.add('shake')
    },
    close() {
      resolve = null
      form.hidden = true
    },
  }
}
