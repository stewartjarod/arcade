import { THREE, ease, noise, sfx, tone, type Entity, type Game } from '@arcade/engine'
import { lessonFor, renderPrompt, speak, spokenText, teachCard, type Practice, type Question } from '@arcade/learning'
import { MONSTER_LINES } from './lands'
import { MAX_GAP, caught, chaseAnswer, creep, eaten, escaped, newChase } from './quest'
import { chasePanel, toast } from './ui'
import { candyMonster } from './world'

// ------------------------------------------------------------------
//  The Candy Monster chase. It stomps up behind Buddy while quick
//  "which is spelled right?" questions pop up. Right answers push it back;
//  three right answers and you get away. If it catches you: CHOMP, it eats
//  half your candies, burps, and waddles off. You never lose map pieces.
// ------------------------------------------------------------------

// Keys 1 2 3 pick an answer. The listener is made once; each chase swaps in its own handler.
let pickKey: (i: number) => void = () => {}
window.addEventListener('keydown', (e) => {
  const i = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]
  if (i !== undefined) pickKey(i)
})

const roar = () => {
  tone(95, 0, 0.9, { type: 'sawtooth', vol: 0.16, to: 55, lp: 700 })
  noise(0, 0.8, 0.12, 600, 200)
}
const chomp = () => [0, 0.18].forEach((at) => noise(at, 0.12, 0.3, 1400, 300))
const burp = () => tone(120, 0, 0.55, { type: 'sawtooth', vol: 0.14, to: 70, lp: 450 })

export interface ChaseOptions {
  game: Game
  me: Entity
  /** How fast the monster closes in (gap per second). */
  creepRate: number
  practice: Practice
  candies: () => number
  eat: (n: number) => void
  /** The chase is over (escaped or chomped): carry on with the land. */
  done: () => void
}

export function startChase(o: ChaseOptions) {
  const { game, me } = o
  const chase = newChase()
  const panel = chasePanel()
  const moment = o.practice.moment() // the whole chase is one challenge
  let asking = false // the monster only creeps while a question is up
  let over = false
  let time = 0

  // The monster rises out of the ground behind Buddy
  const monster = game.add(candyMonster()).at(me.position.x, -3.5, me.position.z + 1.5 + chase.gap * 0.75)
  void game.tweens.to(monster.position, { y: 0 }, 0.8, ease.out)
  roar()
  toast('👾 RUN!')
  speak(MONSTER_LINES.wake)
  panel.meter(chase.gap, MAX_GAP)
  game.after(3, () => !over && ask()) // time to hear the warning before the first question

  let q: Question
  let options: string[] = []
  let open = new Set<number>()

  // Ask the next question. A topic the kid hasn't seen gets its "how it works" card first.
  // `asking` is false until the card closes, so the monster doesn't creep and taps are ignored.
  async function ask() {
    q = moment.ask()
    if (q.item.frontier) {
      await teachCard(lessonFor(q.item))
      if (over) return // the chase ended while the card was up
    }
    options = q.options(3)
    open = new Set([0, 1, 2])
    panel.show(renderPrompt(q.prompt), options, pick)
    q.restartTimer()
    speak(spokenText(q.prompt)) // the word has to be heard to pick it
    if (import.meta.env.DEV) Object.assign(window, { __candyPick: q.answer }) // lets test scripts play a chase
    asking = true
  }

  function pick(i: number) {
    if (over || !asking || !open.has(i)) return
    const firstTry = open.size === 3
    const right = moment.check(q, options[i]!, { choices: open.size })
    panel.mark(i, right)
    chaseAnswer(chase, right, firstTry)
    panel.meter(chase.gap, MAX_GAP)
    if (!right) {
      sfx.bad()
      open.delete(i)
      if (caught(chase)) gotCaught()
      return
    }
    sfx.good(chase.escapes)
    asking = false
    toast(firstTry ? '⚡ Zoom!' : '🏃 Go!')
    if (escaped(chase)) return getAway()
    game.after(0.6, () => !over && ask())
  }
  pickKey = pick

  function finish(after: number) {
    over = true
    asking = false
    pickKey = () => {}
    panel.remove()
    game.after(after, () => {
      monster.destroy()
      o.done()
    })
  }

  function getAway() {
    sfx.win()
    toast('🎉 You got away!')
    speak(MONSTER_LINES.escaped)
    // It trips over its own feet and gets left behind
    void game.tweens.to(monster.object.rotation, { x: 1.2 }, 0.5, ease.out)
    finish(2)
  }

  function gotCaught() {
    const n = eaten(o.candies())
    chomp()
    o.eat(n)
    toast(n ? `👾 CHOMP! −${n} 🍬` : '👾 CHOMP!')
    speak(n ? MONSTER_LINES.chomp : MONSTER_LINES.hungry)
    // Burp, then waddle off to the side and sink away
    game.after(1.4, () => {
      burp()
      if (n) toast('💨 BURP!')
    })
    game.after(1.8, () => {
      if (n) speak(MONSTER_LINES.burp)
      void game.tweens.to(monster.position, { x: me.position.x > 0 ? -12 : 12, y: -3 }, 1.5)
    })
    finish(3.4)
  }

  return {
    update(dt: number) {
      time += dt
      if (!over && asking) {
        creep(chase, dt, o.creepRate)
        panel.meter(chase.gap, MAX_GAP)
        if (caught(chase)) gotCaught()
      }
      // Stomp along behind Buddy, wobbling like jelly
      const z = over ? monster.position.z : me.position.z + 1.5 + chase.gap * 0.75
      monster.position.z += (z - monster.position.z) * Math.min(1, dt * 4)
      if (!over) monster.position.x += (me.position.x - monster.position.x) * Math.min(1, dt * 2)
      const squish = 1 + Math.sin(time * 9) * 0.06
      monster.object.scale.set(1 / squish, squish, 1 / squish)
    },
    /** Leaving the land in the middle of a chase. */
    stop() {
      over = true
      pickKey = () => {}
      panel.remove()
    },
    camera: new THREE.Vector3(0, 7.5, 15), // pull back so you can see the monster behind Buddy
  }
}
