# Question review: math grades 3-5

This log covers every math skill for grades 3-5 (and the times-table skills in `math.ts`). For each one we
generated about 20 questions per level and checked the wording, the picture, the numbers, the wrong answers,
and what IXL covers at that grade (the names in `ixl/skills.json`). "Changed" means the code was edited; the
game still rebuilds every question exactly from its key, and the sweep tests still pass.

Totals: 42 skills checked. 20 levels had a real problem (a missing picture, a wrong grade, an unclear
question, or a wrong math slip) and were fixed. 16 more levels had weak wrong answers (silly or
ambiguous distractors) and were improved. No skill was removed. Three levels were replaced because
the topic is a grade 6 topic (see "Grown-up decisions" below).

## mathUpper.ts (registered through math.ts)

- **Rounding (round):** checked. Questions stand alone. Left as is. Idea for later: a number line picture
  at level 1 (IXL shows one for "Round to the nearest ten or hundred using a number line").
- **Area of figures (area):** level 1 grids and level 2 rectangles are fine. **Level 3 changed:** the
  question asks for the length of a rectangle but showed nothing. Now it shows the width and a "?" side.
- **Perimeter (perimeter):** **Level 2 changed:** the "square" was drawn as a wide rectangle. Squares now
  draw square (this also applies anywhere a rectangle has equal sides). **Level 3 changed:** added the
  picture and reworded the question to name the side ("How long is its left side?").
- **Fractions (fractions):** the picture for level 1 is fine. **Levels 2 and 4 changed (read-aloud only):** the
  voice read "3 5ths"; it now says "three fifths" and "one fifth". Level 3 (equivalent fractions) checked, fine.
- **Decimals (decimals):** **Level 3 changed:** a subtraction could come out as 0.0. The two numbers are
  now always different when subtracting. Other levels checked, fine.
- **Multiply (multiply) and divide (divide):** arithmetic checked, all correct; wrong answers are believable.
  Left as is.
- **Elapsed time (elapsed):** times and answers checked, correct. Not changed. Left: no clock picture
  (the question stands alone); a level 1 wrong answer of "11 hours" is a bit silly but still clearly wrong.

## mathGrade5.ts

- **Factors (factors):** **Level 2 changed:** "greatest common factor" is a grade 6 topic and is not in
  IXL's grade 3-5 list. Level 2 is now "Identify factors" ("Which number is a factor of 24?"), which is in
  IXL's grade 5 "Factors, multiples, and divisibility". Level 1 (prime numbers) and level 3 (least common
  multiple) checked, fine.
