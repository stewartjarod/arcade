import { preview } from 'vite'

// Serve the built site (run `pnpm build` first) exactly like it'll be hosted.
const server = await preview({ configFile: false, build: { outDir: 'dist' }, preview: { open: true } })
server.printUrls()
