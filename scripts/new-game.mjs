import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: pnpm new <game-name>   (lowercase letters, numbers, dashes)')
  process.exit(1)
}
const dest = `games/${slug}`
if (existsSync(dest)) {
  console.error(`${dest} already exists`)
  process.exit(1)
}
const title = slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
cpSync('games/_template', dest, { recursive: true })

for (const file of ['game.json', 'index.html', 'src/main.ts']) {
  const p = `${dest}/${file}`
  writeFileSync(p, readFileSync(p, 'utf8').replaceAll('{{slug}}', slug).replaceAll('{{title}}', title).replaceAll('{{date}}', new Date().toISOString().slice(0, 10)))
}
console.log(`Created ${dest}\n\n  pnpm dev ${slug}\n\nEdit ${dest}/game.json for the title, emoji and color on the homepage.`)
