# Baseline (before the graphics upgrade), maze level 3, 8 realms
Static census (draw items = visible meshes/points; instances counted; triangles include instances, no culling).
Rendered stats come from SwiftShader (software GL), so frame ms are only useful relative to each other.

| realm | draw items | instances | triangles |
|---|---|---|---|
| 0 cupboard | 240 | 240 | 18,838 |
| 1 candy | 290 | 290 | 19,438 |
| 2 garden | 275 | 1431 | **662,034** |
| 3 frozen | 263 | 617 | 22,652 |
| 4 cellar | 298 | 633 | 35,746 |
| 5 crystal | 248 | 557 | 22,022 |
| 6 clockwork | 290 | 984 | **330,146** |
| 7 star | 243 | 509 | 22,054 |

Rendered (realm 0): ~119-160 draw calls, ~12k triangles in view, ~100ms/frame in SwiftShader at 800x500.
Why garden/clockwork are huge: hedge leaves and brass rivets use the shared 20x14 sphere (~520 triangles each).
Screenshots: shots/baseline/realm-0.png, realm-1.png (the others were too slow to render in software).
