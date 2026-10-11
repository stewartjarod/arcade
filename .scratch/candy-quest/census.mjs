import { createServer } from 'vite'
const root = '/home/jarod/Projects/Games'
const vite = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const L = await vite.ssrLoadModule('/packages/learning/src/index.ts')
const rows = []
const all = new Set()
for (const s of L.SUBJECTS) for (const k of s.skills) {
  const set = new Set()
  for (let lv = 1; lv <= k.maxLevel; lv++) for (let i = 0; i < 400; i++) {
    const { say, text } = k.generate(lv).prompt
    const spoken = say ?? (s.id === 'space' ? text : undefined)
    if (spoken) L.sentences(L.mathWords(spoken)).forEach((x) => (set.add(x), all.add(x)))
  }
  if (set.size) rows.push([set.size, `${s.id}.${k.id}`, [...set].slice(0, 2).join(' | ')])
}
const bySubject = {}
for (const s of L.SUBJECTS) bySubject[s.id] = 0
for (const r of rows) bySubject[r[1].split('.')[0]] += r[0]
console.log(JSON.stringify(bySubject))
rows.sort((a, b) => b[0] - a[0])
for (const r of rows.filter((r) => !r[1].startsWith('math')).slice(0, 12)) console.log(r.join('  '))
const words = [...all].filter((x) => x.split(' ').length <= 2)
console.log('total', all.size, '| one/two-word lines', words.length, '| has clip', [...all].filter(t => require_exists(t)).length)
function require_exists(t) { return false }
await vite.close()
