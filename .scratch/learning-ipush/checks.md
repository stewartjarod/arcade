# Checks

| node | requirement | verdict | evidence |
|---|---|---|---|
| N0 | evaluator committed before any learner/scheduler edit | pass | `packages/learning/src/core/ipush.test.ts`, commit on `learning-ipush` |
| N0 | baseline fails drift metrics, passes existing | pass | `baseline.txt`: LEARNER lead −0.95, onTarget 0.35; 6 of 8 ipush tests fail |
| N3 | `lessonFor` sweep over every skill/level: text, say, no names, no grade/IXL/score | pass | `npx vitest run packages/learning/src/core/teach.test.ts`: 2 passed |
| N3 | example is never the asked question | pass (after lead fix) | N3 compared prompt text only, so 14% of cards had no example (clocks, shapes, "which word…" questions). Lead correction: same question = same key, or same text+svg+emoji+answer. Test tightened to compare the whole shown prompt + answer |
| N3 | almost every card shows a worked example | pass | new assertion `examples/checked > 0.95`; measured 2658 of 2660 |
| N3 | `challenge()` shows the card for frontier items | pass (code read) | `ui/challenge.ts` awaits `teachCard(lessonFor(q.item))` then `q.restartTimer()`; visual check deferred to N7 |
| N4a | teach cards for K–3 math (math.ts, mathEarly.ts): short, say, no names/grades | pass | `mathTeach.test.ts` 27 passed; `subjects.test.ts` 430 passed (agent run) |
| N4a | facts correct for grown-ups | pass (after lead fix) | lead read all 111 distinct texts (`/tmp/teach.txt` dump). Fixed: × convention flipped between L1 ("2 × 4 = 2 groups of 4") and L2+ ("5 × 3 = 3 groups of 5"); now "3 × n = 3 groups of n". Perimeter card reworded ("count every square edge on the outside") |
| N4b | teach for clocks/coins/early reading/writing; fromKey for caps, stories, sounds; seconds for time, coins, sight | pass | `languageTeach.test.ts` 15 passed; `subjects.test.ts` 430 passed; fromKey round-trip ~20 items/level |
| N4b | facts correct | pass (after lead fix) | lead read all texts: "mi-cro-phone has 4" syllables was wrong (3); now "wa-ter-mel-on has 4". `reading.stories` key format changed (old keys never rebuilt anyway) |
| N1 | placement floor in rating(); LEARNER vsPlaced better than baseline | pass | vsPlaced −0.77 → −0.31 (agent run of ipush report) |
| N1 | placement settles | pass | placedSd STATIC_1 0.30 → 0.07, STATIC_3 0.24 → 0.04 |
| N1 | grew() not a flood | pass (spec deviation) | grew() counts SAVED ratings that rose a whole level (fixed gate core.test.ts sets a rating without an answer, so "answered this practice" would fail it). maxGrew 49 → 10 |
| N1 | frontier miss doesn't lower placement | pass | ipush "a miss on a brand-new topic" + learner.test.ts (11 passed) |
| N1 | fixed gates placement.test.ts + core.test.ts | pass | 59 passed |
| N1 | **regression found by lead:** post-placing step floor 0.05 makes placement lag a learning kid | fail → N2 | LEARNER endPlaced 2.35 vs truth 2.89 (baseline 2.70). New stricter assertion added to ipush.test.ts: abs(endPlaced − endTruth) < 0.35. Retuning `placeStep` handed to N2 |
| batch 1 | full `pnpm typecheck` + `pnpm test` | pass except N2-owned ipush tests | tsc clean; 1962 passed, 5 failed (all in ipush.test.ts, N2 scope) |
| N5b | Lily Hop, Bubble Pop, Rocket Tour, Candy Quest show the card before frontier questions, game paused | pass (code read) | diff read by lead: Lily Hop `busy`, Bubble Pop `phase='wait'`, Rocket Tour new `'teach'` phase, Candy Quest gate already paused + chase `asking` false. Agent: 22 game tests pass, typecheck 0 errors |
| N5b | bot scripts don't stall on the card | pass (not run) | `.teach-go` click added to `.scratch/lily-mash.mjs`, `candy-quest/play.mjs`, `play-monster.mjs` |
| N5b | card respects Rocket Tour's "Read to me: off" | pass (after lead fix) | added `readAloud` option to `teachCard()`; Rocket Tour passes its switch |
| N5a | Mouse Maze shows the card before a frontier question, no timers running, then doors | pass | agent: 102 Mouse Maze tests pass, typecheck clean; headless run with dev-only `?teach=1`: card shown with `__maze.teaching: true`, no doors; after "Got it" 3 doors + question, no console errors |
| N5a | screenshot | pass | lead viewed `teach-card-maze.png` (card: hexagon worked example) and `teach-card-maze-after.png` (triangle question, doors) — example is a different question than the one asked |
| N2 | all ipush tests pass on the evaluator's seeds | pass | lead run: 9/9; LEARNER lead −0.88 → −0.19, onTarget 0.33 → 0.89; STATIC_1 lead 0.47 → 0.27; maxFocus 10 → 4; frontierShare 0 → 0.04–0.13 |
| N2 | full `pnpm typecheck && pnpm test && pnpm build` | pass | lead run: tsc clean; 48 files, 1972 tests passed; build ✓ |
| N2 | robust on fresh seeds [101..606] | fail → correction attempt 2 | 8/9 pass; "placement settles" STATIC_3 placedSd 0.154 vs < 0.15 (margin was seed luck: 0.142 on fixed seeds). Sent back: trend-aware post-placing step, learner.ts only |
| N2 | code read | pass | lead read scheduler.ts: frontier only after placing, seen===0, unlocked, format/audio usable; unseen band skills held at weight 0.02 so they stay new; due facts subject-wide once placed |
| N6 | docs match code | pass (pending N2 attempt 2 wording) | CLAUDE.md layout + learning rules (teach card rule), docs/difficulty-ramp.md |
| N2 | attempt 2: trend-aware post-placing step, robust on fresh seeds | pass | agent: 9/9 on seeds A and B with margin (static placedSd ≤ 0.115, learner gap ≤ 0.27). Lead: 9/9 on a THIRD unseen set [7, 77, 777, 7777, 31337, 4242] (agent tuned on A and B, so C is the honest check) |
| N7 | final `pnpm typecheck && pnpm test && pnpm build` | pass | tsc clean; 48 files, 1972 tests passed; `✓ built` |
| N7 | evaluator vs baseline (own seeds, rounds 20+) | pass | LEARNER lead −0.95 → −0.19, onTarget 0.35 → 0.79, right 0.94 → 0.91; STATIC_1 onTarget 0.51 → 0.78; STATIC_3 lead −0.57 → +0.35, onTarget 0.36 → 0.78; maxFocus 10 → 4; frontier 0 → 4–13%; maxGrew 49 → 10 |
| N7 | teach card screenshot | pass | `.scratch/learning-ipush/teach-card-maze.png`, `teach-card-maze-after.png` |
| N7 | graph.md matches nodes that ran | pass | N5a/N5b ran alongside N2 (recorded); engine node dropped (recorded) |

