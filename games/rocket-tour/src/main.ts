import {
  Game, THREE, answerSign, burst, confetti, currentPlayer, ease, isMuted, music, setMuted, sfx, storage, rand,
  type AnswerSign, type Entity,
} from '@arcade/engine'
import { planetModel, rocketModel, starPickup, sunModel, PLANET_COLOR, PLANET_SIZE, type PlanetName } from '@arcade/assets'
import { PLANETS, PLANET_CARDS, PLANET_MNEMONIC, speak, startPractice, type Moment, type Question } from '@arcade/learning'

// ------------------------------------------------------------------
//  🚀 Rocket Tour
//  Fly from the Sun out to Neptune, visiting every planet in order.
//  Before each planet, answer a space question by steering into the
//  right answer bubble. Questions come from the Space subject, at
//  your level, and count toward your profile in every game.
// ------------------------------------------------------------------

const game = new Game({ background: '#05030f', lights: false, shadows: false })
const save = storage('rocket-tour')

const ROCKET_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac']
const LANE_COLORS = ['#e4572e', '#17a398', '#9775fa']
const LANES = [-6, 0, 6]
const GAP = 150 // distance between planets
// Warp speed! Add ?warp=2 to the address to fly faster.
const WARP = Math.max(1, Math.min(5, Number(new URLSearchParams(location.search).get('warp')) || 1))
const planetZ = (k: number) => -(k + 1) * GAP
// Planets sit beside the flight path (alternating sides), so the rocket can fly past.
const planetX = (k: number) => (k % 2 === 0 ? -1 : 1) * (9 + PLANET_SIZE[PLANETS[k] as PlanetName] * 1.4)

setMuted(save.get('muted', false))
let readAloud = save.get('readAloud', true)
/** Read something out loud (the "Read to me" switch turns this off). */
const say = (text: string) => readAloud && speak(text)

music.play({ chords: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], note: 0.55, wave: 'sine', sparkle: true })

// ------------------------------------------------------------------
//  Little helpers
// ------------------------------------------------------------------

/** Make an on-screen element inside the HUD (cleared automatically when the scene changes). */
function ui(className: string, html = '') {
  const el = document.createElement('div')
  el.className = `ui ${className}`
  el.innerHTML = html
  game.hud.root.append(el)
  return el
}

let toastTimer = 0
function toast(text: string, kind: 'good' | 'bad' | '' = '', seconds = 1.6) {
  game.hud.root.querySelectorAll('.toast').forEach((t) => t.remove())
  const t = ui(`toast ${kind}`)
  t.textContent = text
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => t.remove(), seconds * 1000)
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
const cardFor = (name: string) => PLANET_CARDS.find((c) => c.name === name)!
const colorFor = (name: string) => PLANET_COLOR[name as PlanetName] ?? '#ffd43b'
const isPlanet = (s: string) => (PLANETS as readonly string[]).includes(s)

/** Stars far away in every direction. They follow the camera, so space never runs out. */
function addSpace(game: Game) {
  game.scene.add(new THREE.AmbientLight('#8c8cff', 0.5))
  const sunlight = new THREE.DirectionalLight('#fff4e0', 2.4)
  sunlight.position.set(0.4, 0.6, 1) // from behind the camera, like the Sun is behind us
  game.scene.add(sunlight)

  const n = 1600
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(300 + Math.random() * 200)
    pos.set([v.x, v.y, v.z], i * 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false }))
  game.scene.add(stars)
  game.onUpdate(() => stars.position.copy(game.camera.position))
}

/** Spin a planet's globe (not its rings or tilt), and send Earth's Moon around. */
const spinGlobe = (speed = 0.25) => (e: Entity, dt: number) => {
  e.object.userData.globe.rotation.y += speed * dt
  if (e.object.userData.moonOrbit) e.object.userData.moonOrbit.rotation.y += dt * 0.5
}

