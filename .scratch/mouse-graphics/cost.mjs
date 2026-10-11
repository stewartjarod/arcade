// Times real renders directly (no requestAnimationFrame, which headless Chrome throttles): ms per frame with the GPU forced to finish.
// A FRESH page per tier, started at that tier, so the glow pass / MSAA are really on for medium and high.
// usage: node cost.mjs [realms] [tiers] [level] [WxH]
import { openPage } from './cdp.mjs'
const [realmsArg = '0,1,2,3,4,5,6,7', tiersArg = 'low,medium,high', level = '3', size = '800x500'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
for (const t of tiersArg.split(',')) {
  const p = await openPage({ url: `/games/mouse-maze-math/?quality=${t}&gov=0`, width, height })
  try {
    await p.evalJs(`document.getElementById('screen').hidden = true`)
    const canvasStyle = await p.evalJs(`JSON.stringify(document.getElementById('c').getAttribute('style'))`)
    for (const r of realmsArg.split(',')) {
      await p.evalJs(`__mm.show(${r}, ${level}); 1`)
      const out = await p.evalJs(`(() => { const d = __mm.world.debug; const gl = d.renderer.getContext(); const px = new Uint8Array(4); for (let i = 0; i < 3; i++) d.renderOnce(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); d.renderer.info.reset(); const t0 = performance.now(); for (let i = 0; i < 6; i++) d.renderOnce(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = (performance.now() - t0) / 6; const i = d.renderer.info.render; return JSON.stringify({ ms: Math.round(ms), calls: Math.round(i.calls / 6), tris: Math.round(i.triangles / 6), census: __mm.census().triangles }) })()`, 600000)
      console.log(`realm ${r} ${t.padEnd(6)} lvl ${level} ${out}`)
    }
    console.log(`  (${t}) canvas inline style: ${canvasStyle}   console: ${p.logs.filter((l) => !/Clock|KHR/.test(l)).join(' | ') || 'clean'}`)
  } finally { p.close() }
}
process.exit(0)
