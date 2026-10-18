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
