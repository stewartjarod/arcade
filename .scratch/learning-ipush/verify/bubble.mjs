// Drives Bubble Pop: taps random bubbles. When a teach card shows, checks nothing falls or pops while it's up,
// clicks "Got it!", then keeps popping. Screenshots land in this folder.
import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const V = '/home/jarod/Projects/Games/.scratch/learning-ipush/verify/'
const page = await openPage({ url: '/games/bubble-pop/?subject=math' })
const { evalJs, shot, logs, close } = page
// Bubbles are the round buttons the game creates (border-radius 50%).
const snap = () => evalJs(`({
  q: document.querySelector('.play')?.innerText ?? [...document.querySelectorAll('div')].map(d => d.innerText).find(t => false) ?? '',
  bubbles: [...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%').map(b => b.innerText.trim() + '@' + Math.round(b.getBoundingClientRect().top)).join(' | '),
  hud: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 160),
  card: !!document.querySelector('.teach-card'),
  cardTitle: document.querySelector('.teach-card .lp-title')?.innerText ?? null,
  cardText: document.querySelector('.teach-card')?.innerText.replace(/\\s+/g,' ').slice(0,200) ?? null,
  over: /Nice try|Play again|NEW RECORD|Try again/.test(document.body.innerText),
  playBtn: [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Play!') ? true : false,
})`)
const say = (...a) => console.log(a.join(' '))
let cards = 0, asked = 0, lastQ = '', afterCard = 0, reloads = 0
try {
  await evalJs(seedJs('math', 1))
  await evalJs('location.reload()')
  await sleep(3000)
  for (let step = 0; step < 500 && (cards < 2 || afterCard < 8); step++) {
    const s = await snap()
    if (s.playBtn) { await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Play!').click()`); await sleep(1500); continue }
    if (s.over) { reloads++; await evalJs('location.reload()'); await sleep(3000); lastQ = ''; continue }
    if (s.card) {
      cards++
      say(`CARD #${cards} shown: title=${s.cardTitle} text="${s.cardText}"`)
      await sleep(400)
      await shot(V + (cards === 1 ? 'bubble-pop-card.png' : `bubble-pop-card-${cards}.png`))
      const a = await snap()
      // Pause test: try to pop a stale bubble (if any) while the card is up.
      await evalJs(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.style.borderRadius === '50%'); b?.onpointerdown?.(new Event('pointerdown')); b?.click() })()`)
      await sleep(1000)
      const b = await snap()
      await sleep(2000)
      const c = await snap()
      say(`  while card up (t0/t+1s/t+3s): bubbles on screen="${a.bubbles}" -> "${b.bubbles}" -> "${c.bubbles}"; hud unchanged=${a.hud === c.hud}; card still up=${c.card}`)
      await evalJs(`document.querySelector('.teach-go')?.click()`)
      await sleep(1500)
      const d = await snap()
      say(`  after Got it: card gone=${!d.card}; bubbles now="${d.bubbles}"; hud="${d.hud.slice(0, 120)}"`)
      await shot(V + (cards === 1 ? 'bubble-pop-after.png' : `bubble-pop-after-${cards}.png`))
      afterCard = 0
      continue
    }
    // Pop a random bubble (any of them; wrong ones cost a heart, which is fine for this check).
    if (s.bubbles) {
      await evalJs(`(() => { const bs = [...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%'); const b = bs[Math.floor(Math.random()*bs.length)]; b?.onpointerdown?.(new Event('pointerdown')) })()`)
      asked++
      if (cards >= 1) afterCard++
      await sleep(1200)
    } else {
      await sleep(400)
    }
  }
  say(`SUMMARY: cards=${cards} pop attempts=${asked} afterCard=${afterCard} reloads(game over/win)=${reloads}`)
} finally {
  console.log('LOGS:', logs.join('\n') || 'clean')
  close()
}
