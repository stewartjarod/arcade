import { setMood, setRealmSound, sfx } from './audio'
import { STICKERS } from './catalog'
import { DX, DZ, generateMaze } from './maze'
import { activeRealm, depth } from './progress'
import { REALMS, realmForDepth } from './realms'
import { chooseProblem, describe, distractors, limitDrop, similarTo, speedOutcome, unlocked, updateSkill, type Problem } from '@arcade/learning'
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

  const escapeCage = async (failed: Problem) => {
    let solved = 0
    let last = failed.text
    while (solved < CAGE_QUESTIONS) {
      const p = similarTo(failed, last)
      last = p.text
      let msg = ''
      for (let tries = 0; ; ) {
        const v = await ui.askNumber({
          title: `🪤 Caught! Solve ${CAGE_QUESTIONS - solved} more to escape`,
          text: p.text,
          msg,
        })
        // Only the first typed attempt is fresh evidence; retries after feedback are not.
        if (tries === 0) updateSkill(save.skills, save.stats, p, v === p.answer ? 1 : 0)
        if (v === p.answer) {
          sfx.good(solved + 1)
          solved++
          gain(2)
          ui.toast(solved < CAGE_QUESTIONS ? 'Nice! One more!' : 'Free!', 'good')
          break
        }
        sfx.bad()
        if (++tries >= 3) {
          ui.toast(`It was ${p.answer}. Try a new one!`, 'bad')
          break
        }
        msg = 'Not quite, try again!'
        ui.trapFeedback(msg)
      }
    }
    ui.closeTrap()
  }

  const menu = () => {
    world.onPick(null)
    pending = null
    ui.closeTrap()
    ui.hideAnswers()
    setMood('menu')
    world.showSigns(0, null)
    world.load(generateMaze(1), REALMS[activeRealm()])
    world.setOrbit(true)
    ui.showMenu()
  }

  const play = async () => {
    const n = save.mazes + 1
    const level = { name: `Maze ${n}`, emoji: '🧀', junctions: Math.min(4 + Math.floor(n / 2), 10) }
    const before = { ...save.skills }
    const realm = REALMS[activeRealm()]!
    const layout = generateMaze(level.junctions, Math.min(0.3 + n * 0.02, 0.5), { runs: realm.runs, len: realm.len })
    world.load(layout, realm)
    setRealmSound(realm.music)
    world.setSkin(save.color, save.hat)
    world.setOrbit(false)
    world.onPick((i) => pending?.(i))
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
    let lastText: string | undefined

    for (let k = 0; k < layout.junctions.length; k++) {
      const j = layout.junctions[k]!
      const correctIdx = j.exits.findIndex((e) => e.kind === 'path')
      const atJunction = { ...save.skills }
      const tried = new Set<number>()

      for (;;) {
        const p = chooseProblem(save.skills, lastText)
        lastText = p.text
        const wrong = distractors(p)
        const guess = 1 / (j.exits.length - tried.size)
        const firstTry = tried.size === 0
        const labels = j.exits.map((_, i) => (i === correctIdx ? p.answer : wrong.shift()!)).map(String)
        ui.setQuestion(p.text)
        world.showSigns(k, labels)
        ui.showAnswers(labels, realm.doors, (i) => pending?.(i), world.setHover)
        const asked = performance.now()
        const idx = await askExit()
        const ex = j.exits[idx]!
        world.setHover(-1)
        ui.markAnswer(idx, ex.kind === 'path')
        world.markSign(k, idx, ex.kind === 'path')
        sfx.pop()
        await sleep(0.5)
        ui.hideAnswers()
        void world.setDoor(k, idx, true)

        if (ex.kind === 'path') {
          updateSkill(save.skills, save.stats, p, firstTry ? speedOutcome(p, performance.now() - asked) : 1, { guess })
          limitDrop(save.skills, atJunction)
          sfx.good(streak)
          const earned = firstTry ? 10 + 2 * Math.min(streak, 5) : 5
          if (firstTry) streak++
          gain(earned)
          ui.setStreak(streak)
          ui.toast(`Yes! +${earned} 🧀`, 'good')
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

        updateSkill(save.skills, save.stats, p, 0, { guess })
        limitDrop(save.skills, atJunction)
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
          await escapeCage(p)
          limitDrop(save.skills, atJunction)
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
    const grew = unlocked(save.skills)
      .filter((k) => Math.round(save.skills[k]) > Math.round(before[k]) || before[k] < 1)
      .map((k) => describe(k, Math.round(save.skills[k])))
    if (isNew) setTimeout(sfx.sticker, 1400)
    if (grew.length) setTimeout(sfx.levelUp, 2200)
    ui.showFinish({ n, stars, mistakes, bonus, sticker, isNew, grew, newRealm: newRealm ? `${newRealm.emoji} ${newRealm.name}` : undefined })
  }

  return { play, menu }
}
