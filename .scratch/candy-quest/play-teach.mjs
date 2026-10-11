// The first-time lesson: Buddy waits until you slide a finger, then until you tap to jump.
// Run: W=900 H=600 node .scratch/candy-quest/play-teach.mjs   (dev server on 5199)
import { mkdirSync } from 'node:fs'
import { openPage, sleep } from './cdp.mjs'
const out = new URL('./shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
mkdirSync('/tmp/cq', { recursive: true })
const page = await openPage({ url: '/games/candy-quest/', width: Number(process.env.W || 900), height: Number(process.env.H || 600) })
const { evalJs, shot, logs } = page
const text = () => evalJs(`document.body.innerText`)
const waitFor = async (re, ms = 180000) => { for (const end = Date.now() + ms; Date.now() < end; await sleep(500)) { const m = (await text()).match(re); if (m) return m[0] } return 'timed out' }
const finger = (type, x) => evalJs(`document.querySelector('canvas').dispatchEvent(new PointerEvent('${type}', { clientX: ${x}, clientY: 300, pointerId: 7, bubbles: true }))`)
try {
  await sleep(1500)
  await evalJs(`document.querySelector('[data-land="0"]').click()`)
  const t0 = Date.now(); console.log('step 1:', await waitFor(/Slide to move!/))
  await shot(out + 't-1-slide.png')
  await finger('pointerdown', 450)
  for (const x of [520, 600, 700, 800]) (await finger('pointermove', x), await sleep(300))
  await finger('pointerup', 800)
  console.log('step 2:', await waitFor(/Tap to jump!/), (Date.now() - t0) / 1000)
  await shot(out + 't-2-tap.png')
  await finger('pointerdown', 500)
  await sleep(100)
  await finger('pointerup', 500)
  console.log('step 3:', await waitFor(/Great!/), '| taught =', await evalJs(`localStorage.getItem('arcade:p:guest:candy-quest:taught')`))
  await sleep(20000)
  await shot(out + 't-3-running.png')
} finally {
  console.log('console:', logs.join('\n') || 'clean')
  page.close()
}
