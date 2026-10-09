import { COLORS, HATS, STICKERS } from './catalog'
import { questionHTML } from './questionHtml'
import { choicePad, findSubject, gradeName, learner, practiceGrade, skillSummary, speak, spokenText, type Prompt, type SkillInfo } from '@arcade/learning'
import { confetti as rain, setMuted } from '@arcade/engine'
import { REALMS } from './realms'
import { commit, save } from './save'
import { activeRealm, currentSubject, playableSubjects } from './progress'
import { sfx, unlockAudio } from './audio'
import { currentPlayer } from '@arcade/players'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

export type Finish = {
  n: number
  grew: string[]
  /** "IXL Grade 2 math", when the subject is mapped to IXL. */
  gradeLine?: string
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

const playerTag = () => {
  const p = currentPlayer()
  const safe = p.name.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  return `${p.avatar} ${safe}`
}

// "· ⭐ proficient" next to a skill, IXL-style: 80+ is proficient, 90+ is the challenge zone.
const smartNote = (sk: SkillInfo) => {
  const b = sk.smart?.band
  return b === 'proficient' ? ' · ⭐ proficient' : b === 'challenge' ? ' · 🔥 challenge zone' : ''
}
const MAX_SKILLS_SHOWN = 8

export const showMenu = () => {
  $('hud').hidden = true
  closeTrap()
  const subjectId = currentSubject()
  const subject = findSubject(subjectId)!
  const { grade, known } = practiceGrade(learner(), subjectId)
  const all = skillSummary(learner(), subjectId)
  const open = all.filter((sk) => sk.unlocked)
  // Only what's unlocked, so the menu stays short; the rest are a surprise to discover.
  const bars = open
    .slice(0, MAX_SKILLS_SHOWN)
    .map((sk) => `<div class="skill"><span>${sk.label}${smartNote(sk)}</span><i><b style="width:${Math.round(sk.progress * 100)}%"></b></i></div>`)
    .join('')
  const more = open.length - MAX_SKILLS_SHOWN
  const hidden = all.length - open.length
  const chips = playableSubjects()
    .map((s) => `<button class="chip-subject ${s.id === subjectId ? 'on' : ''}" data-act="subject" data-id="${s.id}">${s.emoji} ${s.name}</button>`)
    .join('')
  screen(`<h1><span class="mouse">🐭</span> Mouse Maze ${subject.id === 'math' ? 'Math' : subject.name}</h1>
    <div class="sub">${playerTag()} &nbsp;·&nbsp; 🧀 ${save.cheese} &nbsp;·&nbsp; 🖼 ${save.stickers.length}/${STICKERS.length} stickers${known ? ` &nbsp;·&nbsp; 🎓 IXL ${gradeName(grade)}` : ''}</div>
    <div class="subjects-row">${chips}</div>
    <div class="row"><button class="btn primary big" data-act="play">▶ Play Maze ${save.mazes + 1}</button></div>
    <div class="row"><button class="btn" data-act="realm">${REALMS[activeRealm()]!.emoji} ${REALMS[activeRealm()]!.name}${save.realmPick < 0 ? ' · auto' : ''} ⟳</button></div>
    <details class="practicing"><summary>📊 What I'm practicing</summary>
      <div class="skills">${bars}</div>
      <div class="sub">${[more > 0 ? `+${more} more you're practicing` : '', hidden > 0 ? `🔒 ${hidden} more to discover` : ''].filter(Boolean).join(' · ')}</div>
    </details>
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
    ${f.gradeLine ? `<div class="sub">🎓 ${f.gradeLine}</div>` : ''}
    ${f.newRealm ? `<div class="tag">🗺 New realm unlocked: ${f.newRealm}</div>` : ''}
    <div>${f.isNew ? '<span class="tag">New sticker!</span>' : 'Already have it: +20 🧀 instead'}</div>
    <div class="row">
      <button class="btn primary" data-act="play">Maze ${f.n + 1} →</button>
      <button class="btn" data-act="home">Menu</button>
    </div>`)
  confetti()
}

export const confetti = () => rain(['🧀', '⭐', '🎉', '✨', '🎈'])

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
export const setQuestion = (prompt: Prompt | null) => {
  $('q').classList.toggle('off', prompt === null)
  if (prompt !== null) {
    $('qtext').innerHTML = `${questionHTML(prompt)}<button class="qsay" aria-label="Hear it">🔊</button>`
    $('qtext').querySelector<HTMLButtonElement>('.qsay')!.onclick = () => speak(spokenText(prompt))
    $('qtext').classList.toggle('long', prompt.text.length > 14)
    $('qhint').textContent = 'Which door leads to the cheese? 🧀'
  }
}

const ARROWS = ['⬅', '⬆', '➡']
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`
export const showAnswers = (labels: string[], colors: number[], pick: (i: number) => void, hover: (i: number) => void) => {
  const el = $('answers')
  el.innerHTML = labels
    .map((l, i) => `<button class="ans" style="--c:${hex(colors[i]!)}" data-i="${i}" aria-label="${['Left', 'Middle', 'Right'][i]} door: ${l}"><span class="arrow">${ARROWS[i]}</span><span class="num${l.length > 12 ? ' long wordy' : l.length > 5 ? ' long' : ''}">${l}</span></button>`)
    .join('')
  el.querySelectorAll<HTMLButtonElement>('.ans').forEach((b) => {
    const i = Number(b.dataset.i)
    b.onclick = () => pick(i)
    b.onpointerenter = (ev) => ev.pointerType === 'mouse' && hover(i)
    b.onpointerleave = () => hover(-1)
  })
  // Long answers (a whole sentence) read better stacked full-width than squeezed into three columns.
  el.className = labels.some((l) => l.length > 28) ? 'stacked' : ''
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

// The trap cage asks with big tap buttons (the shared choice pad), so there's no typing to slow anyone down.
const pad = choicePad()
export const closeTrap = () => pad.close()
export const askChoice = pad.ask
export const askAgain = pad.again
export const markChoice = pad.mark

export const initUI = (h: Handlers) => {
  handlers = h
  setCheese()
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
    } else if (act === 'subject') {
      save.subject = id!
      commit()
      handlers.realm()
    } else if (act === 'closet') showCloset()
    else if (act === 'stickers') showStickers()
    else if (act === 'mute') {
      save.muted = !save.muted
      setMuted(save.muted)
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
