import { defineConfig } from 'vite'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// The whole site is one multi-page app: the landing page (index.html)
// plus one page per game (games/<slug>/index.html). Folders starting
// with "_" are drafts: playable in dev, but left out of the build.
const root = import.meta.dirname
const games = readdirSync(resolve(root, 'games')).filter(
  (g) => !g.startsWith('_') && !g.startsWith('.') && existsSync(resolve(root, 'games', g, 'index.html')),
)

export default defineConfig({
  base: './', // relative paths, so the site works at any URL (domain root or /repo-name/)
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  build: {
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      input: {
        home: resolve(root, 'index.html'),
        ...Object.fromEntries(games.map((g) => [g, resolve(root, 'games', g, 'index.html')])),
      },
    },
  },
})
