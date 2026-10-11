# Mouse Maze Math: "soft toy-box" graphics upgrade

Goal: make Mouse Maze Math look like a polished kids' game (soft clay/plush look, real shadows, bloom on glows,
rich per-realm worlds, cute hero) while staying smooth on tablets and school Chromebooks.

Decisions (from the user): soft toy-box style, procedural only (no model downloads), target = phones/iPads/Chromebooks,
all four areas in scope, `postprocessing` (pmndrs) may be installed, commits by path allowed.

Constraint: `world.ts`, `realms.ts`, `ui.ts`, `style.css`, `game.ts`... already have the user's UNCOMMITTED edits.
Never revert, stash or reformat them. Edit in place, small diffs.

## Performance budget (measured, not guessed)
Step 0 records a baseline per realm (draw calls, triangles, JS frame ms) with a `?perf` overlay. Budgets:
- chase view, "high" tier: draw calls <= baseline and <= 120; triangles <= 150k
- one shadow map (<= 2048 high / 1024 medium / off low), shadow camera follows the mouse with a ~36 unit box
- pixel ratio capped (high 2, medium 1.5, low 1); bloom runs at half resolution
- a frame-time governor steps the tier down (high -> medium -> low) if the average frame is > 22ms for 2s,
  and never steps up again in the same session (no flip-flopping)
- `postprocessing` code lives in the mouse game's chunk only; other games' bundles unchanged

## Work packages
| # | Package | Owns (new files unless noted) | Done when | Parallel? |
|---|---|---|---|---|
| 0 | Setup + baseline | `pnpm add postprocessing`, `?perf` overlay + `window.__mm` debug hook, baseline screenshots/metrics in `.scratch/mouse-graphics/baseline.md` | numbers + 8 realm screenshots saved | first (me) |
| A | Render pipeline | `packages/engine/src/postfx.ts` (EffectComposer: MSAA, bloom, vignette, soft color grade), `games/mouse-maze-math/src/quality.ts` (+ `quality.test.ts`: tiers, governor step-down logic) | tiers work, governor unit-tested, low tier skips composer | yes |
| B | Procedural textures + sky | `games/mouse-maze-math/src/textures.ts` (floor tile, wall, door wood per realm style, cached, small canvases 128-256px, mip + anisotropy 4), `sky.ts` (gradient sky dome + sun glow, per realm, one draw call) | each realm has a distinct floor/wall/door texture + sky; no per-frame work | yes |
| C | Hero: mouse | `packages/assets/src/mouse.ts` (rewrite in place; only world.ts uses it): rounder body, fur colour gradient, belly, big eyes with highlight, blush, whiskers, teeth, arms/hands, fresnel rim shader via onBeforeCompile; `animate(t, moving, mood)` hook (blink, ear wiggle, tail sway, step cycle); better hats | builds without a canvas (unit test builds every colour x hat), <= 6k triangles | yes |
| D | Treasure + props | `games/mouse-maze-math/src/chest.ts` (bevelled chest, metal bands, coin heap, lid, sparkle ring), `props.ts` (per-realm instanced floor/wall decor that never blocks corridors: sprinkles, flowers, snow tufts, mushrooms, cogs, glow dots) | chest + props return objects/instances to add to `level`; instanced only | yes |
| E | UI / HUD look | `games/mouse-maze-math/src/style.css` (edit in place), small `index.html` tweaks | buttons/cards/chips/question card/doors-bar restyled to match (glossy gradients, soft shadows, consistent radii), readable at 320px and landscape phone, no layout changes | yes |
| F | Integration (shared wiring) | `world.ts`, `realms.ts` (light/colour tuning only), `main.ts` | walls + floors become InstancedMesh with textures; fake contact-AO strips along wall bases; mouse follows shadows; doors restyled; chest/props/sky/postfx hooked up; ACES-ish tone mapping + sRGB output; everything cleaned up in `clearLevel` | after A-E (me) |
| G | Review + polish | tuning pass per realm from screenshots, guard tests | see Definition of done | last |

A-E run as parallel subagents with separate files; I do 0 and F. Interfaces are given to each agent in its brief
(e.g. `makeRealmTextures(realm) -> { floor, wall, door }`, `createChest() -> { group, lid, sparkle(dt) }`).

## Definition of done (checkable)
1. `pnpm typecheck && pnpm test && pnpm build` all pass.
2. Perf: in the browser with `?perf`, for every one of the 8 realms in chase view: draw calls <= min(baseline, 120), triangles <= 150k,
   recorded in `.scratch/mouse-graphics/after.md` next to the baseline. Frame ms (JS) not worse than baseline by more than 20% on high tier.
3. `?quality=low` and `?quality=medium` each load a maze with zero console errors, and low renders with no composer and no shadow map.
4. Screenshots of all 8 realms (chase view) + chest reveal + menu + a question screen exist in `.scratch/mouse-graphics/shots/` and I have looked at them.
5. `dist/` bundle sizes of other games unchanged (compare `dist/games/*/assets` before/after).
6. No console errors/warnings during a full maze run (flyover -> doors -> cage -> chest -> overview) in at least 2 realms.
7. Unit tests exist for: quality governor, texture cache keys (no re-creation), mouse model builds for every colour x hat, and the "dispose everything" path (no growth in `renderer.info.memory` after loading 5 mazes in a row).

## Human checks (not part of done)
- Does it look good to Ima and Millie? (the mouse especially)
- Smoothness on the actual iPad / Chromebook / phone they use (my numbers are from this machine's browser).
- Anything that feels too busy for reading the door numbers.

## Out of scope
Other games, game logic/learning/difficulty, audio, new realms, CC0 model downloads, changing the maze layout or camera design.
