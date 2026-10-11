// Screenshots of every realm at one tier, using direct renders (no requestAnimationFrame needed).
// usage: node shots.mjs <outDir> [tier] [realms] [level] [WxH] [port]
import { mkdirSync } from 'node:fs'
import { openPage } from './cdp.mjs'
const [outDir, tier = 'medium', realmsArg = '0,1,2,3,4,5,6,7', level = '3', size = '800x500'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
mkdirSync(outDir, { recursive: true })
const p = await openPage({ url: `/games/mouse-maze-math/?quality=${tier}&gov=0`, width, height })
try {
  await p.evalJs(`document.getElementById('screen').hidden = true`)
  for (const r of realmsArg.split(',')) {
    await p.evalJs(`(() => { __mm.show(${r}, ${level}); const d = __mm.world.debug; for (let i = 0; i < 4; i++) (d.renderOnce || (() => d.renderer.render(d.scene, d.cam)))(); return 1 })()`, 300000)
    await new Promise((res) => setTimeout(res, 2500)) // the signs pop in over a moment
    await p.evalJs(`(() => { const d = __mm.world.debug; for (let i = 0; i < 3; i++) (d.renderOnce || (() => d.renderer.render(d.scene, d.cam)))(); return 1 })()`, 300000)
    await p.shot(`${outDir}/realm-${r}.png`)
    console.log('realm', r, 'ok')
  }
  console.log(p.logs.length ? [...new Set(p.logs)].join('\n') : 'console clean')
} finally { p.close() }
process.exit(0)
