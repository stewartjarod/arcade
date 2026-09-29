# Arcade — notes for Claude

A dad-and-daughter monorepo of small three.js games. Keep code simple and readable for a kid learning to code:
short functions, friendly names, comments that explain *why* in plain words. Favor fun and visible results over architecture.

## Layout
- `index.html` + `site/` — landing page; globs `games/*/game.json` (and optional `thumbnail.{png,jpg,webp}`) to render cards. `_` drafts show only in dev.
- `games/<slug>/` — one game each: `game.json` (homepage card: title, description, emoji, color, authors, created), `index.html`, `src/main.ts`, optional `public/`.
  Games are NOT workspace packages; they resolve `@arcade/*` from the root `node_modules`.
- `games/_template/` — copied by `pnpm new <slug>`; `{{slug}}`, `{{title}}`, `{{date}}` get substituted. `_`-prefixed games are skipped by the build.
- `packages/engine` (`@arcade/engine`) — Game, Entity, behaviors, shapes, input, sound (synth presets), hud, tweens, particles, loaders, util. Re-exports `THREE`.
- `packages/assets` (`@arcade/assets`) — shared prefabs (`buddy`, `coin`, `starPickup`, `tree`, `cloud`, `spiky`, `platform`) and shared files imported as `@arcade/assets/models/x.glb?url`.
- `packages/players` (`@arcade/players`) — profiles in localStorage (`arcade:players`, `arcade:current-player`); all per-player data lives under `arcade:p:<playerId>:<game>:<key>` via `playerKey()`, so deleting a player and Guest→first-player hand-off just move/remove that prefix. Falls back to a `guest` player.
- `packages/learning` (`@arcade/learning`) — the adaptive i+1 math model (problem generator, Elo-style `updateSkill`, unlock order, distractors). Skill levels are **profile-level**, stored at `playerKey('learning', 'math')` via `mathLearner()`. Any game asking math questions must use `mathLearner()` rather than its own copy, so progress is shared across games. Mouse Maze Math aliases `save.skills`/`save.stats` to the learner's objects.
- Single multi-page Vite app: `vite.config.ts` lists the landing page plus every non-`_` game as build inputs → `dist/index.html`, `dist/games/<slug>/index.html`; three.js lands in one shared chunk.

## Engine conventions
- An Entity wraps a three.js Object3D; logic goes in behaviors attached via `.with()`. A behavior is `(entity, dt) => void` or `{ start, update, destroy }`.
- Tags drive interaction: `'player'`, `'enemy'`, `'coin'`, `'solid'` (landed on by `gravity()`). Collision is sphere-based via `entity.radius` / `touches()`.
- Levels are scene functions `(game) => void | cleanup`; `game.setScene(fn)` wipes the world, `game.restart()` reruns the current one.
- `game.state` for per-run values (score), `storage(slug)` for per-player persistence (`'best'` shows on the homepage card), `game.player` for who's playing.
- Never write to localStorage with raw keys in a game — go through `storage()`, `playerKey()` or `mathLearner()` so saves stay per-player.
- Promote anything reused by 2+ games into `packages/`.

## Commands
`pnpm new <slug>` · `pnpm dev [slug]` · `pnpm typecheck` · `pnpm build` · `pnpm preview`
Always run `pnpm typecheck && pnpm build` after changes.
