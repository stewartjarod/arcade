import { createServer } from 'vite'
import { existsSync } from 'node:fs'

// `pnpm dev` opens the landing page; `pnpm dev rocket-tour` jumps straight into a game.
const slug = process.argv[2]
if (slug && !existsSync(`games/${slug}/index.html`)) {
  console.error(`No game called "${slug}" in games/`)
  process.exit(1)
}
// portless (see package.json) picks a free port for us and shows the game at https://arcade.localhost.
// host: true also shares it on your Wi-Fi, so a phone or tablet can open the "Network" link below.
const port = Number(process.env.PORT) || 5173
const server = await createServer({
  server: { port, host: true, allowedHosts: true, open: slug ? `/games/${slug}/` : '/' },
})
await server.listen()
server.printUrls()
