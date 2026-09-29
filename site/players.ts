import {
  AVATARS, PLAYER_COLORS, createPlayer, currentPlayer, deletePlayer, listPlayers,
  onPlayersChanged, selectPlayer, updatePlayer, type Player,
} from '@arcade/players'
import { peekMathSkills, skillSummary } from '@arcade/learning'

// ------------------------------------------------------------------
//  "Who's playing?" — pick, make, edit and delete players.
//  Everything is saved in this browser (localStorage).
// ------------------------------------------------------------------

export function mountPlayers(root: HTMLElement, onChange: () => void) {
  const render = () => {
    root.replaceChildren(...playerRow(rerender), skillLine())
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

/** "🦊 Mia's math: Adding up to 20 · Times tables: 2, 10" — shared by every game. */
function skillLine() {
  const line = el('p', 'skills-line')
  const player = currentPlayer()
  const skills = peekMathSkills(player.id)
  if (!skills) return line
  const levels = skillSummary(skills).filter((s) => s.unlocked).map((s) => s.label)
  line.textContent = `🧠 ${player.name}'s math: ${levels.join(' · ')}`
  return line
}

// --- The make/edit dialog ---

function openEditor(player: Player | null, changed: () => void) {
  const dialog = document.createElement('dialog')
  dialog.className = 'editor'
  let avatar = player?.avatar ?? pickUnused(AVATARS, listPlayers().map((p) => p.avatar))
  let color = player?.color ?? pickUnused(PLAYER_COLORS, listPlayers().map((p) => p.color))

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
    if (player) updatePlayer(player.id, { name: name.value, avatar, color })
    else createPlayer({ name: name.value, avatar, color })
    changed()
  })

  form.append(
    el('h2', '', player ? `Change ${player.name}` : 'New player'),
    preview, name, el('h3', '', 'Pick a buddy'), avatars, el('h3', '', 'Pick a color'), colors, buttons,
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