**Unresolved / thin margins** (deterministic, but a future change will move them): UNDER `lead` 0.49 vs < 0.5 on seeds B (0.31–0.38 on A and C); LEARNER `right` 0.90–0.92 vs < 0.93. Frontier share for a steady kid shrinks over many rounds as the pool of never-seen topics a step above them empties (by design: once seen, a topic isn't new). "Bonus for skills not seen for longest" not built: needs a per-skill last-seen time in the save.
| N2/N3 | advisor gap: `similar()` follow-up to a new topic lost the frontier flag, so a miss on it lowered placement (Mouse Maze trap cage, Bubble Pop retry) | pass (lead fix) | `pickSimilar` keeps `frontier`; games only show the card on fresh `ask()` paths (grep: bubble-pop:113 in the ask branch, mouse-maze:187 junction ask, cage at :75 has none). New test "similar() to a frontier question is still frontier" in scheduler.test.ts |
| N3 | card said "new" twice (title "Something new!" + text "New! …") | pass (lead fix) | fallback text is now just the skill name; teach.test.ts updated to match |
| N7 | full gate after fixes | pass | tsc clean; 48 files, 1973 tests; build ✓ |
| N8 | Lily Hop / Bubble Pop / Rocket Tour / Candy Quest seen in a browser with a placed profile | running | — |
