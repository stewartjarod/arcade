// Drives Candy Quest (Cotton Candy Clouds, writing grade 1). Word gates: spells the word from the dev hook
// window.__candyWord (set after a card closes), except the first two gates in the land, which are missed on
// purpose so the Candy Monster chases. Chase: taps the right answer from window.__candyPick.
// Teach cards: checks the gate stays shut (letter pad hidden) and the frame holds still while the card is up.
import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const V = '/home/jarod/Projects/Games/.scratch/learning-ipush/verify/'
const page = await openPage({ url: '/games/candy-quest/?warp=2' })
const { evalJs, send, shot, logs, close } = page
const grab = async () => (await send('Page.captureScreenshot', { format: 'png' })).result.data
const snap = () => evalJs(`({
  pad: !!document.querySelector('.letter-pad') && !document.querySelector('.letter-pad').hidden,
  card: !!document.querySelector('.teach-card'),
  cardText: document.querySelector('.teach-card')?.innerText.replace(/\\s+/g,' ').slice(0,200) ?? null,
  choice: !!document.querySelector('[data-answers] button'),
  hud: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 200),
  landMenu: !!document.querySelector('[data-land]'),
  treasure: /Treasure found/.test(document.body.innerText),
  word: window.__candyWord ?? null,
})`)
const type = (text) => evalJs(`(async () => { for (const key of ${JSON.stringify([...text, 'Enter'])}) { window.dispatchEvent(new KeyboardEvent('keydown', { key })); await new Promise(r => setTimeout(r, 60)) } })()`)
const say = (...a) => console.log(a.join(' '))
let gateCards = 0, chaseCards = 0, gates = 0, chaseQs = 0, afterGate = 0, afterChase = 0, lands = 0
let lastGateKey = null
try {
  await evalJs(seedJs('writing', 1) + `; localStorage.setItem('arcade:p:guest:candy-quest:taught','true')`)
  await evalJs('location.reload()')
  await sleep(4000)
  await evalJs(`document.querySelector('[data-land="0"]').click()`)
  await sleep(2000)
  let chaseMode = false
  for (let step = 0; step < 1500 && (gateCards + chaseCards < 3 || afterGate < 6) && lands < 3; step++) {
    const s = await snap()
    if (s.treasure) { lands++; await sleep(1500); await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('Next'))?.click()`); await sleep(2000); await evalJs(`document.querySelector('[data-land="${lands}"]')?.click()`); await sleep(2000); continue }
    if (s.card) {
      const kind = s.pad ? 'gate' : 'pre-gate/chase'
      if (s.pad) gateCards++; else chaseCards++
      say(`CARD #${gateCards + chaseCards} (${kind}) shown: "${s.cardText}" | letter pad open=${s.pad} | chase choices visible=${s.choice}`)
      await sleep(400)
      await shot(V + `candy-quest-card-${gateCards + chaseCards}.png`)
      const a = await grab(); await sleep(1000); const b = await grab(); await sleep(2000); const c = await grab()
      say(`  while card up: frame t0 == t+1s ${a === b}, t0 == t+3s ${a === c}; pad still closed=${!(await snap()).pad}`)
      await evalJs(`document.querySelector('.teach-go')?.click()`)
      await sleep(1500)
      const d = await snap()
      say(`  after Got it: card gone=${!d.card}; letter pad open=${d.pad}; chase choices visible=${d.choice}`)
      await shot(V + `candy-quest-after-${gateCards + chaseCards}.png`)
      afterGate = 0; continue
    }
    if (s.pad) {
      const word = s.word
      const key = word + '#' + (gates)
      if (key !== lastGateKey) {
        lastGateKey = key; gates++
        const miss = gates <= 2 // miss the first two gates so the Candy Monster starts a chase
        if (miss) { for (let i = 0; i < 3; i++) { await type('zzz'); await sleep(300) } ; say(`  gate ${gates} (${word}): missed on purpose`) }
        else { await type(word); say(`  gate ${gates} (${word}): spelled right`); afterGate++ }
        await sleep(2500)
      } else await sleep(400)
      continue
    }
    if (s.choice) {
      chaseQs++
      // The chase panel answers on pointerdown (not click), and each button reads "1\nanswer".
      await evalJs(`(() => { const want = String(window.__candyPick); const b = [...document.querySelectorAll('[data-answers] button')].find(b => b.textContent.trim().endsWith(want)); b?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })()`)
      if (chaseQs <= 2) say(`  chase question ${chaseQs}: tapped "${s.word}"`)
      await sleep(1200)
      afterChase++
      continue
    }
    await sleep(500)
    if (step % 60 === 0) say(`  ...waiting (${s.hud.slice(0, 90)})`)
  }
  say(`SUMMARY: gate cards=${gateCards} chase cards=${chaseCards} gates=${gates} chase taps=${chaseQs} lands completed=${lands} afterGate=${afterGate}`)
} finally {
  console.log('LOGS:', logs.join('\n') || 'clean')
  close()
}
