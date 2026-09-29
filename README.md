# 🕹️ Arcade

Our three.js games, all in one place. Every game gets its own page, and the homepage lists them all.

## What this repo is for

This is a **dad-and-daughter game workshop**. We make small, playable 3D browser games together, and the
goal is to have fun and see results fast while learning to code along the way. It is not a game engine
project or a portfolio piece.

**The games we want to make are:**
- **Small and quick to play**: a round lasts a few minutes, and you can get the idea in seconds.
- **Colorful and silly**: simple shapes, bright colors, big sounds, particles and confetti.
- **Playable in a browser**: keyboard, mouse or gamepad, no installs, hosted as one site.
- **Sometimes sneaky-educational**: math (and other skills) woven into the fun, like bonus stars that ask a question.
  Progress follows the *player* across every game.
- **Built in an afternoon**: if an idea needs weeks of engine work, we shrink the idea.

**How we write the code:** short functions, friendly names, and comments that explain *why* in plain words.
Readable beats clever. If a kid can't follow it, simplify it.

Ideas for extra libraries (physics, glow effects, AI, …) live in [`docs/libraries.md`](docs/libraries.md).

## Make a new game

```sh
pnpm dev                # opens the Arcade homepage — pick a game to play
pnpm new space-cats     # copies games/_template → games/space-cats
pnpm dev space-cats     # jumps straight into one game; saves reload instantly
```

Then open `games/space-cats/src/main.ts` and start changing things.
Set the title, emoji, color and description in `games/space-cats/game.json` — that's what shows on the homepage.
Want a picture instead of the emoji? Drop a `thumbnail.png` (a screenshot works great) next to `game.json`.

## Release it

Push to GitHub. The site rebuilds and every game in `games/` goes live at `/games/<name>/`.
(Folders starting with `_` are drafts: they show up on the homepage while you run `pnpm dev`, but not on the real site until you rename them.)

To check the real site locally first: `pnpm build && pnpm preview`.

## Players & saves

Pick or make a player on the homepage ("Who's playing?"), and optionally a subject to **practice more of**.
Everything is saved in the browser, per player:

- **Where they start: zero.** Every skill starts at the very beginning — no guessing from age or grade.
  A new skill calibrates fast: each right answer jumps a whole level, and the first miss settles them just
  below it. Then it's gentle i+1. That baseline belongs to the player, so a skill found in one game is
  already known in every other game.
- **What they know** — every subject's levels, plus facts they missed (which come back until they stick),
  live on the *player*, not in a game. Practice in one game and they're levelled up in all of them.
  The homepage shows it: "What Millie is learning", with every skill.
- **Game saves** — `storage('my-game')` in the engine automatically saves for whoever is playing.
  Save a high score as `'best'` (e.g. `save.highScore(score)`) and it shows on the homepage card.
- `game.player` has the current player's name, avatar, color and grade if a game wants them.

Until someone makes a player, you play as Guest; the first player you create keeps Guest's progress.

## Learning in every game

Every game can (and should!) sneak in some learning. It all goes through `@arcade/learning`, which picks
questions at the player's level — mostly just right, sometimes one step harder (that's "i+1") — in any subject:

| Subject | Skills (they unlock and level up as you go) |
| --- | --- |
| 🔢 Math | + and − (10 → 1000s), times tables, division, place value, skip counting |
| 📚 Reading | first sounds, picture words (cat → frog → cake → star), sight words (heard aloud), short stories |
| ✏️ Writing | spelling words you hear, spotting the right spelling, capitals & punctuation |
| 🪐 Space | planet names, their order from the Sun, what makes each one special |
| 🌎 Geography | continents & oceans, countries, then US states & capitals |
| ⏰ Clocks & Coins | telling time on a real clock, counting coins, making change |

**The one-liner** — a pop-up question in whatever subject fits, with the right pad (numbers, letters or choices):

```ts
import { challenge } from '@arcade/learning'

game.paused = true
const { solved } = await challenge({ title: '⭐ Bonus star!' })   // or { subjects: ['space'] }
game.paused = false
```

The template already has a bonus star that does this.

**Your own way of asking** — doors, balloons, anything. Say which answer styles your game can show:

```ts
import { startPractice } from '@arcade/learning'

const practice = startPractice({ formats: ['choice'] })   // once per level; optionally subjects: [...]
const moment = practice.moment()          // one challenge (a door, a boss, a gate)
const q = moment.ask()                    // q.prompt = { text, emoji?, svg?, say? }, q.answer = "12"
const options = q.options(3)              // ["11", "12", "14"] — believable wrong answers
// ...player picks one...
moment.check(q, picked, { choices: 3 })   // → true/false; their levels move
practice.grew()                           // ["Adding up to 100"] — for the level-complete screen
```

It handles the fairness rules for you: only the first answer counts, fast answers count a bit extra,
lucky guesses count less, one bad moment can't undo a level, and missed facts come back later.
Show questions with `renderPrompt(q.prompt)` (pictures, clocks, 🔊 read-aloud) or use the ready-made
`numberPad()`, `letterPad()` and `choicePad()`.

For in-game rewards (new worlds, harder enemies), use `subjectGrowth(learner(), 'math')` — how far they've
come since they started.

