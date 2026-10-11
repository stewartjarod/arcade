// The menu card and an in-game question (DOM filled in by hand with the same markup the game uses), desktop and phone sizes.
import { mkdirSync } from 'node:fs'
import { openPage } from './cdp.mjs'
mkdirSync('shots/ui', { recursive: true })
for (const [name, w, h] of [['desktop', 1000, 640], ['phone', 390, 780]]) {
  const p = await openPage({ url: '/games/mouse-maze-math/?quality=medium&gov=0', width: w, height: h })
  try {
    await new Promise((r) => setTimeout(r, 3000))
    await p.shot(`shots/ui/menu-${name}.png`)
    await p.evalJs(`(() => {
      document.getElementById('screen').hidden = true
      __mm.show(2, 2)
      document.getElementById('hud').hidden = false
      document.getElementById('lvl').textContent = '🌿 Maze 4'
      document.getElementById('cheese').textContent = '🧀 27'
      document.getElementById('streak').textContent = '🔥 3'
      document.getElementById('bar').style.width = '60%'
      const q = document.getElementById('q'); q.classList.remove('off')
      document.getElementById('qtext').innerHTML = '7 <span class="op">+</span> 5 = <span class="qmark">?</span>'
      document.getElementById('qhint').textContent = 'Pick a door!'
      const a = document.getElementById('answers'); a.classList.remove('off')
      const cols = ['#d9482f', '#2f8fd6', '#f0b400']
      a.innerHTML = ['11', '12', '13'].map((l, i) => '<button class="ans" style="--c:' + cols[i] + '"><span class="arrow">' + ['⬅', '⬆', '➡'][i] + '</span><span class="num">' + l + '</span></button>').join('')
      return 1
    })()`)
    await new Promise((r) => setTimeout(r, 2500))
    await p.shot(`shots/ui/question-${name}.png`)
    console.log(name, 'ok', p.logs.filter((l) => !/Clock|KHR/.test(l)).join(' | '))
  } finally { p.close() }
}
process.exit(0)
