import { escapeHTML } from '@arcade/learning'
import { LANDS, type Hat, type Land } from './lands'
import { unlockedLands, wardrobe } from './quest'

// ------------------------------------------------------------------
//  The flat (HTML) parts of Candy Quest: the treasure map card, the
//  touch buttons, and the land picker on the title screen.
// ------------------------------------------------------------------

const FONT = 'font-family:Fredoka,system-ui,sans-serif;'
const HAT_EMOJI: Record<Hat | 'none', string> = { none: '🙂', party: '🥳', top: '🎩', crown: '👑' }

function div(css: string, html = '') {
  const el = document.createElement('div')
  el.style.cssText = FONT + css
  el.innerHTML = html
  document.body.append(el)
  return el
}

/** The treasure map in the corner: one tile per piece. Found tiles show their landmark. */
export function mapCard(land: Land, pieces: number) {
  const el = div('position:fixed;top:56px;right:12px;background:#fff8e1;border:4px solid #c08a4a;border-radius:18px;padding:8px 10px;box-shadow:0 5px 0 #0003;text-align:center;')
  const draw = (found: number) => {
    const tiles = land.landmarks.slice(0, pieces).map((l, i) =>
      `<span style="display:inline-grid;place-items:center;width:40px;height:40px;margin:2px;border-radius:10px;font-size:26px;background:${i < found ? '#ffe8a3' : '#e9d8b4'};${i < found ? '' : 'filter:grayscale(1);opacity:.55'}">${i < found ? l.emoji : '❓'}</span>`)
    const done = found >= pieces
    el.innerHTML = `<div style="font:700 15px Fredoka,system-ui;color:#8a5a2b">🗺️ Treasure map</div>
      <div style="max-width:${Math.ceil(pieces / 2) * 44}px">${tiles.join('')}</div>
      <div style="font:700 14px Fredoka,system-ui;color:${done ? '#e03131' : '#8a5a2b'}">${done ? '❌ Treasure ahead!' : `${found} / ${pieces}`}</div>`
  }
  draw(0)
  return {
    show: (found: number) => {
      draw(found)
      // A little wiggle so the new piece gets noticed
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-4deg)' }, { transform: 'scale(1)' }], { duration: 500 })
    },
    remove: () => el.remove(),
  }
}

/** Big ⬅ ⬆ ➡ buttons for tablets and phones (the keyboard works too). */
export function touchButtons(onPress: (action: 'left' | 'jump' | 'right') => void) {
  const el = div('position:fixed;bottom:14px;right:12px;display:flex;gap:10px;')
  for (const [action, label] of [['left', '⬅'], ['jump', '⬆'], ['right', '➡']] as const) {
    const b = document.createElement('button')
    b.textContent = label
    b.style.cssText = 'width:70px;height:70px;border-radius:50%;border:4px solid #fff;background:#f783acdd;color:#fff;font-size:32px;box-shadow:0 5px 0 #0003;touch-action:manipulation;cursor:pointer;'
    // pointerdown (not click) so it reacts the moment a finger touches
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      onPress(action)
    })
    el.append(b)
  }
  return el
}

/** A small "back to the lands" button. */
export function landsButton(onClick: () => void) {
  const b = document.createElement('button')
  b.textContent = '🗺️ Lands'
  b.style.cssText = FONT + 'position:fixed;bottom:56px;left:12px;z-index:10;font-weight:700;font-size:16px;color:#fff;background:#0006;border:0;padding:6px 12px;border-radius:999px;cursor:pointer;'
  b.onclick = onClick
  document.body.append(b)
  return b
}

export interface Look {
  color: string
  hat: Hat | 'none'
}

