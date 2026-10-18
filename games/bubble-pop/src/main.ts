import { Game, confetti, currentPlayer, hz, music, rand, scale, sfx, storage, tone } from '@arcade/engine'
import { cloud as skyCloud } from '@arcade/assets'
import { heartsMatter, nextPace, PARTY_EVERY, PARTY_SECONDS, QUICK_POINTS, quickPopSeconds, readingSeconds, settingsFor, START_PACE, styleFor } from './difficulty'
import { canSpeak, escapeHTML, findSubject, lessonFor, peekLearner, practiceGrade, renderPrompt, speak, spokenText, startPractice, teachCard, type Question } from '@arcade/learning'

// ------------------------------------------------------------------
//  Bubble Pop
//  A question shows at the top. Answer bubbles float down — tap the right one!
//  If the right bubble reaches the bottom, it lights up so you can see the answer,
//  and a question like it comes next. Older kids also lose a heart.
//  Every few right answers there's a bubble party: free bubbles to pop just for fun.
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

// Soft, floaty background music.
music.play({ chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], note: 0.42, wave: 'sine', sparkle: true })

const QUESTIONS_PER_ROUND = 10
const HEARTS = 3
const COLORS = ['#ff6b6b', '#ffa94d', '#51cf66', '#4dabf7', '#9775fa', '#f783ac']
const PARTY_FRIENDS = ['🐟', '⭐', '🦆', '🎈', '🍓', '🐸', '🦋', '🌸', '🐙', '🍭']

const CHEERS = ['Great! 🎉', 'Yes! ⭐', 'Nice pop! 🫧', 'You got it! 🙌', 'Awesome! 🌟']

// The first tap of the page turns sound on, so the very first round waits for a "Play!" tap.
// After that, "Play again" starts right away.
let started = false

// Little sparkles that fly out from a popped bubble
function sparkle(from: HTMLElement, count = 8) {
  const r = from.getBoundingClientRect()
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div')
    s.textContent = ['✨', '⭐', '💫'][i % 3]!
    s.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;font-size:28px;pointer-events:none;z-index:20;`
    document.body.append(s)
    const a = (i / count) * Math.PI * 2
    const move = s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * 90}px,${Math.sin(a) * 90}px) scale(.4)`, opacity: 0 }], { duration: 600, easing: 'ease-out' })
    move.onfinish = () => s.remove()
  }
}

// A shiny soap-bubble look: see-through color, a white rim and a bright spot of light.
const bubbleLook = (color: string) =>
  `border:3px solid #fffc;background:radial-gradient(circle at 30% 26%,#fffe 0 8%,#fff6 14%,${color}cc 55%,${color} 100%);box-shadow:inset -6px -8px 14px #0002,0 6px 12px #0003;`

