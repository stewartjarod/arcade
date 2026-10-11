import { openPage } from './cdp.mjs'
const p = await openPage({ url: process.env.URL || '/games/mouse-maze-math/?quality=high&gov=0', width: 800, height: 500 })
try {
  for (const code of JSON.parse(process.env.PROBE)) {
    let out
    try { out = JSON.stringify(await p.evalJs(code, Number(process.env.T || 120000))) } catch (e) { out = 'ERR ' + e.message.slice(0, 100) }
    console.log(`${code.slice(0, 60)}  =>  ${out}`)
  }
} finally { p.close() }
process.exit(0)
