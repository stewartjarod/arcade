import { speak } from './speak'

/**
 * The 🐢 "slow down" wait after mashing answers. Covers `el` (the answer buttons, or a whole
 * pop-up card) with a friendly turtle and a shrinking bar, so taps don't do anything until
 * it's over. Resolves when they can pick again.
 *
 *   const right = moment.check(q, picked, { choices })
 *   if (!right) await slowDown(answersEl, moment.slowDown(), { say: spokenText(q.prompt) })
 *
 * `seconds` of 0 resolves at once, so it's safe to call after every wrong pick.
 * `say`: read the question again while they wait (for kids still learning to read).
 */
export function slowDown(el: HTMLElement, seconds: number, o: { say?: string } = {}): Promise<void> {
  if (seconds <= 0) return Promise.resolve()
  styleOnce()
  // The cover sits inside `el`, so `el` needs to be a positioned box.
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
  el.querySelector('.slow-down')?.remove()
  const cover = document.createElement('div')
  cover.className = 'slow-down'
  cover.innerHTML = `<div>🐢 Slow down! ${o.say ? 'Listen' : 'Read it'}, then pick.</div><i style="animation-duration:${seconds}s"></i>`
  el.append(cover)
  if (o.say) speak(o.say)
  return new Promise((resolve) =>
    setTimeout(() => {
      cover.remove()
      resolve()
    }, seconds * 1000),
  )
}

let styled = false
function styleOnce() {
  if (styled) return
  styled = true
  const style = document.createElement('style')
  style.textContent = `
.slow-down { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; background: #fffaf0e8; border-radius: inherit; color: #2a2150; font: 700 clamp(1.1rem, 4.5vw, 1.6rem) Fredoka, ui-rounded, system-ui, sans-serif;
  text-align: center; pointer-events: auto; touch-action: none; animation: slow-down-in .2s ease-out; }
.slow-down i { display: block; width: 60%; height: 10px; border-radius: 5px; background: #22c55e; transform-origin: left; animation: slow-down-bar linear forwards; }
@keyframes slow-down-bar { to { transform: scaleX(0); } }
@keyframes slow-down-in { from { opacity: 0; } }`
  document.head.append(style)
}
