import { Game, THREE, ball, box, cylinder, group, lerp, storage, confetti, burst, ease, sfx, currentPlayer } from '@arcade/engine'
import { escapeHTML, findSubject, gradeName, peekLearner, practiceGrade, renderPrompt, speak, spokenText, startPractice, type Question } from '@arcade/learning'
import { pondFor } from './difficulty'

// ------------------------------------------------------------------
//  Lily Hop
//  A question shows at the top. Three colored lily pads wait ahead, one per answer.
//  Tap the answer (or the matching key) and the frog hops to that pad. One tap per hop!
//  A wrong pad sinks and the gator swims closer. The pond gets longer and the gator
//  sneakier as you move up in IXL grade levels (found by the learning package).
// ------------------------------------------------------------------

// What to practice: ?subject=reading in the address, else the grown-up's focus subject, else math.
// Any subject that has multiple-choice questions works here.
const canPlay = (id?: string | null): id is string => !!id && !!findSubject(id)?.skills.some((k) => k.formats.includes('choice'))
const fromUrl = new URLSearchParams(location.search).get('subject')
const subjectId = [fromUrl, currentPlayer().focus].find(canPlay) ?? 'math'
const subjectName = findSubject(subjectId)!.name

const game = new Game({ background: '#bfe9ff' })
const save = storage('lily-hop')

const SPACING = 3.2 // distance between rows of pads
const LANE_X = [-3, 0, 3]
const LANE_COLORS = ['#ff6b6b', '#ffa94d', '#4dabf7']
const GATOR_HEAD_START = 3 // how many rows behind you the gator begins
const CHEERS = ['Hop! 🐸', 'Nice! ⭐', 'Yes! 🎉', 'Great jump! 🌟']

// Space / 1 2 3 / arrow keys also pick a pad; the newest scene's picker is kept here so restarts don't stack listeners.
let pickNow: (lane: number) => void = () => {}
window.addEventListener('keydown', (e) => {
  const lane = { Digit1: 0, Digit2: 1, Digit3: 2, ArrowLeft: 0, ArrowUp: 1, ArrowDown: 1, ArrowRight: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]
  if (lane !== undefined) pickNow(lane)
})

