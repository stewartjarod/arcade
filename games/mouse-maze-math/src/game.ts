import { keepAwake } from '@arcade/engine'
import { setMood, setRealmSound, sfx } from './audio'
import { STICKERS } from './catalog'
import { cageQuestionsFor, corridorFor, hintSecondsFor, junctionsFor, nudgeSecondsFor, QUICK_BONUS, quickSecondsFor, styleFor, trapChanceFor } from './difficulty'
import { DX, DZ, generateMaze } from './maze'
import { activeRealm, currentSubject, depth } from './progress'
import { REALMS, realmForDepth } from './realms'
import { currentPlayer } from '@arcade/players'
import { choicePad, lessonFor, learner, practiceGrade, slowDown, speak, spokenText, startPractice, type Moment, type Question } from '@arcade/learning'
import { commit, save } from './save'
import * as ui from './ui'
import { sleep, type World } from './world'

// Varied praise, sometimes with the player's name, so it never sounds like a machine.
const PRAISE = ['Yes!', 'Great job!', 'Super!', 'You got it!', 'Awesome!', 'Nice one!', 'Brilliant!']
const praise = () => {
  const word = PRAISE[Math.floor(Math.random() * PRAISE.length)]!
  return Math.random() < 0.3 ? `${word.replace('!', '')}, ${currentPlayer().name}!` : word
}

/** How a door question waits for a pick: how often to nudge, and the one-time hint (hintMs 0 = no hint). */
type Idle = { nudgeMs: number; hintMs: number; nudge: () => void; hint: () => void }

