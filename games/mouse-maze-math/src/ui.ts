import { COLORS, HATS, STICKERS } from './catalog'
import { KINDS, describe, unlocked } from './math'
import { REALMS } from './realms'
import { commit, save } from './save'
import { activeRealm } from './progress'
import { sfx, unlockAudio } from './audio'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

export type Finish = {
  n: number
  grew: string[]
  newRealm?: string
  stars: number
  mistakes: number
  bonus: number
  sticker: string
  isNew: boolean
}

type Handlers = { play: () => void; menu: () => void; skin: () => void; realm: () => void }
let handlers: Handlers

const starRow = (n: number) => `<span class="stars">${[1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : ''}">★</span>`).join('')}</span>`

const screen = (html: string) => {
  const el = $('screen')
  el.innerHTML = `<div class="card">${html}</div>`
  el.hidden = false
}
export const hideScreen = () => ($('screen').hidden = true)

export const showMenu = () => {
  $('hud').hidden = true
  closeTrap()
  const open = unlocked(save.skills)
  const bars = KINDS.map((k) => {
    const on = open.includes(k)
    const r = save.skills[k]
    const pct = Math.round((r - Math.floor(r)) * 100)
    return `<div class="skill ${on ? '' : 'locked'}"><span>${on ? describe(k, Math.round(r)) : '🔒 Unlocks as you grow'}</span>${on ? `<i><b style="width:${pct}%"></b></i>` : ''}</div>`
  }).join('')
  screen(`<h1><span class="mouse">🐭</span> Mouse Maze Math</h1>
    <div class="sub">🧀 ${save.cheese} &nbsp;·&nbsp; 🖼 ${save.stickers.length}/${STICKERS.length} stickers</div>
    <div class="skills">${bars}</div>
    <div class="row"><button class="btn" data-act="realm">${REALMS[activeRealm()]!.emoji} ${REALMS[activeRealm()]!.name}${save.realmPick < 0 ? ' · auto' : ''} ⟳</button></div>
    <div class="row"><button class="btn primary big" data-act="play">▶ Play Maze ${save.mazes + 1}</button></div>
    <div class="row">
      <button class="btn" data-act="closet">🎩 Mouse closet</button>
      <button class="btn" data-act="stickers">🖼 Sticker book</button>
      <button class="btn" data-act="mute">${save.muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
      <a class="btn" href="../../" style="text-decoration:none">🏠 Arcade</a>
    </div>`)
}

const showCloset = () => {
  const colors = COLORS.map((c) => {
    const owned = save.ownedColors.includes(c.id)
    return `<button class="item ${save.color === c.id ? 'on' : ''}" data-act="wear" data-kind="color" data-id="${c.id}">
      <span class="swatch" style="background:#${c.hex.toString(16).padStart(6, '0')}"></span><br>${c.name}<br>${owned ? (save.color === c.id ? 'Wearing' : 'Owned') : `🧀 ${c.cost}`}</button>`
  }).join('')
  const hats = HATS.map((h) => {
    const owned = save.ownedHats.includes(h.id)
    return `<button class="item ${save.hat === h.id ? 'on' : ''}" data-act="wear" data-kind="hat" data-id="${h.id}">
      <span class="big">${h.emoji}</span>${h.name}<br>${owned ? (save.hat === h.id ? 'Wearing' : 'Owned') : `🧀 ${h.cost}`}</button>`
  }).join('')
  screen(`<h2>🎩 Mouse closet</h2><div class="sub">🧀 ${save.cheese} to spend</div>
    <h3>Fur</h3><div class="grid">${colors}</div><h3>Hats</h3><div class="grid">${hats}</div>
    <div class="row"><button class="btn primary" data-act="home">Done</button></div>`)
}

const showStickers = () =>
  screen(`<h2>🖼 Sticker book</h2><div class="sub">Open a treasure chest to find a new one</div>
    <div class="grid">${STICKERS.map((s) => `<div class="sticker ${save.stickers.includes(s) ? '' : 'locked'}">${save.stickers.includes(s) ? s : '❔'}</div>`).join('')}</div>
    <div class="row"><button class="btn primary" data-act="home">Done</button></div>`)

export const showFinish = (f: Finish) => {
  screen(`<h2>You found the treasure! 🎉</h2>
    <div class="bigstars">${starRow(f.stars)}</div>
    <div class="sub">${f.mistakes === 0 ? 'Perfect run!' : `${f.mistakes} wrong turn${f.mistakes === 1 ? '' : 's'}`} &nbsp;·&nbsp; +${f.bonus} 🧀 bonus</div>
    <div class="prize">${f.sticker}</div>
    ${f.grew.length ? `<div class="sub">📈 Now practicing: ${f.grew.join(' · ')}</div>` : ''}
    ${f.newRealm ? `<div class="tag">🗺 New realm unlocked: ${f.newRealm}</div>` : ''}
    <div>${f.isNew ? '<span class="tag">New sticker!</span>' : 'Already have it: +20 🧀 instead'}</div>
    <div class="row">
      <button class="btn primary" data-act="play">Maze ${f.n + 1} →</button>
      <button class="btn" data-act="home">Menu</button>
    </div>`)
  confetti()
}

export const confetti = () => {
  const bits = ['🧀', '⭐', '🎉', '✨', '🎈']
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div')
    el.className = 'confetti'
    el.textContent = bits[i % bits.length]!
    el.style.left = `${Math.random() * 100}vw`
    el.style.animationDuration = `${2.5 + Math.random() * 2.5}s`
    el.style.animationDelay = `${Math.random() * 1.2}s`
    document.body.append(el)
    setTimeout(() => el.remove(), 7000)
  }
}

export const showHud = (levelName: string) => {
  $('hud').hidden = false
  $('lvl').textContent = levelName
}
export const setProgress = (k: number, n: number) => ($('bar').style.width = `${(k / n) * 100}%`)
export const setCheese = () => ($('cheese').textContent = `🧀 ${save.cheese}`)
export const setStreak = (n: number) => {
  $('streak').textContent = n >= 2 ? `🔥 ${n} in a row` : ''
  $('streak').hidden = n < 2
}
export const setQuestion = (text: string | null) => {
  $('q').classList.toggle('off', text === null)
  if (text !== null) {
    $('qtext').innerHTML = `${text.replace(/[+−×÷]/g, (op) => `<span class="op">${op}</span>`)} <span class="op">=</span> <span class="qmark">?</span>`
    $('qhint').textContent = 'Which door leads to the cheese? 🧀'
  }
}

const ARROWS = ['⬅', '⬆', '➡']
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`
export const showAnswers = (labels: string[], colors: number[], pick: (i: number) => void, hover: (i: number) => void) => {
  const el = $('answers')
  el.innerHTML = labels
    .map((l, i) => `<button class="ans" style="--c:${hex(colors[i]!)}" data-i="${i}" aria-label="${['Left', 'Middle', 'Right'][i]} door: ${l}"><span class="arrow">${ARROWS[i]}</span><span class="num">${l}</span></button>`)
    .join('')
  el.querySelectorAll<HTMLButtonElement>('.ans').forEach((b) => {
    const i = Number(b.dataset.i)
    b.onclick = () => pick(i)
    b.onpointerenter = (ev) => ev.pointerType === 'mouse' && hover(i)
    b.onpointerleave = () => hover(-1)
  })
  el.className = ''
}
export const hoverAnswer = (i: number) =>
  $('answers').querySelectorAll('.ans').forEach((b, k) => b.classList.toggle('hot', k === i))
export const markAnswer = (i: number, good: boolean) => {
  const el = $('answers')
  el.classList.add('picked')
  el.querySelectorAll('.ans')[i]?.classList.add(good ? 'good' : 'bad')
}
export const hideAnswers = () => $('answers').classList.add('off')

let toastTimer: number | undefined
export const toast = (msg: string, kind: 'good' | 'bad' | '' = '') => {
  const el = $('toast')
  el.textContent = msg
  el.className = `show ${kind}`
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (el.className = ''), 1500)
}

