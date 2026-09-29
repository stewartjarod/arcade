import {
  AVATARS, GRADES, PLAYER_COLORS, createPlayer, currentPlayer, deletePlayer, listPlayers,
  onPlayersChanged, selectPlayer, updatePlayer, type Player,
} from '@arcade/players'
import { SUBJECTS, peekLearner, skillSummary, subjectSummary } from '@arcade/learning'

// ------------------------------------------------------------------
//  "Who's playing?" — pick, make, edit and delete players.
//  Everything is saved in this browser (localStorage).
// ------------------------------------------------------------------

export function mountPlayers(root: HTMLElement, onChange: () => void) {
  const render = () => {
    root.replaceChildren(...playerRow(rerender), learningCard())
  }
  const rerender = () => {
    render()
    onChange()
  }
  onPlayersChanged(rerender)
  // Coming back from a game with the Back button can show a saved copy of this page; refresh it.
  window.addEventListener('pageshow', (e) => e.persisted && rerender())
  render()
}

function playerRow(changed: () => void): HTMLElement[] {
  const players = listPlayers()
  const current = currentPlayer()

  const title = el('h2', 'players-title', players.length ? "Who's playing?" : 'Make a player to save your progress!')
  const row = el('div', 'players')

  for (const p of players) {
    const btn = el('button', 'player')
    btn.type = 'button'
    btn.style.setProperty('--pc', p.color)
    btn.append(el('span', 'avatar', p.avatar), el('span', 'name', p.name))
    if (p.id === current.id) {
      btn.classList.add('on')
      btn.setAttribute('aria-pressed', 'true')
      const edit = el('span', 'edit', '✏️')
      edit.title = `Change ${p.name}`
      edit.addEventListener('click', (e) => {
        e.stopPropagation()
        openEditor(p, changed)
      })
      btn.append(edit)
    }
    btn.addEventListener('click', () => {
      selectPlayer(p.id)
      changed()
    })
    row.append(btn)
  }

  const add = el('button', 'player add')
  add.type = 'button'
  add.append(el('span', 'avatar', '＋'), el('span', 'name', 'New player'))
  add.addEventListener('click', () => openEditor(null, changed))
  row.append(add)

  return [title, row]
}

/** What the current player is learning, in every subject (shared by every game). */
function learningCard() {
  const player = currentPlayer()
  const l = peekLearner(player.id)
  const card = el('section', 'learning')
  const grade = player.grade !== undefined ? ` · ${GRADES[player.grade]} grade` : ''
  card.append(el('h3', 'learning-title', `🧠 What ${player.name} is learning${grade}`))
  const grid = el('div', 'subjects')
  for (const s of subjectSummary(l)) {
    const tile = el('details', 'subject')
    if (player.focus === s.id) tile.classList.add('focus')
    const summary = el('summary')
    const bar = el('i')
    bar.append(el('b'))
    ;(bar.firstChild as HTMLElement).style.width = `${Math.round(Math.max(0.04, s.progress) * 100)}%`
    summary.append(
      el('span', 'subject-emoji', s.emoji),
      el('span', 'subject-name', s.name + (player.focus === s.id ? ' 📌' : '')),
      el('span', 'subject-now', s.started ? s.current : `Ready: ${s.current}`),
      bar,
    )
    if (s.review) summary.append(el('span', 'subject-review', `🔁 ${s.review} to practice again`))
    const skills = el('ul', 'subject-skills')
    for (const k of skillSummary(l, s.id)) {
      skills.append(el('li', k.unlocked ? (k.mastered ? 'done' : '') : 'locked', `${k.mastered ? '⭐' : k.unlocked ? '▸' : '🔒'} ${k.label}${k.unlocked ? '' : ' — coming soon'}`))
    }
    tile.append(summary, skills)
    grid.append(tile)
  }
  card.append(grid)
  return card
}

// --- The make/edit dialog ---

