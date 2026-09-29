# Arcade — notes for Claude

A dad-and-daughter monorepo of small three.js games. Keep code simple and readable for a kid learning to code:
short functions, friendly names, comments that explain *why* in plain words. Favor fun and visible results over architecture.

## Layout
- `games/<slug>/` — one game each: `game.json` (homepage card: title, description, emoji, color, created), `index.html`, `src/main.ts`, optional `public/`.
  Games are NOT workspace packages; they resolve `@arcade/*` from the root `node_modules`.
- `games/_template/` — copied by `pnpm new <slug>`; `{{slug}}`, `{{title}}`, `{{date}}` get substituted. `_`-prefixed games are skipped by the build.
- `packages/engine` (`@arcade/engine`) — Game, Entity, behaviors, shapes, input, sound (synth presets), hud, tweens, particles, loaders, util. Re-exports `THREE`.
- `packages/assets` (`@arcade/assets`) — shared prefabs (`buddy`, `coin`, `starPickup`, `tree`, `cloud`, `spiky`, `platform`) and shared files imported as `@arcade/assets/models/x.glb?url`.
- `scripts/build.mjs` builds each game with the shared `vite.config.ts` (`GAME=<slug>`) into `dist/games/<slug>/` and generates `dist/index.html`.

## Engine conventions
- An Entity wraps a three.js Object3D; logic goes in behaviors attached via `.with()`. A behavior is `(entity, dt) => void` or `{ start, update, destroy }`.
- Tags drive interaction: `'player'`, `'enemy'`, `'coin'`, `'solid'` (landed on by `gravity()`). Collision is sphere-based via `entity.radius` / `touches()`.
- Levels are scene functions `(game) => void | cleanup`; `game.setScene(fn)` wipes the world, `game.restart()` reruns the current one.
- `game.state` for per-run values (score), `storage(slug)` for persistence.
- Promote anything reused by 2+ games into `packages/`.

## Commands
`pnpm new <slug>` · `pnpm dev <slug>` · `pnpm typecheck` · `pnpm build` · `pnpm preview`
Always run `pnpm typecheck && pnpm build` after changes.
