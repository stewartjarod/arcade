import { Game, confetti, currentPlayer, rand, sfx, storage } from '@arcade/engine'
import { cloud as skyCloud } from '@arcade/assets'
import { heartsMatter, QUICK_POINTS, quickPopSeconds, settingsFor, styleFor } from './difficulty'
import { escapeHTML, findSubject, peekLearner, practiceGrade, renderPrompt, speak, spokenText, startPractice, type Question } from '@arcade/learning'

// ------------------------------------------------------------------
//  Bubble Pop
//  A question shows at the top. Answer bubbles float down — tap the right one!
//  If the right bubble reaches the bottom, or you pop wrong ones too often, you lose a heart.
//  More bubbles and faster drops as you move up in IXL math grades (found by the learning package).
// ------------------------------------------------------------------

// What to practice: ?subject=reading in the address, else the grown-up's focus subject, else math.
const fromUrl = new URLSearchParams(location.search).get('subject')
// Any subject that has multiple-choice questions works here (typed-only skills like spelling are skipped).
const canPlay = (id?: string | null): id is string => !!id && !!findSubject(id)?.skills.some((k) => k.formats.includes('choice'))
const subjectId = [fromUrl, currentPlayer().focus].find(canPlay) ?? 'math'
const subjectName = findSubject(subjectId)!.name

const game = new Game({ background: '#d0ebff' })
const save = storage('bubble-pop')

const QUESTIONS_PER_ROUND = 10
const HEARTS = 3
const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']

const CHEERS = ['Great! 🎉', 'Yes! ⭐', 'Nice pop! 🫧', 'You got it! 🙌', 'Awesome! 🌟']

// Little sparkles that fly out from a popped bubble
function sparkle(from: HTMLElement) {
  const r = from.getBoundingClientRect()
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div')
    s.textContent = ['✨', '⭐', '💫'][i % 3]!
    s.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;font-size:28px;pointer-events:none;z-index:20;`
    document.body.append(s)
    const a = (i / 8) * Math.PI * 2
    const move = s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * 90}px,${Math.sin(a) * 90}px) scale(.4)`, opacity: 0 }], { duration: 600, easing: 'ease-out' })
    move.onfinish = () => s.remove()
  }
}