function level(game: Game) {
  const { grade, known } = practiceGrade(peekLearner(), subjectId)
  const pond = pondFor(grade)
  const padZ = (row: number) => -row * SPACING
  const practice = startPractice({ subjects: [subjectId], formats: ['choice'] })

  let frogRow = 0
  let gatorRow = -GATOR_HEAD_START
  let streak = 0
  let wrong = 0
  let busy = false // true while a hop or a splash is happening
  let over = false

  // --- The pond: row 0 is the start, the last row is the gold finish pad; rows between have three pads ---
  game.add(box({ size: [80, 0.2, 240], color: '#4dabf7' })).at(0, -0.2, -pond.pads * SPACING * 0.5)
  const pads: THREE.Object3D[][] = []
  for (let row = 0; row <= pond.pads; row++) {
    const finish = row === pond.pads
    const lanes = row === 0 || finish ? [1] : [0, 1, 2]
    pads[row] = []
    for (const lane of lanes) {
      const mesh = cylinder({ radius: finish ? 1.8 : 1.2, height: 0.15, color: finish ? '#ffd43b' : row === 0 ? '#51cf66' : LANE_COLORS[lane]! })
      game.add(mesh).at(finish || row === 0 ? 0 : LANE_X[lane]!, 0, padZ(row))
      pads[row]![lane] = mesh
    }
  }

  // The frog: a green ball with two eyes
  const frog = group(
    ball({ radius: 0.6, color: '#37b24d' }),
    ball({ radius: 0.22, color: '#fff' }).translateX(-0.25).translateY(0.5).translateZ(-0.3),
    ball({ radius: 0.22, color: '#fff' }).translateX(0.25).translateY(0.5).translateZ(-0.3),
  )
  const frogEntity = game.add(frog).at(0, 0.6, padZ(0))

  // The gator: a long green box with a snout, swimming up the middle
  const gator = group(box({ size: [1.4, 0.6, 3], color: '#2b8a3e' }), box({ size: [1, 0.4, 1.2], color: '#2f9e44' }).translateZ(-2))
  const gatorEntity = game.add(gator).at(0, 0.2, padZ(gatorRow))

  // The camera rides along, a little behind and above the frog
  game.onUpdate(() => {
    game.camera.position.lerp(new THREE.Vector3(5, 9, frogEntity.position.z + 14), 0.1)
    game.camera.lookAt(0, 0, frogEntity.position.z - 2)
  })

  // While a hop is happening the frog follows a little arc
  let hop: { t: number; from: THREE.Vector3; to: THREE.Vector3 } | null = null
  const placeFrog = () => hop && frogEntity.position.set(lerp(hop.from.x, hop.to.x, hop.t), 0.6 + Math.sin(hop.t * Math.PI) * 1.4, lerp(hop.from.z, hop.to.z, hop.t))
  game.onUpdate(placeFrog)
  async function hopTo(row: number, lane: number) {
    hop = { t: 0, from: frogEntity.position.clone(), to: new THREE.Vector3(row === pond.pads ? 0 : LANE_X[lane]!, 0.6, padZ(row)) }
    await game.tweens.to(hop, { t: 1 }, 0.45, ease.out)
    placeFrog()
    hop = null
  }

  async function moveGator() {
    gatorRow++
    sfx.bad()
    await game.tweens.to(gatorEntity.position, { z: padZ(gatorRow) }, 0.5)
    if (gatorRow >= frogRow) lose()
  }
  // From grade 2 up the gator also swims by itself, so there's a little hurry
  if (pond.gatorEvery) game.every(pond.gatorEvery, () => !busy && !over && moveGator())

  // --- The question and the three answer buttons ---
  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;font-family:Fredoka,system-ui,sans-serif;'
  root.innerHTML = `<div id="lh-q" style="position:absolute;top:64px;left:50%;transform:translateX(-50%);max-width:92vw;background:#fffe;border-radius:24px;padding:10px 22px;box-shadow:0 6px 0 #0002;text-align:center;pointer-events:auto"></div>
    <div id="lh-answers" style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:12px;width:min(94vw,640px);pointer-events:auto"></div>`
  document.body.append(root)
  const qBox = root.querySelector<HTMLElement>('#lh-q')!
  const answers = root.querySelector<HTMLElement>('#lh-answers')!

  let q: Question
  let moment: ReturnType<typeof practice.moment>
  let options: string[] = []
  let open = new Set<number>()
  let missedThisQuestion = false

  const showTop = () => {
    game.hud.set('pads', `🪷 ${frogRow} / ${pond.pads}`, 'top-left')
    game.hud.set('grade', `🐸 Lily Hop · ${known ? `${gradeName(grade)} ` : ''}${subjectName.toLowerCase()}${streak >= 2 ? ` · 🔥 ${streak}` : ''}`, 'top')
    game.hud.set('best', `🏆 ${save.get('best', 0)}`, 'top-right')
  }

  function ask() {
    moment = practice.moment()
    q = moment.ask()
    options = q.options(3)
    open = new Set([0, 1, 2])
    missedThisQuestion = false
    qBox.replaceChildren(renderPrompt(q.prompt))
    const long = Math.max(...options.map((o) => o.length)) > 8
    answers.innerHTML = options
      .map((o, i) => `<button data-i="${i}" style="flex:1;min-width:0;border:4px solid #fff;border-radius:24px;background:${LANE_COLORS[i]};color:#fff;font:700 ${long ? 22 : 38}px Fredoka,system-ui;padding:14px 6px;cursor:pointer;box-shadow:0 7px 0 #0004;text-shadow:0 0 3px #000b,0 2px 3px #000b;line-height:1.1"><span style="display:block;font-size:14px;opacity:.9">${['⬅', '⬆', '➡'][i]}</span>${escapeHTML(o)}</button>`)
      .join('')
    answers.querySelectorAll<HTMLButtonElement>('button').forEach((b) => (b.onclick = () => pick(Number(b.dataset.i))))
    q.restartTimer()
    if (grade <= 1) speak(spokenText(q.prompt)) // young readers: say it out loud
    showTop()
  }

  async function pick(lane: number) {
    if (busy || over || !open.has(lane)) return
    busy = true
    const button = answers.querySelectorAll<HTMLButtonElement>('button')[lane]!
    const right = moment.check(q, options[lane]!, { choices: open.size })
    const nextRow = frogRow + 1
    if (right) {
      sfx.good(streak++)
      button.style.background = '#22c55e'
      await hopTo(nextRow, lane)
      frogRow = nextRow
      burst(game, frogEntity.position)
      game.hud.message(CHEERS[streak % CHEERS.length]!, { seconds: 0.7 })
      showTop()
      if (frogRow >= pond.pads) return win()
      ask()
    } else {
      streak = 0
      open.delete(lane)
      button.disabled = true
      button.style.opacity = '.35'
      sfx.bad()
      // That pad sinks. The first wrong pick on a question brings the gator closer.
      const pad = pads[nextRow]?.[lane]
      if (pad) void game.tweens.to(pad.position, { y: -1.2 }, 0.5)
      showTop()
      if (!missedThisQuestion) {
        missedThisQuestion = true
        wrong++
        game.hud.message('Splash! The gator is closer!', { seconds: 1.1 })
        await moveGator()
      }
    }
    busy = false
  }
  pickNow = (lane) => pick(lane)

  function win() {
    over = true
    root.remove()
    const score = Math.max(1, pond.pads * 10 - wrong * 5)
    const record = save.highScore(score)
    sfx.win()
    confetti()
    game.hud.message('You crossed the pond! 🎉', {
      subtitle: `${wrong} ${wrong === 1 ? 'splash' : 'splashes'} · score ${score}${record ? ' — NEW RECORD!' : ''}`,
      button: 'Play again',
      onClick: () => game.restart(),
    })
  }

  function lose() {
    over = true
    root.remove()
    sfx.bad()
    game.hud.message('Chomp! 🐊', { subtitle: 'Try again, you can do it!', button: 'Try again', onClick: () => game.restart() })
  }

  ask()
  return () => {
    root.remove()
    pickNow = () => {}
  }
}

game.start(level)
