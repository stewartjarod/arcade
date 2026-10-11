// usage: node capture.mjs <outDir> [query] [realms e.g. 0,1,2] [maze level] [width x height]
// Per realm: screenshot + draw calls + triangles + median software-rendered frame ms (SwiftShader: relative numbers only).
import { mkdirSync } from 'node:fs'
import { openPage, sleep } from './cdp.mjs'

const [outDir, query = '', realmsArg = '0,1,2,3,4,5,6,7', level = '3', size = '800x500'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
mkdirSync(outDir, { recursive: true })
const p = await openPage({ url: `/games/mouse-maze-math/${query}`, width, height })
await p.evalJs(`document.getElementById('screen').hidden = true`)
for (const r of realmsArg.split(',').map(Number)) {
  await p.evalJs(`__mm.show(${r}, ${level})`)
  await sleep(500)
  const census = await p.evalJs(`JSON.stringify(__mm.census())`)
  console.log(`realm ${r} census ${census}`)
  // wait for 4 real frames, record the gaps
  let frames = [NaN]
  try { frames = await p.evalJs(`new Promise((done) => { const t = []; let last = performance.now(); const step = (now) => { t.push(now - last); last = now; if (t.length < 2) requestAnimationFrame(step); else done(t.slice(1)) }; requestAnimationFrame(step) })`, 120000) } catch (e) { console.log('  frames:', e.message.slice(0, 60)) }
  const stats = await p.evalJs(`JSON.stringify(__mm.stats())`)
  try { await Promise.race([p.shot(`${outDir}/realm-${r}.png`), sleep(240000).then(() => { throw new Error('shot timeout') })]) } catch (e) { console.log('  shot:', e.message) }
  const median = frames.sort((a, b) => a - b)[Math.floor(frames.length / 2)]
  console.log(`realm ${r}  ${stats}  medianFrameMs=${Math.round(median)}`)
}
console.log(p.logs.length ? 'console problems:\n' + [...new Set(p.logs)].join('\n') : 'console: clean')
p.close()
process.exit(0)
