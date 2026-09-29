import * as THREE from 'three'
import { readSave } from '@arcade/players'
import { mountPlayers } from './players'

// ------------------------------------------------------------------
//  The landing page. It finds every games/<slug>/game.json by itself,
//  so a new game shows up here as soon as it exists.
// ------------------------------------------------------------------

interface GameInfo {
  title: string
  description?: string
  emoji?: string
  color?: string
  authors?: string[]
  created?: string
}

const infos = import.meta.glob<GameInfo>('../games/*/game.json', { eager: true, import: 'default' })
// Optional screenshot: drop a thumbnail.png (or .jpg/.webp) next to game.json.
const thumbs = import.meta.glob<string>('../games/*/thumbnail.{png,jpg,jpeg,webp}', {
  eager: true, query: '?url', import: 'default',
})

const slugOf = (path: string) => path.split('/')[2]

const games = Object.entries(infos)
  .map(([path, info]) => ({ slug: slugOf(path), ...info }))
  // "_" games are drafts: visible while developing, hidden on the real site.
  .filter((g) => import.meta.env.DEV ? g.slug !== '_template' : !g.slug.startsWith('_'))
  .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))

const DAY = 24 * 60 * 60 * 1000
const isNew = (created?: string) => !!created && Date.now() - new Date(created).getTime() < 14 * DAY

const list = document.getElementById('games')!

function renderCards() {
  list.replaceChildren()
  for (const g of games) {
    const card = document.createElement('a')
    card.className = 'card'
    card.href = `./games/${g.slug}/`
    card.style.setProperty('--c', g.color ?? '#6c5ce7')

    const thumb = document.createElement('div')
    thumb.className = 'thumb'
    const shot = Object.entries(thumbs).find(([p]) => slugOf(p) === g.slug)?.[1]
    if (shot) thumb.style.backgroundImage = `url(${shot})`
    else thumb.innerHTML = `<span></span>`, (thumb.firstElementChild!.textContent = g.emoji ?? '🎮')

    const info = document.createElement('div')
    info.className = 'info'
    const h2 = document.createElement('h2')
    h2.textContent = g.title
    info.append(h2)
    if (g.description) {
      const p = document.createElement('p')
      p.textContent = g.description
      info.append(p)
    }
    if (g.authors?.length) {
      const by = document.createElement('p')
      by.className = 'by'
      by.textContent = `by ${g.authors.join(' & ')}`
      info.append(by)
    }

    // High score for whoever's playing, if the game saves one with storage().set('best', ...)
    const best = readSave<number>(g.slug, 'best', 0)
    if (best > 0) {
      const b = document.createElement('p')
      b.className = 'best'
      b.textContent = `🏆 Best: ${best}`
      info.append(b)
    }

    card.append(thumb, info)
    if (g.slug.startsWith('_')) card.append(badge('draft', 'new draft'))
    else if (isNew(g.created)) card.append(badge('NEW!', 'new'))
    list.append(card)
  }

  if (!games.length) {
    list.innerHTML = `<p class="empty">No games yet! Make one with <code>pnpm new my-game</code></p>`
  }
}

renderCards()
mountPlayers(document.getElementById('who')!, renderCards)

function badge(text: string, className: string) {
  const b = document.createElement('span')
  b.className = className
  b.textContent = text
  return b
}

// --- A little 3D background: floating shapes, because why not ---
const canvas = document.getElementById('bg') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
camera.position.z = 20
scene.add(new THREE.HemisphereLight('#ffffff', '#443366', 2.5))

const geos = [new THREE.IcosahedronGeometry(1), new THREE.TorusGeometry(0.8, 0.3, 12, 24), new THREE.BoxGeometry(1.3, 1.3, 1.3), new THREE.OctahedronGeometry(1)]
const colors = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac']
const shapes = Array.from({ length: 18 }, (_, i) => {
  const m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshStandardMaterial({ color: colors[i % colors.length], flatShading: true }))
  m.position.set((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 22, -Math.random() * 12)
  m.userData.spin = new THREE.Vector3(Math.random(), Math.random(), 0).multiplyScalar(0.8)
  m.userData.speed = 0.3 + Math.random() * 0.5
  scene.add(m)
  return m
})

function resize() {
  renderer.setSize(innerWidth, innerHeight, false)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const timer = new THREE.Timer()
timer.connect(document)
renderer.setAnimationLoop((t) => {
  timer.update(t)
  const dt = reduceMotion ? 0 : timer.getDelta()
  for (const s of shapes) {
    s.rotation.x += s.userData.spin.x * dt
    s.rotation.y += s.userData.spin.y * dt
    s.position.y += s.userData.speed * dt
    if (s.position.y > 13) s.position.y = -13
  }
  renderer.render(scene, camera)
})