/** The planet card: name, number from the Sun, and facts you can hear. */
function planetCard(name: string, button?: { label: string; onClick: () => void }) {
  const c = cardFor(name)
  const el = ui('planet-card')
  el.style.setProperty('--pc', colorFor(name))
  el.innerHTML = `
    <div class="num">${c.order === 0 ? 'The center of our solar system' : `Planet #${c.order} from the Sun`}</div>
    <h2>${esc(c.name)}</h2>
    <div class="nick">${esc(c.nickname)} <span class="kind">${esc(c.kind)}</span></div>
    <ul>${c.facts.map((f, i) => `<li><button data-fact="${i}" aria-label="Hear it">🔊</button><span>${esc(f)}</span></li>`).join('')}</ul>
    ${button ? `<div class="row"><button class="btn go">${esc(button.label)}</button></div>` : ''}`
  el.querySelectorAll<HTMLButtonElement>('[data-fact]').forEach((b) => (b.onclick = () => speak(c.facts[Number(b.dataset.fact)]!)))
  if (button) el.querySelector<HTMLButtonElement>('.btn.go')!.onclick = button.onClick
  return el
}

/** The row of planets used by the title screen and Explore: Sun on the left, Neptune on the right. */
function solarSystemRow(game: Game) {
  const names = ['Sun', ...PLANETS]
  const xs: number[] = []
  let x = 0
  for (const name of names) {
    const r = name === 'Sun' ? 5 : PLANET_SIZE[name as PlanetName]
    xs.push(x + (name === 'Sun' ? 0 : r))
    x += (name === 'Sun' ? 5 : r * 2) + 6
  }
  names.forEach((name, i) => {
    const model = name === 'Sun' ? sunModel() : planetModel(name as PlanetName)
    game.add(model).at(xs[i]!, 0, 0).with(spinGlobe(name === 'Sun' ? 0.05 : 0.3))
  })
  return { names, xs }
}

// ------------------------------------------------------------------
//  Title screen
// ------------------------------------------------------------------

function title(game: Game) {
  addSpace(game)
  const { xs } = solarSystemRow(game)
  const middle = xs[4]!
  let t = 0
  game.onUpdate((dt) => {
    t += dt * 0.08
    game.camera.position.set(middle + Math.sin(t) * 30, 14, 60 + Math.cos(t) * 10)
    game.camera.lookAt(middle, 0, 0)
  })

  const player = currentPlayer()
  const visited: string[] = save.get('visited', [])
  const color = save.get('rocketColor', ROCKET_COLORS[0]!)
  const screen = ui('screen')
  screen.innerHTML = `<div class="card">
    <h1>🚀 Rocket Tour</h1>
    <div class="sub">${esc(player.avatar)} ${esc(player.name)} · Planets visited: ${visited.length} / 8 · Tours: ${save.get('tours', 0)}</div>
    <div>Pick your rocket's color</div>
    <div class="swatches">${ROCKET_COLORS.map((c) => `<button class="swatch${c === color ? ' on' : ''}" style="background:${c}" data-color="${c}" aria-label="Rocket color"></button>`).join('')}</div>
    <div class="row"><button class="btn go" data-act="tour">🚀 Start the tour</button></div>
    <div class="row">
      <button class="btn" data-act="explore">🔭 Explore the planets</button>
      <button class="btn" data-act="read">${readAloud ? '🗣 Read to me: on' : '🗣 Read to me: off'}</button>
      <button class="btn" data-act="mute">${isMuted() ? '🔇 Sound off' : '🔊 Sound on'}</button>
    </div></div>`
  screen.onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
    if (!b) return
    sfx.pop()
    if (b.dataset.color) {
      save.set('rocketColor', b.dataset.color)
      screen.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('on', s === b))
    }
    const act = b.dataset.act
    if (act === 'tour') game.setScene(tour)
    if (act === 'explore') game.setScene(explore)
    if (act === 'read') {
      readAloud = !readAloud
      save.set('readAloud', readAloud)
      b.textContent = readAloud ? '🗣 Read to me: on' : '🗣 Read to me: off'
      say('I will read to you!')
    }
    if (act === 'mute') {
      setMuted(!isMuted())
      save.set('muted', isMuted())
      b.textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on'
    }
  }
}

// ------------------------------------------------------------------
//  Explore: visit any planet, no questions
// ------------------------------------------------------------------

function explore(game: Game) {
  addSpace(game)
  const { names, xs } = solarSystemRow(game)
  let focus = 0
  let card: HTMLElement | undefined

  const nav = ui('explore-nav')
  nav.innerHTML =
    names.map((n, i) => `<button data-i="${i}" style="--c:${n === 'Sun' ? '#ffb52e' : colorFor(n)}">${n}</button>`).join('') +
    `<button data-act="back" style="--c:#fff">⬅ Back</button>`
  nav.onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
    if (!b) return
    if (b.dataset.act === 'back') return game.setScene(title)
    show(Number(b.dataset.i))
  }

  function show(i: number) {
    focus = Math.max(0, Math.min(names.length - 1, i))
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.i === String(focus)))
    card?.remove()
    card = planetCard(names[focus]!)
    sfx.pop()
    const c = cardFor(names[focus]!)
    say(`${c.name}. ${c.facts[0]}`)
  }
  show(0)

  const want = new THREE.Vector3()
  const look = new THREE.Vector3()
  game.onUpdate((dt) => {
    if (game.input.pressed('right')) show(focus + 1)
    if (game.input.pressed('left')) show(focus - 1)
    const r = focus === 0 ? 5 : PLANET_SIZE[names[focus] as PlanetName]
    // Stand back far enough to see the whole planet (and Saturn's rings), a little to one side.
    want.set(xs[focus]! - r * 0.8, r * 0.8, r * 3.6 + 4)
    look.set(xs[focus]! - r * 0.6, 0, 0)
    game.camera.position.lerp(want, 1 - Math.exp(-3 * dt))
    game.camera.lookAt(look)
  })
  game.camera.position.set(-20, 10, 40)
}

// ------------------------------------------------------------------
//  The tour
// ------------------------------------------------------------------

type Phase = 'intro' | 'cruise' | 'gate' | 'bounce' | 'land' | 'card' | 'done'

function tour(game: Game) {
  addSpace(game)
  const practice = startPractice({ subjects: ['space'], formats: ['choice'] })

  // The Sun behind the start, and every planet along the way.
  game.add(sunModel()).at(0, 0, 45).with(spinGlobe(0.05))
  PLANETS.forEach((name, k) => game.add(planetModel(name as PlanetName)).at(planetX(k), 0, planetZ(k)).with(spinGlobe()))

  const rocket = game.add(rocketModel({ color: save.get('rocketColor', ROCKET_COLORS[0]!) }))
  rocket.position.set(0, 0, 20)
  const flame = rocket.object.userData.flame as THREE.Mesh

  let k = 0 // which planet we're flying to
  let phase: Phase = 'intro'
  let lane = 1
  let speed = 0
  let stardust = 0
  let streak = 0
  let introTime = 0
  let blasting = false // an answer was chosen: zoom through the gate

  // --- HUD ---
  const dust = ui('stardust', '✨ 0')
  const trail = ui('trail', PLANETS.map((n) => `<span style="--c:${colorFor(n)}" title="${n}"></span>`).join(''))
  const updateTrail = () =>
    trail.querySelectorAll('span').forEach((s, i) => {
      s.classList.toggle('on', i < k || (i === k && phase === 'card'))
      s.classList.toggle('next', i === k && phase !== 'card' && phase !== 'done')
    })
  updateTrail()
  const steerHint = ui('steer', '⬅ ➡ steer · or tap the sides of the screen')

  // --- Things to collect and dodge along the way ---
  const pickups: Entity[] = []
  function fillLeg(from: number, to: number) {
    for (let z = from; z > to; z -= 14) {
      const x = LANES[rand(0, 2)]!
      if (Math.random() < 0.7) {
        const s = game.add(starPickup({ color: '#ffe066' })).at(x, 0, z)
        s.object.scale.setScalar(0.8)
        s.tag('stardust')
        pickups.push(s)
      } else {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), new THREE.MeshStandardMaterial({ color: '#8a7f76', flatShading: true }))
        const a = game.add(rock).at(x, 0, z).tag('asteroid')
        a.with((e, dt) => ((e.rotation.x += dt), (e.rotation.y += dt * 0.7)))
        pickups.push(a)
      }
    }
  }
  const gateZ = (i: number) => planetZ(i) + 55
  fillLeg(0, gateZ(0) + 40)

  // --- The question gate ---
  let q: Question | undefined
  let moment: Moment | undefined
  let options: string[] = []
  let open = new Set<number>()
  let bubbles: { entity: Entity; sign: AnswerSign }[] = []
  let banner: HTMLElement | undefined
  let laneButtons: HTMLElement | undefined

  function openGate() {
    phase = 'gate'
    steerHint.remove()
    moment = practice.moment()
    q = moment.ask()
    options = q.options(3)
    open = new Set([0, 1, 2])
    bubbles = options.map((opt, i) => makeBubble(opt, i))
    banner = ui('question')
    banner.innerHTML = `<span class="q">${esc(q.text)}</span><button class="say" aria-label="Hear it">🔊</button>
      <div class="hint">Tap an answer to blast off! (or steer ⬅ ➡ and press ⬆)</div>`
    banner.querySelector<HTMLButtonElement>('.say')!.onclick = () => speak(questionSpeech())
    laneButtons = ui('lanes')
    laneButtons.innerHTML = options.map((o, i) => `<button data-i="${i}" style="--c:${LANE_COLORS[i]}">${esc(o)}</button>`).join('')
    laneButtons.onclick = (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) return
      steerTo(Number(b.dataset.i))
      blast()
    }
    updateLaneButtons()
    say(questionSpeech())
    q.restartTimer()
  }

  // Read the question and the choices, for kids still learning to read.
  // Each choice is its own short sentence, so every one can use a recorded clip (see lines.ts).
  const questionSpeech = () => {
    const choices = options.filter((_, i) => open.has(i)).map((o, i) => `${i === 0 ? 'Is it' : 'Or'} ${o}?`)
    return `${q!.prompt.say ?? q!.text} ${choices.join(' ')}`
  }

  function makeBubble(option: string, i: number) {
    const group = new THREE.Group()
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(2.3, 32, 20),
      new THREE.MeshStandardMaterial({ color: LANE_COLORS[i], transparent: true, opacity: 0.35, emissive: LANE_COLORS[i], emissiveIntensity: 0.4 }),
    )
    group.add(ball)
    if (isPlanet(option)) {
      const mini = planetModel(option as PlanetName)
      mini.scale.setScalar(1.4 / PLANET_SIZE[option as PlanetName] / (option === 'Saturn' ? 1.8 : 1))
      group.add(mini)
    }
    const sign = answerSign(LANE_COLORS[i]!)
    sign.draw(option)
    group.add(sign.mesh)
    const entity = game.add(group).at(LANES[i]!, 0, gateZ(k)).tag('bubble')
    entity.with((e) => {
      // Signs always face you, and grow with distance so they're readable from far away.
      sign.mesh.quaternion.copy(game.camera.quaternion)
      const size = Math.min(2.2, Math.max(1.3, game.camera.position.distanceTo(e.position) * 0.05)) // capped so neighbors never overlap
      sign.mesh.scale.setScalar(size)
      sign.mesh.position.y = 2.6 + size * 0.8
    })
    entity.with((e) => (e.position.y = Math.sin(game.time * 2 + i) * 0.3)) // bob gently
    return { entity, sign }
  }

  function updateLaneButtons() {
    laneButtons?.querySelectorAll('button').forEach((b, i) => {
      b.classList.toggle('here', i === lane)
      b.classList.toggle('out', !open.has(i))
    })
  }

  function steerTo(i: number) {
    const next = Math.max(0, Math.min(2, i))
    if (next === lane) return
    lane = next
    sfx.pop()
    steerHint.remove()
    updateLaneButtons()
    if (phase === 'gate' && open.has(lane)) say(`${options[lane]!}.`)
  }

  /** They've picked their answer: full speed ahead through the bubble. */
  function blast() {
    if (phase !== 'gate' || blasting || !open.has(lane)) return
    blasting = true
    sfx.whoosh(false)
  }

  function passGate() {
    blasting = false
    if (!open.has(lane)) return bounceBack() // flew through a popped bubble: come around again
    const picked = options[lane]!
    const right = moment!.check(q!, picked, { choices: open.size })
    const b = bubbles[lane]!
    if (right) {
      b.sign.draw(picked, 'good')
      sfx.good(streak++)
      burst(game, b.entity.position, { color: ['#ffe066', LANE_COLORS[lane]!, '#ffffff'], count: 30 })
      toast(`Yes! ${picked} ✓`, 'good')
      say(`Yes! ${picked}!`)
      for (const x of bubbles) game.tweens.to(x.entity.scale, { x: 0, y: 0, z: 0 }, 0.4).then(() => x.entity.destroy())
      banner?.remove()
      laneButtons?.remove()
      phase = 'land'
    } else {
      streak = 0
      sfx.bad()
      b.sign.draw(picked, 'bad')
      burst(game, b.entity.position, { color: ['#ef4444', '#ffffff'], count: 16 })
      b.entity.destroy()
      open.delete(lane)
      updateLaneButtons()
      toast(isPlanet(picked) ? `That's ${picked}! Try again` : 'Not that one — try again!', 'bad')
      say(isPlanet(picked) ? `That's ${picked}. Try again!` : 'Not that one. Try again!')
      bounceBack()
    }
  }

  function bounceBack() {
    phase = 'bounce'
    blasting = false
    speed = 0
    game.tweens.to(rocket.position, { z: gateZ(k) + 40 }, 1, ease.out).then(() => {
      if (phase === 'bounce') phase = 'gate'
    })
  }

  // --- Visiting a planet ---
  let card: HTMLElement | undefined
  function arrive() {
    phase = 'card'
    const name = PLANETS[k]!
    const visited = new Set<string>(save.get('visited', []))
    const firstTime = !visited.has(name)
    visited.add(name)
    save.set('visited', [...visited])
    updateTrail()
    sfx.chest()
    const c = cardFor(name)
    card = planetCard(name, {
      label: k < PLANETS.length - 1 ? `🚀 Blast off to ${PLANETS[k + 1]}` : '🎉 Finish the tour',
      onClick: leave,
    })
    say(`${firstTime ? 'You found' : 'Welcome back to'} ${name}! ${c.facts[0]}`)
  }

  function leave() {
    sfx.whoosh(false)
    card?.remove()
    k++
    if (k >= PLANETS.length) return finish()
    fillLeg(planetZ(k - 1) - 20, gateZ(k) + 40)
    phase = 'cruise'
    updateTrail()
    announce()
  }

  function announce() {
    const name = PLANETS[k]!
    toast(`Next stop: ${name} (planet #${k + 1})`, '', 2.4)
    say(`Next stop: ${name}, planet number ${k + 1} from the Sun.`)
  }

  function finish() {
    phase = 'done'
    const tours = save.get('tours', 0) + 1
    save.set('tours', tours)
    const best = save.highScore(stardust)
    confetti(['🪐', '⭐', '🚀', '✨', '🌍'])
    sfx.win()
    const grew = practice.grew()
    const screen = ui('screen')
    screen.innerHTML = `<div class="card">
      <h2>You toured the whole solar system! 🎉</h2>
      <div class="sub">✨ ${stardust} stardust${best ? ' — a new record!' : ''} · Tours finished: ${tours}</div>
      <div class="order">${PLANETS.map((n, i) => `<span style="--c:${colorFor(n)}">${i + 1}. ${n}</span>`).join('')}</div>
      <div class="mnemonic">Remember the order: “${PLANET_MNEMONIC}”</div>
      ${grew.length ? `<div class="sub">📈 Now learning: ${grew.map(esc).join(' · ')}</div>` : ''}
      <div class="row"><button class="btn go" data-act="again">🚀 Tour again</button><button class="btn" data-act="explore">🔭 Explore</button><button class="btn" data-act="menu">Menu</button></div>
    </div>`
    screen.onclick = (ev) => {
      const act = (ev.target as HTMLElement).closest<HTMLElement>('button')?.dataset.act
      if (act === 'again') game.setScene(tour)
      if (act === 'explore') game.setScene(explore)
      if (act === 'menu') game.setScene(title)
    }
    say(`You toured the whole solar system! Remember: ${PLANET_MNEMONIC}.`)
  }

  // --- Every frame ---
  const camWant = new THREE.Vector3()
  const camLook = new THREE.Vector3()
  game.onUpdate((dt) => {
    const input = game.input

    // Steering: arrow keys / WASD, or tap the left or right side of the screen.
    if (phase === 'cruise' || phase === 'gate' || phase === 'bounce') {
      if (input.pressed('left')) steerTo(lane - 1)
      if (input.pressed('right')) steerTo(lane + 1)
      if (input.clicked) steerTo(lane + (input.pointer.x < 0 ? -1 : 1)) // taps on the game itself (not buttons)
      if (input.pressed('up') || input.pressed('jump') || input.pressed('action')) blast()
    }
    if (phase === 'card' && (input.pressed('action') || input.pressed('jump'))) leave()

    // Flying forward: cruise, slow down near a question so there's time to read it,
    // and blast through once an answer is picked.
    if (phase === 'cruise' || phase === 'gate') {
      const nearGate = phase === 'gate' && rocket.position.z - gateZ(k) < 70
      const target = blasting ? 45 : nearGate ? 5 : 14
      speed += (target * WARP - speed) * (1 - Math.exp(-(blasting ? 4 : 2) * dt))
      rocket.position.z -= speed * dt
      if (phase === 'cruise' && rocket.position.z < gateZ(k) + 95) openGate()
      if (phase === 'gate' && rocket.position.z <= gateZ(k)) passGate()
    }
    if (phase === 'land') {
      // After the right answer, zoom to the planet and ease off as we arrive.
      const stopZ = planetZ(k) + 2
      const left = rocket.position.z - stopZ
      const target = Math.min(45, Math.max(4, left * 2.2)) * WARP
      speed += (target - speed) * (1 - Math.exp(-4 * dt))
      rocket.position.z = Math.max(stopZ, rocket.position.z - speed * dt)
      lane = 1
      if (rocket.position.z <= stopZ + 0.05) arrive()
    }

    // Slide between lanes, leaning into the turn.
    const targetX = phase === 'land' || phase === 'card' ? 0 : LANES[lane]!
    const dx = targetX - rocket.position.x
    rocket.position.x += dx * (1 - Math.exp(-8 * dt))
    rocket.rotation.z = -dx * 0.12
    flame.scale.y = 0.8 + Math.random() * 0.5 + speed * 0.03

    // Stardust and asteroids in our lane.
    for (const p of pickups) {
      if (!p.alive || Math.abs(p.position.z - rocket.position.z) > 1.4 || Math.abs(p.position.x - rocket.position.x) > 1.8) continue
      if (p.is('stardust')) {
        stardust++
        dust.textContent = `✨ ${stardust}`
        sfx.good(0)
        burst(game, p.position, { color: '#ffe066', count: 8, speed: 4 })
      } else {
        stardust = Math.max(0, stardust - 3)
        dust.textContent = `✨ ${stardust}`
        sfx.bonk()
        burst(game, p.position, { color: ['#8a7f76', '#c9bfb6'], count: 14 })
        game.tweens.to(rocket.rotation, { y: 0 }, 0.5, ease.elastic)
        rocket.rotation.y = 0.6
      }
      p.destroy()
    }

    // Camera
    if (phase === 'intro') {
      // Look back at the rocket with the Sun behind it, then swing around and blast off.
      introTime += dt
      camWant.set(rocket.position.x + 6, 2.5, rocket.position.z - 12)
      camLook.copy(rocket.position)
      if (introTime > 2.6) {
        phase = 'cruise'
        announce()
      }
    } else if (phase === 'card' || (phase === 'done' && k >= PLANETS.length)) {
      // Float near the planet we're visiting, keeping it on the left (the card is on the right).
      const i = Math.min(k, PLANETS.length - 1)
      const r = PLANET_SIZE[PLANETS[i] as PlanetName] * (PLANETS[i] === 'Saturn' ? 1.6 : 1)
      const px = planetX(i)
      const sway = Math.sin(game.time * 0.3) * 0.8
      camWant.set(px - r * 0.4 + sway, 1 + r * 0.5, planetZ(i) + r * 3.4 + 6)
      camLook.set(px + r * 1.3 + 2.5, 0, planetZ(i))
    } else {
      camWant.set(rocket.position.x * 0.5, 3.2, rocket.position.z + 9.5)
      camLook.set(rocket.position.x * 0.6, 0.6, rocket.position.z - 14)
    }
    // The camera keeps up better when we're going fast.
    game.camera.position.lerp(camWant, 1 - Math.exp(-(4 + speed * 0.12) * dt))
    const m = new THREE.Matrix4().lookAt(game.camera.position, camLook, game.camera.up)
    game.camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m), 1 - Math.exp(-6 * dt))
  })

  game.camera.position.set(8, 3, 6)
  game.camera.lookAt(rocket.position)
  say('Three, two, one, blast off!')
}

game.start(title)
