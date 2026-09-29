import { createServer } from 'vite'
import { readdirSync } from 'node:fs'

const games = readdirSync('games').filter((g) => !g.startsWith('.'))
const slug = process.argv[2]
if (!slug || !games.includes(slug)) {
  console.log(`Usage: pnpm dev <game>\n\nGames:\n${games.map((g) => '  ' + g).join('\n')}`)
  process.exit(slug ? 1 : 0)
}
process.env.GAME = slug
const server = await createServer({ configFile: 'vite.config.ts', server: { open: true } })
await server.listen()
server.printUrls()
