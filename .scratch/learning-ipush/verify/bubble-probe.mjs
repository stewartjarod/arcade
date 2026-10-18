import { openPage, sleep } from '../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const page = await openPage({ url: '/games/bubble-pop/?subject=math' })
const { evalJs, shot, logs, close } = page
try {
  await evalJs(seedJs('math', 1)); await evalJs('location.reload()'); await sleep(3000)
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Play!')?.click()`)
  await sleep(2500)
  const t = () => evalJs(`document.body.innerText.replace(/\\s+/g,' ').slice(0,200)`)
  console.log('before:', await t())
  console.log('bubbles:', await evalJs(`[...document.querySelectorAll('button')].filter(b => b.style.borderRadius === '50%').map(b => b.innerText + '@' + Math.round(b.getBoundingClientRect().top)).join(' | ')`))
  await shot('/home/jarod/Projects/Games/.scratch/learning-ipush/verify/bubble-probe.png')
  await evalJs(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.style.borderRadius === '50%'); b.onpointerdown(new Event('pointerdown')) })()`)
  await sleep(1500)
  console.log('after pop:', await t())
  console.log('logs', logs.join('\n') || 'clean')
} finally { close() }
