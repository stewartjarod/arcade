/**
 * Players for the whole arcade, saved in the browser (localStorage).
 * Every game on the site shares the same list and the same "who's playing".
 *
 *   currentPlayer()              → { name: 'Mia', avatar: '🦊', ... }
 *   playerKey('coin-hunt', 'best') → a localStorage key just for this player
 *
 * Until someone makes a player, everyone plays as "Guest". The first player
 * created inherits the guest's progress, so nothing is lost.
 */

export interface Player {
  id: string
  name: string
  avatar: string
  color: string
  created: string
  /** School grade (0 = kindergarten). Sets where each subject starts. */
  grade?: number
  /** A subject id a grown-up wants practiced more (e.g. "math"). */
  focus?: string
}

export const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🐸', '🦄', '🐙', '🦖', '🐧', '🐯', '🐰', '🐻', '🐵', '🦉', '🐲', '🤖', '👽', '🧙', '🦸', '🧜'] as const
export const PLAYER_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'] as const

export const GUEST: Player = { id: 'guest', name: 'Guest', avatar: '🙂', color: '#868e96', created: '' }

const PLAYERS = 'arcade:players'
const CURRENT = 'arcade:current-player'
const prefix = (id: string) => `arcade:p:${id}:`

// localStorage can throw (private mode, blocked storage), so every access is guarded.
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: things just won't be remembered */
  }
}
function keysStartingWith(p: string): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(p))
  } catch {
    return []
  }
}

export function listPlayers(): Player[] {
  const list = read<Player[]>(PLAYERS, [])
  return Array.isArray(list) ? list : []
}

export function currentPlayer(): Player {
  const id = read<string | null>(CURRENT, null)
  return listPlayers().find((p) => p.id === id) ?? listPlayers()[0] ?? GUEST
}

export function selectPlayer(id: string) {
  write(CURRENT, id)
}

export function createPlayer(info: Pick<Player, 'name' | 'avatar' | 'color'> & Partial<Pick<Player, 'grade' | 'focus'>>): Player {
  const players = listPlayers()
  const player: Player = {
    id: Math.random().toString(36).slice(2, 10),
    name: info.name.trim().slice(0, 20) || 'Player',
    avatar: info.avatar,
    color: info.color,
    created: new Date().toISOString(),
    grade: info.grade,
    focus: info.focus,
  }
  if (players.length === 0) moveSaves(GUEST.id, player.id)
  write(PLAYERS, [...players, player])
  selectPlayer(player.id)
  return player
}

export function updatePlayer(id: string, changes: Partial<Pick<Player, 'name' | 'avatar' | 'color' | 'grade' | 'focus'>>) {
  if (changes.name !== undefined) changes.name = changes.name.trim().slice(0, 20) || 'Player'
  write(PLAYERS, listPlayers().map((p) => (p.id === id ? { ...p, ...changes } : p)))
}

/** Remove a player and all of their saved game progress. */
export function deletePlayer(id: string) {
  for (const k of keysStartingWith(prefix(id))) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  const rest = listPlayers().filter((p) => p.id !== id)
  write(PLAYERS, rest)
  if (read(CURRENT, null) === id && rest[0]) selectPlayer(rest[0].id)
}

/** The localStorage key for one piece of one game's save data, for the current player. */
/** Look up one player (or undefined). */
export function getPlayer(id: string): Player | undefined {
  return id === GUEST.id ? GUEST : listPlayers().find((p) => p.id === id)
}

export const GRADES = ['K', '1st', '2nd', '3rd', '4th', '5th'] as const

export function playerKey(game: string, key: string, playerId = currentPlayer().id) {
  return `${prefix(playerId)}${game}:${key}`
}

/** Read a value a game saved for a player (used by the homepage to show high scores). */
export function readSave<T>(game: string, key: string, fallback: T, playerId?: string): T {
  return read(playerKey(game, key, playerId), fallback)
}

function moveSaves(from: string, to: string) {
  for (const k of keysStartingWith(prefix(from))) {
    try {
      localStorage.setItem(prefix(to) + k.slice(prefix(from).length), localStorage.getItem(k)!)
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
}

/** Run a callback when players change in another tab (e.g. picked on the homepage). */
export function onPlayersChanged(fn: () => void) {
  window.addEventListener('storage', (e) => {
    if (e.key === PLAYERS || e.key === CURRENT) fn()
  })
}
