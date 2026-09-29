# Libraries to reach for

three.js and our own `@arcade/*` packages cover most games. This is a shopping list for when a game needs
something they *don't* do. **Nothing here is installed yet.** Add a library only when a game actually needs it.

## Before you add one

1. Can the engine already do it? Check `packages/engine/src` (behaviors, tweens, particles, sound) first.
2. Install it at the **root** (`pnpm add <lib>`), because games resolve dependencies from the root `node_modules`.
3. Wrap it so games use our style. Make a behavior (`.with(physicsBody())`) or a helper in `packages/engine`
   instead of having every game call the library directly. Kids should never need to read the library's docs
   to make a game.
4. Keep it tree-shakeable and lazy where possible. Big libraries (physics WASM) should be loaded with a
   dynamic `import()` by the games that need them, so the other games stay fast.
5. Run `pnpm typecheck && pnpm build`, and check the build size didn't jump.

## Good bets

| Library | Use it for | Notes |
| --- | --- | --- |
| **Rapier** (`@dimforge/rapier3d-compat`, or `rapier2d`) | Real physics: bouncing, stacking, knocking things over, marble runs, bowling | Best fit for three.js. Our `gravity()` and sphere collisions are enough for simple platformers. Reach for Rapier when things need to *tumble*. Wrap it as a `physicsBody()` behavior. |
| **postprocessing** (pmndrs) | Bloom (glowing coins), outlines, vignette, color grading | The biggest "looks polished" gain for the least code. |
| **Howler.js** | Recorded music and voice clips | Our synth presets handle sound effects. Only add it for real audio files. |
| **yuka** | Game AI: steering, wandering, pathfinding, state machines | Engine-agnostic. Good for smarter enemies and NPCs than `chase` and `patrol`. |
| **three-mesh-bvh** | Fast raycasts and collisions against big or complex meshes | For maze and level games with lots of geometry. |

## Maybe later

- **GSAP**: fancy timelines (camera flythroughs, UI animation). Our `tweens` covers most needs. Try it only if tweens gets in the way.
- **Tone.js**: generative or reactive music.
- **Zustand** or a tiny store: only if HUD and UI state gets tangled. `game.state` is fine until then.

## Dev tools (not shipped to players)

- **lil-gui** or **Leva**: live sliders for speed, gravity, jump height. A great way to *see* how numbers change a game.
- **gltf-transform**: compress and optimize `.glb` files before adding them to `packages/assets`.
- **Playwright**: a smoke test that opens every game and fails on console errors. It would pair with `vitest`.

## Skip

- Whole frameworks and engines (Babylon, PlayCanvas, react-three-fiber). They fight our Entity + behavior design.
- **cannon-es**. Rapier replaced it.
