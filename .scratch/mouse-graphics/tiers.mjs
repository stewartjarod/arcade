// same realm, same page, different tier -> screenshots (finds what changes the picture)
import { openPage } from './cdp.mjs'
const [realm = '3', tiers = 'low,medium', size = '640x400'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const p = await openPage({ url: `/games/mouse-maze-math/?quality=low&gov=0`, width, height })
const frames = (n) => p.evalJs(`new Promise((done) => { const i = __mm.world.debug.renderer.info; const b = i.render.frame; const t = () => (i.render.frame - b > ${n} ? done(1) : setTimeout(t, 200)); t() })`, 900000)
try {
  await p.evalJs(`document.getElementById('screen').hidden = true`)
  await p.evalJs(`__mm.show(${realm}, 2); 1`)
  for (const t of tiers.split(',')) {
    await p.evalJs(`__mm.world.debug.setTier('${t}'); 1`)
    await p.evalJs(`(() => { const d = __mm.world.debug; for (let i = 0; i < 3; i++) d.renderOnce(); return 1 })()`, 300000)
    await new Promise((r) => setTimeout(r, 1500))
    await p.shot(`shots/tier-${realm}-${t}.png`)
    console.log(t, 'done')
  }
  console.log(p.logs.length ? [...new Set(p.logs)].join('\n') : 'clean')
} finally { p.close() }
process.exit(0)