function round(game: Game) {
  for (let i = 0; i < 5; i++) game.add(skyCloud()).at(rand(-20, 20), rand(2, 10), rand(-15, -5))

  const { grade } = practiceGrade(peekLearner(), subjectId)
  const { bubbles: bubbleCount, fallSeconds } = settingsFor(grade)
  const practice = startPractice({ subjects: [subjectId], formats: ['choice'] })

  const style = styleFor(grade)
  let hearts = HEARTS
  let bonus = 0 // ⚡ points for quick pops (speedy style)
  let asked = 0
  let popped = 0
  let streak = 0
  let over = false

  // The screen: a question banner on top, a play area for the bubbles below
  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;inset:0;font-family:Fredoka,system-ui,sans-serif;user-select:none;'
  root.innerHTML = `
    <div id="bp-top" style="position:absolute;top:10px;left:0;right:0;text-align:center;pointer-events:none;"></div>
    <div id="bp-q" style="position:absolute;top:56px;left:50%;transform:translateX(-50%);background:#fffd;border-radius:24px;padding:10px 24px;box-shadow:0 6px 0 #0002;text-align:center;"></div>
    <div id="bp-play" style="position:absolute;inset:0;overflow:hidden;"></div>`
  document.body.append(root)
  const top = root.querySelector<HTMLElement>('#bp-top')!
  const qBox = root.querySelector<HTMLElement>('#bp-q')!
  const play = root.querySelector<HTMLElement>('#bp-play')!

  const showTop = () => {
    top.innerHTML = `<span style="font-size:26px;font-weight:700;color:#1c4a7a">${heartsMatter(style) ? `${'❤️'.repeat(hearts)}${'🖤'.repeat(HEARTS - hearts)} &nbsp; ` : ''}🫧 ${popped}/${QUESTIONS_PER_ROUND} &nbsp; ${streak >= 2 ? `🔥 ${streak} in a row &nbsp; ` : ''}${bonus > 0 ? `⚡ ${bonus} &nbsp; ` : ''}${escapeHTML(subjectName.toLowerCase())}</span>`
  }
  showTop()

  // One question at a time
  let q: Question
  let moment: ReturnType<typeof practice.moment>
  let live: { el: HTMLButtonElement; y: number; x: number; wobble: number; right: boolean; w: number; h: number }[] = []
  let waiting = false // between questions

  function nextQuestion() {
    play.replaceChildren()
    live = []
    moment = practice.moment()
    q = moment.ask()
    asked++
    qBox.replaceChildren(renderPrompt(q.prompt))
    const options = q.options(bubbleCount)
    const longest = Math.max(...options.map((o) => o.length))
    const laneWidth = window.innerWidth / bubbleCount
    // Numbers fit in a round bubble; words and sentences need a wider one that wraps its text.
    const size = longest <= 4 ? { w: 104, h: 104, font: 34 } : longest <= 9 ? { w: Math.min(170, laneWidth - 12), h: 100, font: 26 } : { w: Math.min(240, laneWidth - 12), h: 130, font: longest > 24 ? 19 : 24 }
    options.forEach((text, i) => {
      const el = document.createElement('button')
      const color = COLORS[i % COLORS.length]!
      el.textContent = text
      el.style.cssText = `position:absolute;width:${size.w}px;height:${size.h}px;border-radius:${size.w > size.h ? 60 : 50}px;padding:6px;line-height:1.1;border:4px solid #fff9;background:radial-gradient(circle at 30% 28%,#fff9,${color});font:700 ${size.font}px Fredoka,system-ui;color:#fff;text-shadow:0 0 3px #000b,0 2px 3px #000b;cursor:pointer;box-shadow:0 6px 12px #0003;`
      const lane = (i + 0.5) / bubbleCount
      const bubble = { el, y: qBox.getBoundingClientRect().bottom + 14 + rand(0, 30), x: lane, wobble: rand(0, 6), right: text === q.answer, w: size.w, h: size.h }
      el.onclick = () => pop(bubble)
      play.append(el)
      live.push(bubble)
    })
    q.restartTimer()
    waiting = false
    // Kindergartners and first graders are still learning to read: say the question out loud for them.
    if (grade <= 1) speak(spokenText(q.prompt))
  }

  function pop(b: (typeof live)[number]) {
    if (waiting || over) return
    const right = moment.check(q, b.el.textContent!, { choices: live.length })
    if (right) {
      sfx.pop()
      sfx.good(streak++)
      popped++
      // Speedy style: a quick first-try pop earns bonus points.
      const quickLimit = quickPopSeconds(style)
      const quick = quickLimit > 0 && live.length === bubbleCount && (performance.now() - q.askedAt) / 1000 <= quickLimit
      if (quick) bonus += QUICK_POINTS
      sparkle(b.el)
      b.el.style.background = '#22c55e'
      b.el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 350, fill: 'forwards' })
      qBox.insertAdjacentHTML('beforeend', `<div style="color:#2b8a3e;font-weight:700;font-size:22px">${quick ? `⚡ Quick! +${QUICK_POINTS}` : CHEERS[streak % CHEERS.length]}</div>`)
      showTop()
      waiting = true
      setTimeout(() => (popped >= QUESTIONS_PER_ROUND ? win() : nextQuestion()), 600)
    } else {
      streak = 0
      sfx.bad()
      b.el.style.background = '#ef4444'
      b.el.disabled = true
      b.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(12px)' }, { transform: 'translateX(0)', opacity: 0.35 }], { duration: 350, fill: 'forwards' })
      showTop()
      live = live.filter((x) => x !== b) // a wrong bubble pops and is gone; the others keep falling
    }
  }

  // The bubbles drift down; if the right one reaches the bottom, that's a lost heart
  game.onUpdate((dt) => {
    if (waiting || over) return
    const h = window.innerHeight
    const speed = (h - 150) / fallSeconds
    for (const b of live) {
      b.y += speed * dt
      b.wobble += dt * 1.5
      b.el.style.left = `calc(${b.x * 100}% - ${b.w / 2}px + ${Math.sin(b.wobble) * 10}px)`
      b.el.style.top = `${b.y}px`
      if (b.right && b.y > h - b.h - 10) return missed()
    }
  })

  function missed() {
    if (waiting) return
    waiting = true
    streak = 0
    moment.record(q, false, { choices: live.length })
    sfx.bad()
    if (heartsMatter(style)) hearts--
    showTop()
    // Cozy style (K–1): nothing is lost, the question is simply shown and a new one comes.
    qBox.insertAdjacentHTML('beforeend', `<div style="color:#c92a2a;font-weight:700">It was ${escapeHTML(q.answer)}!${heartsMatter(style) ? '' : " Let's try another!"}</div>`)
    setTimeout(() => (hearts <= 0 ? lose() : nextQuestion()), 1400)
  }

  function win() {
    over = true
    play.replaceChildren() // clear the leftover bubbles
    const score = Math.max(1, popped * 10 + (heartsMatter(style) ? hearts * 5 : 0) + bonus)
    const record = save.highScore(score)
    sfx.win?.()
    confetti()
    game.hud.message('You popped them all! 🎉', {
      subtitle: `${heartsMatter(style) ? `${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left · ` : ''}score ${score}${bonus ? ` (⚡ ${bonus})` : ''}${record ? ' — NEW RECORD!' : ''}`,
      button: 'Play again',
      onClick: () => game.restart(),
    })
  }

  function lose() {
    over = true
    play.replaceChildren()
    game.hud.message('Out of hearts!', { subtitle: `You popped ${popped}. Try again!`, button: 'Try again', onClick: () => game.restart() })
  }

  nextQuestion()
  return () => root.remove() // cleanup when the scene restarts
}

game.start(round)
