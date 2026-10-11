# Question review: science, social studies, space, geography

What this is: a read-through of every question our science, social studies, space and geography
skills can ask, checked the way IXL would present the topic. For each skill: what was checked, what
changed, and what needs a grown-up's call. Nothing was published or committed; the changes are in the
working tree.

## How it was checked

- Every skill's levels were sampled (about 20 questions per level, 6,600 rows) and read.
- Each level's IXL category was checked against `ixl/skills.json`. The skill names under a category
  show how IXL asks the topic, and that was the grade and wording we compared against.
- Each wrong option was checked against its question: is the option ever also true? Rows where an
  option was also true were fixed.
- Looked for: questions that point at a picture or map we don't show; picture giveaways (a picture of
  the answer); facts a teacher could dispute; grade mismatches; answers over 45 characters; odd text.
- Facts were checked from general knowledge, not against a reference book. Treat the standard
  textbook claims as checked by a careful reader, not verified against a source.
- Tests: the owned science, social, space and geography tests and the IXL map check pass (948 tests,
  run several times). Full `pnpm test` passed in the last full run.

## Summary

- 111 skills reviewed. About 60 skills changed.
- About 40 question, answer, option or IXL-map edits.
- About 100 pictures removed: those that showed the answer (for example, a picture of a bee for "which
  insect makes honey?"). Pictures that show the thing being asked about were kept.
- 2 facts replaced with a different fact in the same skill (Upper: dolphin → bat; footprint → petrified wood).
- 2 facts removed: Kilauea was rewritten (not removed); the Pentagon "headquarters" fact was removed
  (the department was given a second name in 2025, so the wording is unsettled).
- 0 skills removed.

Saved progress: a fact whose key changed (or was removed) simply stops matching. `scheduler.ts` checks
`fromKey` for `null` and skips it, so nothing crashes; the old missed-fact memory is just unused. The
keys that changed are the question text in `space` (2 questions) and `geography` (3 questions). The
other changes keep the same ids, so their keys are unchanged.

## Changes by file

### scienceSocial.ts

| Skill | Change | Why |
|---|---|---|
| livingThings | "What do animals breathe in?" → "Which gas in the air do animals need?" answer **oxygen** | "Air" is wrong for fish, which take in oxygen from water. |
| plants | "What does a seed need to sprout?" → "Which of these does a seed need to sprout?" | Water is one of several things a seed needs; the new wording makes it a fair pick. |
| forces | "What does a push or pull do to a toy car?" → "What **can** a push or pull do…" | Not every push makes a car move. |
| weather | "Which season do flowers bloom…" → "In which season…" | Grammar. |
| timeline | "What do you do first in the morning?" → "Which comes first in a morning: waking up or going to bed?" | "First" was arguable. |
| timeline | Telephone question → "Which of these was invented first?" options: airplane, smartphone, television | The old options named a computer and a TV, which were not in the question. Babbage's computer designs came before the telephone, so "computer" was disputable; "smartphone" is clearly later. |
| timeline | "Which word tells you what happened at the end?" → "…the last thing that happened in a story?" | Clearer. |
| physicalGeography | "very tall with a pointy top" → "very tall and rises high above the land" | Many mountains have flat tops. |
| earlyAmerica | "How many colonies became the first 13 states?" → "How many original colonies became the first states?" | The question gave the answer (13). |
| earlyAmerica | Jamestown answer shortened to "the first permanent English colony" | Was 45 characters. |
| community | Police-officer fact: picture removed | The picture was the answer. |

### scienceSocialMore.ts

| Skill | Change | Why |
|---|---|---|
| rocks | Sculptors question → "Michelangelo carved his statue David from which white rock?"; options: pumice, coal, obsidian | Sandstone and granite are also carved. |
| adaptations | Polar bear fur answer "hide in the snow" → "blend in with the snow"; fish-breathing option "with lungs" → "with fur" | Lungfish breathe with lungs. |
| traits | Kitten trait option "a meow" → "a favorite toy" | Meowing is partly learned by kittens. |
| mapSkills | "the curved lines on a topographic map" → "contour lines on a topographic map" (standalone); ruler option "a scale" → "a stopwatch" | The old map referred to something not shown; a map scale can measure distance. |
| heat | Sun fact: picture removed | The picture was the answer. |
| westward | Telegraph option "Thomas Edison" → "Paul Revere" | Edison helped improve the telegraph, so he was arguable. |

### scienceSocialUpper.ts

| Skill | Change | Why |
|---|---|---|
| lightReflect | "What does light travel faster than?" → "Which of these travels fastest?" answer **light**; options sound, a train, a bicycle | Light is faster than all three old options, so each was also right. |
| waves | Fastest sound: → "Which of these lets sound travel fastest?" answer **steel** | The old options (a vacuum, empty space) were not choices in the question. |
| waves | Sound-wave question reworded | Clearer. |
| mixtures | Salt and sand answer → "add water, filter, then evaporate" | Adding water alone does not separate them. |
| classification | Fact "Which mammal lives in the ocean?" (dolphin) **replaced** by "Which animal is a mammal that can fly?" (bat) | Whales are ocean mammals too. (The options did not include a whale, so this was a question-wording problem, not a wrong option. The swap keeps the level at 8 facts.) |
| scientificNames | Species answer → "living things that can make babies together" | Length. |
| fossils | Fact "Which living thing can leave a fossil by walking in mud?" (dinosaur) **replaced** by "What do we call wood that has slowly turned into stone?" (petrified wood) | Many animals leave footprints, so the answer was not unique. (Rationale tightened: no listed option was true, but the question had more than one answer in principle.) |
| fossils | Body-fossil options: "a fossil egg" → "a fossil burrow" | Eggs are often classed as body fossils. |
| fossils | Leaf-print options: "a trace" → "a fossil footprint" | A leaf print is not a trace fossil. |
| earthFeatures | Fjord option "a bay" → "a canyon" | A bay can look like a fjord. |
| humanGeography | "urban or rural?" → "Which word describes places with many buildings and people?"; options → rural, arid, alpine | Odd distractors. |
| humanGeography | Capital question → "What is a capital city?" answer "the city where the government sits" | The old answer was not a plain answer. |
| humanGeography | Settlement option "a river valley" → "a bolt of lightning" | A river valley can be a place people settle. |
| banking | "What is a bill?" → "What do we call a request to pay for a service you got?" | "Bill" also means paper money. |
| modernHistory | "Which machine was first used in large numbers in WWI?" → "What new armored vehicle was first used in battle in WWI?" options castles, sailing ships, covered wagons | Airplanes and trains were also used in WWI. |
| modernHistory | FDR question option "Herbert Hoover" → "Calvin Coolidge" | Hoover was president until March 1933, so he was arguable. |

### scienceSocialRound3.ts

| Skill | Change | Why |
|---|---|---|
| skyObjects | "See faraway things up close" → "make faraway things look closer and bigger"; Moon-size option "much bigger than the Sun" → "not there at all"; sun, Moon and telescope pictures removed | Contradictory wording; pictures were the answers. |
| comparingObjects | All 27 pictures removed | Each picture was the correct object, so kids could match the picture. |
| pollinators | Bee question → "Which busy insect makes honey and carries pollen…"; butterfly question → "…has a long, coiled tongue for sipping nectar"; three pictures removed (bee, butterfly, beetle); grasses picture removed | Bees also sip nectar. The pictures were the answers. |
| groupBehavior | Crow question: option "a flock" removed (replaced with "a pride"); flock question: "a gaggle" → "a herd"; meerkats picture (an otter) and honeybee picture removed | A flock of crows is correct usage. The meerkat picture showed an otter. |
| lifeCycles | Bird eggs picture removed | The picture was the answer. |
| locationWords | Arrow pictures for "above" and "below" removed | The arrows were the answer. |
| cityNicknames | Harvard: "Boston" removed from the options; New Haven, Providence, Hartford used instead | Harvard is in Cambridge, near Boston. |
| nationalHolidays | Federal holiday answer → "a holiday recognized by federal law" | "Set by federal law" was loose. |
| usPhysical | Badlands question → "Badlands National Park is in which state?" options Colorado, Utah, Texas | North Dakota, Montana and Nebraska also have badlands. |
| usPhysical | Kilauea question **rewritten** → "Which of these volcanoes is in Hawaii?" | The old question had two correct answers (Kilauea and Mauna Loa). The new one has one. |
| monuments | Pentagon "which department?" fact **removed** | The Department of Defense was given a second name in 2025, so the answer is unsettled. |
| chronology | Versailles question → "The Treaty of Versailles in 1919 set peace terms after which war?" | "Officially ended" WWI is disputed. |

### scienceSocialRound4.ts

| Skill | Change | Why |
|---|---|---|
| madeOf | Glass window picture removed | The picture was the answer. |
| heatingCooling | "What helps cool you down?" → "What spins blades to push air around and cool you down?"; clothes question → "Which color of clothes reflects sunlight…?" answer **white**; sun and warm-air arrow pictures removed | An air conditioner also cools you. "Light-colored" was not a color answer. |
| humanImpacts | Trash can picture removed | The picture was the answer. |
| ecosystemRoles | Hawk question → "When a hawk eats a snake…" (was garbled); snake picture removed | The picture was the answer. |
| plantScience | Sugar (candy) picture removed | The picture was almost the answer. |
| magnetPoles | "Which one would a magnet pick up?" answer → **an iron nail** (was steel spoon) and its bolt picture removed; "NOT stick to" options no longer include a steel spoon; plastic-spoon picture removed; "NOT attracted" option "steel" → "cobalt" | Stainless steel is not magnetic; steel is often magnetic. Pictures were the answers or near the answer. |
| colorsShapes | Dirt picture changed from a brown square (the answer color) to a worm | A color swatch gave the answer. |
| humanMade | Bridge and city pictures removed | The pictures were the answers. |
| landWater | Forest and rainforest pictures removed | The pictures were the answers. |
| thenNow | All pictures removed | Several pictures showed the wrong era or the answer. |
| governmentBranches | Judicial branch scales picture removed | The picture was the answer. |

### scienceSocialRound5.ts

| Skill | Change | Why |
|---|---|---|
| naturalResources | Coal question → "Which fossil fuel is a black rock that is dug out of mines?"; "renewable, so it will not run out" → "can be replaced naturally over and over"; 9 pictures removed | Oil also fits the old coal wording; "will not run out" overstated wind. Pictures were the answers. |
| eventOrder | IXL map: levels 2–3 "Order events" (grade 1) → "Chronology and causation" (grades 2 and 3) | The questions use years; grade 1 "Order events" is about days, months and time-order words. |
| matterShapes | Brick picture removed | The picture was the answer. |
| pushPullMotion | Stop-sign picture removed | The picture gave the answer word. |
| vertebrateGroups | 11 pictures removed (whale, penguin, turtle, frog, salmon, ladybug, feather, milk bottle, egg, crab, octopus) | Each picture was the answer. Other pictures in this skill were kept. |
| heatMoves | Thermometer picture removed | The picture was the answer. |
| inheritedTraits | Bicycle picture removed | The picture was the answer. |
| metricUnits | Ruler, balance, stopwatch, cylinder and thermometer pictures removed | Each picture was the answer. |
| densityFloat | Rock, honey and oil-drum pictures removed | Each picture was the answer. |
| holidayTraditions | Diwali lamp, Holi palette, mooncake and flag pictures removed | Each picture gave the answer. |
| greatDepressionEra | "What was the stock market?" → "What is the stock market?" | The stock market still exists. |

### space.ts

| Skill | Change | Why |
|---|---|---|
| planets | "Which planet is covered with oceans of water?" → "…has oceans of liquid water on its surface?" | "Covered with" overstated. |
| planets | "What goes around the Earth?" → "What natural satellite travels around Earth?" | The space station also goes around Earth. (Key changed.) |
| order | No change | Order logic checked. |

### geography.ts

| Skill | Change | Why |
|---|---|---|
| world | "Which continent do we live on?" → "Which continent is the United States in?" (flag picture) | We don't know where every player lives. |
| world | "Where do penguins live in the wild, far in the south?" → "Which continent is home to emperor penguins?" | Other penguins live elsewhere. (Key changed.) |
| world | "Which continent is right below North America?" → "…south of North America?" (globe picture) | "Right below" depends on a map we don't show. (Key changed.) |
| world | "Which ocean is below India?" → "…south of India?" | Clearer. (Key changed.) |
| capitals | No change | All 50 capitals were checked from general knowledge. |

## Skills checked with no change

- scienceSocial: animals, ecosystems, statesOfMatter, forcesAdvanced, magnets, lightSound, earthResources, conservation; social: symbols, holidays, maps, government, economics, famousPeople.
- scienceSocialMore: earthEvents, waterCycle, electricity, energy, simpleMachines, measurement, engineeringDesign; social: usRegions, nativePeoples, explorers, civilWar, constitution, citizenship.
- scienceSocialUpper: materials, physicalChange, cells; social: evaluateSources.
- scienceSocialRound3: heredity, particles, starsSeasons; social: statesNicknames, nationalHolidays (other than above).
- scienceSocialRound4: colorsShapes (other than the dirt picture), climateWind; social: famousFirsts, moneyChoices, supplyDemand, revolutionEvents, landWater (other than pictures).
- scienceSocialRound5: designProcess, landForms, earthLayers, metricUnits (other than pictures), factsOpinions, earlyColonies, thirteenColonies, worldWarOne, basicEconomics, worldWarTwoHome.

## Judgment calls for a grown-up

1. **How many continents and oceans?** The file says 7 continents and 5 oceans, the common US textbook count. Some curricula count 6 continents or 4 oceans.
2. **Planet claims** (Saturn would float in a bathtub; Venus's Sun rises in the west; Mars has the tallest volcano; Jupiter fits 1,000+ Earths). These are common textbook facts, but they came from general knowledge. Look them up before showing them to a teacher.
3. **"The President"** is generic, so it stays true through changes in office.
4. **Judgment-heavy items left as they are:** "Which is more reliable, a fact checked by experts or a rumor?" is a rule of thumb; "Which one is a need?" lists treat a home and food as needs, which is a teaching simplification.
5. **Monument, date and capital facts** (Mount Rushmore, the Liberty Bell, the Gateway Arch, state capitals, holiday dates) are standard, but they were not re-checked against a reference.
6. **Arrow and symbol pictures** for "above"/"below" were removed as giveaways; a teacher may prefer them for kindergarten. That is a judgment call.

## Worth the owner's attention

- **Pictures policy.** Pictures that show the thing the question asks about are kept (a weather picture for "what kind of weather is this?"). Pictures of the answer were removed. Comparison questions ("which is heavier?") now have no picture at all; IXL would show two pictures. Showing two pictures would need a change to the question layout, not just the data, so it was not done.
- **Pictures still to check.** Some pictures in the sample are close to the answer (for example, a thermometer for "what tool measures temperature"); these were kept as similar-but-different objects.
- **Not in my files (not edited):**
  - `packages/learning/src/ixl/map.ts` holds the IXL map for `space.planets`, `space.order`, `geography.world` and `geography.capitals`. They pass the check, but I did not review whether the grades fit (they map to grade 3-5 "Astronomy", "Physical geography" and "State capitals").
  - Other subjects (math, reading, writing, clocks, languages) were not reviewed. A `mathGrade5.ts` parse error briefly broke the test run during this review; it was another agent's file and cleared on its own.
