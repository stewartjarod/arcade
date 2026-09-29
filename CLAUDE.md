# Arcade — notes for Claude

A dad-and-daughter monorepo of small three.js games. Keep code simple and readable for a kid learning to code:
short functions, friendly names, comments that explain *why* in plain words. Favor fun and visible results over architecture.

## What we're making
Small, colorful, quick-to-play 3D browser games (a round is a few minutes), built in an afternoon, sometimes
with sneaky-educational bits (math via `@arcade/learning`). Prefer the simplest thing that's fun over reusable
architecture. If an idea needs weeks of engine work, suggest a smaller idea instead.
The README's "What this repo is for" and "Using the shared packages" sections are the user-facing version of this.

## Adding libraries
`docs/libraries.md` lists candidate libraries (Rapier, postprocessing, Howler, yuka, …) and the rules for adding one:
install at the root, wrap it as an engine behavior/helper, lazy-load heavy ones, and only add it when a game needs it.

## Layout
- `index.html` + `site/` — landing page; globs `games/*/game.json` (and optional `thumbnail.{png,jpg,webp}`) to render cards. `_` drafts show only in dev.
- `games/<slug>/` — one game each: `game.json` (homepage card: title, description, emoji, color, authors, created), `index.html`, `src/main.ts`, optional `public/`.
  Games are NOT workspace packages; they resolve `@arcade/*` from the root `node_modules`.
- `games/_template/` — copied by `pnpm new <slug>`; `{{slug}}`, `{{title}}`, `{{date}}` get substituted. `_`-prefixed games are skipped by the build.
- `packages/engine` (`@arcade/engine`) — Game, Entity, behaviors, shapes, input, hud, tweens, particles, loaders, util; `audio.ts` (shared synth: `tone`/`noise`, `sfx.*`, `music.play(track)`, `setMuted`; auto-unlocks on first gesture), `labels.ts` (`answerSign`, `emojiSprite`), `confetti()`. Re-exports `THREE`. `sideEffects: false`, so games that use only a few parts (like Mouse Maze Math) don't pull in the rest.
- `packages/assets` (`@arcade/assets`) — shared prefabs (`buddy`, `coin`, `starPickup`, `tree`, `cloud`, `spiky`, `platform`), `mouseModel({ color, hat })` and shared files imported as `@arcade/assets/models/x.glb?url`.
- `packages/players` (`@arcade/players`) — profiles in localStorage (`arcade:players`, `arcade:current-player`); all per-player data lives under `arcade:p:<playerId>:<game>:<key>` via `playerKey()`, so deleting a player and Guest→first-player hand-off just move/remove that prefix. Falls back to a `guest` player.
- `packages/learning` (`@arcade/learning`) — i+1 learning for every subject. `core/`: types (Subject → Skill → Item; formats `number|choice|letters`), `learner.ts` (one per-player state at `playerKey('learning','v2')`: ratings per `subject.skill`, seen/fast, missed-fact spaced repetition, grade placement via `startByGrade`, unlocks via `unlocksAfter`, migration from the old `learning:math` key), `scheduler.ts` (focus subject 50%, stalest subject, weaker skills, due facts 35%, level mix 70/20/10), `practice.ts` (Practice → Moment → Question), `summary.ts`. `subjects/`: math, reading, writing, space, geography, clocks (+ shared word lists). `ui/`: numberPad, letterPad, choicePad, renderPrompt, speak (TTS), `challenge()`. Tests: `core/core.test.ts`, `subjects/subjects.test.ts` (content sweep).
- Single multi-page Vite app: `vite.config.ts` lists the landing page plus every non-`_` game as build inputs → `dist/index.html`, `dist/games/<slug>/index.html`; three.js lands in one shared chunk.

## Engine conventions
- An Entity wraps a three.js Object3D; logic goes in behaviors attached via `.with()`. A behavior is `(entity, dt) => void` or `{ start, update, destroy }`.
- Tags drive interaction: `'player'`, `'enemy'`, `'coin'`, `'solid'` (landed on by `gravity()`). Collision is sphere-based via `entity.radius` / `touches()`.
- Levels are scene functions `(game) => void | cleanup`; `game.setScene(fn)` wipes the world, `game.restart()` reruns the current one.
- `game.state` for per-run values (score), `storage(slug)` for per-player persistence (`'best'` shows on the homepage card), `game.player` for who's playing.
- Never write to localStorage with raw keys in a game — go through `storage()`, `playerKey()` or `@arcade/learning` so saves stay per-player.
- Promote anything reused by 2+ games into `packages/`.

## Learning rules (important)
- Every game should include i+1 practice, and it must go through `@arcade/learning` so progress is shared per player across all games and subjects.
- Quick question: `challenge({ title, subjects?, formats? })`. Custom UI: `startPractice({ subjects?, formats })` → `practice.moment()` → `moment.ask()` → `moment.check(q, response, { choices })` / `moment.record(q, correct|0..1, { choices })`. One `Practice` per level/round; one `Moment` per challenge (shared max-drop safety net; only its first question can earn the speed bonus).
- Declare only the `formats` the game can actually show. Show `q.prompt` fully (emoji/svg/`say` via `renderPrompt`) — questions for young kids depend on pictures and read-aloud.
- Never call `learner.score`/`limitDrop`/`pickItem` from a game, never keep a copy of ratings, never score retries.
- In-game rewards/unlocks use `subjectGrowth()`, not absolute levels (grade placement would skip rewards).
- Display: `peekLearner()` + `skillSummary()`/`subjectSummary()` (fresh from storage); in-game: cached `learner()`.
- Content must be correct for kids *and* grown-ups (facts checked; avoid answers that change over time). New subjects/skills must pass `pnpm test` — the sweep checks every level: answer present, `wrong(n)` returns n distinct options none of which score as right, `fromKey` round-trips. Use `check()` for exact-match content (capitalization) or partial credit (spelling).
- Kids: Ima (1st grade) and Millie (2nd grade). Keep prompts short; use `say` for anything a 1st grader can't read; `listen: true` only when sound is required.
## Commands
`pnpm new <slug>` · `pnpm dev [slug]` · `pnpm typecheck` · `pnpm test` · `pnpm build` · `pnpm preview`
Always run `pnpm typecheck && pnpm test && pnpm build` after changes.
