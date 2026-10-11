// Wakes the Candy Monster (miss gates 1 and 2) and plays the chase in headless Chromium.
// CAUGHT=1 → don't answer, so it catches you. Otherwise answer right and escape.
// Needs the dev server: (setsid nohup env PORT=5199 node scripts/dev.mjs candy-quest > /tmp/cq/dev.log 2>&1 < /dev/null &)
// Run: WARP=6 W=640 H=400 node .scratch/candy-quest/play-monster.mjs
import { mkdirSync } from 'node:fs'
import { openPage, sleep } from './cdp.mjs'

const out = new URL('./shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
mkdirSync('/tmp/cq', { recursive: true })
const tag = process.env.CAUGHT ? 'caught' : 'escape'
const page = await openPage({ url: '/games/candy-quest/?warp=' + (process.env.WARP || 1), width: Number(process.env.W || 1280), height: Number(process.env.H || 800) })
const { evalJs, shot, logs } = page
const padOpen = () => evalJs(`!!document.querySelector('.letter-pad') && !document.querySelector('.letter-pad').hidden`)
const type = (text) => evalJs(`(async () => { for (const key of ${JSON.stringify([...text, 'Enter'])}) { window.dispatchEvent(new KeyboardEvent('keydown', { key })); await new Promise(r => setTimeout(r, 60)) } })()`)
const candies = () => evalJs(`document.body.innerText.match(/🍬 (\\d+)/)?.[1]`)
const chaseUp = () => evalJs(`!!document.querySelector('[data-answers] button')`)

try {
  await sleep(1500)
  await evalJs(`localStorage.setItem('arcade:p:guest:candy-quest:taught', 'true')`) // skip the first-time lesson
  await evalJs(`location.reload()`)
  await sleep(4000)
  await evalJs(`document.querySelector('[data-land="0"]').click()`)
  let gates = 0
  let answered = 0
  let shotChase = false
  for (const end = Date.now() + 20 * 60e3; Date.now() < end; ) {
    if (await padOpen()) {
      gates++
      const word = await evalJs('window.__candyWord')
      if (gates <= 2) {
        if (gates === 1) await shot(out + `m-${tag}-pad.png`)
        console.log(`gate ${gates}: missing "${word}" on purpose, candies ${await candies()}`)
        for (let i = 0; i < 3; i++) (await type('zzz'), await sleep(300))
        while (await padOpen()) await sleep(200) // it stays open a moment to show the answer
      } else {
        console.log(`gate ${gates} after the chase: "${word}"`)
        await shot(out + `m-${tag}-next-gate.png`)
        break
      }
    }
    if (await chaseUp()) {
      if (!shotChase) {
        shotChase = true
        console.log('chase! candies', await candies())
        await shot(out + `m-${tag}-chase.png`)
      }
      if (!process.env.CAUGHT) {
        const answer = await evalJs('window.__candyPick')
        const clicked = await evalJs(`(() => { const b = [...document.querySelectorAll('[data-answers] button')].find(b => !b.disabled && b.lastChild.textContent === ${JSON.stringify('')} + window.__candyPick); if (!b || b.style.background.includes('34, 197')) return false; b.dispatchEvent(new PointerEvent('pointerdown')); return true })()`)
        if (clicked) console.log(`  picked "${answer}" (${++answered})`)
      }
    } else if (shotChase && !(await evalJs('window.__chaseDone'))) {
      await evalJs('window.__chaseDone = true')
      console.log('chase over, candies', await candies(), '| toasts:', await evalJs(`document.body.innerText.match(/CHOMP|got away|BURP/g)?.join(',') ?? 'none'`))
      await shot(out + `m-${tag}-after.png`)
    }
    await sleep(400)
  }
} finally {
  console.log('console:', logs.join('\n') || 'clean')
  page.close()
}
