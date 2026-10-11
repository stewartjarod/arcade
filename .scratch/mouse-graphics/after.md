# After the graphics upgrade (maze level 3, 800x500, SOFTWARE GL: only calls/triangles are meaningful, ms is relative)

Method: `cost.mjs` opens a FRESH page per tier (so the glow pass, MSAA and shadows are really on for medium/high), times 6 direct renders
with the GPU forced to finish, and counts every draw of the frame (main pass + shadow pass + glow passes). Numbers vary run to run
because mazes and views are random. Old build measured the same way earlier (`baseline.md`, `cost-base.txt`).

| realm | old calls | new calls low / medium / high | old triangles | new triangles low / medium / high | old ms | new ms low / medium / high |
|---|---|---|---|---|---|---|
| 0 cupboard | 112 | 14 / 43 / 58 | 11k | 4k / 11k / 14k | 41 | 44 / 169 / 155 |
| 1 candy | 104 | 40 / 109 / 113 | 11k | 15k / 29k / 31k | 40 | 94 / 206 / 240 |
| 2 garden | 217 | 43 / 71 / 127 | **739k** | 88k / 92k / 105k | 343 | 123 / 219 / 260 |
| 3 frozen | 134 | 37 / 121 / 74 | 15k | 15k / 37k / 23k | 41 | 64 / 217 / 195 |
| 4 cellar | 270 | 59 / 79 / 93 | 33k | 26k / 27k / 27k | 54 | 99 / 252 / 210 |
| 5 crystal | 106 | 37 / 105 / 65 | 14k | 14k / 31k / 20k | 39 | 60 / 206 / 208 |
| 6 clockwork | 135 | 39 / 108 / 124 | **401k** | 46k / 61k / 59k | 141 | 80 / 234 / 233 |
| 7 star | 178 | 80 / 108 / 115 | 19k | 25k / 32k / 31k | 58 | 81 / 239 / 224 |

Largest maze the game builds (12 junctions), medium tier: garden 202k triangles / 168 calls (after trimming the hedge archways; was 368k),
clockwork 155k / 68, cellar 52k / 77, cupboard 31k / 68.

Honest reading:
- Draw calls: new 14-127 per whole frame (shadow + glow passes included) vs old 104-270. The plan's budget of <= 120 is met in most
  views, with a few at 121-127 (high tier on a random maze).
- Triangles: typical realms 4k-105k (old up to 739k). Garden at the largest maze is ~200k, over the 150k plan budget; still ~10x lighter than the old build at that size.
- Frame time: in software the medium/high tiers cost 3-5x the old build on typical realms, because the full-screen glow pass, MSAA and the shadow
  map are pixel-fill heavy; on a real GPU those are ~1-3 ms. The plan's "high not >20% slower than before" check CANNOT be judged on this
  machine. Garden and clockwork are faster than before on every tier. Smoothness on the real iPad/Chromebook is a Human check;
  the governor steps high -> medium -> low when the median frame stays over 22 ms.
- Canvas inline style after load is empty at every tier (the stale-size bug on step-down was fixed).
- Memory: textures steady at 38, geometries 36-46 over 6 mazes in a row (no growth; the old code leaked geometry on every load).
- Console: clean in a scripted full run (flyover, doors, bonk, cage, reveal, chest, hop, overview) in garden and crystal, and at all three tiers.
Not done as planned: DoD #7's "no memory growth" unit test is replaced by the browser memory check above (it needs a WebGL context).
Screenshots: shots/baseline-full (old), shots/wave3 + wave4 (new), shots/scenes (reveal, chest, overview, front), shots/ui (menu, question, desktop + phone).
