// Drives Lily Hop: plays with random answer taps (wrong ones are fine), and when a teach card shows,
// checks the game holds still, clicks "Got it!", then keeps playing. Screenshots land in this folder.
import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const V = '/home/jarod/Projects/Games/.scratch/learning-ipush/verify/'
const page = await openPage({ url: '/games/lily-hop/?subject=math' })
const { evalJs, shot, logs, close } = page
const snap = () => evalJs(`({
  q: document.querySelector('#lh-q')?.innerText ?? '',
  pads: (document.body.innerText.match(/🪷 (\\d+) \\/ \\d+/) || [])[1],
  answers: [...document.querySelectorAll('#lh-answers button')].map(b => b.innerText.replace(/\\s+/g,' ') + (b.disabled ? '[off]' : '')).join(' | '),
  card: !!document.querySelector('.teach-card'),
  cardTitle: document.querySelector('.teach-card .lp-title')?.innerText ?? null,
  cardText: document.querySelector('.teach-card')?.innerText.replace(/\\s+/g,' ').slice(0,200) ?? null,
  over: /Chomp|crossed the pond/.test(document.body.innerText),
})`)
const report = []
const say = (...a) => { const s = a.join(' '); report.push(s); console.log(s) }
let cards = 0, asked = 0, lastQ = '', afterCard = 0, reloads = 0
try {
  await evalJs(seedJs('math', 1))
  await evalJs('location.reload()')
  await sleep(3000)
  for (let step = 0; step < 400 && (cards < 2 || afterCard < 8); step++) {
    const s = await snap()
    if (s.over) { reloads++; await evalJs('location.reload()'); await sleep(3000); lastQ = ''; continue }
    if (s.card) {
      cards++
      say(`CARD #${cards} shown: title=${s.cardTitle} text="${s.cardText}"`)
      await sleep(400)
      await shot(V + (cards === 1 ? 'lily-hop-card.png' : `lily-hop-card-${cards}.png`))
      const a = await snap()
      // Pause test: poke a stale answer button while the card is up; nothing should change.
      await evalJs(`document.querySelector('#lh-answers button:not([disabled])')?.click()`)
      await sleep(1000)
      const b = await snap()
      await sleep(2000)
      const c = await snap()
      say(`  while card up (t0/t+1s/t+3s): pads ${a.pads}/${b.pads}/${c.pads}; question unchanged=${a.q === c.q}; answer buttons unchanged=${a.answers === c.answers}; card still up=${c.card}`)
      await evalJs(`document.querySelector('.teach-go')?.click()`)
      await sleep(1200)
      const d = await snap()
      say(`  after Got it: card gone=${!d.card}; new question="${d.q}"; answers=${d.answers}`)
      await shot(V + (cards === 1 ? 'lily-hop-after.png' : `lily-hop-after-${cards}.png`))
      afterCard = 0
      lastQ = d.q
      continue
    }
    // Play: tap a random enabled answer, pausing so the kid-speed slow-down doesn't kick in.
    if (s.q && s.q !== lastQ) { asked++; lastQ = s.q; if (cards >= 1) afterCard++ }
    await evalJs(`(() => { const b = [...document.querySelectorAll('#lh-answers button:not([disabled])')]; b[Math.floor(Math.random()*b.length)]?.click() })()`)
    await sleep(1400)
  }
  say(`SUMMARY: cards=${cards} questions seen=${asked} afterCard=${afterCard} reloads(game over)=${reloads}`)
} finally {
  console.log('LOGS:', logs.join('\n') || 'clean')
  close()
}
