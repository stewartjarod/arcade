# How each game gets harder with the IXL grade

The grade comes from the learning package's placement: it starts at the grade on the player's profile (IXL's scale, 100 points per grade) and moves with every answer, so a kid who is really ahead or behind is found within a maze or two. Kids never see it; it only sets how the games play. The games' grade can fall at once but rises at most one grade per round, so a hot streak doesn't flip a young player to a much harder style. The numbers come from each game's `difficulty.ts`; `games/lily-hop/src/ramp.test.ts` fails if any game stops getting harder as the grade rises. Update this table if you change a rule.

| IXL grade | Mouse Maze (first maze) | Lily Hop | Bubble Pop |
|---|---|---|---|
| K | 5 questions | 6 pads, gator only after a miss | 3 bubbles, 14s fall |
| 1 | 6 questions | 8 pads, gator only after a miss | 3 bubbles, 14s fall |
| 2 | 7 questions | 10 pads, gator every 14s | 4 bubbles, 10s fall |
| 3 | 8 questions | 12 pads, gator every 14s | 4 bubbles, 10s fall |
| 4 | 9 questions | 14 pads, gator every 8s | 5 bubbles, 7s fall |
| 5 | 10 questions | 16 pads, gator every 8s | 5 bubbles, 7s fall |

## Mouse Maze plays differently by grade, not just longer

| IXL grade | Style | What changes |
|---|---|---|
| K, 1 | cozy | No trap cage: a wrong door is a friendly dead end, and the same question comes back with that door crossed out. Questions are read aloud automatically. |
| 2, 3 | explorer | Wrong doors can be traps: solve one question (grade 2) or two (grade 3) to escape the cage. |
| 4, 5 | speedy | Traps too (two questions to escape), plus a ⚡ +5 🧀 bonus for answering within 6 seconds. |

Every grade keeps the same question while the player works out a door: a wrong door doesn't re-roll it, and a door already tried stays crossed out. If the player sits thinking, the question is read again (every 8 seconds for K and 1, every 12 for the rest). For K and 1, one wrong door also fades away after 16 seconds.

### Mouse Maze numbers

Every grade gets a big, grand maze: long winding corridors (one to three straight runs of three to five or more cells each, `corridorFor` in `difficulty.ts`). A maze starts with a quick sky-drop behind the mouse (tap to skip) that never shows the layout, so the route isn't given away. Near the end the camera rises to show the treasure chest with a beam of light over it, the mouse trots up to open it, and then the camera lifts over the whole maze so you can see the route you ran.

A maze gets one more door question for every three mazes won, up to the cap, and traps creep up by 0.02 for every maze won, up to their cap.

| IXL grade | Style | Questions (first maze → cap) | Trap chance (first maze → cap) | Cage | Idle nudge | Hint |
|---|---|---|---|---|---|---|
| K | cozy | 5 → 8 | 0 | none | every 8s | one wrong door fades at 16s |
| 1 | cozy | 6 → 9 | 0 | none | every 8s | one wrong door fades at 16s |
| 2 | explorer | 7 → 10 | 0.2 → 0.35 | 1 question | every 12s | none |
| 3 | explorer | 8 → 11 | 0.3 → 0.4 | 2 questions | every 12s | none |
| 4 | speedy | 9 → 12 | 0.3 → 0.5 | 2 questions | every 12s | none |
| 5 | speedy | 10 → 12 | 0.3 → 0.5 | 2 questions | every 12s | none |

## Lily Hop, Bubble Pop and Rocket Tour play differently by grade too

The band rule is `playStyleFor(grade)` in the learning package: cozy (K, 1), explorer (2, 3), speedy (4, 5).

| Style | Lily Hop | Bubble Pop | Rocket Tour |
|---|---|---|---|
| cozy (K–1) | No gator. A wrong pad just sinks; nothing can be lost. | No hearts. If the right bubble floats down it comes back as a new question. | One wrong answer is removed at each gate: two choices. |
| explorer (2–3) | The gator swims after you. | Three hearts; a missed bubble costs one. | Three choices. |
| speedy (4–5) | Gator too, plus a ⚡ super hop (two pads) for a quick right answer. | Hearts too, plus ⚡ bonus points for a quick first-try pop. | Three choices, plus ⚡ +5 stardust for a quick first-try answer. |

The questions climb too: every skill has levels mapped to IXL grades (`packages/learning/src/ixl/map.ts`), and the i+1 scheduler asks mostly at the player's level, some one harder.
