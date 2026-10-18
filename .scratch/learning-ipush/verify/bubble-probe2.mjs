import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const page = await openPage({ url: '/games/bubble-pop/?subject=math' })
const { evalJs, logs, close } = page
try {
  await evalJs(seedJs('math', 1)); await evalJs('location.reload()'); await sleep(3000)
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Play!')?.click()`)
  await sleep(2000)
  let last = ''
  for (let i = 0; i < 45; i++) {
    const s = await evalJs(`({ hud: document.body.innerText.replace(/\\s+/g,' ').slice(0,90), bubbles: [...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%').map(b => b.innerText + '@' + Math.round(b.getBoundingClientRect().top)).join(' | '), card: !!document.querySelector('.teach-card') })`)
    if (s.hud !== last || i % 5 === 0) console.log(i, s.card ? 'CARD' : '', s.hud, '::', s.bubbles)
    if (s.card) { await sleep(1000); await evalJs(`document.querySelector(".teach-go")?.click()`) }
    last = s.hud
    const pick = await evalJs(`(() => { const bs=[...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%'); return bs.length })()`)
    if (pick) await evalJs(`(() => { const bs=[...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%'); const b = bs[Math.floor(Math.random()*bs.length)]; b.onpointerdown(new Event('pointerdown')) })()`)
    await sleep(1200)
  }
  console.log('logs', logs.join('\n') || 'clean')
} finally { close() }
