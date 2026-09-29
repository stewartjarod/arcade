/**
 * On-screen text over the game: score, lives, big "YOU WIN!" messages, buttons.
 * Plain HTML, so it's easy to style.
 */
export class Hud {
  readonly root: HTMLDivElement
  private labels = new Map<string, HTMLDivElement>()

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div')
    Object.assign(this.root.style, {
      position: 'fixed', inset: '0', pointerEvents: 'none',
      fontFamily: '"Fredoka", system-ui, sans-serif', color: '#fff',
      textShadow: '0 2px 4px #0008', userSelect: 'none',
    })
    parent.appendChild(this.root)
  }

  /**
   * Show a value in a corner. Calling again with the same name updates it.
   * hud.set('score', `⭐ ${score}`)
   */
  set(name: string, text: string | number, corner: 'top-left' | 'top-right' | 'top' | 'bottom' = 'top-left') {
    let el = this.labels.get(name)
    if (!el) {
      el = document.createElement('div')
      el.style.position = 'absolute'
      el.style.fontSize = '28px'
      el.style.fontWeight = '700'
      const stack = [...this.labels.values()].filter((l) => l.dataset.corner === corner).length
      const offset = `${16 + stack * 40}px`
      const pos: Record<string, Partial<CSSStyleDeclaration>> = {
        'top-left': { top: offset, left: '20px' },
        'top-right': { top: offset, right: '20px' },
        top: { top: offset, left: '50%', transform: 'translateX(-50%)' },
        bottom: { bottom: offset, left: '50%', transform: 'translateX(-50%)' },
      }
      Object.assign(el.style, pos[corner])
      el.dataset.corner = corner
      this.root.appendChild(el)
      this.labels.set(name, el)
    }
    el.textContent = String(text)
  }

  /**
   * Big centered message, with optional buttons.
   * hud.message('Game Over', { button: 'Try again', onClick: () => game.restart() })
   */
  message(title: string, opts: { subtitle?: string; button?: string; onClick?: () => void; seconds?: number } = {}) {
    this.hideMessage()
    const box = document.createElement('div')
    box.className = 'hud-message'
    Object.assign(box.style, {
      position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center',
      background: '#0005', pointerEvents: opts.button ? 'auto' : 'none',
    })
    const h = document.createElement('div')
    h.textContent = title
    Object.assign(h.style, { fontSize: 'clamp(40px, 9vw, 96px)', fontWeight: '800' })
    box.appendChild(h)
    if (opts.subtitle) {
      const p = document.createElement('div')
      p.textContent = opts.subtitle
      p.style.fontSize = '24px'
      box.appendChild(p)
    }
    if (opts.button) {
      const b = document.createElement('button')
      b.textContent = opts.button
      Object.assign(b.style, {
        font: 'inherit', fontSize: '28px', fontWeight: '700', padding: '12px 32px',
        borderRadius: '999px', border: 'none', background: '#ffd43b', color: '#222',
        cursor: 'pointer', boxShadow: '0 6px 0 #c9a200',
      })
      b.onclick = () => {
        this.hideMessage()
        opts.onClick?.()
      }
      box.appendChild(b)
      setTimeout(() => b.focus())
    }
    this.root.appendChild(box)
    if (opts.seconds) setTimeout(() => box.remove(), opts.seconds * 1000)
  }

  hideMessage() {
    this.root.querySelectorAll('.hud-message').forEach((m) => m.remove())
  }

  /** @internal — wipe everything (scene change). */
  clear() {
    this.root.replaceChildren()
    this.labels.clear()
  }
}
