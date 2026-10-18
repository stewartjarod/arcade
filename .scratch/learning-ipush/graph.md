# Graph: i+1 that keeps pushing (learning-ipush)

Status: ready-for-agent · Branch: `learning-ipush` (local, not pushed)

## Inputs
- **Task:** fix the review findings in `@arcade/learning`: questions keep up with the kid after placing (A, B, C), new untaught topics come with a teach card (D), a round sticks to a few skills (E), cleanups (F).
- **Output:** code on branch `learning-ipush`; this directory (`graph.md`, `checks.md`, `progress.md`, `baseline.txt`).
- **Checks:** `packages/learning/src/core/ipush.test.ts` (the evaluator, fixed), existing `placement.test.ts` + `core.test.ts` (fixed gates), `pnpm typecheck && pnpm test && pnpm build`, a screenshot of a teach card in Mouse Maze.
- **Sources:** the review in this session; `CLAUDE.md` learning rules; `docs/difficulty-ramp.md`.
- **Scope:** `packages/learning/**`, `games/*/src/**` (teach-card hookup only), `docs/difficulty-ramp.md`, `CLAUDE.md` learning section. Not the engine (user marked it optional; advisor: unverified need). Not `.scratch/mouse-graphics/world.before.ts`.
- **Limit:** 3 attempts per node; at most 10 subagent runs in total.

## Decisions
- Ran without the approval pause: the user asked for the fixes outright ("Gotta fix these issues for sure"), and the session is unattended.
- A is the cheap floor first (`rating() = max(saved, placement start − 0.5)`), not the offset rewrite: it keeps the save format and `limitDrop` working. Offsets only if the floor fails its gate.
- Round focus refresh: per Practice, per subject: up to 4 skills chosen the first time a subject is asked, chosen again after every 10 questions in that subject. Not while placing. Due missed facts and frontier picks don't count against it. (Needed because `challenge()` keeps one Practice for the whole page.)
- Frontier: only after placing, about 1 pick in 8, from skills with `seen === 0` whose gates are met and whose starting question is 0.3–1.0 grade above the placement. `Item.frontier = true`. A frontier miss doesn't lower placement.
- Sequential nodes may edit the same file (N1 then N2 both touch `practice.ts`); parallel nodes never share a file.
- "Shallow-skill bias" metric dropped: 69% of math skills have ≤3 levels, so the 80% share was mostly the population. Replaced by `onTarget` (share of questions within 0.6 grade of the kid).

## Contract (written by N0, already in `core/types.ts`)
- `Item.frontier?: boolean` — set by the scheduler.
- `Skill.teach?(level): Teach` and `interface Teach { text; say?; emoji?; svg?; example?: { prompt; answer } }` — exported from the package index.

## Nodes

| id | kind | does | reads | writes (only) | check |
|---|---|---|---|---|---|
| N0 | code (lead) | evaluator + contract + baseline | review, learner/scheduler | `core/ipush.test.ts`, `core/types.ts`, `index.ts` (type export), `baseline.txt` | baseline fails drift metrics, existing tests pass |
| N1 | agent | A: placement floor in `rating()`; damp placement after placing; frontier-miss rule in `score()`; `grew()` only lists skills answered in the practice | N0 | `core/learner.ts`, `core/practice.ts` (grew only), `core/learner.test.ts` (new) | placement+core tests pass; ipush: "placement settles", "grew" pass; LEARNER `vsPlaced` improves vs baseline |
| N2 | agent | B, C, E, stretch as grade delta, retire mastered, frontier pick | N1 | `core/scheduler.ts`, `core/practice.ts` | all of `ipush.test.ts` + placement + core pass |
| N3 | agent | teach card: `lessonFor(item)` (skill.teach or a worked example that never shows the asked question), `teachCard()` UI, `challenge()` shows it for frontier items | N0 contract | `core/teach.ts`, `core/teach.test.ts`, `ui/teachCard.ts`, `ui/challenge.ts`, `index.ts` (exports) | `teach.test.ts` sweep over every skill/level; no Ima/Millie, no "grade"/"IXL" in kid text |
| N4a | agent | hand-written `teach` for core K–3 math skills | N0 contract | `subjects/math.ts`, `subjects/mathEarly.ts`, `subjects/mathTeach.test.ts` | own test file passes |
| N4b | agent | `teach` for clocks/coins + early reading/writing; `fromKey` for `writing.caps`, `reading.stories`, `reading.sounds`; `seconds` for `clocks.time`, `clocks.coins`, `reading.sight` | N0 contract | `subjects/clocksCoins.ts`, `subjects/reading.ts`, `subjects/writing.ts`, `subjects/languageTeach.test.ts` | own test file passes; fromKey round-trips |
| N5a | agent | Mouse Maze shows the teach card before a frontier question | N2, N3 | `games/mouse-maze-math/src/**` | game tests pass; lead screenshot |
| N5b | agent | same for Lily Hop, Bubble Pop, Rocket Tour, Candy Quest | N2, N3 | those games' `src/**` | game tests pass |
| N6 | lead | docs: CLAUDE.md learning rules, difficulty-ramp.md | N2, N3 | `CLAUDE.md`, `docs/difficulty-ramp.md` | reads true against the code |
| N7 | code (lead) | final gate | all | `checks.md`, `progress.md` | `pnpm typecheck && pnpm test && pnpm build`, evaluator, screenshot |

## Edges
N0 → N1 → N2 → {N5a, N5b, N6} · N0 → N3 → {N5a, N5b, N6} · N0 → {N4a, N4b} → N7 · everything → N7

Parallel batches: **[N1, N3, N4a, N4b]** → **[N2]** → **[N5a, N5b]** → N6 → N7.

## Code nodes (never routed through a model)
N0 (evaluator, metrics), N7 (typecheck/test/build, evaluator run), the merge (sequential edits in one tree; commits per batch).

## Gates
Every agent edge: deterministic test output first, then the node report. Fixed gates: `ipush.test.ts`, `placement.test.ts`, `core.test.ts`, `subjects.test.ts`. Changing one counts as weakening unless `checks.md` records why. Parallel agents run only their own test files (shared tree); the lead runs the full suite after each batch.

## Learning edges
(filled in as results are accepted)
- **N1 → rule:** a placement floor in `rating()` (max(saved, start − 0.5)) is enough to make skills climb with the kid; no save-format change needed. Damping placement too hard (0.05/answer) makes it lag a growing kid: settle vs. follow must be tuned together, with both evaluator checks on.
- **N3 → rule:** "same question" means same key, or same text+picture+answer. Comparing prompt text alone rejects most picture and pick-the-answer questions.
- **N4 → rule:** agent-written content needs a lead read of every distinct text; tests can't catch a wrong fact (×-convention flip, syllable count).