/** The title screen card: pick a land and how Buddy looks. */
export function titleCard(o: { finished: number; look: Look; onLook: (look: Look) => void; onPlay: (land: number) => void }) {
  const el = div('position:fixed;right:max(4vw,calc(50vw - 480px));top:50%;transform:translateY(-50%);width:min(92vw,480px);max-height:92vh;overflow:auto;background:#fffd;border-radius:28px;padding:16px 18px;box-shadow:0 8px 0 #0003;text-align:center;')
  const draw = () => {
    const open = unlockedLands(o.finished)
    const lands = LANDS.map((land, i) => {
      const locked = i >= open
      const badge = i < o.finished ? '✅' : locked ? '🔒' : '▶️'
      return `<button data-land="${i}" ${locked ? 'disabled' : ''} style="display:flex;align-items:center;gap:10px;width:100%;margin:6px 0;padding:10px 14px;border:4px solid #fff;border-radius:20px;background:${locked ? '#dee2e6' : land.path};color:${locked ? '#868e96' : '#fff'};font:700 20px Fredoka,system-ui;text-shadow:${locked ? 'none' : '0 2px 3px #0006'};box-shadow:0 5px 0 #0002;cursor:${locked ? 'default' : 'pointer'}">
        <span style="font-size:30px">${land.emoji}</span><span style="flex:1;text-align:left">${escapeHTML(land.name)}</span><span>${badge}</span></button>`
    }).join('')
    const { colors, hats } = wardrobe(o.finished)
    const swatches = colors.map((c) => `<button data-color="${c.color}" title="${escapeHTML(c.name)}" style="width:44px;height:44px;margin:3px;border-radius:50%;background:${c.color};cursor:pointer;border:4px solid ${c.color === o.look.color ? '#495057' : '#fff'}"></button>`).join('')
    const hatButtons = hats.map((h) => `<button data-hat="${h}" style="width:48px;height:48px;margin:3px;border-radius:14px;font-size:28px;background:#fff;cursor:pointer;border:4px solid ${h === o.look.hat ? '#495057' : '#e9ecef'}">${HAT_EMOJI[h]}</button>`).join('')
    el.innerHTML = `<div style="font:700 38px Fredoka,system-ui;color:#e64980">🍭 Candy Quest</div>
      <div style="font:500 17px Fredoka,system-ui;color:#495057;margin-bottom:6px">Spell words to find map pieces. Find the treasure!</div>
      ${lands}
      <div style="font:700 16px Fredoka,system-ui;color:#495057;margin-top:10px">Buddy's look</div>
      <div>${swatches}</div><div>${hatButtons}</div>`
  }
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button')
    if (!b || b.disabled) return
    if (b.dataset.land) return o.onPlay(Number(b.dataset.land))
    if (b.dataset.color) o.look = { ...o.look, color: b.dataset.color }
    if (b.dataset.hat) o.look = { ...o.look, hat: b.dataset.hat as Look['hat'] }
    o.onLook(o.look)
    draw()
  })
  draw()
  return el
}

/** A quick little word that floats up and fades (for small things, like "Sticky!"). */
export function toast(text: string) {
  const el = div('position:fixed;left:50%;top:30%;transform:translateX(-50%);font:700 40px Fredoka,system-ui;color:#fff;text-shadow:0 3px 0 #d9480f,0 0 8px #0005;pointer-events:none;', text)
  el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -60px' }], { duration: 900, easing: 'ease-out' }).onfinish = () => el.remove()
}

/**
 * The Candy Monster chase: a question at the top, three answer buttons at the bottom,
 * and a strip showing how close the monster is (😀 ......... 👾).
 */
export function chasePanel() {
  const el = div('position:fixed;inset:0;pointer-events:none;')
  el.innerHTML = `
    <div data-meter style="position:absolute;top:58px;left:50%;transform:translateX(-50%);width:min(70vw,360px);height:34px;background:#fff9;border-radius:999px;border:3px solid #9c36b5;">
      <span data-me style="position:absolute;right:4px;top:0;font-size:26px">🏃</span>
      <span data-monster style="position:absolute;top:0;font-size:26px;transition:left .3s">👾</span>
    </div>
    <div data-q style="position:absolute;top:104px;left:50%;transform:translateX(-50%);max-width:92vw;background:#fffe;border-radius:22px;padding:8px 18px;box-shadow:0 6px 0 #0002;text-align:center;pointer-events:auto"></div>
    <div data-answers style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:10px;width:min(94vw,560px);pointer-events:auto"></div>`
  const $ = (k: string) => el.querySelector<HTMLElement>(`[data-${k}]`)!
  const COLORS = ['#ff6b6b', '#ffa94d', '#4dabf7']
  return {
    /** gap 0 (caught) … max (far away). */
    meter(gap: number, max: number) {
      const far = Math.max(0, Math.min(1, gap / max)) // 1 = far away (left end), 0 = right next to Buddy
      $('monster').style.left = `${(1 - far) * 85}%`
    },
    show(prompt: HTMLElement, options: string[], onPick: (i: number) => void) {
      $('q').replaceChildren(prompt)
      $('answers').innerHTML = options
        .map((o, i) => `<button data-i="${i}" style="flex:1;min-width:0;border:4px solid #fff;border-radius:22px;background:${COLORS[i]};color:#fff;font:700 32px Fredoka,system-ui;padding:12px 4px;cursor:pointer;box-shadow:0 6px 0 #0004;text-shadow:0 2px 3px #000a"><span style="display:block;font-size:13px;opacity:.9">${i + 1}</span>${escapeHTML(o)}</button>`)
        .join('')
      $('answers').querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        onPick(Number(b.dataset.i))
      }))
    },
    /** Grey out a wrong button, or turn the right one green. */
    mark(i: number, right: boolean) {
      const b = $('answers').querySelectorAll<HTMLButtonElement>('button')[i]
      if (!b) return
      if (right) b.style.background = '#22c55e'
      else {
        b.disabled = true
        b.style.opacity = '.35'
      }
    },
    remove: () => el.remove(),
  }
}