export const createGame = (world: World) => {
  // Every play() and menu() gets a new number. A running maze that sees the number change has been left
  // (menu tapped) and must stop: no more doors, speech or timers on top of the menu.
  let round = 0
  let pending: ((exit: number) => void) | null = null
  // Stops the timers of the door question being waited on. Set by askExit; menu() calls it when the player leaves.
  let stopIdle = () => {}
  world.onPick((i) => pending?.(i))
  world.onHover(ui.hoverAnswer)
  addEventListener('pointerdown', () => world.skipFlyover()) // a tap skips the opening shot of a maze
  addEventListener('keydown', (ev) => {
    if (!pending || (ev.target as HTMLElement).tagName === 'INPUT') return
    const i = { ArrowLeft: 0, a: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2 }[ev.key]
    if (i !== undefined) {
      ev.preventDefault()
      pending(i)
    }
  })

  // Waits for a door pick. Doors in `blocked` (tried before, or faded by a hint) are ignored: the 3D click and
  // the arrow keys don't know the HTML buttons are disabled, so the check has to be here.
  // While the player thinks, `idle.nudge` runs every `nudgeMs`, and `idle.hint` runs once after `hintMs` (if not 0).
  // The timers stop on the first real pick, or when the player leaves for the menu.
  const askExit = (blocked: ReadonlySet<number>, idle: Idle) =>
    new Promise<number>((res) => {
      const nudge = window.setInterval(idle.nudge, idle.nudgeMs)
      const hint = idle.hintMs > 0 ? window.setTimeout(idle.hint, idle.hintMs) : 0
      const stop = () => {
        window.clearInterval(nudge)
        window.clearTimeout(hint)
        pending = null
        stopIdle = () => {}
      }
      stopIdle = stop
      pending = (i) => {
        if (blocked.has(i)) return
        stop()
        res(i)
      }
    })

  const gain = (n: number) => {
    save.cheese += n
    commit()
    ui.setCheese()
  }

  // The trap cage: solve `needed` similar questions to get out. Returns early (and quietly) if the player has left.
  const escapeCage = async (moment: Moment, failed: Question, needed: number, left: () => boolean) => {
    let solved = 0
    while (solved < needed) {
      const q = moment.similar(failed)
      const options = q.options(3)
      let open = options.length // how many answers are still open (a guess among fewer is likelier to be lucky)
      let picked = await ui.askChoice({ title: `🪤 Solve ${needed - solved} to escape`, prompt: q.prompt, options })
      if (left()) return
      for (;;) {
        // Only the first pick is scored; the moment ignores later ones, so tapping around never hurts.
        if (moment.check(q, picked, { choices: open })) {
          ui.markChoice(picked, true)
          sfx.good(solved + 1)
          solved++
          gain(2)
          ui.toast(solved < needed ? 'Nice! One more!' : 'Free!', 'good')
          await sleep(0.35)
          if (left()) return
          break
        }
        sfx.bad()
        ui.markChoice(picked, false)
        open--
        // Tapping answers super fast without reading? A short 🐢 wait before the next pick.
        await slowDown(choicePad().element, moment.slowDown())
        if (left()) return
        picked = await ui.askAgain()
        if (left()) return
      }
    }
    ui.closeTrap()
  }

  const menu = () => {
    round++
    stopIdle() // a door question may still be waiting: its nudges and hint must not fire on the menu
    window.speechSynthesis?.cancel() // stop a question that is still being read out (recorded clips finish their sentence)
    world.onPick(null)
    pending = null
    world.setFocus(false) // a cage may have been up; bring the camera back down
    ui.closeTrap()
    ui.closeTeach() // a "something new" card may still be up: it goes with the round
    if (import.meta.env.DEV) delete (window as unknown as { __maze?: unknown }).__maze // no maze is being played
    ui.hideAnswers()
    keepAwake(false) // nobody is playing, let the screen sleep
    setMood('menu')
    world.showSigns(0, null)
    world.load(generateMaze(1), REALMS[activeRealm()])
    world.setOrbit(true)
    ui.showMenu()
  }

  const play = async () => {
    const mine = ++round
    stopIdle() // belt and braces: no timers from an earlier maze can reach this one
    const left = () => mine !== round // true once the player has gone back to the menu
    // Dev only: ?teach=1 makes the first door question count as a new topic, so the teach card can be seen by hand.
    const forceTeach = import.meta.env.DEV && new URLSearchParams(location.search).has('teach')
    const n = save.mazes + 1
    const subjectId = currentSubject()
    // The maze gets longer as the player's IXL grade in this subject goes up (and a little with every maze won).
    const { grade } = practiceGrade(learner(), subjectId)
    const style = styleFor(grade)
    // Mazes won so far (not counting this one) make the maze a little longer, and traps a little more likely.
    const level = { name: `Maze ${n}`, emoji: '🧀', junctions: junctionsFor(grade, save.mazes) }
    // Questions in this subject that can be answered by picking a door.
    const practice = startPractice({ subjects: [subjectId], formats: ['choice'] })
    const realm = REALMS[activeRealm()]!
    const layout = generateMaze(level.junctions, trapChanceFor(grade, save.mazes), corridorFor(grade, { runs: realm.runs, len: realm.len }))
    const cageQuestions = cageQuestionsFor(grade)
    world.load(layout, realm)
    setRealmSound(realm.music)
    world.setSkin(save.color, save.hat)
    world.setOrbit(false)
    world.onPick((i) => pending?.(i))
    keepAwake(true) // don't let the phone dim between questions
    setMood('maze')
    ui.hideScreen()
    ui.toast(`${realm.emoji} ${realm.name}`, 'good')
    ui.showHud(`${level.emoji} ${level.name}`)
    ui.setCheese()
    ui.setStreak(0)
    ui.setProgress(0, level.junctions)
    ui.closeTrap()

    // The opening shot: the camera drops from the sky behind the mouse. (It never shows the maze from above: that would give the route away.)
    ui.setQuestion(null) // no empty question card during the opening shot
    await world.flyover()
    if (left()) return

    let mistakes = 0
    let streak = 0

    for (let k = 0; k < layout.junctions.length; k++) {
      const j = layout.junctions[k]!
      const correctIdx = j.exits.findIndex((e) => e.kind === 'path')
      const moment = practice.moment()
      // One question per junction. A wrong door doesn't re-roll it: the same question and labels come back,
      // with the doors tried so far blocked. (Only the first answer is scored, so retries never count.)
      const q = moment.ask()
      const labels = q.options(j.exits.length, correctIdx).map(String)
      // Words and sentences don't fit on a door sign, so the sign shows an arrow and the big buttons carry the words.
      const signLabels = labels.some((l) => l.length > 12) ? ['⬅', '⬆', '➡'] : labels
      const tried = new Set<number>() // doors that were wrong (dead end or trap)
      const blocked = new Set<number>() // tried doors, plus any door a hint faded away: none of these can be picked
      let hinted = false
      let teaching = false // true while the "something new" card is up
      // Test bots (dev server only) read this to know which door is right, and which ones are blocked right now.
      const publish = () => {
        if (import.meta.env.DEV) (window as unknown as { __maze: unknown }).__maze = { correctIdx, grade, junction: k, of: layout.junctions.length, round: mine, blocked: [...blocked], teaching }
      }

      // A topic the kid has never met: show the "how it works" card before any door comes up. It is shown once per
      // question (not on every wrong door), and no nudge or hint timer runs yet (askExit starts them). The question's
      // own read-aloud happens below, after the card closes, so the two voices never overlap.
      if (q.item.frontier || (forceTeach && k === 0)) {
        teaching = true
        publish()
        await ui.showTeach(lessonFor(q.item))
        teaching = false
        if (left()) return // the player went back to the menu while the card was up
        q.restartTimer() // the speed bonus counts from when the doors appear
      }

      // The cozy hint: fade one wrong door that's still open. Once per question.
      const hint = () => {
        if (hinted) return
        const open = j.exits.map((_, i) => i).filter((i) => i !== correctIdx && !blocked.has(i))
        if (open.length === 0) return
        hinted = true
        const faded = open[Math.floor(Math.random() * open.length)]!
        blocked.add(faded)
        ui.fadeAnswer(faded)
        world.showSigns(k, signLabels, [...blocked])
        publish()
      }

      for (;;) {
        publish()
        ui.setQuestion(q.prompt)
        world.showSigns(k, signLabels, [...blocked])
        if (grade <= 1) speak(spokenText(q.prompt)) // young readers: say the question out loud
        ui.showAnswers(labels, realm.doors, (i) => pending?.(i), world.setHover, [...blocked])
        q.restartTimer() // the speed bonus counts from when the doors appear
        let readAgain = false
        const idx = await askExit(blocked, {
          nudgeMs: nudgeSecondsFor(grade) * 1000,
          hintMs: hintSecondsFor(grade) * 1000,
          // "Still thinking?": wiggle the doors that still count. The question is read again only the first time:
          // hearing it over and over gets in the way of thinking (the 🔊 button is there for more).
          nudge: () => {
            if (!readAgain) speak(spokenText(q.prompt))
            readAgain = true
            ui.pulseAnswers()
          },
          hint,
        })
        if (left()) return
        const ex = j.exits[idx]!
        // Doors still open for this pick (a hint may have closed one), so a lucky guess counts for a little less.
        const choices = j.exits.length - blocked.size
        const firstTry = tried.size === 0
        world.setHover(-1)
        ui.markAnswer(idx, ex.kind === 'path')
        world.markSign(k, idx, ex.kind === 'path')
        sfx.pop()
        moment.record(q, ex.kind === 'path', { choices })
        await sleep(0.35) // long enough to see the green or red mark
        if (left()) return
        ui.hideAnswers()
        void world.setDoor(k, idx, true)

        if (ex.kind === 'path') {
          sfx.good(streak)
          const quickLimit = quickSecondsFor(grade)
          const quick = firstTry && quickLimit > 0 && (performance.now() - q.askedAt) / 1000 <= quickLimit
          const earned = (firstTry ? 10 + 2 * Math.min(streak, 5) : 5) + (quick ? QUICK_BONUS : 0)
          if (firstTry) streak++
          gain(earned)
          ui.setStreak(streak)
          ui.toast(quick ? `⚡ Quick! +${earned} 🧀` : `${praise()} +${earned} 🧀`, 'good')
          if (streak === 5) ui.confetti() // five in a row!
          ui.setQuestion(null)
          world.showSigns(k, null)
          if (k === layout.junctions.length - 1) {
            // Stop well short of the chest: the camera rises for the reveal, then the mouse trots up to it.
            const { goal } = layout
            const path = ex.path.slice(0, -1)
            await world.walkPath([...path, [goal.x - DX[goal.heading]! * 0.75, goal.z - DZ[goal.heading]! * 0.75]])
          } else {
            await world.walkPath(ex.path)
          }
          if (left()) return
          ui.setProgress(k + 1, level.junctions)
          break
        }

        tried.add(idx)
        blocked.add(idx)
        mistakes++
        streak = 0
        ui.setStreak(0)
        ui.setQuestion(null)
        world.showSigns(k, null)
        await world.walkPath(ex.path)
        if (left()) return

        if (ex.kind === 'dead') {
          sfx.bad()
          ui.toast(style === 'cozy' ? '🙈 Try another!' : 'Oops! Try another door', 'bad')
          await world.bonk()
        } else {
          world.setFocus(true)
          await world.dropCage()
          if (left()) return
          setMood('trap')
          await escapeCage(moment, q, cageQuestions, left)
          if (left()) return
          setMood('maze')
          await world.liftCage()
          if (left()) return
          world.setFocus(false)
        }
        await world.walkPath([...ex.path.slice(0, -1).reverse(), [j.x, j.z]])
        if (left()) return
        world.releaseCamera(j.x, j.z, j.heading)
        await world.turnTo(j.heading)
        if (left()) return
        await sleep(0.25)
        if (left()) return
        void world.setDoor(k, idx, false)
        // Back at the junction: the same question returns (loop), with this door crossed out.
      }
    }

    await world.reveal()
    if (left()) return
    const { goal } = layout
    await world.walkPath([[goal.x - DX[goal.heading]! * 0.2, goal.z - DZ[goal.heading]! * 0.2]])
    if (left()) return
    await world.openChest()
    if (left()) return
    sfx.win()
    void world.hop(3)
    await sleep(1.2)
    if (left()) return
    // Now the maze is solved, rise up and show all of it from above while the finish card comes in.
    await world.overview()
    await sleep(3.2) // time to take in the whole maze
    if (left()) return

    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    const bonus = 25 * stars
    const unowned = STICKERS.filter((s) => !save.stickers.includes(s))
    const isNew = unowned.length > 0
    const pool = isNew ? unowned : STICKERS
    const sticker = pool[Math.floor(Math.random() * pool.length)]!
    if (isNew) save.stickers.push(sticker)
    save.mazes = n
    if (mistakes === 0) save.perfect++
    gain(bonus + (isNew ? 0 : 20))
    const realmBefore = save.realmMax
    const newRealm = realmForDepth(depth()) > realmBefore ? REALMS[realmForDepth(depth())] : undefined
    activeRealm()
    const grew = practice.grew()
    if (isNew) setTimeout(sfx.sticker, 1400)
    if (grew.length) setTimeout(sfx.levelUp, 2200)
    keepAwake(false) // the round is over; sleeping on the results screen is fine
    ui.showFinish({ n, stars, mistakes, bonus, sticker, isNew, grew, newRealm: newRealm ? `${newRealm.emoji} ${newRealm.name}` : undefined })
  }

  return { play, menu }
}
