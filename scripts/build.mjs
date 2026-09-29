import { build } from 'vite'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'

const slugs = readdirSync('games').filter((g) => !g.startsWith('_') && !g.startsWith('.'))
rmSync('dist', { recursive: true, force: true })

const games = []
for (const slug of slugs) {
  process.env.GAME = slug
  await build({ configFile: 'vite.config.ts', logLevel: 'warn' })
  const meta = JSON.parse(readFileSync(`games/${slug}/game.json`, 'utf8'))
  games.push({ slug, ...meta })
  console.log(`built ${slug}`)
}
games.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const cards = games.map((g) => `
  <a class="card" href="games/${g.slug}/" style="--c:${esc(g.color ?? '#6c5ce7')}">
    <span class="emoji">${esc(g.emoji ?? '🎮')}</span>
    <h2>${esc(g.title)}</h2>
    <p>${esc(g.description)}</p>
  </a>`).join('')

mkdirSync('dist', { recursive: true })
writeFileSync('dist/index.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arcade</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:system-ui,sans-serif;background:#14112b;color:#fff;min-height:100vh}
  header{padding:48px 24px 8px;text-align:center} h1{font-size:clamp(2.2rem,6vw,4rem);margin:0}
  header p{opacity:.7;margin:.5rem 0 0}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;max-width:1000px;margin:32px auto;padding:0 20px}
  .card{display:block;padding:24px;border-radius:20px;background:var(--c);color:#fff;text-decoration:none;transition:transform .15s;box-shadow:0 8px 24px #0006}
  .card:hover{transform:translateY(-6px) rotate(-1deg)} .emoji{font-size:3rem} h2{margin:.4rem 0}
  .card p{margin:0;opacity:.9}
</style></head><body>
<header><h1>🕹️ Arcade</h1><p>Games made together</p></header>
<main>${cards}</main></body></html>`)
console.log(`\nDone: ${games.length} game(s) → dist/  (preview with: pnpm preview)`)
