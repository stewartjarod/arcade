// Mash vs. careful in cozy Lily Hop: how long does crossing the pond take?
// Needs the dev server: (setsid nohup env PORT=5199 node scripts/dev.mjs lily-hop > /tmp/cq/dev.log 2>&1 < /dev/null &)
import { openPage, sleep } from './candy-quest/cdp.mjs'
const mode = process.argv[2] || 'mash'
const page = await openPage({ url: '/games/lily-hop/' })
const { evalJs, shot, logs } = page
const t0 = Date.now()
let shotTaken = false
try {
  for (let i = 0; i < 4000; i++) {
    const text = await evalJs('document.body.innerText')
    if (text.includes('crossed the pond')) break
    if (mode === 'careful') await sleep(1300)
    await evalJs(`(() => { const b = [...document.querySelectorAll('#lh-answers button')].filter(b => !b.disabled); b[Math.floor(Math.random()*b.length)]?.click() })()`)
    if (!shotTaken && (await evalJs(`!!document.querySelector('.slow-down')`))) { await shot('.scratch/lily-slowdown.png'); shotTaken = true }
    if (mode === 'mash') await sleep(80)
  }
  console.log(mode, 'crossed in', ((Date.now() - t0) / 1000).toFixed(1), 's', 'turtle seen:', shotTaken)
} finally {
  console.log(logs.join('\n'))
  page.close?.()
}
