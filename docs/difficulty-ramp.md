# How each game gets harder with the IXL grade

The grade comes from the learning package's placement (what the kid has practiced), never from age. The numbers come from each game's `difficulty.ts`; `games/lily-hop/src/ramp.test.ts` fails if any game stops getting harder as the grade rises. Update this table if you change a rule.

| IXL grade | Mouse Maze (first maze) | Lily Hop | Bubble Pop |
|---|---|---|---|
| K | 3 questions | 6 pads, gator only after a miss | 3 bubbles, 14s fall |
| 1 | 4 questions | 8 pads, gator only after a miss | 3 bubbles, 14s fall |
| 2 | 5 questions | 10 pads, gator every 14s | 4 bubbles, 10s fall |
| 3 | 6 questions | 12 pads, gator every 14s | 4 bubbles, 10s fall |
| 4 | 7 questions | 14 pads, gator every 8s | 5 bubbles, 7s fall |
| 5 | 8 questions | 16 pads, gator every 8s | 5 bubbles, 7s fall |

## Mouse Maze plays differently by grade, not just longer

| IXL grade | Style | What changes |
|---|---|---|
| K, 1 | cozy | No trap cage: a wrong door is just a friendly dead end. Questions are read aloud automatically. |
| 2, 3 | explorer | Wrong doors can be traps: tap the right answer twice to escape the cage. |
| 4, 5 | speedy | Traps too, plus a ⚡ +5 🧀 bonus for answering within 6 seconds. |

The questions climb too: every skill has levels mapped to IXL grades (`packages/learning/src/ixl/map.ts`), and the i+1 scheduler asks mostly at the player's level, some one harder.
