# Question review: early math (K–2), plus the math skills around it

Goal: for every question, ask "how would IXL present this?" Each question was generated 25 times per level and read, and each level was checked against the IXL skill names in `packages/learning/src/ixl/skills.json`.

## Summary

- **62 skills reviewed** (mathEarly 18, mathLast 18, mathMore 16, shapes/sides 2, clocks/coins 2, math.ts add/sub/count/compare/place/skip 6).
- **30 skills changed**, **32 checked with no change**, **0 skills removed**.
- Files changed: `mathEarly.ts`, `mathLast.ts`, `mathMore.ts`, `shapes.ts`, `clocksCoins.ts`, and the K–2 skills in `math.ts`.
- `ixl/map.ts` was **not** edited. Two of its entries are wrong; see "For the owner" below.
- Tests: `pnpm typecheck`, `pnpm test` (1383 passing), and `pnpm build` all pass.

## Changed skills

Level numbers are ours (1 = easiest).

| Skill | Level(s) | What was wrong | What changed |
|---|---|---|---|
| `math.teenNumbers` | 2, 3 | "14 is 10 and what?" is not how IXL asks it. Level 3 asked "what comes after", but its IXL topic is names of numbers. | Level 2 is now "10 + ? = 14". Level 3 is now "What number is 'fourteen'?". Old level 3 keys return null. |
| `math.tensCount` | 1, 3 | Some wrong choices were numbers already shown in the sequence (80 in "60, 70, 80, ?"; 95 and 94 in a count-back). | Wrong choices are now near misses that are not in the list. |
| `math.addPictures` | 1, 3 | Read-aloud said "3 apples plus 1 apples". | "3 plus 1. How many in all?" |
| `math.subPictures` | 1–3 | Small answers got wrong choices like "11" (more than the starting amount). | Near misses only, kept at 10 or less. |
| `math.addOrSub` | 3 | "1 more come", "5 go away". | "Then Ima gets 1 more" / "Ima gives 5 away". |
| `math.compareMore` | 1, 2 | Emoji rows wrapped on a phone, so apples and pears ran together. | Drawn as labeled rows (SVG): "Apples" / "Pears", or the two children's names. |
| `math.nearestTen` | 2 | "Round each number to the nearest ten first" is wordy. | "Round each number to the nearest ten, then add." |
| `math.bigCount` | 1, 3 | The "hundred chart" was a 2-row fragment, so the text was not true. Level 3 was mapped to plain counting. | Full 1–100 chart with the number shaded and the ? below it. Level 3 is mapped to IXL "Addition: three digits" (add 10 or 100 to a three-digit number). |
| `math.gridSquares` | 3 | "How many steps?" around a rectangle can mean two answers (unit sides, or squares on the edge). | "Each step is one side of a square." The squares-on-the-edge answer (4 fewer) is offered as a wrong choice. |
| `math.positions` | 1–3 | Level 1 offered "left/right" for an "above or below" question. Levels 2 and 3 did not match their wording. | The question names all four choices. L1: above/below/left/right. L2: inside/outside (above/below as wrong choices). L3: left/right. Keys are now "L:word"; old keys return null. |
| `math.sameDifferent` | 1–3 | "Which one is different?" had wrong choices that were not in the picture. The shape level was ambiguous (🔺, ⬛ and 🟦 are shapes that can be mixed up). | Renamed "same": "Which one is the same as this?" with a picture and four choices, one matching. Keys are now "L:pair"; old keys return null. |
| `math.classifying` | 2 | 🧸 (a bear) was a wrong choice for "Which one is an animal?". | 🧸 replaced with 🏠. |
| `math.venn` | 1–3 | Labels were 🐶 and 🔴, but the dots were all orange and tiny. | Two labeled circles ("Circles", "Blue") with real shapes: red circles, blue circles, blue squares. Question 3 reads "circles, but not blue". |
| `math.understandAdd` | 2, 3 | Level 2 went to 20, past IXL's grade 1 "Understand addition" (sums to 10). "1 and 4 more" wording. | Level 2 is "Groups up to 10". Level 3 counts on 1–3 from a start up to 17 (sum ≤ 20), mapped to "Addition up to 20". "1 plus 4." |
| `math.understandSub` | 1–3 | "She eats 3" for frogs, balloons and fish. Level 3 compared fish with cookies. Level 3 went to 15. | Same item in each story, "gives away". Level 3 uses one item, capped at 10, mapped to "Comparison word problems up to 10". |
| `math.addSubTwenty` | 1–3 | Near misses added or subtracted 10 even for small answers ("14" for 2 + 2). | A ten off is offered only when the answer is 10 or more. |
| `math.twoDigitStrategy` | 1, 2 | IXL topic was "Addition strategies" (level 1) and "Subtraction strategies" (level 2). | Mapped to IXL "Addition: two digits" and "Subtraction: two digits" (grade 2). Questions unchanged. |
| `math.threeDigitStrategy` | 1, 2 | Same as above, for three digits. | Mapped to "Addition: three digits" and "Subtraction: three digits" (grade 2). Questions unchanged. |
| `math.customaryMetric` | 1–3 | Unit conversions were mapped to grade 3. | Mapped to grade 4 "Convert and compare customary/metric units". |
| `math.orderNumbers` | 1–3 | "Biggest" and "smallest" are not IXL's words. | "Greatest", "least", "second greatest". |
| `math.relateFracDec` | 1, 3 | Level 1 offered "9" and "9.0" (the same value) and "0.0". "1 tenths". Level 3 had only decimals for a "compare decimals and fractions" topic. | Level 1 wrong choices are 0.0n, n, and a different tenth. "What is 2/10 as a decimal?" Level 3 includes 1/2 as a wrong choice. |
| `math.measure` | 3, 4 | "This pencil" but the picture is a red bar. | "This bar". |
| `math.solids` | 1–3 | 📦 (box) looked like a cube, and "cube" was a wrong choice for it. Level 1 used the box as one of its four shapes. | Level 1: ball, die, can, cone. Level 2 adds the box. A cube and a rectangular prism are never wrong choices for each other. Keys name the object ("1:ball"); old keys return null. |
| `math.calendar` | 3 | "Today is Tuesday. What day in 4 days?" with no calendar shown. | Two-week strip from today, drawn as SVG. Same keys. |
| `math.moneyWords` | 1 | "3 nickels and 3 dimes" shown with a 💰 emoji, so the coins were not drawn. | Coins drawn (`coinsSVG`). |
| `shapes` | 1, 2 | A square could be offered as "rectangle" or "rhombus" (a square is both). The rhombus drawing was almost a square (diagonals 104 and 108). | A square never has rectangle or rhombus as a wrong choice (and the reverse for rectangle/square). The rhombus is drawn clearly leaning (diagonals 104 and 80). |
| `clocks.coins` | 1–5 (labels); 1–5 (`fromKey`) | Coin labels were "FIVE CENTS" in about 5-pixel text on a phone. The skill had no `fromKey`, so a missed question could not come back. | Coins labeled "1¢", "5¢", "10¢", "25¢" in a readable size. `fromKey` added (it reads the question text, so old text keys still work). |
| `math.compare` | 1–5 | Only three numbers were shown, and the third wrong choice was a random number from 0 to 12 (for example "least? 55, 52, 82" with "9" offered). | Four numbers shown. Wrong choices are the other listed numbers, then numbers a little off. Old three-number keys return null. |
| `math.place` | 1–6 | "1 ones" and "1 tens". Level 2 (digit) offered the whole number (43) as a wrong choice. The skill had no `fromKey`. | Correct plurals. Digit wrong choices are other digits. Keys are now "place:L:…" and rebuild exactly. |
| `math.skip` | 1–6 (level 5 content) | Level 5 was "by 3s and 4s", which is grade 3 content. Wrong choices repeated numbers already shown ("30" in "10, 20, 30, __"). No `fromKey`. | Level 5 is "by hundreds and fives". Wrong choices are the next jump or one off. Keys are now "skip:start:step:dir". |

