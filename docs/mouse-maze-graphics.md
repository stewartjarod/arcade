# Mouse Maze Math: how the graphics work

The look is "soft toy-box": textured rounded worlds, one real shadow, a gentle glow, a plush mouse. It has to stay smooth on
tablets and school Chromebooks, so there are rules.

## Quality tiers (`games/mouse-maze-math/src/quality.ts`)
`high` (desktop), `medium` (phones, tablets, Chromebooks, 4 cores or fewer), `low` (safety net: no shadows, no glow pass, no smoothing of edges).
Medium and high both use MSAA 4 so edges stay smooth on tablets; the difference is pixel ratio and shadow size.
`?quality=low|medium|high` forces one; `?gov=0` stops the automatic step-down (for screenshots). A governor lowers the tier
if the median frame stays over 22 ms (never raises it again in the same visit). The tier is not saved anywhere.

## Rules that keep it fast
- Walls, floor tiles, wall caps and the contact shade strips are each ONE instanced mesh; still door parts are glued together
  (`mergeStatic` in `world.ts`). Don't add a mesh per wall or per decoration: instance it.
- Decoration uses low-detail shared spheres (`ballLo`, `ballTiny`). A smooth sphere costs ~500 triangles; a hedge maze once had 700k triangles because of it.
- No extra real lights (every light costs every lit pixel). Fake glows with additive sprites. Only the sun casts shadows (one map that follows the mouse).
- Textures are neutral grey (`textures.ts` strips colour) because the realm colour is multiplied on top. Don't paint coloured textures for realms.
- Glow: only colours ABOVE 1.0 bloom. Glowing things use `color.multiplyScalar(2.2)` and `toneMapped: false`. Everything else must stay <= 1.0
  so white walls, snow and door signs never glow. No tone mapping on purpose (Neutral/ACES crush mid colours).
- Free GPU memory in `clearLevel` (geometry, instance buffers, chest, props). Check `renderer.info.memory` stays flat after repeated loads.

## Measuring
Dev only (`setTier` can only go DOWN from the tier the page started in: it never builds the glow pass, so open the page with `?quality=medium` to measure medium): in the browser console `__mm.show(realmIndex, mazeLevel)`, `__mm.stats()`, `__mm.census()`, `__mm.world.debug.setTier('low')`.
`renderer.info.autoReset` is off and reset once per frame, so `calls` counts the whole frame including shadow and glow passes.
Headless/software GL is only good for draw calls, triangles and screenshots, not for real frame times.
