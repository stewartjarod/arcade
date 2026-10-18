// Plays Cotton Candy Clouds start to finish in headless Chromium and takes screenshots.
// Needs the dev server: (setsid nohup env PORT=5199 node scripts/dev.mjs candy-quest > /tmp/cq/dev.log 2>&1 < /dev/null &)
// Run: node .scratch/candy-quest/play.mjs   (screenshots land in .scratch/candy-quest/shots/)
import { mkdirSync } from 'node:fs'
import { openPage, sleep } from './cdp.mjs'

const out = new URL('./shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const page = await openPage({ url: '/games/candy-quest/?warp=' + (process.env.WARP || 1), width: Number(process.env.W || 1280), height: Number(process.env.H || 800) })
const { evalJs, shot, logs } = page
const padOpen = () => evalJs(`!!document.querySelector('.letter-pad') && !document.querySelector('.letter-pad').hidden`)
const type = (text) => evalJs(`(async () => { for (const key of ${JSON.stringify([...text, 'Enter'])}) { window.dispatchEvent(new KeyboardEvent('keydown', { key })); await new Promise(r => setTimeout(r, 60)) } })()`)
const hudText = () => evalJs(`document.body.innerText`)

try {
  await sleep(1500)
  await shot(out + '1-title.png')
  await evalJs(`localStorage.setItem('arcade:p:guest:candy-quest:taught', 'true')`) // skip the first-time lesson
  await evalJs(`location.reload()`)
  await sleep(4000)
  await evalJs(`document.querySelector('[data-land="0"]').click()`)
  await sleep(1500)
  await shot(out + '2-intro.png')
  await sleep(3000)
  await sleep(700)
  await shot(out + '3-running.png')

  let gates = 0
  for (let t = 0; t < 600; t++) {
    const text = await hudText()
    if (text.includes('Treasure found')) break
    await evalJs(`document.querySelector('.teach-go')?.click()`) // "Got it!" on a new topic's card
    if (await padOpen()) {
      gates++
      if (gates === 1) await shot(out + '4-gate.png')
      const word = await evalJs('window.__candyWord')
      if (gates === 2) {
        for (let i = 0; i < 3; i++) (await type('zzz'), await sleep(400)) // miss one on purpose
        await sleep(2500)
        await shot(out + '6-missed.png')
      } else {
        await type(word)
        await sleep(900)
        if (gates === 1) await shot(out + '5-map-piece.png')
      }
      console.log('  message:', await evalJs(`document.querySelector('.hud-message')?.innerText ?? 'none'`))
      console.log(`gate ${gates}: ${word} ${gates === 2 ? '(missed)' : ''}`)
    }
    await sleep(500)
  }
  await sleep(1500)
  await shot(out + '7-treasure.png')
  console.log('end text:', (await hudText()).replace(/\s+/g, ' ').slice(0, 300))
  console.log('saved finished =', await evalJs(`Object.entries(localStorage).filter(([k]) => k.includes('candy-quest')).map(e => e.join('=')).join(' | ')`))
  // back to the title: the land is ✅ and the next one unlocked
  await evalJs(`[...document.querySelectorAll('.hud-message button, button')].find(b => b.textContent.includes('Next'))?.click()`)
  await sleep(2000)
  await shot(out + '8-next-land.png')
} finally {
  console.log('console:', logs.join('\n') || 'clean')
  page.close()
}
