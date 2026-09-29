import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// One shared config for every game. Pick the game with GAME=<slug>
// (scripts/dev.mjs and scripts/build.mjs do this for you).
const game = process.env.GAME
if (!game) throw new Error('Set GAME=<slug>, or use `pnpm dev <slug>`.')

const root = resolve(import.meta.dirname, 'games', game)

export default defineConfig({
  root,
  base: './', // relative paths, so a game works at any URL (/games/<slug>/)
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  server: { fs: { allow: [resolve(import.meta.dirname)] } },
  build: {
    outDir: resolve(import.meta.dirname, 'dist/games', game),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
