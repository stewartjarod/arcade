# 🕹️ Arcade

Our three.js games, all in one place. Every game gets its own page, and the homepage lists them all.

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

Pick or make a player on the homepage ("Who's playing?"). Everything is saved in the browser, per player:

- **Game saves** — `storage('my-game')` in the engine automatically saves for whoever is playing.
  Save a high score as `'best'` (e.g. `save.highScore(score)`) and it shows on the homepage card.
- **Math skills** — the i+1 learning model lives on the *player*, not in a game, so every math game
  shares it. Practice in one game and you're levelled up in all of them:
  ```ts
  import { mathLearner, chooseProblem, updateSkill } from '@arcade/learning'
  const math = mathLearner()                         // current player's levels
  const p = chooseProblem(math.skills)               // a question at their level (sometimes +1)
  updateSkill(math.skills, math.stats, p, correct ? 1 : 0)
  math.save()
  ```
- `game.player` has the current player's name, avatar and color if a game wants to show them.

Until someone makes a player, you play as Guest; the first player you create keeps Guest's progress.

## What's where

```
index.html, site/      the homepage (finds every game automatically)
games/
  _template/          starter every new game is copied from
  coin-hunt/          a game! (game.json + index.html + src/main.ts)
  mouse-maze-math/    3D maze + math practice (its own code, no engine)
packages/
  engine/             @arcade/engine — the shared game engine
  assets/             @arcade/assets — shared characters, models, sounds
  players/            @arcade/players — player profiles + per-player saves (localStorage)
  learning/           @arcade/learning — adaptive i+1 math practice, saved on the player
scripts/              new / dev
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
- **sound** — `game.sound.play('coin' | 'jump' | 'hit' | 'boom' | 'powerup' | 'win' | 'lose')`. No files needed!
- **hud** — `game.hud.set('score', '⭐ 5')`, `game.hud.message('You win!', { button: 'Again', onClick })`.
- **tweens** — `game.tweens.to(thing.scale, { x: 2, y: 2, z: 2 }, 0.5, ease.bounce)`.
- **extras** — `burst()` particles, `rand` `pick` `chance`, `storage('my-game')` for high scores, `loadModel()` for .glb files.

## Sharing things between games

If you make something cool in one game — a character, an enemy, a behavior — move it into
`packages/assets/src/prefabs.ts` (things) or `packages/engine/src/behaviors.ts` (brains) and every game can use it.
Shared models and sounds go in `packages/assets/models` / `sounds` — see `packages/assets/README.md`.
