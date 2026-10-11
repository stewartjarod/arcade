import { Game, THREE, burst, clamp, confetti, ease, music, pick, rand, sfx, storage, tone, type Entity, type SceneFn } from '@arcade/engine'
import { canPick, learner, letterPad, peekLearner, practiceGrade, speak, startPractice, type PickOptions, type Practice } from '@arcade/learning'
import { COACH_LINES, LANDS } from './lands'
import { startChase } from './monster'
import { afterGate, landFor, mapDone, monsterWakes, newMap } from './quest'
import { coach, landsButton, mapCard, titleCard, toast, type Look } from './ui'
import { candyGate, chest, gumdrop, hero, landmark, pathPiece, scenery, taffy, wrappedCandy, xMark } from './world'

// ------------------------------------------------------------------
//  Candy Quest
//  Buddy runs along a candy path all by themselves. Drag a finger to move them, tap to jump
//  (or ⬅ ➡ and Space). The first time, Buddy waits and shows you how.
//  Gumdrops bounce you high (grab the candies up there!). Sticky taffy slows you down.
//  A candy gate blocks the path every so often: spell the word to open it and win
//  a piece of the treasure map. Finish the map, open the chest, and the next land opens.
//  Miss two words in a land and the Candy Monster chases you (see monster.ts).
// ------------------------------------------------------------------

const game = new Game({ background: LANDS[0]!.sky, lights: true })
game.renderer.domElement.style.touchAction = 'none' // sliding a finger steers Buddy; it must not scroll or zoom the page
const save = storage('candy-quest')
music.play({ chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], note: 0.35, wave: 'triangle', sparkle: true })

const LANE_X = [-2.4, 0, 2.4]
const STRETCH = 34 // distance from one gate to the next
const TRIES = 3 // tries to spell a word before we show it
const GRAVITY = 28
const JUMP = 10 // how hard a jump pushes up
const BOING = 14 // how hard a gumdrop pushes up
// The chase asks "which is spelled right?": quick to tap, still spelling.
const CHASE_QUESTIONS: PickOptions = { subjects: ['writing'], skills: ['writing.pick'], formats: ['choice'] }

/** How high a gumdrop bounce has taken Buddy after running `ahead` more steps at `speed`. */
const bounceHeight = (ahead: number, speed: number) => {
  const t = ahead / speed
  return Math.max(0, BOING * t - (GRAVITY / 2) * t * t)
}

let look: Look = { color: save.get('color', '#f783ac'), hat: save.get('hat', 'none') }
const finishedLands = () => save.get('finished', 0)

const EDGE = 2.6 // how far left or right Buddy can go on the path

// Test scripts can add ?warp=5 to run faster (dev only; slow headless browsers need it).
const WARP = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('warp') ?? 1) : 1

const wait = (seconds: number) => new Promise((r) => setTimeout(r, seconds * 1000))

// ---------------------------------------------------------------- title screen

function titleScreen(game: Game) {
  const land = LANDS[Math.min(finishedLands(), LANDS.length - 1)]!
  game.scene.background = new THREE.Color(land.sky)
  game.scene.fog = null
  game.add(pathPiece(30, land.path, land.scenery)).at(0, 0, -6)
  for (let i = 0; i < 10; i++) game.add(scenery(land.scenery, land.candy)).at(pick([-1, 1])! * rand(6, 11), 0, rand(-25, 2))

  // Buddy spins on the spot so you can see the new look
  let buddy: Entity | undefined
  const showBuddy = () => {
    buddy?.destroy()
    buddy = game.add(hero(look.color, look.hat)).at(-2.6, 0, 1.5) // left of the card
    buddy.object.scale.setScalar(1.3)
  }
  showBuddy()
  game.onUpdate((dt) => buddy && (buddy.object.rotation.y += dt * 1.2))
  game.camera.position.set(0, 2.6, 8.5)
  game.camera.lookAt(0, 1.6, 0)

  const card = titleCard({
    finished: finishedLands(),
    look,
    onLook: (l) => {
      look = l
      save.set('color', l.color)
      save.set('hat', l.hat)
      sfx.pop()
      showBuddy()
    },
    onPlay: (i) => game.setScene(runLand(i)),
  })
  return () => card.remove()
}

// ---------------------------------------------------------------- one land

