// Which parts of the scene cost the most? Hides one thing at a time and measures frames per second (software GL: relative only).
import { openPage } from './cdp.mjs'
const [realm = '0', size = '640x400', tier = 'low'] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const p = await openPage({ url: `/games/mouse-maze-math/?quality=${tier}&gov=0`, width, height })
const measure = (ms) => p.evalJs(`new Promise((done) => { const i = __mm.world.debug.renderer.info; const f0 = i.render.frame; const t0 = performance.now(); setTimeout(() => done(Math.round((performance.now() - t0) / Math.max(i.render.frame - f0, 1))), ${ms}) })`, 60000)
try {
  await p.evalJs(`document.getElementById('screen').hidden = true; __mm.show(${realm}, 3); 1`)
  await p.evalJs(`new Promise((d) => { const i = __mm.world.debug.renderer.info; const b = i.render.frame; const t = () => (i.render.frame - b > 3 ? d(1) : setTimeout(t, 200)); t() })`, 300000)
  console.log('all on', await measure(4000), 'ms/frame')
  const names = await p.evalJs(`(() => { const s = __mm.world.debug.scene; return JSON.stringify(s.children.map((c, i) => c.type + ':' + c.children.length)) })()`)
  console.log('top level', names)
  const n = (await p.evalJs(`__mm.world.debug.scene.children.length`))
  for (let i = 0; i < n; i++) {
    await p.evalJs(`(() => { const c = __mm.world.debug.scene.children[${i}]; window.__v = c.visible; c.visible = false })()`)
    const ms = await measure(3000)
    const what = await p.evalJs(`__mm.world.debug.scene.children[${i}].type + ' #' + ${i} + ' kids=' + __mm.world.debug.scene.children[${i}].children.length`)
    await p.evalJs(`__mm.world.debug.scene.children[${i}].visible = window.__v; 1`)
    console.log('hide', what, '=>', ms, 'ms/frame')
  }
  // inside the level group (index of the Group with the most children)
  const lvl = await p.evalJs(`(() => { const s = __mm.world.debug.scene.children; let b = 0; s.forEach((c, i) => { if (c.children.length > s[b].children.length) b = i }); return b })()`)
  const kids = await p.evalJs(`__mm.world.debug.scene.children[${lvl}].children.length`)
  console.log('level group index', lvl, 'children', kids)
  const rows = []
  for (let k = 0; k < kids; k++) {
    const info = await p.evalJs(`(() => { const o = __mm.world.debug.scene.children[${lvl}].children[${k}]; const g = o.geometry; return JSON.stringify({ t: o.type, inst: o.count ?? 1, tri: g ? Math.round((g.index ? g.index.count : g.attributes.position.count) / 3) : 0, map: !!(o.material && o.material.map), tr: !!(o.material && o.material.transparent) }) })()`)
    const i = JSON.parse(info)
    if (i.tri * i.inst < 400 && !i.tr) continue // tiny things: skip
    await p.evalJs(`__mm.world.debug.scene.children[${lvl}].children[${k}].visible = false; 1`)
    const ms = await measure(2500)
    await p.evalJs(`__mm.world.debug.scene.children[${lvl}].children[${k}].visible = true; 1`)
    rows.push(`${String(k).padStart(3)} ${i.t.padEnd(14)} inst=${String(i.inst).padEnd(4)} tri/inst=${String(i.tri).padEnd(5)} map=${i.map} transparent=${i.tr} hidden=> ${ms}`)
  }
  console.log(rows.join('\n'))
} finally { p.close() }
process.exit(0)
