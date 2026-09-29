/** The pop-up card look shared by the choice pad and letter pad (matches the number pad). */
let styled = false

export function styleCard() {
  if (styled) return
  styled = true
  const style = document.createElement('style')
  style.textContent = `
.lp-card { --pad-accent: #ffc93c; --pad-ink: #2a2150; --pad-good: #22c55e; --pad-bad: #ef4444; --pad-border: #9aa4b4;
  position: fixed; left: 50%; bottom: max(12px, env(safe-area-inset-bottom)); transform: translateX(-50%);
  width: min(94vw, 460px); max-height: calc(100vh - 24px); overflow: auto; background: #fffaf0; color: var(--pad-ink);
  border: 5px solid var(--pad-border); border-radius: 28px; padding: 10px 14px 12px; text-align: center;
  box-shadow: 0 8px 0 rgba(0,0,0,.3); z-index: 10; font-family: Fredoka, ui-rounded, system-ui, sans-serif; font-weight: 600;
  animation: lp-rise .35s cubic-bezier(.3,1.5,.5,1); }
.lp-card[hidden] { display: none !important; }
@keyframes lp-rise { from { transform: translate(-50%, 60px); opacity: 0; } }
.lp-title { font-weight: 700; font-size: 1rem; color: #6b5f99; }
.lp-msg { min-height: 1.3em; margin-top: 6px; font-weight: 700; color: var(--pad-bad); }
.lp-card.shake { animation: lp-shake .35s; }
@keyframes lp-shake { 20% { transform: translateX(calc(-50% - 10px)); } 50% { transform: translateX(calc(-50% + 10px)); } 80% { transform: translateX(calc(-50% - 6px)); } }
.lp-key { font-family: inherit; font-weight: 700; border: 0; border-radius: 14px; background: #ece6ff; color: var(--pad-ink);
  box-shadow: 0 4px 0 #c5b8f0; cursor: pointer; transition: transform .06s, box-shadow .06s; }
.lp-key:active { transform: translateY(3px); box-shadow: 0 1px 0 #c5b8f0; }
.lp-key.go { background: var(--pad-good); color: #fff; box-shadow: 0 4px 0 #15803d; }
`
  document.head.append(style)
}

export function shake(el: HTMLElement) {
  el.classList.remove('shake')
  void el.offsetWidth // restart the animation
  el.classList.add('shake')
}
