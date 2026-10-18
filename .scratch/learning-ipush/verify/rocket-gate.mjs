// Waits for the first gate question of a tour, then logs the gate state every 2 s while clicking random lanes.
import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const page = await openPage({ url: '/games/rocket-tour/' })
const { evalJs, logs, close } = page
const state = () => evalJs(`({ q: document.querySelector('.question .q')?.innerText ?? '-', lanes: [...document.querySelectorAll('button[data-i]')].map(b => b.innerText.trim() + (b.disabled ? '[off]' : '')).join('|') || '-', card: !!document.querySelector('.teach-card'), planet: [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(t => /Blast|Finish/.test(t)).join(' ') || '-', hud: document.body.innerText.replace(/\\s+/g,' ').slice(0,80) })`)
try {
  await evalJs(seedJs('space', 2.5)); await evalJs('location.reload()'); await sleep(3000)
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('Start the tour'))?.click()`)
  let gateSeen = 0
  for (let i = 0; i < 400 && gateSeen < 25; i++) {
    const s = await state()
    if (s.card) { console.log('CARD', s.hud); await evalJs(`document.querySelector('.teach-go')?.click()`); await sleep(2000); continue }
    if (s.planet !== '-') { console.log('PLANET BUTTON', s.planet); await evalJs(`[...document.querySelectorAll('button')].find(b => /Blast|Finish/.test(b.innerText))?.click()`); await sleep(2000); continue }
    if (s.lanes !== '-') {
      gateSeen++
      console.log(gateSeen, 'q:', s.q.slice(0, 50), '| lanes:', s.lanes)
      await evalJs(`(() => { const b=[...document.querySelectorAll('button[data-i]:not([disabled])')]; b[Math.floor(Math.random()*b.length)]?.click() })()`)
    } else if (i % 10 === 0) console.log('waiting', s.hud)
    await sleep(2000)
  }
  console.log('logs', logs.join('\n') || 'clean')
} finally { close() }
