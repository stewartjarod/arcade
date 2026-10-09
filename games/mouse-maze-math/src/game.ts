import { keepAwake } from '@arcade/engine'
import { setMood, setRealmSound, sfx } from './audio'
import { STICKERS } from './catalog'
import { junctionsFor, QUICK_BONUS, quickSecondsFor, trapChanceFor } from './difficulty'
import { DX, DZ, generateMaze } from './maze'
import { activeRealm, currentSubject, depth } from './progress'
import { REALMS, realmForDepth } from './realms'
import { learner, practiceGrade, speak, spokenText, startPractice, gradeName, findSubject, type Moment, type Question } from '@arcade/learning'
import { commit, save } from './save'
import * as ui from './ui'
import { sleep, type World } from './world'

const CAGE_QUESTIONS = 2

export const createGame = (world: World) => {
  let pending: ((exit: number) => void) | null = null
  world.onPick((i) => pending?.(i))
  world.onHover(ui.hoverAnswer)
  addEventListener('keydown', (ev) => {
    if (!pending || (ev.target as HTMLElement).tagName === 'INPUT') return
    const i = { ArrowLeft: 0, a: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2 }[ev.key]
    if (i !== undefined) {
      ev.preventDefault()
      pending(i)
    }
  })
  const askExit = () =>
    new Promise<number>((res) => {
      pending = (i) => {
        pending = null
        res(i)
      }
    })

  const gain = (n: number) => {
    save.cheese += n
    commit()
    ui.setCheese()
  }

  // The cage is part of the same moment as the door that caught you, so it shares its safety net.
  const escapeCage = async (moment: Moment, failed: Question) => {
    let solved = 0
    while (solved < CAGE_QUESTIONS) {
      const q = moment.similar(failed)
      const options = q.options(3)
      let left = options.length // how many answers are still open (a guess among fewer is likelier to be lucky)
      let picked = await ui.askChoice({ title: `🪤 Caught! Solve ${CAGE_QUESTIONS - solved} more to escape`, prompt: q.prompt, options })
      for (;;) {
        // Only the first pick is scored; the moment ignores later ones, so tapping around never hurts.
        if (moment.check(q, picked, { choices: left })) {
          ui.markChoice(picked, true)
          sfx.good(solved + 1)
          solved++
          gain(2)
          ui.toast(solved < CAGE_QUESTIONS ? 'Nice! One more!' : 'Free!', 'good')
          await sleep(0.5)
          break
        }
        sfx.bad()
        ui.markChoice(picked, false)
        left--
        picked = await ui.askAgain()
      }
    }
    ui.closeTrap()
  }

  const menu = () => {
    world.onPick(null)
    pending = null
    ui.closeTrap()
    ui.hideAnswers()
    keepAwake(false) // nobody is playing, let the screen sleep
    setMood('menu')
    world.showSigns(0, null)
    world.load(generateMaze(1), REALMS[activeRealm()])
    world.setOrbit(true)
    ui.showMenu()
  }

  const play = async () => {
    const n = save.mazes + 1
    const subjectId = currentSubject()
    // The maze gets longer as the player's IXL grade in this subject goes up (and a little with every maze won).
    const { grade, known } = practiceGrade(learner(), subjectId)
    const level = { name: `Maze ${n}`, emoji: '🧀', junctions: junctionsFor(grade, n) }
    // Questions in this subject that can be answered by picking a door.
    const practice = startPractice({ subjects: [subjectId], formats: ['choice'] })
    const realm = REALMS[activeRealm()]!
    const layout = generateMaze(level.junctions, trapChanceFor(grade, n), { runs: realm.runs, len: realm.len })
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

    let mistakes = 0
    let streak = 0

    for (let k = 0; k < layout.junctions.length; k++) {
      const j = layout.junctions[k]!
      const correctIdx = j.exits.findIndex((e) => e.kind === 'path')
      const moment = practice.moment()
      const tried = new Set<number>()

      for (;;) {
        const q = moment.ask()
        // Doors already tried are known wrong, so a guess among the rest is likelier to be lucky.
        const choices = j.exits.length - tried.size
        const firstTry = tried.size === 0
        const labels = q.options(j.exits.length, correctIdx).map(String)
        ui.setQuestion(q.prompt)
        // Words and sentences don't fit on a door sign, so the sign shows an arrow and the big buttons carry the words.
        world.showSigns(k, labels.some((l) => l.length > 12) ? ['⬅', '⬆', '➡'] : labels)
        if (grade <= 1) speak(spokenText(q.prompt)) // young readers: say the question out loud
        ui.showAnswers(labels, realm.doors, (i) => pending?.(i), world.setHover)
        q.restartTimer() // the speed bonus counts from when the doors appear
        const idx = await askExit()
        const ex = j.exits[idx]!
        world.setHover(-1)
        ui.markAnswer(idx, ex.kind === 'path')
        world.markSign(k, idx, ex.kind === 'path')
        sfx.pop()
        await sleep(0.5)
        ui.hideAnswers()
        void world.setDoor(k, idx, true)

        moment.record(q, ex.kind === 'path', { choices })

        if (ex.kind === 'path') {
          sfx.good(streak)
          const quickLimit = quickSecondsFor(grade)
          const quick = firstTry && quickLimit > 0 && (performance.now() - q.askedAt) / 1000 <= quickLimit
          const earned = (firstTry ? 10 + 2 * Math.min(streak, 5) : 5) + (quick ? QUICK_BONUS : 0)
          if (firstTry) streak++
          gain(earned)
          ui.setStreak(streak)
          ui.toast(quick ? `⚡ Quick! +${earned} 🧀` : `Yes! +${earned} 🧀`, 'good')
          ui.setQuestion(null)
          world.showSigns(k, null)
          if (k === layout.junctions.length - 1) {
            const { goal } = layout
            const path = ex.path.slice(0, -1)
            await world.walkPath([...path, [goal.x - DX[goal.heading]! * 0.2, goal.z - DZ[goal.heading]! * 0.2]])
          } else {
            await world.walkPath(ex.path)
          }
          ui.setProgress(k + 1, level.junctions)
          break
        }

        tried.add(idx)
        mistakes++
        streak = 0
        ui.setStreak(0)
        ui.setQuestion(null)
        world.showSigns(k, null)
        await world.walkPath(ex.path)

        if (ex.kind === 'dead') {
          sfx.bad()
          ui.toast('Dead end! Try another problem', 'bad')
          await world.bonk()
        } else {
          world.setFocus(true)
          await world.dropCage()
          setMood('trap')
          await escapeCage(moment, q)
          setMood('maze')
          await world.liftCage()
          world.setFocus(false)
        }
        await world.walkPath([...ex.path.slice(0, -1).reverse(), [j.x, j.z]])
        world.releaseCamera(j.x, j.z, j.heading)
        await world.turnTo(j.heading)
        await sleep(0.35)
        void world.setDoor(k, idx, false)
      }
    }

    await world.openChest()
    sfx.win()
    void world.hop(3)
    await sleep(1.2)

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
    ui.showFinish({ n, stars, mistakes, bonus, sticker, isNew, grew, gradeLine: known ? `IXL ${gradeName(practiceGrade(learner(), subjectId).grade)} ${findSubject(subjectId)!.name.toLowerCase()}` : undefined, newRealm: newRealm ? `${newRealm.emoji} ${newRealm.name}` : undefined })
  }

  return { play, menu }
}
