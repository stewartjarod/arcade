// Drives Rocket Tour: starts a tour, picks lanes at random (wrong ones bounce back), and when a teach card shows,
// checks the rocket holds still (screenshots identical while the card is up), clicks "Got it!", then keeps going.
import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const V = '/home/jarod/Projects/Games/.scratch/learning-ipush/verify/'
const page = await openPage({ url: '/games/rocket-tour/' })
const { evalJs, send, shot, logs, close } = page
const grab = async () => (await send('Page.captureScreenshot', { format: 'png' })).result.data
const snap = () => evalJs(`({
  question: document.querySelector('.question .q')?.innerText ?? null,
  lanes: [...document.querySelectorAll('button[data-i]')].map(b => b.innerText.trim() + (b.disabled ? '[off]' : '')).join(' | '),
  card: !!document.querySelector('.teach-card'),
  cardText: document.querySelector('.teach-card')?.innerText.replace(/\\s+/g,' ').slice(0,200) ?? null,
  planetBtn: [...document.querySelectorAll('button')].find(b => /Blast off|Finish the tour/.test(b.innerText))?.innerText.trim() ?? null,
  start: [...document.querySelectorAll('button')].some(b => b.innerText.includes('Start the tour')),
  finished: /toured the whole solar system/.test(document.body.innerText),
  dust: document.querySelector('.stardust')?.innerText ?? null,
  visited: (document.body.innerText.match(/Planets visited: \\d+ \\/ \\d+/) || [null])[0],
})`)
const say = (...a) => console.log(a.join(' '))
let cards = 0, asked = 0, afterCard = 0, reloads = 0, control = null
try {
  await evalJs(seedJs('space', 2.5))
  await evalJs('location.reload()')
  await sleep(3000)
  for (let step = 0; step < 900 && (cards < 2 || afterCard < 8); step++) {
    const s = await snap()
    if (s.start) { await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('Start the tour')).click()`); await sleep(3000); continue }
    if (s.finished) { reloads++; await evalJs(`document.querySelector('button[data-act=again]')?.click()`); await sleep(3000); continue }
    if (s.card) {
      cards++
      say(`CARD #${cards} shown: "${s.cardText}" | question banner visible=${s.question !== null} | lanes=${s.lanes || 'none'} | ${s.visited}`)
      await sleep(400)
      await shot(V + (cards === 1 ? 'rocket-tour-card.png' : `rocket-tour-card-${cards}.png`))
      const a = await grab()
      await evalJs(`document.querySelector('.teach-card')?.dispatchEvent(new MouseEvent('click', {bubbles:true}))`) // harmless click on the card body
      await sleep(1000)
      const b = await grab()
      await sleep(2000)
      const c = await grab()
      say(`  while card up: frame t0 == t+1s ${a === b}, t0 == t+3s ${a === c} (identical screenshots = nothing moved); card still up=${(await snap()).card}`)
      await evalJs(`document.querySelector('.teach-go')?.click()`)
      await sleep(1500)
      const d = await snap()
      say(`  after Got it: card gone=${!d.card}; question="${d.question}"; lanes="${d.lanes}"`)
      await shot(V + (cards === 1 ? 'rocket-tour-after.png' : `rocket-tour-after-${cards}.png`))
      afterCard = 0
      continue
    }
    if (s.planetBtn) { await evalJs(`[...document.querySelectorAll('button')].find(b => /Blast off|Finish the tour/.test(b.innerText)).click()`); await sleep(1000); continue }
    if (s.question && s.lanes.includes('|') || s.question) {
      if (control === null && cards === 0) {
        // Control: while cruising toward a gate the frame should change between two grabs.
        const x = await grab(); await sleep(1000); const y = await grab(); control = x !== y
        say(`  control (question on screen, not a card): two frames 1s apart differ = ${control}`)
      }
      asked++
      if (cards >= 1) afterCard++
      await evalJs(`(() => { const b = [...document.querySelectorAll('button[data-i]:not([disabled])')]; b[Math.floor(Math.random()*b.length)]?.click() })()`)
      await sleep(1500)
      continue
    }
    await sleep(500)
  }
  say(`SUMMARY: cards=${cards} gate questions=${asked} afterCard=${afterCard} tours finished=${reloads}`)
} finally {
  console.log('LOGS:', logs.join('\n') || 'clean')
  close()
}
