// usage: node census.mjs [query] [level]  -> static scene census per realm (no frames rendered, so it is fast)
import { openPage } from './cdp.mjs'
const [query = '', level = '3'] = process.argv.slice(2)
const p = await openPage({ url: `/games/mouse-maze-math/${query}`, width: 400, height: 300 })
await p.evalJs(`document.getElementById('screen').hidden = true`)
for (let r = 0; r < 8; r++) {
  const c = await p.evalJs(`(() => { __mm.show(${r}, ${level}); return JSON.stringify(__mm.census()) })()`)
  console.log(`realm ${r} ${c}`)
}
p.close(); process.exit(0)
