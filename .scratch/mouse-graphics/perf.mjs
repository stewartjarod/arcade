// usage: node perf.mjs [realms] [tiers] [level] [WxH]
// Per realm and tier: average frame ms over ~5s (software GL, relative numbers only), draw calls and triangles of the last frame.
import { openPage, sleep } from './cdp.mjs'
const [realmsArg = '0,2,5', tiersArg = 'low,medium,high', level = '3', size = '800x500'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const p = await openPage({ url: '/games/mouse-maze-math/?quality=low&gov=0', width, height, port: Number(process.env.PORT || 5199) })
try {
  await p.evalJs(`document.getElementById('screen').hidden = true`)
  for (const r of realmsArg.split(',')) {
    await p.evalJs(`__mm.show(${r}, ${level}); 1`)
    for (const t of tiersArg.split(',')) {
      if (!process.env.NOTIER) await p.evalJs(`__mm.world.debug.setTier('${t}'); 1`)
      // wait (up to 2 minutes) until frames are really flowing again: the first frame of a new look compiles shaders, which is slow in software GL
      try { await p.evalJs(`new Promise((done) => { const i = __mm.world.debug.renderer.info; let seen = 0; const tick = () => { if (i.render.frame - window.__base > 3) done(1); else setTimeout(tick, 200) }; window.__base = i.render.frame; tick() })`, 240000) } catch { console.log(`realm ${r} ${t} stalled (no frames for 240s)`); continue }
      const out = await p.evalJs(`new Promise((done) => { const i = __mm.world.debug.renderer.info; const f0 = i.render.frame; const t0 = performance.now(); setTimeout(() => { const n = i.render.frame - f0; done(JSON.stringify({ ms: Math.round((performance.now() - t0) / Math.max(n, 1)), frames: n, ...__mm.stats() })) }, 5000) })`, 30000)
      console.log(`realm ${r} ${t.padEnd(6)} ${out}`)
    }
  }
  console.log(p.logs.length ? 'console problems: ' + [...new Set(p.logs)].join(' | ') : 'console: clean')
} finally { p.close() }
process.exit(0)
