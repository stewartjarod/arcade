# English question review (reading and writing)

What we checked, what changed, and what needs a grown-up's call. Every question in the English
(reading and writing) files was generated and read against how IXL phrases the same topic at the
grade the level is mapped to. Math and other subjects are not covered here.

## The short version

- **Removed:** nothing whole. Every skill is still there. The tone skill was already left out of the
  game by its author (it is a judgment call); it stays out.
- **Fixed by hand:** about 45 rows and labels across the files (roughly 30 removed or rewritten
  rows, plus label and map fixes). The most common problems were: a picture that
  had a second name (cup, bath, hen, peanut), a second correct answer hiding among the wrong options
  (gate, when, ever, wet), a question that was in the wrong tense for its level, and a rule the
  answer broke (a closed-syllable word listed as "ends in a vowel").
- **Left for a grown-up:** the judgment calls at the bottom.

## Per skill

### Early reading (languageEarly.ts)

- **Short vowels (picture words):** removed the "jet" (a plane) row, and the "tub" (bathtub) rows,
  which also appeared in another level. Both pictures have a second common name.
- **Short i/o/u (picture words):** removed the grin, zipper-face, kiss, and "top" rows, which were
  the wrong picture for the word or had a second name. Replaced the wastebasket ("bin") row with a
  brick, which is clearly what the word means.
- **Digraphs:** removed the thumbs-up, bath, camera ("photo"), alphabet symbol, bandage ("patch"),
  bar chart ("graph"), and mosquito ("gnat") rows. The "night" spelling row listed "nite" as wrong,
  but "nite" is a real informal spelling; changed it.
- **Open and closed syllables:** "cabin" was listed as an open first part (it is closed, cab-in),
  and as a wrong answer for "closed" questions where it is actually closed. Replaced with "radio".
- **Inferring:** the label said "Clues in a picture" but there is no picture. Changed it to
  "Clues in a sentence".
- **Checked and kept:** the main-idea, author's-purpose, article, tense, subject-verb, pronoun,
  contraction, preposition, capitalization, and sense-word rows. Every answer is right and every
  wrong option is clearly wrong.

### Early reading and writing, second set (languageEarly2.ts)

- **Soft and hard g:** one hard-g question had "gate" (hard g) as a wrong option, so two answers
  were right. Replaced "gate" with "gem".
- **Word matching:** "ever" sounds almost the same as "every"; replaced with "berry".
- **Multiple-meaning words:** "a stairway" was close to the right meaning of "hall"; replaced.
- **Abbreviations (writing.shortForms):** the IXL grade 2 category only covers days and months, so
  the measures and time-word levels now map to grade 3 "Abbreviations".
- **Checked and kept:** letters, letter sounds, book parts, story order and setting, point of view,
  read-along stories and facts, silent e, vowel teams, action and describing words, spelling
  endings, prefixes and suffixes, linking words, topic sentences, opinion and fact, and the rest.

### Language basics (language.ts, used by reading and writing)

- **Syllables:** wrong options could include "0" (for "cat"). Removed that choice.
- **Nouns:** "park" is also a verb ("to park the car"), so it could be a right answer to the verb
  question. Replaced with "rock".
- **Checked and kept:** rhymes (each family checked; no cross-rhymes), antonyms and synonyms,
  complete sentences versus fragments, and parts of speech.

### Phonics and word families (languageMore.ts)

- **Blend the sounds:** the "hat" row used a cap picture (a baseball cap is not a hat). Changed to a
  top hat. The "mop" row used a broom picture; made it a text-only question.
- **Long vowel patterns:** "The sky is ___ today" depends on the weather; changed to "On a clear,
  sunny day". "My shoes are ___ and shiny" had "wet" as a second right answer; changed to "My feet
  grew, so I need ___ shoes."
- **Conjunctions (level 2):** "You can go outside ___ you finish" also works with "when" as a wrong
  option; replaced "when" with "unless".
- **Checked and kept:** letters, letter sounds, long-vowel words, r-controlled vowels, question
  words, colors and numbers, location words, categories, reality versus fiction, story setting and
  plot, compound words, shades of meaning, Greek and Latin roots, plurals, verb types, and the rest.