function round(game: Game) {
  for (let i = 0; i < 5; i++) game.add(skyCloud()).at(rand(-20, 20), rand(2, 10), rand(-15, -5))

  const { grade } = practiceGrade(peekLearner(), subjectId)
  const { bubbles: bubbleCount, fallSeconds } = settingsFor(grade)
  const practice = startPractice({ subjects: [subjectId], formats: ['choice'] })

  const style = styleFor(grade)
  let hearts = HEARTS
  let bonus = 0 // ⚡ points for quick pops (speedy style)
  let popped = 0
  let partyPops = 0
  let streak = 0
  let pace = START_PACE // slows down after a miss, so nobody gets stuck losing
  // What's happening now: waiting for "Play!", a question, a short pause between questions, a bubble party, or done.
  let phase: 'start' | 'ask' | 'wait' | 'party' | 'over' = 'start'

  // The screen: a question banner on top, a play area for the bubbles below.
  // Only the bubbles and the question box catch taps, so the end-of-round buttons always work.
  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;inset:0;font-family:Fredoka,system-ui,sans-serif;user-select:none;pointer-events:none;'
  root.innerHTML = `
    <div id="bp-top" style="position:absolute;top:10px;left:0;right:0;text-align:center;"></div>
    <div id="bp-q" style="position:absolute;top:56px;left:50%;transform:translateX(-50%);width:max-content;max-width:min(92vw,640px);box-sizing:border-box;background:#fffd;border-radius:24px;padding:10px 24px;box-shadow:0 6px 0 #0002;text-align:center;pointer-events:auto;visibility:hidden;"></div>
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
  let firstInMoment = true // only a brand-new question can earn the ⚡ bonus, not the "one like it" after a miss
  let live: { el: HTMLButtonElement; y: number; x: number; wobble: number; right: boolean; w: number; h: number; speed: number }[] = []
  let age = 0 // seconds since the bubbles appeared
  let lockedUntil = 0 // after mashing, no pops until `age` gets here

  /** Ask a new question, or (after a miss) one like the last, so they get another go at the same idea. */
  async function nextQuestion(like?: Question) {
    play.replaceChildren()
    live = []
    if (like) {
      q = moment.similar(like)
      firstInMoment = false
    } else {
      moment = practice.moment()
      q = moment.ask()
      firstInMoment = true
      // A topic the kid hasn't seen gets its "how it works" card first. Nothing falls or pops while it's up:
      // any phase other than 'ask' is a pause.
      if (q.item.frontier) {
        phase = 'wait'
        await teachCard(lessonFor(q.item))
      }
    }
    showQuestion()

    const options = q.options(bubbleCount)
    const longest = Math.max(...options.map((o) => o.length))
    const laneWidth = window.innerWidth / bubbleCount
    // Numbers fit in a round bubble; words and sentences need a wider one that wraps its text.
    // On a narrow phone every bubble shrinks to fit its lane, so they never cover each other.
    const want = longest <= 4 ? { w: 110, h: 110, font: 36 } : longest <= 9 ? { w: 170, h: 100, font: 26 } : { w: 240, h: 130, font: longest > 24 ? 19 : 24 }
    const shrink = Math.min(1, (laneWidth - 8) / want.w)
    const w = want.w * shrink
    const h = longest <= 4 ? w : want.h * Math.max(shrink, 0.85)
    const font = Math.max(15, want.font * Math.max(shrink, 0.7))

    // The bubbles start just under the question, and take long enough to fall that there's time to read it.
    const startY = qBox.getBoundingClientRect().bottom + 14
    const seconds = (fallSeconds + readingSeconds(q.text)) / pace
    options.forEach((text, i) => {
      const el = document.createElement('button')
      el.textContent = text
      el.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;padding:6px;line-height:1.1;${bubbleLook(COLORS[(i + popped) % COLORS.length]!)}font:700 ${font}px Fredoka,system-ui;color:#fff;text-shadow:0 0 3px #000b,0 2px 3px #000b;cursor:pointer;pointer-events:auto;touch-action:manipulation;`
      const lane = (i + 0.5) / bubbleCount
      const y = startY + rand(0, 30)
      const bubble = { el, y, x: lane, wobble: rand(0, 6), right: text === q.answer, w, h, speed: (window.innerHeight - y - h - 10) / seconds }
      // pointerdown, not click: a moving target is easier to hit when the tap counts right away.
      el.onpointerdown = () => pop(bubble)
      play.append(el)
      live.push(bubble)
      // They blow in with a little "bloop" one after another.
      el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 350, delay: i * 70, easing: 'ease-out', fill: 'backwards' })
    })
    place()
    age = 0
    lockedUntil = 0
    q.restartTimer()
    phase = 'ask'
    // Kindergartners and first graders are still learning to read: say the question out loud for them.
    if (grade <= 1) speak(spokenText(q.prompt))
  }

  function showQuestion() {
    qBox.style.visibility = 'visible'
    qBox.replaceChildren(renderPrompt(q.prompt))
    // Questions with their own words to say get a 🔊 from renderPrompt. Sums like "7 + 5" don't,
    // so young players get one here too, in case they want to hear it again.
    const words = spokenText(q.prompt)
    if (grade <= 3 && !q.prompt.say && canSpeak(words)) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'lp-say'
      b.textContent = '🔊 Hear it'
      b.onclick = () => speak(words)
      qBox.append(b)
    }
  }

  function note(html: string, color: string) {
    qBox.insertAdjacentHTML('beforeend', `<div style="color:${color};font-weight:700;font-size:22px">${html}</div>`)
  }

  function pop(b: (typeof live)[number]) {
    // Ignore taps in the first half second: a fast tap left over from the party or the last pop
    // shouldn't count as an answer to a question nobody has read yet.
    if (phase !== 'ask' || age < 0.5 || age < lockedUntil) return
    const right = moment.check(q, b.el.textContent!, { choices: live.length })
    if (right) {
      sfx.pop()
      sfx.good(streak++)
      popped++
      pace = nextPace(pace, true)
      // Speedy style: a quick first-try pop earns bonus points.
      const quickLimit = quickPopSeconds(style)
      const quick = quickLimit > 0 && firstInMoment && live.length === bubbleCount && (performance.now() - q.askedAt) / 1000 <= quickLimit
      if (quick) bonus += QUICK_POINTS
      sparkle(b.el)
      b.el.style.background = '#22c55e'
      b.el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 350, fill: 'forwards' })
      note(quick ? `⚡ Quick! +${QUICK_POINTS}` : CHEERS[streak % CHEERS.length]!, '#2b8a3e')
      showTop()
      phase = 'wait'
      const party = popped % PARTY_EVERY === 0 && popped < QUESTIONS_PER_ROUND
      game.after(0.7, () => (popped >= QUESTIONS_PER_ROUND ? win() : party ? bubbleParty() : nextQuestion()))
    } else {
      // A wrong bubble pops and is gone; the others keep falling, so there's still time to find the right one.
      streak = 0
      sfx.bad()
      b.el.style.background = '#ef4444'
      b.el.disabled = true
      b.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(12px)' }, { transform: 'translateX(0) scale(.5)', opacity: 0 }], { duration: 400, fill: 'forwards' })
      showTop()
      live = live.filter((x) => x !== b)
      // Popping bubbles super fast without reading? A short wait, so guessing is slower than thinking.
      const wait = practice.slowDown()
      if (wait > 0) {
        lockedUntil = age + wait
        play.animate([{ opacity: 0.4 }, { opacity: 0.4, offset: 0.9 }, { opacity: 1 }], { duration: wait * 1000 })
        note('🐢 Slow down! Read it, then pop.', '#7048e8')
      }
    }
  }

  // Move each bubble's button to where the bubble is, with a little side-to-side sway.
  function place() {
    for (const b of live) {
      b.el.style.left = `calc(${b.x * 100}% - ${b.w / 2}px + ${Math.sin(b.wobble) * 10}px)`
      b.el.style.top = `${b.y}px`
    }
  }

  game.onUpdate((dt) => {
    if (phase === 'party') return updateParty(dt)
    if (phase !== 'ask') return
    // The bubbles start slow and pick up speed over the first second or so — a moment to read the question first.
    age += dt
    const ease = Math.min(1, age / 1.5)
    for (const b of live) {
      b.y += b.speed * ease * dt
      b.wobble += dt * 1.5
    }
    place()
    if (live.some((b) => b.right && b.y > window.innerHeight - b.h - 10)) missed()
  })

  // The right bubble reached the bottom: light it up so they see the answer, then try one like it.
  function missed() {
    phase = 'wait'
    streak = 0
    pace = nextPace(pace, false)
    moment.record(q, false, { choices: live.length })
    sfx.bad()
    if (heartsMatter(style)) hearts--
    showTop()
    for (const b of live) {
      if (b.right) {
        b.el.style.boxShadow = '0 0 0 6px #ffd43b, 0 0 30px 12px #ffd43bcc'
        b.el.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-60px) scale(1.25)' }], { duration: 500, easing: 'ease-out', fill: 'forwards' })
      } else {
        b.el.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 300, fill: 'forwards' })
      }
    }
    note(`Here it is: ${escapeHTML(q.answer)}!${hearts > 0 ? ' Try one like it!' : ''}`, '#c92a2a')
    speak('Here it is!')
    const last = q
    game.after(2.2, () => (hearts <= 0 ? lose() : nextQuestion(last)))
  }

  // ---- Bubble party: a few seconds of free bubbles with friends inside. Just for fun, no questions. ----
  let party: { el: HTMLButtonElement; y: number; x: number; wobble: number; speed: number; size: number }[] = []

  function bubbleParty() {
    phase = 'party'
    play.replaceChildren()
    live = []
    qBox.replaceChildren()
    note('🎉 Bubble party! Pop them all!', '#9c36b5')
    speak('Bubble party! Pop them all!')
    const h = window.innerHeight
    const size = Math.min(90, window.innerWidth / 5)
    for (let i = 0; i < 14; i++) {
      const el = document.createElement('button')
      el.textContent = PARTY_FRIENDS[i % PARTY_FRIENDS.length]!
      el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;padding:0;${bubbleLook(COLORS[i % COLORS.length]!)}font-size:${size * 0.45}px;cursor:pointer;pointer-events:auto;touch-action:manipulation;`
      const b = { el, y: h + rand(0, h * 0.6), x: rand(0.08, 0.92), wobble: rand(0, 6), speed: h / rand(2.6, 3.6), size }
      el.onpointerdown = () => partyPop(b)
      play.append(el)
      party.push(b)
    }
    game.after(PARTY_SECONDS, endParty)
  }

  function updateParty(dt: number) {
    for (const b of party) {
      b.y -= b.speed * dt // party bubbles float up, like real ones
      b.wobble += dt * 2
      b.el.style.left = `calc(${b.x * 100}% - ${b.size / 2}px + ${Math.sin(b.wobble) * 14}px)`
      b.el.style.top = `${b.y}px`
    }
  }

  function partyPop(b: (typeof party)[number]) {
    if (phase !== 'party') return
    // Each pop plays the next note up the scale, so popping lots makes a little tune.
    tone(hz(scale(partyPops % 10) + 12), 0, 0.18, { type: 'triangle', vol: 0.12 })
    sfx.pop()
    partyPops++
    sparkle(b.el, 5)
    b.el.remove()
    party = party.filter((x) => x !== b)
    qBox.replaceChildren()
    note(`🎉 Bubble party! 🫧 ${partyPops}`, '#9c36b5')
  }

  function endParty() {
    party = []
    nextQuestion()
  }

  function win() {
    phase = 'over'
    play.replaceChildren() // clear the leftover bubbles
    const score = Math.max(1, popped * 10 + (heartsMatter(style) ? hearts * 5 : 0) + bonus + partyPops)
    const record = save.highScore(score)
    const grew = practice.grew()
    sfx.win()
    confetti(['🫧', '⭐', '🎉', '✨', '🎈'])
    speak('You popped them all!')
    game.hud.message('You popped them all! 🎉', {
      subtitle: [
        `${heartsMatter(style) ? `${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left · ` : ''}score ${score}${bonus ? ` (⚡ ${bonus})` : ''}${record ? ' — NEW RECORD!' : ''}`,
        grew.length ? ` · 📈 Now learning: ${grew.join(' · ')}` : '',
      ].join(''),
      button: 'Play again',
      onClick: () => game.restart(),
    })
  }

  function lose() {
    phase = 'over'
    play.replaceChildren()
    speak('Nice try!')
    game.hud.message('Nice try! 💪', { subtitle: `You popped ${popped} ${popped === 1 ? 'bubble' : 'bubbles'}. Want another go?`, button: 'Try again', onClick: () => game.restart() })
  }

  if (started) nextQuestion()
  else {
    game.hud.message('Bubble Pop 🫧', {
      subtitle: 'Pop the bubble with the right answer!',
      button: 'Play!',
      onClick: () => {
        started = true
        nextQuestion()
      },
    })
  }
  return () => root.remove() // cleanup when the scene restarts
}

game.start(round)