function runLand(index: number): SceneFn {
  return (game) => {
    const land = LANDS[index]!
    const rules = landFor(practiceGrade(peekLearner(), 'writing').grade)
    const practice = startPractice({ subjects: ['writing'], formats: ['letters'] }) // one practice per land
    const map = newMap(rules.pieces)
    const card = mapCard(land, rules.pieces)
    const back = landsButton(() => game.setScene(titleScreen))

    game.scene.background = new THREE.Color(land.sky)
    game.scene.fog = new THREE.Fog(land.sky, 30, 85)

    // The ground goes on forever: it just slides along with Buddy.
    const ground = game.add(new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: land.ground })))
    ground.object.rotation.x = -Math.PI / 2
    ground.position.y = -0.25

    const me = game.add(hero(look.color, look.hat)).at(0, 0, 0)
    me.object.rotation.y = Math.PI // face down the path
    game.camera.position.set(0, 4.6, 8.5) // start right behind Buddy (not where the last land ended)
    let targetX = 0 // where Buddy is heading, left to right
    let vy = 0
    let slow = 0 // seconds of sticky-taffy slowness left
    let candies = 0
    let state: 'ready' | 'teach' | 'run' | 'gate' | 'done' = 'ready'
    let alive = true // false once we leave this land
    let misses = 0 // gate words missed in this land
    let chase: ReturnType<typeof startChase> | null = null
    let chasePractice: Practice | undefined // made the first time the monster wakes

    const showCandies = () => game.hud.set('candies', `🍬 ${candies}`, 'top-left')
    showCandies()
    game.hud.set('land', `${land.emoji} ${land.name}`, 'top')

    // Anything behind Buddy gets cleaned up, so the world never fills up.
    const behind = (margin: number) => (e: Entity) => {
      if (e.position.z > me.position.z + margin) e.destroy()
    }
    // New things pop up from nothing (so it doesn't look odd if one appears in view).
    const popIn = (e: Entity, size = 1) => {
      e.object.scale.setScalar(0.01)
      void game.tweens.to(e.object.scale, { x: size, y: size, z: size }, 0.5, ease.out)
      return e
    }

    // --- The path and scenery are built a little at a time, far ahead of Buddy ---
    let builtTo = 10
    function buildScenery(toZ: number) {
      while (builtTo > toZ) {
        const z = builtTo - 5
        game.add(pathPiece(10, land.path, land.scenery)).at(0, 0, z).with(behind(20))
        for (const side of [-1, 1]) {
          const x = side * rand(land.scenery === 'chocolate' ? 10.5 : 6.5, 14)
          game.add(scenery(land.scenery, land.candy)).at(x, 0, z + rand(-4, 4)).with(behind(20))
        }
        builtTo -= 10
      }
    }
    buildScenery(-90)

    // --- Things on the path: gumdrops, taffy, candies. Checked by hand each frame. ---
    type Thing = { e: Entity; kind: 'gumdrop' | 'taffy' | 'candy'; used: boolean; hinted?: boolean }
    let things: Thing[] = []
    const addThing = (kind: Thing['kind'], obj: THREE.Object3D, x: number, y: number, z: number) => {
      const e = game.add(obj).at(x, y, z).with(behind(4))
      if (kind === 'candy') e.with((c, dt) => (c.object.rotation.y += dt * 3))
      things.push({ e, kind, used: false })
    }

    /** Fill the stretch of path that starts at startZ with things to bounce on, dodge and grab. */
    function fillStretch(startZ: number) {
      const slots = [8, 13, 18, 23, 28].map((d) => startZ - d)
      const puddleSlots = new Set(slots.slice(1).sort(() => Math.random() - 0.5).slice(0, rules.puddles))
      for (const z of slots) {
        const l = Math.floor(rand(0, 3))
        if (puddleSlots.has(z)) {
          addThing('taffy', taffy(), LANE_X[l]!, 0, z)
          // a candy right above the puddle: jump for it!
          addThing('candy', wrappedCandy(pick(land.candy)!), LANE_X[l]!, 1.9, z)
        } else {
          addThing('gumdrop', gumdrop(pick(land.candy)!), LANE_X[l]!, 0, z)
          // a line of candies up in the air, right along the path the bounce takes you
          const flight = (2 * BOING) / GRAVITY // seconds in the air
          for (const part of [0.2, 0.4, 0.6, 0.8]) {
            const ahead = part * flight * rules.speed
            addThing('candy', wrappedCandy(pick(land.candy)!), LANE_X[l]!, bounceHeight(ahead, rules.speed) + 0.7, z - ahead)
          }
        }
      }
    }

    // Stretches are filled far ahead of Buddy as they run (so a long monster chase never runs out of path).
    let nextFill = 0
    const fillAhead = () => {
      while (nextFill > me.position.z - 70) {
        fillStretch(nextFill)
        nextFill -= STRETCH
      }
    }

    // --- Gates and the treasure ---
    let gate: { e: Entity; wall: THREE.Mesh; z: number } | null = null
    let treasure: { lid: THREE.Object3D; glow: THREE.PointLight; z: number } | null = null

    /** At z (always where one stretch meets the next): a gate if the map still needs pieces, else the X and the chest. */
    function placeEnd(z: number) {
      if (mapDone(map)) {
        game.add(xMark()).at(0, 0, z)
        const c = chest()
        game.add(c.object).at(0, 0, z - 1.6)
        treasure = { lid: c.lid, glow: c.glow, z }
      } else {
        const g = candyGate(pick(land.candy)!)
        const e = popIn(game.add(g.object).at(0, 0, z).with(behind(6)))
        gate = { e, wall: g.wall, z }
      }
    }

    /** Spell a word on the letter pad. Same rules as every other game: a few tries, then we show it. */
    async function spellIt() {
      const moment = practice.moment()
      const q = moment.ask()
      const pad = letterPad()
      let msg = ''
      q.restartTimer()
      if (import.meta.env.DEV) Object.assign(window, { __candyWord: q.answer }) // lets test scripts play a land
      for (let t = 0; t < TRIES; t++) {
        const word = await pad.ask({ title: '🍬 Spell it to open the gate!', prompt: q.prompt, listen: q.item.listen, msg })
        if (moment.check(q, word)) {
          sfx.good(t === 0 ? 2 : 0)
          pad.close()
          return true
        }
        sfx.bad()
        const close = q.score(word) > 0
        msg = t < TRIES - 1 ? (close ? 'So close! Try again!' : 'Not quite, try again!') : `It was ${q.answer}!`
        pad.feedback(msg)
      }
      await wait(1.8) // time to read the right spelling
      pad.close()
      return false
    }

    async function atGate() {
      state = 'gate'
      game.paused = true
      const solved = await spellIt()
      game.paused = false
      const { piece, helped } = afterGate(map, solved)

      // The jelly wall melts down into the ground
      sfx.free()
      burst(game, new THREE.Vector3(0, 1.5, gate!.z), { color: land.candy, count: 40, speed: 8 })
      void game.tweens.to(gate!.wall.scale, { y: 0.01 }, 0.5)
      void game.tweens.to(gate!.wall.position, { y: 0 }, 0.5)

      if (piece) {
        const mark = land.landmarks[map.found - 1]!
        card.show(map.found)
        sfx.sticker()
        game.hud.message(`🗺️ ${helped ? 'Here is a map piece to help you!' : 'Map piece!'}`, { subtitle: mark.clue, seconds: 3 })
        speak(mark.clue)
        // The landmark on the map pops up beside the path ahead
        const side = pick([-1, 1])!
        popIn(game.add(landmark(mark.emoji)).at(side * 5.5, 0, gate!.z - STRETCH / 2).with(behind(10)))
      }
      const gateZ = gate!.z
      gate = null
      game.after(0.5, () => (state = 'run'))

      if (!solved) misses++
      if (!solved && monsterWakes(misses) && canPick(learner(), CHASE_QUESTIONS)) return wakeMonster()
      if (!piece) {
        game.hud.message('Nice try! 💪', { subtitle: 'One more gate to find this map piece.', seconds: 2.5 })
        speak('Nice try! One more gate to find this map piece.')
      }
      placeEnd(gateZ - STRETCH)
    }

    /** Too many missed words: here comes the Candy Monster! No gate until the chase is over. */
    function wakeMonster() {
      chasePractice ??= startPractice(CHASE_QUESTIONS)
      back.style.display = 'none' // the answer buttons go down there
      chase = startChase({
        game,
        me,
        creepRate: rules.creep,
        practice: chasePractice,
        candies: () => candies,
        eat: (n) => {
          candies -= n
          showCandies()
        },
        done: () => {
          chase = null
          back.style.display = ''
          // The next gate goes on the first stretch boundary at least 20 steps ahead
          placeEnd(-Math.ceil((20 - me.position.z) / STRETCH) * STRETCH)
        },
      })
    }

    async function openChest() {
      state = 'done'
      const t = treasure!
      sfx.chest()
      void game.tweens.to(t.lid.rotation, { x: -1.9 }, 0.8, ease.out)
      void game.tweens.to(t.glow, { intensity: 4 }, 0.8)
      burst(game, new THREE.Vector3(0, 1.5, t.z - 1.6), { color: ['#ffd43b', '#fff', ...land.candy], count: 60, speed: 9 })
      confetti(['🍬', '🍭', '🍫', '⭐', '🎉'])
      speak(land.treasure)

      // Save: this land is finished, and Buddy puts on the new reward right away
      const firstTime = finishedLands() <= index
      if (firstTime) {
        save.set('finished', index + 1)
        const r = land.reward
        look = r.kind === 'color' ? { ...look, color: r.color } : { ...look, hat: r.hat }
        save.set('color', look.color)
        save.set('hat', look.hat)
      }
      const record = save.highScore(candies)
      await wait(1.6)
      const last = index === LANDS.length - 1
      game.hud.message(`${land.emoji} Treasure found!`, {
        // Short, so it fits on a phone (the whole treasure line was just said out loud)
        subtitle: `${firstTime ? `New for Buddy: ${land.reward.name}! · ` : ''}🍬 ${candies}${record ? ' · NEW RECORD!' : ''}`,
        button: last ? '🗺️ Back to the lands' : `Next: ${LANDS[index + 1]!.emoji} ${LANDS[index + 1]!.name}`,
        onClick: () => game.setScene(last ? titleScreen : runLand(index + 1)),
      })
    }

    // --- Start: the first two stretches, the first gate, and the story ---
    fillAhead()
    placeEnd(-STRETCH)
    game.hud.message(`${land.emoji} ${land.name}`, { subtitle: land.intro, seconds: 3.5 })
    speak(land.intro)
    game.after(3, () => {
      if (!save.get('taught', false)) return void teach()
      state = 'run'
      sfx.whoosh(false)
    })

    // --- Fingers: hold and slide anywhere to move Buddy (like a trackpad); a quick tap jumps ---
    let finger: { id: number; startX: number; buddyX: number; at: number; moved: boolean } | null = null
    let tapped = false
    let jumps = 0
    const onScreen = (e: PointerEvent) => !(e.target as Element).closest?.('button, .lp-card, [data-answers]')
    const onDown = (e: PointerEvent) => {
      if (!onScreen(e) || finger) return
      finger = { id: e.pointerId, startX: e.clientX, buddyX: targetX, at: performance.now(), moved: false }
    }
    const onMove = (e: PointerEvent) => {
      if (!finger || e.pointerId !== finger.id) return
      const dx = e.clientX - finger.startX
      if (Math.abs(dx) > 12) finger.moved = true
      // Sliding across the whole screen moves Buddy across the path about twice
      targetX = clamp(finger.buddyX + (dx / innerWidth) * EDGE * 4, -EDGE, EDGE)
    }
    const onUp = (e: PointerEvent) => {
      if (!finger || e.pointerId !== finger.id) return
      if (!finger.moved && performance.now() - finger.at < 300) tapped = true
      finger = null
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    /** Wait (checking 10 times a second) until something is true, or we leave the land. */
    const until = (test: () => boolean) =>
      new Promise<void>((done) => {
        const id = setInterval(() => (test() || !alive) && (clearInterval(id), done()), 100)
      })

    /** The first time: Buddy stands still and shows how to move and jump, waiting until the kid does it. */
    async function teach() {
      state = 'teach'
      let hint = coach('Slide to move!', 'drag')
      speak(COACH_LINES.drag)
      await until(() => Math.abs(me.position.x) > 1.4)
      hint.remove()
      sfx.good(1)
      hint = coach('Tap to jump!', 'tap')
      speak(COACH_LINES.tap)
      const before = jumps
      await until(() => jumps > before)
      hint.remove()
      if (!alive) return
      sfx.good(3)
      toast('Great! ⭐')
      speak(COACH_LINES.ready)
      save.set('taught', true)
      game.after(1.2, () => {
        state = 'run'
        sfx.whoosh(false)
      })
    }
    let jumpHints = 0 // "Tap to jump!" pops up for the first few taffy puddles in Buddy's way

    // --- Every frame: run, steer, jump, bounce ---
    let time = 0
    game.onUpdate((dt) => {
      time += dt
      const grounded = me.position.y <= 0.001

      // Steering: fingers (above), or ⬅ ➡ hop one lane at a time
      const jump = game.input.pressed('jump') || game.input.pressed('up') || tapped
      tapped = false
      if (state === 'run' || state === 'ready' || state === 'teach') {
        const lane = Math.round(targetX / LANE_X[2]!) // -1, 0 or 1: the nearest lane
        if (game.input.pressed('left')) targetX = Math.max(-1, lane - 1) * LANE_X[2]!
        if (game.input.pressed('right')) targetX = Math.min(1, lane + 1) * LANE_X[2]!
        if (jump && grounded) {
          vy = JUMP
          jumps++
          tone(400, 0, 0.15, { type: 'triangle', vol: 0.08, to: 800 })
        }
      }
      me.position.x += (targetX - me.position.x) * Math.min(1, dt * 12)

      // Jumping and falling
      vy -= GRAVITY * dt
      me.position.y = Math.max(0, me.position.y + vy * dt)
      if (me.position.y === 0) vy = 0

      // Running forward (slower in taffy, with a wobble)
      slow = Math.max(0, slow - dt)
      if (state === 'run') me.position.z -= rules.speed * WARP * (slow > 0 ? 0.4 : 1) * dt
      me.object.rotation.z = slow > 0 ? Math.sin(time * 18) * 0.25 : 0
      const hop = state === 'run' && grounded ? Math.abs(Math.sin(time * 12)) * 0.12 : 0
      me.object.children[0]!.position.y = hop // a little bounce in every step

      if (state === 'run') bumpInto()
      if (state === 'run' && jumpHints < 3) hintJump()
      if (state === 'run' && gate && me.position.z <= gate.z + 2.2) void atGate()
      if (state === 'run' && treasure && me.position.z <= treasure.z + 1) void openChest()

      chase?.update(dt)
      fillAhead()
      buildScenery(me.position.z - 90)
      ground.position.set(0, -0.25, me.position.z)

      // The camera rides behind and above, leaning a little with the lanes (further back in a chase, to see the monster)
      const cam = chase?.camera ?? new THREE.Vector3(0, 4.6, 8.5)
      game.camera.position.lerp(new THREE.Vector3(me.position.x * 0.5, cam.y, me.position.z + cam.z), Math.min(1, dt * 3))
      game.camera.lookAt(me.position.x * 0.4, 1.2, me.position.z - 6)
    })

    /** For the first few puddles: if taffy is right ahead of Buddy, say "Tap to jump!". */
    function hintJump() {
      const ahead = things.find((t) => t.kind === 'taffy' && !t.hinted && t.e.position.z < me.position.z - 3 && t.e.position.z > me.position.z - 7 && Math.abs(t.e.position.x - me.position.x) < 1.2)
      if (!ahead) return
      ahead.hinted = true // only once per puddle
      jumpHints++
      toast('👆 Tap to jump!')
      speak(COACH_LINES.jumpHint)
    }

    /** Did Buddy run into a gumdrop, a taffy puddle or a candy? */
    function bumpInto() {
      const p = me.position
      for (const t of things) {
        if (t.used || !t.e.alive) continue
        const near = Math.abs(t.e.position.z - p.z) < 0.9 && Math.abs(t.e.position.x - p.x) < 1.1
        if (!near) continue
        if (t.kind === 'gumdrop' && p.y < 0.9) {
          // Boing! Squish the gumdrop and fly
          vy = BOING
          sfx.boing()
          t.used = true
          const s = t.e.object.scale
          void game.tweens.to(s, { y: 0.45 }, 0.08).then(() => game.tweens.to(s, { y: 1 }, 0.3, ease.out))
          game.after(0.6, () => (t.used = false))
        } else if (t.kind === 'taffy' && p.y < 0.3 && slow === 0) {
          slow = 1.2
          tone(160, 0, 0.4, { type: 'sine', vol: 0.15, to: 90 })
          toast('Sticky! 🍯')
        } else if (t.kind === 'candy' && Math.abs(t.e.position.y - (p.y + 0.7)) < 1.2) {
          t.used = true
          candies++
          sfx.pop()
          burst(game, t.e.position, { color: land.candy, count: 10 })
          t.e.destroy()
          showCandies()
        }
      }
      things = things.filter((t) => t.e.alive)
    }

    return () => {
      alive = false
      chase?.stop()
      card.remove()
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      back.remove()
      letterPad().close()
      game.paused = false
    }
  }
}

game.start(titleScreen)