function openEditor(player: Player | null, changed: () => void) {
  const dialog = document.createElement('dialog')
  dialog.className = 'editor'
  let avatar = player?.avatar ?? pickUnused(AVATARS, listPlayers().map((p) => p.avatar))
  let color = player?.color ?? pickUnused(PLAYER_COLORS, listPlayers().map((p) => p.color))
  let grade = player?.grade
  let focus = player?.focus

  const form = document.createElement('form')
  form.method = 'dialog'

  const preview = el('div', 'preview')
  const name = document.createElement('input')
  name.value = player?.name ?? ''
  name.placeholder = 'Your name'
  name.maxLength = 20
  name.required = true
  name.autocomplete = 'off'
  const updatePreview = () => {
    preview.textContent = avatar
    preview.style.background = color
  }

  const avatars = el('div', 'choices')
  for (const a of AVATARS) {
    const b = choice(a, a === avatar, () => {
      avatar = a
      select(avatars, b)
      updatePreview()
    })
    avatars.append(b)
  }

  const colors = el('div', 'choices colors')
  for (const c of PLAYER_COLORS) {
    const b = choice('', c === color, () => {
      color = c
      select(colors, b)
      updatePreview()
    })
    b.style.background = c
    b.setAttribute('aria-label', c)
    colors.append(b)
  }

  // School grade sets where each subject starts (they still move up and down as they play).
  const grades = el('div', 'choices words')
  GRADES.forEach((g, i) => {
    const b = choice(g, i === grade, () => {
      grade = grade === i ? undefined : i
      grades.querySelectorAll('.on').forEach((n) => n.classList.remove('on'))
      if (grade !== undefined) b.classList.add('on')
    })
    grades.append(b)
  })

  // A grown-up can ask for more of one subject.
  const focuses = el('div', 'choices words')
  for (const [id, label] of [[undefined, 'Everything'], ...SUBJECTS.map((s) => [s.id, `${s.emoji} ${s.name}`])] as [string | undefined, string][]) {
    const b = choice(label, id === focus, () => {
      focus = id
      select(focuses, b)
    })
    focuses.append(b)
  }

  const buttons = el('div', 'editor-buttons')
  if (player) {
    const del = el('button', 'danger', 'Delete')
    del.type = 'button'
    del.addEventListener('click', () => {
      if (!confirm(`Delete ${player.name}? Their saved games will be gone for good.`)) return
      deletePlayer(player.id)
      dialog.close()
      changed()
    })
    buttons.append(del)
  }
  const cancel = el('button', 'plain', 'Cancel')
  cancel.type = 'button'
  cancel.addEventListener('click', () => dialog.close())
  const ok = el('button', 'go', player ? 'Save' : "Let's play!")
  ok.type = 'submit'
  buttons.append(cancel, ok)

  form.addEventListener('submit', () => {
    if (player) updatePlayer(player.id, { name: name.value, avatar, color, grade, focus })
    else createPlayer({ name: name.value, avatar, color, grade, focus })
    changed()
  })

  form.append(
    el('h2', '', player ? `Change ${player.name}` : 'New player'),
    preview, name, el('h3', '', 'Pick a buddy'), avatars, el('h3', '', 'Pick a color'), colors,
    el('h3', '', 'What grade are you in?'), grades, el('h3', '', 'Practice more of…'), focuses, buttons,
  )
  dialog.append(form)
  dialog.addEventListener('close', () => dialog.remove())
  document.body.append(dialog)
  updatePreview()
  dialog.showModal()
  name.focus()
}

function choice(text: string, on: boolean, onPick: () => void) {
  const b = el('button', on ? 'choice on' : 'choice', text)
  b.type = 'button'
  b.addEventListener('click', onPick)
  return b
}

function select(group: HTMLElement, chosen: HTMLElement) {
  group.querySelectorAll('.on').forEach((n) => n.classList.remove('on'))
  chosen.classList.add('on')
}

function pickUnused<T>(options: readonly T[], used: T[]): T {
  const free = options.filter((o) => !used.includes(o))
  const list = free.length ? free : options
  return list[Math.floor(Math.random() * list.length)]!
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}
