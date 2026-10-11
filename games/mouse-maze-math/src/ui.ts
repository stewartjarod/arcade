import { COLORS, HATS, STICKERS } from './catalog'
import { questionHTML } from './questionHtml'
import { choicePad, findSubject, learner, practiceGrade, skillSummary, speak, spokenText, type Prompt, type SkillInfo } from '@arcade/learning'
import { confetti as rain, setMuted } from '@arcade/engine'
import { REALMS } from './realms'
import { commit, save } from './save'
import { activeRealm, currentSubject, playableSubjects } from './progress'
import { sfx, unlockAudio } from './audio'
import { currentPlayer } from '@arcade/players'
import { cheeseFromFinish, doorHint, isCozy, wordlessToast, wordsHint } from './cozy'

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
export const hideScreen = () => {
  closeLeave()
  $('screen').hidden = true
}

// The youngest players get picture-first screens. Judged by their IXL grade in the subject being played.
const cozyNow = () => isCozy(practiceGrade(learner(), currentSubject()).grade)

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
  closeLeave()
  // The menu is redrawn often (mute, subject, realm), so keep the ⚙️ panel open if it was open.
  const settingsWereOpen = document.querySelector<HTMLDetailsElement>('details.more')?.open ?? false
  const subjectId = currentSubject()
  const subject = findSubject(subjectId)!
  const { grade } = practiceGrade(learner(), subjectId)
  const cozy = isCozy(grade)
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
    .map((s) => {
      const on = s.id === subjectId
      // Young players get just the emoji; the name is still there for screen readers.
      return cozy
        ? `<button class="chip-subject emoji ${on ? 'on' : ''}" data-act="subject" data-id="${s.id}" aria-label="${s.name}" aria-pressed="${on}">${s.emoji}</button>`
        : `<button class="chip-subject ${on ? 'on' : ''}" data-act="subject" data-id="${s.id}">${s.emoji} ${s.name}</button>`
    })
    .join('')
  const realm = REALMS[activeRealm()]!
  const realmButton = cozy
    ? `<button class="btn" data-act="realm" aria-label="Change place: ${realm.name}">${realm.emoji} ⟳</button>`
    : `<button class="btn" data-act="realm">${realm.emoji} ${realm.name}${save.realmPick < 0 ? ' · auto' : ''} ⟳</button>`
  const practicing = `<details class="practicing"><summary>📊 What I'm practicing</summary>
      <div class="skills">${bars}</div>
      <div class="sub">${[more > 0 ? `+${more} more you're practicing` : '', hidden > 0 ? `🔒 ${hidden} more to discover` : ''].filter(Boolean).join(' · ')}</div>
    </details>`
  const title = `<h1><span class="mouse">🐭</span> Mouse Maze ${subject.id === 'math' ? 'Math' : subject.name}</h1>`
  const playLabel = `Play maze ${save.mazes + 1}`
  const stickerCount = `🖼 ${save.stickers.length}/${STICKERS.length} stickers`

  if (cozy) {
    // Picture-first: one giant play button, a row of icon buttons, and everything else behind ⚙️.
    screen(`${title}
      <div class="sub">${currentPlayer().avatar} &nbsp;·&nbsp; 🧀 ${save.cheese}</div>
      <div class="row"><button class="btn primary giant" data-act="play" aria-label="${playLabel}">▶</button></div>
      <div class="row icons">
        <button class="btn icon" data-act="closet" aria-label="Mouse closet">🎩</button>
        <button class="btn icon" data-act="stickers" aria-label="Sticker book">🖼</button>
        <button class="btn icon" data-act="mute" aria-label="${save.muted ? 'Sound is off. Turn it on' : 'Sound is on. Turn it off'}">${save.muted ? '🔇' : '🔊'}</button>
        <a class="btn icon" href="../../" aria-label="Back to the arcade">🏠</a>
      </div>
      <details class="more" ${settingsWereOpen ? 'open' : ''}><summary aria-label="Settings">⚙️</summary>
        <div class="subjects-row">${chips}</div>
        <div class="row">${realmButton}</div>
        ${practicing}
        <div class="sub">${playerTag()} &nbsp;·&nbsp; ${stickerCount}</div>
      </details>`)
    return
  }

  screen(`${title}
    <div class="sub">${playerTag()} &nbsp;·&nbsp; 🧀 ${save.cheese} &nbsp;·&nbsp; ${stickerCount}</div>
    <div class="subjects-row">${chips}</div>
    <div class="row"><button class="btn primary big" data-act="play">▶ Play Maze ${save.mazes + 1}</button></div>
    <div class="row">${realmButton}</div>
    ${practicing}
    <div class="row">
      <button class="btn" data-act="closet">🎩 Mouse closet</button>
      <button class="btn" data-act="stickers">🖼 Sticker book</button>
      <button class="btn" data-act="mute">${save.muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
      <a class="btn" href="../../" style="text-decoration:none">🏠 Arcade</a>
    </div>`)
}

const showCloset = () => {
  const cozy = cozyNow()
  const colors = COLORS.map((c) => {
    const owned = save.ownedColors.includes(c.id)
    const worn = save.color === c.id
    // Young players see the swatch and a check or a cheese price; grown-ups also get the words.
    const tag = cozy ? (worn ? '✅' : owned ? '' : `🧀 ${c.cost}`) : owned ? (worn ? 'Wearing' : 'Owned') : `🧀 ${c.cost}`
    const label = `${c.name}${worn ? ', wearing' : owned ? ', owned' : `, costs ${c.cost} cheese`}`
    return `<button class="item ${worn ? 'on' : ''}" data-act="wear" data-kind="color" data-id="${c.id}" aria-label="${label}">
      <span class="swatch" style="background:#${c.hex.toString(16).padStart(6, '0')}"></span><br>${cozy ? '' : `${c.name}<br>`}${tag}</button>`
  }).join('')
  const hats = HATS.map((h) => {
    const owned = save.ownedHats.includes(h.id)
    const worn = save.hat === h.id
    const tag = cozy ? (worn ? '✅' : owned ? '' : `🧀 ${h.cost}`) : owned ? (worn ? 'Wearing' : 'Owned') : `🧀 ${h.cost}`
    const label = `${h.name}${worn ? ', wearing' : owned ? ', owned' : `, costs ${h.cost} cheese`}`
    return `<button class="item ${worn ? 'on' : ''}" data-act="wear" data-kind="hat" data-id="${h.id}" aria-label="${label}">
      <span class="big">${h.emoji}</span>${cozy ? '' : h.name}<br>${tag}</button>`
  }).join('')
  if (cozy) {
    screen(`<h2>🎩</h2><div class="sub">🧀 ${save.cheese}</div>
      <h3>🎨</h3><div class="grid">${colors}</div><h3>🎩</h3><div class="grid">${hats}</div>
      <div class="row"><button class="btn primary giant" data-act="home" aria-label="Done">✔</button></div>`)
    return
  }
  screen(`<h2>🎩 Mouse closet</h2><div class="sub">🧀 ${save.cheese} to spend</div>
    <h3>Fur</h3><div class="grid">${colors}</div><h3>Hats</h3><div class="grid">${hats}</div>
    <div class="row"><button class="btn primary" data-act="home">Done</button></div>`)
}

const showStickers = () => {
  const cozy = cozyNow()
  const grid = `<div class="grid">${STICKERS.map((s) => `<div class="sticker ${save.stickers.includes(s) ? '' : 'locked'}">${save.stickers.includes(s) ? s : '❔'}</div>`).join('')}</div>`
  if (cozy) {
    screen(`<h2>🖼</h2><div class="sub">${save.stickers.length}/${STICKERS.length}</div>
      ${grid}
      <div class="row"><button class="btn primary giant" data-act="home" aria-label="Done">✔</button></div>`)
    return
  }
  screen(`<h2>🖼 Sticker book</h2><div class="sub">Open a treasure chest to find a new one</div>
    ${grid}
    <div class="row"><button class="btn primary" data-act="home">Done</button></div>`)
}

export const showFinish = (f: Finish) => {
  closeLeave()
  if (cozyNow()) {
    showFinishCozy(f)
    confetti()
    return
  }
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

// Picture-only finish for the youngest players: stars, the prize, the cheese won, and one big ▶.
const showFinishCozy = (f: Finish) => {
  const cheese = cheeseFromFinish(f.bonus, f.isNew)
  // The words that a non-reader can't use go behind ⚙️.
  const extra = [
    f.grew.length ? `📈 Now practicing: ${f.grew.join(' · ')}` : '',
    f.newRealm ? `🗺 New place: ${f.newRealm}` : '',
  ].filter(Boolean)
  screen(`<h2>🎉</h2>
    <div class="bigstars">${starRow(f.stars)}</div>
    <div class="prize">${f.sticker}</div>
    <div class="tag big" aria-label="${cheese} cheese">+${cheese} 🧀</div>
    <div>${f.isNew ? '<span class="tag" aria-label="New sticker">✨</span>' : ''}${f.newRealm ? ' <span class="tag" aria-label="New place">🗺</span>' : ''}</div>
    <div class="row"><button class="btn primary giant" data-act="play" aria-label="Next maze">▶</button></div>
    <div class="row"><button class="btn icon" data-act="home" aria-label="Back to the menu">🏠</button></div>
    ${extra.length ? `<details class="more"><summary aria-label="More about this maze">⚙️</summary>${extra.map((line) => `<div class="sub">${line}</div>`).join('')}</details>` : ''}`)
  speak('You found the treasure!')
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
    // A whole story problem: smaller still on a landscape phone, so it doesn't cover the doors.
    $('qtext').classList.toggle('vlong', prompt.text.length > 70)
    $('qhint').textContent = doorHint(cozyNow())
  }
}

const ARROWS = ['⬅', '⬆', '➡']
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`
// `blocked` doors were already tried: they stay on screen, crossed out and unclickable.
export const showAnswers = (labels: string[], colors: number[], pick: (i: number) => void, hover: (i: number) => void, blocked: number[] = []) => {
  const el = $('answers')
  el.innerHTML = labels
    .map((l, i) => `<button class="ans${blocked.includes(i) ? ' blocked' : ''}"${blocked.includes(i) ? ' disabled' : ''} style="--c:${hex(colors[i]!)}" data-i="${i}" aria-label="${['Left', 'Middle', 'Right'][i]} door: ${l}"><span class="arrow">${ARROWS[i]}</span><span class="num${l.length > 12 ? ' long wordy' : l.length > 5 ? ' long' : ''}">${l}</span></button>`)
    .join('')
  el.querySelectorAll<HTMLButtonElement>('.ans').forEach((b) => {
    const i = Number(b.dataset.i)
    b.onclick = () => pick(i)
    b.onpointerenter = (ev) => ev.pointerType === 'mouse' && hover(i)
    b.onpointerleave = () => hover(-1)
  })
  // Long answers (a whole sentence) read better stacked full-width than squeezed into three columns.
  el.className = labels.some((l) => l.length > 28) ? 'stacked' : ''
  // When the answers are words, the door signs only show arrows, so point the player at the buttons below.
  $('qhint').textContent = labels.some((l) => l.length > 12) ? wordsHint(cozyNow()) : doorHint(cozyNow())
}
/** A little wiggle on the doors that still count, to say "pick one!" */
export const pulseAnswers = () => {
  $('answers').querySelectorAll('.ans:not(.blocked)').forEach((b) => {
    b.classList.remove('nudge')
    void (b as HTMLElement).offsetWidth // restart the animation if it was already running
    b.classList.add('nudge')
  })
}
/** Fade one door out (a hint): it can't be picked any more. */
export const fadeAnswer = (i: number) => {
  const b = $('answers').querySelectorAll<HTMLButtonElement>('.ans')[i]
  b?.classList.add('blocked')
  if (b) b.disabled = true
}
export const hoverAnswer = (i: number) =>
  $('answers').querySelectorAll('.ans').forEach((b, k) => b.classList.toggle('hot', k === i))
export const markAnswer = (i: number, good: boolean) => {
  const el = $('answers')
  el.classList.add('picked')
  el.querySelectorAll('.ans')[i]?.classList.add(good ? 'good' : 'bad')
}
export const hideAnswers = () => $('answers').classList.add('off')

// The "Leave the maze?" prompt. The round keeps running underneath (nothing pauses), so "stay" just hides it.
export const closeLeave = () => ($('leave').hidden = true)
const openLeave = () => {
  // Young players get only the ✔ and ✖ under the title.
  $('leave-sub').hidden = cozyNow()
  $('leave').hidden = false
}

let toastTimer: number | undefined
export const toast = (msg: string, kind: 'good' | 'bad' | '' = '') => {
  const el = $('toast')
  el.textContent = cozyNow() ? wordlessToast(msg, kind) : msg
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

// Keys that pick a door in the maze. While the leave prompt is up, they must not pick one behind it.
const DOOR_KEYS = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'a', 'w', 'd']

export const initUI = (h: Handlers) => {
  handlers = h
  setCheese()
  // Capture phase on the window runs before the maze's own key handler, so this stops door keys only.
  addEventListener(
    'keydown',
    (ev) => {
      if (!$('leave').hidden && DOOR_KEYS.includes(ev.key)) ev.stopImmediatePropagation()
    },
    true,
  )
  document.addEventListener('click', (ev) => {
    unlockAudio()
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (!t) return
    const { act, id, kind } = t.dataset
    if (act === 'play') handlers.play()
    else if (act === 'menu' || act === 'home') handlers.menu()
    else if (act === 'leave') openLeave()
    else if (act === 'leave-no') closeLeave()
    else if (act === 'leave-yes') {
      closeLeave()
      handlers.menu()
    } else if (act === 'realm') {
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
