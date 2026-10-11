// Special moments: mouse from the front, treasure reveal + open chest, victory overview. usage: node scenes.mjs <outDir> [realm] [tier]
import { mkdirSync } from 'node:fs'
import { openPage } from './cdp.mjs'
const [outDir, realm = '0', tier = 'medium'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const p = await openPage({ url: `/games/mouse-maze-math/?quality=${tier}&gov=0`, width: 800, height: 500 })
const render = (n = 3) => p.evalJs(`(() => { const d = __mm.world.debug; for (let i = 0; i < ${n}; i++) d.renderOnce(); return 1 })()`, 300000)
const advance = (s) => p.evalJs(`__mm.world.debug.advance(${s}); 1`, 300000)
const shot = async (name) => { await render(); await new Promise((r) => setTimeout(r, 1200)); await render(2); console.log('rendered', name); await Promise.race([p.shot(`${outDir}/${name}.png`), new Promise((_, rej) => setTimeout(() => rej(new Error('screenshot timeout')), 60000))]); console.log(name) }
try {
  await p.evalJs(`document.getElementById('screen').hidden = true; __mm.show(${realm}, 3); __mm.world.showSigns(0, null); 1`)
  // the mouse from the front (camera placed by hand; renderOnce does not move the camera)
  for (const [name, side] of [['front', 0], ['front-side', 0.7]]) {
    await p.evalJs(`__mm.world.debug.setCameraHook((c) => { const m = __mm.world.debug.mouse; const a = m.rotation.y + ${side}; c.position.set(m.position.x + Math.sin(a) * 1.75, 1.1, m.position.z + Math.cos(a) * 1.75); c.lookAt(m.position.x, 0.8, m.position.z) }); 1`)
    await shot(`${name}-${realm}`)
  }
  await p.evalJs(`__mm.world.debug.setCameraHook(null); 1`)
  if (process.env.ONLY_FRONT) { console.log('front only'); p.close(); process.exit(0) }
  // treasure reveal, then the chest opens
  await p.evalJs(`__mm.world.reveal(); 1`); await advance(2.5); await shot(`reveal-${realm}`)
  await p.evalJs(`__mm.world.openChest(); 1`); await advance(1.5); await shot(`chest-open-${realm}`)
  // victory overview
  await p.evalJs(`__mm.world.overview(); 1`); await advance(5); await shot(`overview-${realm}`)
  console.log(p.logs.length ? [...new Set(p.logs)].join('\n') : 'console clean')
} finally { p.close() }
process.exit(0)