**Adding a subject** — write one file in `packages/learning/src/subjects/` (copy `space.ts`: a list of skills,
each with levels and a `generate(level)`), add it to `subjects/index.ts`, and run `pnpm test`: the content
sweep checks every question at every level is answerable and fair.

## What's where

```
index.html, site/      the homepage (finds every game automatically)
games/
  _template/          starter every new game is copied from
  mouse-maze-math/    3D maze + math practice (own world code; shared learning, sound, labels, mouse)
  rocket-tour/        fly from the Sun to Neptune; space questions at each planet (add ?warp=3 to fly faster)
packages/
  engine/             @arcade/engine — the shared game engine
  assets/             @arcade/assets — shared characters, models, sounds
  players/            @arcade/players — player profiles + per-player saves (localStorage)
  learning/           @arcade/learning — i+1 practice in every subject, pads, challenge() (saved on the player)
scripts/              new / dev
                      pnpm test runs the learning tests
```

## The engine in 30 seconds

```ts
import { Game, ground, box, spin, moveWithKeys, cameraFollow, collect } from '@arcade/engine'
import { buddy, coin } from '@arcade/assets'

const game = new Game()

game.start((game) => {
  game.add(ground())
  const player = game.add(buddy()).with(moveWithKeys(), cameraFollow())
  game.add(coin()).at(3, 1, 0).with(collect('player', () => game.sound.play('coin')))
  game.add(box({ color: 'hotpink' })).at(-3, 1, 0).with(spin())
})
```

- **Game** — the world. `add()`, `find(tag)`, `every(seconds, fn)`, `after(seconds, fn)`, `setScene(level2)`, `restart()`.
- **Entity** — a thing in the world. Has `position`, `velocity`, `tags`, `data`, and **behaviors**.
- **Behaviors** — little reusable brains you stack with `.with(...)`:
  `spin` `bob` `moveWithKeys` `platformer` `gravity` `cameraFollow` `chase` `patrol`
  `collect` `onTouch` `lifetime` `stayInside` `despawnFar` — or write your own:
  ```ts
  const wiggle = (e, dt) => { e.rotation.z = Math.sin(e.game.time * 10) * 0.3 }
  ```
- **Shapes** — `box` `ball` `cylinder` `cone` `capsule` `torus` `star` `ground` `group` for building stuff with no models.
- **input** — `game.input.down('left')`, `pressed('jump')`, `axis()`, `clicked`. Keyboard, gamepad and mouse.
- **sound** — `game.sound.play('coin' | 'jump' | 'hit' | 'boom' | 'powerup' | 'win' | 'lose')`, or the shared
  effects `sfx.good(streak)` `sfx.bad()` `sfx.levelUp()` `sfx.door(true)`... and background `music.play(track)`. No files needed!
- **hud** — `game.hud.set('score', '⭐ 5')`, `game.hud.message('You win!', { button: 'Again', onClick })`.
- **tweens** — `game.tweens.to(thing.scale, { x: 2, y: 2, z: 2 }, 0.5, ease.bounce)`.
- **3D labels** — `answerSign(color)` (big speech-bubble answers), `emojiSprite('💥')`.
- **extras** — `confetti()`, `burst()` particles, `rand` `pick` `chance`, `storage('my-game')` for high scores, `loadModel()` for .glb files.

## Using the shared packages in a game

Games are **not** packages themselves. They import `@arcade/*` straight from the repo's root `node_modules`,
so there is nothing to install per game. Start from `games/_template/src/main.ts`, which uses all of these.

| Package | What you get | Typical import |
| --- | --- | --- |
| `@arcade/engine` | The `Game` world, entities, behaviors, shapes, input, sound, HUD, tweens, particles, `storage()`. Also re-exports `THREE`, so `import { THREE } from '@arcade/engine'` and you never need to install three yourself. | `import { Game, box, moveWithKeys, storage } from '@arcade/engine'` |
| `@arcade/assets` | Ready-made things: `buddy` `coin` `starPickup` `tree` `cloud` `spiky` `platform`, plus shared `.glb` models. | `import { buddy, coin } from '@arcade/assets'` |
| `@arcade/players` | Who is playing, plus per-player save keys. Mostly used through the engine (`game.player`, `storage()`). | `import { currentPlayer } from '@arcade/engine'` |
| `@arcade/learning` | i+1 learning in every subject: `challenge()` pops up a question at the player's level; `startPractice()` for your own way of asking; `numberPad` / `letterPad` / `choicePad`. | `import { challenge } from '@arcade/learning'` |

Rules of thumb:
- **Saving anything?** Use `storage('my-game')`, never raw `localStorage`, so saves stay per-player.
- **Asking questions (any subject)?** Use `challenge()` or `startPractice()`, never your own copy, so levels are shared by every game.
- **Need a shared model or sound?** Import it with a `?url` suffix, for example `import hat from '@arcade/assets/models/hat.glb?url'`, then `loadModel(hat)`.
- **Made something two games could use?** Move it into a package (see below).

## Sharing things between games

If you make something cool in one game — a character, an enemy, a behavior — move it into
`packages/assets/src/prefabs.ts` (things) or `packages/engine/src/behaviors.ts` (brains) and every game can use it.
Shared models and sounds go in `packages/assets/models` / `sounds` — see `packages/assets/README.md`.
