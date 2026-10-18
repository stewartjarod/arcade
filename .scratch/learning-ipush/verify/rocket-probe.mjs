import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const page = await openPage({ url: '/games/rocket-tour/' })
const { evalJs, logs, close } = page
try {
  await evalJs(seedJs('space', 2.5)); await evalJs('location.reload()'); await sleep(3000)
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('Start the tour'))?.click()`)
  for (let i = 0; i < 36; i++) {
    const s = await evalJs(`({ q: document.querySelector('.question .q')?.innerText ?? '-', lanes: [...document.querySelectorAll('button[data-i]')].map(b => b.innerText.trim() + (b.disabled ? '[off]' : '')).join('|') || '-', card: !!document.querySelector('.teach-card'), btn: [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean).slice(0,6).join(' / '), hud: document.body.innerText.replace(/\\s+/g,' ').slice(0,110) })`)
    console.log(i, s.card ? 'CARD' : '', '| q:', s.q.slice(0, 50), '| lanes:', s.lanes, '| btns:', s.btn, '| hud:', s.hud.slice(0, 70))
    if (s.card) await evalJs(`document.querySelector('.teach-go')?.click()`)
    if (s.lanes !== '-') await evalJs(`(() => { const b=[...document.querySelectorAll('button[data-i]:not([disabled])')]; b[Math.floor(Math.random()*b.length)]?.click() })()`)
    await sleep(3000)
  }
  console.log('logs', logs.join('\n') || 'clean')
} finally { close() }
