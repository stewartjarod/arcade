# Checks

| node | requirement | verdict | evidence |
|---|---|---|---|
| N0 | evaluator committed before any learner/scheduler edit | pass | `packages/learning/src/core/ipush.test.ts`, commit on `learning-ipush` |
| N0 | baseline fails drift metrics, passes existing | pass | `baseline.txt`: LEARNER lead −0.95, onTarget 0.35; 6 of 8 ipush tests fail |