- **Numerical expressions (expressions):** arithmetic checked, correct. Not changed.
- **Powers of ten (powers):** questions checked. The IXL map was changed for levels 1 and 3 to
  "Multiplication" (IXL's category for multiplying by 10, 100, 1,000); level 2 stays "Powers of ten".
- **Adding and subtracting unlike fractions (addSubFractions):** all answers checked. **All 4 levels:**
  the wrong answers could be whole numbers like "9" for "1/2"; now they are fractions only.
- **Adding mixed numbers (mixedNumbers):** arithmetic checked, correct. Not changed.
- **Multiplying fractions (multiplyFractions):** arithmetic checked, correct. Not changed.
- **Dividing fractions (fractionDivision):** **Level 3 changed:** "4 ÷ 2/3" (dividing by a non-unit fraction)
  is a grade 6 topic. Now it is a sharing word problem ("5 pizzas are shared equally by 8 kids. What fraction
  of a pizza does each kid get?"), which is grade 5. **Level 2:** wrong answers fractions only.
- **Decimals to fractions (decimalFractions):** checked, correct. **Levels 1 and 2:** wrong answers
  fractions only.
- **Decimal place value (decimalPlaces):** **Level 2 changed:** one wrong answer was "5.023" (3 digits after
  the point). The wrong answer is now the digits written backwards ("5.32"), which is the real slip.
- **Multiply and divide decimals (decimalOps):** arithmetic checked, correct. **Level 3 changed:** a factor
  of 10 (1.0) was trivial; those are now left out.
- **Customary and metric units (units):** all conversions checked, correct. Not changed.
- **Coordinate plane (coordinates):** pictures and answers checked, correct. Not changed.
- **Volume (volume):** **All 3 levels changed:** the box was only described in words. Now a 3D box is drawn.
  Level 1 marks every unit cube so it can be counted; level 2 names the sides in cm; level 3 names two
  sides and shows "?" for the height.
- **Statistics (statistics):** range, mode, median, and mean checked, correct. Not changed.

## mathGrades345.ts

- **Estimating (estimate):** **All 4 levels changed:** wrong answers used to include numbers like 13,001,
  which can't come from rounding. Now the wrong answers are other rounded numbers or the exact answer
  (the classic slip of not rounding). Arithmetic checked.
- **Mixed operations (mixedOps):** arithmetic checked, correct. Not changed.
- **Missing numbers (equations):** checked, correct. Not changed.
- **Number patterns (numberPatterns):** **Level 3 changed:** "What is number 18 in the pattern?" is now
  "What is the 18th number in the pattern?" (the ordinal is handled for 21st, 22nd, 23rd, and so on).
- **Comparing fractions (compareFractions):** checked, correct. The four fractions appear as the answer
  choices (the prompt does not list them). Not changed.
- **Fractions on number lines (fractionLine):** **Levels 1 and 2 changed:** the close wrong answers are now
  other marks on the same line (one or two ticks off), not random fractions. Level 3 checked, fine.
- **Bar and line graphs (dataGraphs):** **Level 3 changed:** the question said "How much more was it..."
  with no title on the graph. It now says what the numbers count (cups of lemonade). Tick and label text
  is larger on all three levels. IXL map: level 3 is now grade 4 (line graphs are a grade 4 topic).
- **Lines of symmetry (symmetry):** **All 3 levels changed:** wrong answers like "11" were silly. Now they
  are other real counts (0 to 8).
- **Polygons and angles (polygons):** **Level 1 changed:** a square could be marked wrong for "rectangle",
  but a square is also a rectangle. "Rectangle" is no longer a wrong answer for a square. **Level 3 changed:**
  it asked "by its sides" but offered "right triangle" (an angle name), and an equilateral triangle could
  also count as isosceles. It now asks "How many sides of this triangle are the same length?" with none,
  one, two, or all three. Level 2 (polygon names) and level 4 (four-sided shapes) checked, fine.
- **Angles (angles):** levels 1 and 3 checked, fine. Level 2 keeps "curved" as a wrong answer (see below).
- **Composite area (compositeArea):** **Level 2 changed:** the notch sizes were not on the picture, so the
  question could not be answered from it. Both notch sides are now labelled. The side labels were also
  clipped at the left edge (showed "cm" only); fixed. **Level 3 changed:** it was a triangle area, which is a
  grade 6 topic. It is now a rectangle with a half-cm side (for example 8 1/2 cm by 4 cm = 34 square cm),
  which is grade 5 ("Area of rectangles with fractions"). Level 1 (perimeter) checked, fine.
  Saved level 3 keys from the old triangle question no longer rebuild (see the note below).
- **Division word problems (divStories):** arithmetic and story checked, correct. Not changed.
- **Multi-step word problems (multiStep):** arithmetic checked, correct. Not changed.
- **Big multiplying and dividing (bigMulDiv):** arithmetic checked, correct. **Level 3 label fixed:** the
  numbers have 5 digits, so the label now says "4- or 5-digit".
- **Big numbers (bigNumbers):** checked, correct. Not changed.
- **Money (money):** arithmetic checked, correct. IXL map changed: level 3 (saving each week) and
  level 4 (spending and keeping track) are now grade 4 "Money" (IXL's multi-step money problems), not
  "Financial literacy".
- **Fractions times whole numbers and mixed numbers (fractionMulMixed):** arithmetic checked, correct.
  Not changed.
- **Factors and multiples (factorsMultiples):** checked, correct. Not changed.

## math.ts (times tables, levels 1-16)

- **Multiplication facts (mul) and division facts (div):** checked, correct, wrong answers believable.
  Not changed. Their IXL map entries are in `ixl/map.ts` and fit the topics.

## Notes for the owner

- **Saved keys:** keys saved from the old versions of factors level 2, dividing-fractions level 3, and
  composite area level 3 no longer rebuild. The first two are dropped automatically. For composite area,
  level 3 keys are dropped unless their height is 2, 4, 6, or 8 (so no decimal answers are ever made);
  the ones that remain rebuild as the new rectangle question.
- **Grown-up decisions:**
  - Factors level 2 is "Identify factors", not "greatest common factor" (grade 6). If you want GCF, it belongs in a grade 6 file.
  - Composite area level 3 is now a rectangle with a half-cm side. The triangle area is grade 6.
  - Dividing fractions level 3 is now a sharing word problem. "Divide by 2/3" is grade 6.
  - The triangle question now asks how many sides are the same length. This avoids the angle-versus-side mix and the
    equilateral-is-isosceles argument. Some teachers would call an equilateral triangle isosceles; the question
    counts "two" as exactly two sides equal, so "all three" is the only right answer for equilateral.
  - Lines level 2 still offers "curved" as a fourth choice. It is an easy wrong answer; swap it if you like.
  - Rounding rounds halves up (350 goes to 400), as most classes do. Some teachers round halves to the even digit.
  - Rounding and elapsed time have no number line or clock picture (IXL often has one). The text stands alone.
  - Overlap to consider: decimal place value and decimal operations appear in both `mathUpper.ts` and `mathGrade5.ts`;
    perimeter and area appear in both `mathUpper.ts` and `mathGrades345.ts`. You may want one of each.
- **Not touched:** `ixl/map.ts` (the level-to-IXL map for `mathUpper.ts` and the times tables lives there, and every
  entry I checked is correct). No other subject files were edited.
