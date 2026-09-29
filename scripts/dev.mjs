import { createServer } from 'vite'
import { existsSync } from 'node:fs'

// `pnpm dev` opens the landing page; `pnpm dev rocket-tour` jumps straight into a game.
const slug = process.argv[2]
if (slug && !existsSync(`games/${slug}/index.html`)) {
  console.error(`No game called "${slug}" in games/`)
  process.exit(1)
}
const server = await createServer({ server: { open: slug ? `/games/${slug}/` : '/' } })
await server.listen()
server.printUrls()
