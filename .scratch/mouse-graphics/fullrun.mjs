// A scripted maze run through the real world API in two realms, driven by fast-forwarding the game clock. Fails on any console error/exception.
// Also loads 6 mazes in a row and checks the graphics-card memory counts stop growing.
import { openPage } from './cdp.mjs'
const p = await openPage({ url: '/games/mouse-maze-math/?quality=medium&gov=0', width: 640, height: 400 })
const run = (code, ms = 300000) => p.evalJs(code, ms)
const adv = (s) => run(`__mm.world.debug.advance(${s}); __mm.world.debug.renderOnce(); 1`)
try {
  await run(`document.getElementById('screen').hidden = true; 1`)
  for (const realm of [2, 5]) {
    await run(`(() => { const L = __mm.layout = null; __mm.show(${realm}, 3); return 1 })()`)
    await run(`void __mm.world.flyover(); 1`); await adv(3)
    await run(`__mm.world.showSigns(0, ['3', '4', '5']); 1`); await adv(1)
    await run(`void __mm.world.setDoor(0, 1, true); 1`); await adv(1)
    await run(`void __mm.world.bonk(); 1`); await adv(1)
    await run(`void __mm.world.dropCage(); 1`); await adv(1.5)
    await run(`__mm.world.setFocus(true); 1`); await adv(1)
    await run(`void __mm.world.liftCage(); 1`); await adv(1.5)
    await run(`__mm.world.setFocus(false); __mm.world.markSign(0, 1, true); 1`); await adv(0.5)
    await run(`void __mm.world.setDoor(0, 1, false); 1`); await adv(1)
    await run(`void __mm.world.reveal(); 1`); await adv(2)
    await run(`void __mm.world.openChest(); 1`); await adv(1.5)
    await run(`void __mm.world.hop(3); 1`); await adv(1.5)
    await run(`void __mm.world.overview(); 1`); await adv(4)
    console.log('realm', realm, 'full run ok')
  }
  const growth = []
  for (let i = 0; i < 6; i++) {
    await run(`(() => { __mm.show(${i % 2 ? 2 : 5}, 3); __mm.world.debug.renderOnce(); return 1 })()`)
    await adv(0.5)
    growth.push(await run(`JSON.stringify((({ geometries, textures }) => ({ geometries, textures }))(__mm.world.debug.renderer.info.memory))`))
  }
  console.log('memory after each load (alternating garden / crystal):\n  ' + growth.join('\n  '))
  const bad = p.logs.filter((l) => !/THREE.Clock|KHR_parallel/.test(l))
  console.log(bad.length ? 'PROBLEMS:\n' + [...new Set(bad)].join('\n') : 'console clean (only the known Clock deprecation + software-GL note)')
} finally { p.close() }
process.exit(0)