### Grades 2 to 5 (languageUpper.ts)

- **Past tense:** "Every day, Mom ___ dinner" is present tense under a past-tense skill. Changed to
  "Yesterday, Mom ___ dinner".
- **Main idea (level 3):** the right answer "Hard work and care turn an empty space into something
  useful" was a judgment call. Changed to "Ms. Lee's class worked hard to grow a garden."
- **Checked and kept:** nouns, subject-verb agreement, pronouns, prepositions, adjectives and adverbs,
  commas, contractions, affixes, homophones, figurative language, context clues, author's purpose,
  text features, and inference.

### Grades 3 to 5, second set (languageUpper2.ts)

- **Fragments and run-ons:** the answer "The dog wagged." was a complete sentence but a strange fix;
  changed to "The dog wagged its tail."
- **Who or whom:** "Maya is the friend ___ I told you about" accepts "who" in everyday speech. Reworded
  to "Maya is the friend about ___ I told you", so only "whom" fits.
- **Tone:** not exported (see judgment calls).
- **Checked and kept:** story elements, literary texts, informational texts, idioms, categories,
  synonyms and antonyms, homonyms, affixed words, topic sentences, opinion writing, sentence variety,
  introductions and conclusions, perfect tenses, paragraph unity, and capitalization.

### Grade 5 (languageGrade5.ts)

- **Articles (level 3):** "an unusual rock" is disputed ("a unusual" is also used). Changed to
  "Ben found ___ interesting rock."
- **Paragraphs (level 2):** "Recycling is a good idea" could pass as a supporting detail. Replaced
  that wrong option with "Lunch is served at noon."
- **Checked and kept:** text structure, poetry, sensory details, reference skills (ABC order and
  guide words were each checked), multisyllabic words (dictionary syllable counts), analogies,
  summarizing, character traits, abbreviations, spelling, linking words, essay parts, and argument
  support.

### Reading and writing skills (reading.ts, writing.ts, words.ts)

- **First sound (level 2):** the label said "b, d, p" but the question pool is every consonant. Changed
  the label to "look-alike letters".
- **Spelling (level 5):** 40% of questions were picture words (star, house) under a label that says
  "sight word: grade 2". Removed that branch, so level 5 only spells grade 2 sight words.
- **Picture words (words.ts):** removed five pictures with a second name or a wrong picture: cup
  (a drink with a straw), nut (a peanut), hen (a chicken), thumb (a thumbs-up), feet (a single foot).
- **Checked and kept:** the sight-word lists (checked by eye against the standard Dolch lists), the story questions (each
  answer is in the text), and the spelling rules and misspellings.

## Judgment calls left for a grown-up

1. **Tone skill:** left out of the game. It is subjective ("serious" versus "gloomy" can both be
   defended). Decide whether to bring it back with a passage that has a clearly one-word tone.
2. **Map entries outside my files:** `packages/learning/src/ixl/map.ts` (not reviewed by this pass)
   holds the IXL map for the reading and writing skills in `reading.ts`, `writing.ts`, and
   `language.ts`. The labels above are checked against the same IXL categories, but the map file
   itself was not edited.
3. **Read-aloud quirks:** prompts like "Which letter says 'duh'?" and "Blend these sounds: d - o - g"
   depend on text-to-speech reading the quoted sounds sensibly. Consider a `say` override per row.
4. **Parts of speech:** a few words can be more than one part of speech (run, jump, draw as nouns;
   cold, sweet as nouns). The prompt says what kind of word is wanted, but a grown-up may still
   object. Consider swapping in clearer words.
5. **Point of view:** the wrong options include "fourth person", which is not a term IXL teaches.
6. **Passage levels:** the grade 4 and 5 reading passages were kept as they were (they match IXL
   length), but they were not checked against a reading-level tool.
7. **Sight words and spelling:** the level 1 to 3 spelling questions can show an easier word at a
   harder level (a deliberate mix to bring older words back). The labels describe the level's focus,
   not every word.