let resolveAnswer: ((n: number) => void) | null = null
export const closeTrap = () => {
  resolveAnswer = null
  $('trap').hidden = true
}
export const askNumber = (o: { title: string; text: string; msg?: string }) =>
  new Promise<number>((res) => {
    $('trap-title').textContent = o.title
    $('trap-q').textContent = `${o.text} =`
    $('trap-msg').textContent = o.msg ?? ''
    const input = $<HTMLInputElement>('ans')
    input.value = ''
    $('trap').hidden = false
    resolveAnswer = res
    if (matchMedia('(pointer: fine)').matches) setTimeout(() => input.focus(), 50)
  })
export const trapFeedback = (msg: string) => {
  $('trap-msg').textContent = msg
  const t = $('trap')
  t.classList.remove('shake')
  void t.offsetWidth
  t.classList.add('shake')
}

export const initUI = (h: Handlers) => {
  handlers = h
  setCheese()
  $('trap').addEventListener('submit', (ev) => {
    ev.preventDefault()
    const input = $<HTMLInputElement>('ans')
    const v = Number(input.value.trim())
    if (input.value.trim() === '' || Number.isNaN(v)) return
    const r = resolveAnswer
    resolveAnswer = null
    r?.(v)
  })
  $('pad').addEventListener('click', (ev) => {
    const key = (ev.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key
    if (!key) return
    const input = $<HTMLInputElement>('ans')
    if (key === 'back') input.value = input.value.slice(0, -1)
    else if (input.value.length < 6) input.value += key
    sfx.pop()
  })
  document.addEventListener('click', (ev) => {
    unlockAudio()
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (!t) return
    const { act, id, kind } = t.dataset
    if (act === 'play') handlers.play()
    else if (act === 'menu' || act === 'home') handlers.menu()
    else if (act === 'realm') {
      save.realmPick = save.realmPick + 1 > save.realmMax ? -1 : save.realmPick + 1
      commit()
      handlers.realm()
    } else if (act === 'closet') showCloset()
    else if (act === 'stickers') showStickers()
    else if (act === 'mute') {
      save.muted = !save.muted
      commit()
      showMenu()
    } else if (act === 'wear') {
      const item = (kind === 'color' ? COLORS : HATS).find((x) => x.id === id)!
      const owned = kind === 'color' ? save.ownedColors : save.ownedHats
      if (!owned.includes(item.id)) {
        if (save.cheese < item.cost) return toast(`Need ${item.cost - save.cheese} more 🧀`, 'bad')
        save.cheese -= item.cost
        owned.push(item.id)
        sfx.good()
      }
      if (kind === 'color') save.color = item.id
      else save.hat = item.id
      commit()
      handlers.skin()
      showCloset()
    }
  })
}