## Checked, no change

- **mathEarly:** `numberWords`, `countSmall`, `countForwardBack`, `tensAdd`, `subStrategy`, `addFacts`, `subFacts`, `factFamilies`, `trueSentence`.
- **mathLast:** `realShapes`, `financeBasics` (see judgment calls), `story10`, `story20`, `mixedOneDigit`, `shapePattern`.
- **mathMore:** `addStories`, `subStories`, `missingPart`, `strategies`, `oneMoreLess`, `evenOdd`, `patterns`, `graphs`, `equalParts`, `equalGroups`, `twoStep`, `mulStories`.
- **shapes:** `sides`. **clocks:** `time`. **math.ts:** `add`, `sub`, `count`.

## Judgment calls (for a grown-up to look at)

- **Same/different (`sameDifferent`):** we asked "which one is the same as this?" instead of IXL's "which one is different?". The checker needs three distinct wrong choices, and a "different" row has no way to supply them without showing choices that are not in the picture.
- **Read-aloud first:** `numberWords` level 1 shows the word ("two") as text. A kindergartner may not read it yet, but the 🔊 button reads it aloud.
- **Subtraction pictures:** `subPictures` shows the starting group and does not cross out what is taken away.
- **"Shape" is a bar:** `equalParts` uses a bar (a strip) for "how many equal parts is this shape split into?".
- **Box = rectangular prism:** a box-shaped thing can also be a cube. We never offer cube and rectangular prism against each other.
- **Toilet roll = can:** `realShapes` level 3 accepts 🧻 as "shaped like a can" (a cylinder).
- **Financial literacy:** `financeBasics` level 2 "Which is a good way to spend money?" is an opinion question. Level 3 ("money left after buying") is really subtraction in dollars, mapped to IXL's "Financial literacy".
- **Coin names:** `clocks.coins` level 1 has two forms: "which coin is worth 5¢?" (name choices, no picture) and "how many cents is a nickel worth?" (with the coin drawn).
- **Not changed:** `tensCount` level 2 "How many is 5 tens?" wording is kept.

## For the owner (outside my files, not edited)

These two entries are in `packages/learning/src/ixl/map.ts`, which was not on my list:

1. **`math.place`, level 2** (digit in the tens or ones place) is mapped to grade 1 "Place value". IXL's digit questions are grade 2 "Value of a digit". Suggested fix: change that entry to `m(2, 'Place value')`.
2. **`clocks.coins`, level 5** ("Make change") is mapped to grade 2 "Add and subtract money up to $1". IXL's "Making change" sits under "Money up to $1". Suggested fix: `m(2, 'Money up to $1')`.

Also worth a look: `math.skip` level 4 ("count on from any number") is mapped to "Counting to 120". "Count forward by tens" would be a closer fit.
