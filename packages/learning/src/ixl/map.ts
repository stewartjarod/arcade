/**
 * Which IXL topic each of our levels is practicing. This is how a level in our games lines up with
 * what the kids see in school: "Addition up to 20" is IXL grade 1.
 *
 * It's only a label on our levels (saved ratings don't change), and it's how we work out which
 * IXL grade a player is working at. The names match IXL's category names; ixl.test.ts checks every
 * one exists in the full list (skills.json), so a typo can't sneak in.
 *
 * Grade 0 = Kindergarten.
 */
import { LANGUAGE_MORE_IXL } from '../subjects/languageMore'
import { LANGUAGE_UPPER_IXL } from '../subjects/languageUpper'
import { GRADE5_MATH_IXL } from '../subjects/mathGrade5'
import { MORE_MATH_IXL } from '../subjects/mathMore'
import { SCIENCE_SOCIAL_IXL } from '../subjects/scienceSocial'
import { SCIENCE_SOCIAL_MORE_IXL } from '../subjects/scienceSocialMore'

export type IxlSubject = 'math' | 'ela' | 'science' | 'social-studies'

export interface IxlRef {
  subject: IxlSubject
  /** 0 = Kindergarten, 1–5 = grades. */
  grade: number
  /** IXL's category name, e.g. "Addition up to 20". */
  category: string
}

const m = (grade: number, category: string): IxlRef => ({ subject: 'math', grade, category })

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })
const ss = (grade: number, category: string): IxlRef => ({ subject: 'social-studies', grade, category })
const sci = (grade: number, category: string): IxlRef => ({ subject: 'science', grade, category })

const rep = (n: number, ref: IxlRef): IxlRef[] => Array.from({ length: n }, () => ref)

/** One entry per level (index 0 = level 1), keyed by our skill id. Skills not listed aren't mapped yet. */
export const IXL_LEVELS: Record<string, IxlRef[]> = {
  ...LANGUAGE_UPPER_IXL,
  ...LANGUAGE_MORE_IXL,
  ...GRADE5_MATH_IXL,
  ...MORE_MATH_IXL,
  ...SCIENCE_SOCIAL_IXL,
  ...SCIENCE_SOCIAL_MORE_IXL,
  'math.add': [
    m(0, 'Addition up to 10'),
    m(1, 'Addition up to 20'),
    ...rep(2, m(2, 'Addition: two digits')),
    ...rep(2, m(2, 'Addition: three digits')),
    m(3, 'Addition: three digits'),
    ...rep(5, m(3, 'Addition: four or five digits')),
  ],
  'math.sub': [
    m(0, 'Subtraction up to 10'),
    m(1, 'Subtraction up to 20'),
    ...rep(2, m(2, 'Subtraction: two digits')),
    ...rep(2, m(2, 'Subtraction: three digits')),
    m(3, 'Subtraction: three digits'),
    ...rep(5, m(3, 'Subtraction: four or five digits')),
  ],
  'math.mul': [
    ...rep(8, m(3, 'Multiplication fluency up to 10')),
    ...rep(2, m(3, 'Multiplication fluency up to 12')),
    ...rep(6, m(4, 'Multiplication')),
  ],
  'math.div': [
    ...rep(8, m(3, 'Division fluency up to 10')),
    ...rep(2, m(3, 'Division fluency up to 12')),
    ...rep(6, m(4, 'Division')),
  ],
  'math.count': [m(0, 'Counting to 5'), m(0, 'Counting to 10'), m(0, 'Counting to 20'), m(0, 'Numbers and counting to 30')],
  'math.compare': [m(0, 'Comparing up to 5'), m(0, 'Comparing up to 10'), m(0, 'Comparing up to 20'), m(1, 'Comparing up to 100'), m(2, 'Comparing and ordering')],
  'math.shapes': [m(0, 'Two-dimensional shapes'), m(1, 'Two-dimensional shapes'), m(2, 'Two-dimensional shapes')],
  'math.sides': [m(0, 'Two-dimensional shape attributes'), m(1, 'Two-dimensional shapes'), m(2, 'Two-dimensional shapes')],
  'math.round': [m(3, 'Rounding'), m(3, 'Rounding'), m(4, 'Rounding')],
  'math.area': [m(3, 'Area'), m(3, 'Area'), m(4, 'Area')],
  'math.perimeter': [m(3, 'Perimeter'), m(3, 'Perimeter'), m(4, 'Perimeter')],
  'math.fractions': [m(3, 'Understand fractions'), m(3, 'Compare fractions with like denominators'), m(3, 'Equivalent fractions'), m(4, 'Add and subtract fractions with like denominators')],
  'math.decimals': [m(4, 'Decimals'), m(4, 'Decimals'), m(4, 'Add and subtract decimals'), m(5, 'Compare decimals')],
  'math.multiply': [m(3, 'Two-digit multiplication'), m(4, 'Multiply by one-digit numbers'), m(4, 'Multiply by one-digit numbers'), m(4, 'Multiply by two-digit numbers')],
  'math.divide': [m(4, 'Divide by one-digit numbers'), m(4, 'Divide by one-digit numbers'), m(4, 'Divide by one-digit numbers')],
  'math.elapsed': [m(3, 'Elapsed time'), m(3, 'Elapsed time'), m(3, 'Elapsed time')],
  'math.place': [m(1, 'Place value'), m(1, 'Place value'), m(2, 'Place value'), m(2, 'Place value'), m(2, 'Place value'), m(3, 'Place value')],
  'math.skip': [
    ...rep(3, m(1, 'Skip-counting')),
    m(1, 'Counting to 120'),
    m(2, 'Skip-counting and number patterns'),
    m(2, 'Skip-counting and number patterns'),
  ],
  'reading.sounds': [e(0, 'Beginning and ending sounds'), e(0, 'Beginning and ending sounds'), e(1, 'Consonant digraphs')],
  'reading.words': [e(0, 'Short vowels: mixed'), e(0, 'Consonant blends'), e(1, 'Long vowel patterns'), e(2, 'Long vowel patterns')],
  'reading.sight': [e(0, 'High-frequency and irregular words'), e(0, 'High-frequency and irregular words'), e(1, 'High-frequency and irregular words'), e(2, 'High-frequency and irregular words')],
  'reading.stories': [e(0, 'Decodable texts'), e(1, 'Decodable texts'), e(2, 'Cause and effect'), e(2, 'Sequence')],
  'writing.spell': [e(0, 'Short vowels: mixed'), e(1, 'Consonant digraphs and blends'), e(1, 'Long vowel patterns'), e(1, 'High-frequency and irregular words'), e(2, 'High-frequency and irregular words')],
  'writing.pick': [e(0, 'Short vowels: mixed'), e(1, 'Consonant digraphs and blends'), e(1, 'Long vowel patterns'), e(1, 'High-frequency and irregular words'), e(2, 'High-frequency and irregular words')],
  'writing.caps': [e(0, 'Capitalization'), e(0, 'Capitalization'), e(2, 'Punctuation'), e(2, 'Capitalization')],
  'geography.world': [ss(2, 'Physical geography'), ss(2, 'Physical geography'), ss(3, 'Physical geography')],
  'geography.capitals': rep(5, ss(3, 'State capitals')),
  'space.planets': [sci(3, 'Astronomy'), sci(3, 'Astronomy'), sci(4, 'Astronomy'), sci(5, 'Astronomy')],
  'space.order': [sci(3, 'Astronomy'), sci(3, 'Astronomy'), sci(4, 'Astronomy'), sci(4, 'Astronomy')],
  'reading.rhyme': [e(0, 'Rhyming'), e(1, 'Rhyming'), e(2, 'Rhyming')],
  'reading.syllables': [e(0, 'Syllables'), e(1, 'Syllables'), e(2, 'Syllables')],
  'reading.wordMeaning': [e(0, 'Synonyms and antonyms'), e(1, 'Synonyms and antonyms'), e(2, 'Synonyms and antonyms')],
  'writing.sentences': [e(0, 'Sentences'), e(1, 'Sentences'), e(2, 'Sentences, fragments, and run-ons')],
  'writing.grammar': [e(0, 'Nouns'), e(0, 'Verbs'), e(1, 'Adjectives')],
  'clocks.time': [m(0, 'Time'), m(1, 'Time'), m(2, 'Time'), m(2, 'Time'), m(3, 'Read and write times')],
  'clocks.coins': [m(0, 'Money'), m(1, 'Money'), m(1, 'Money'), m(2, 'Money up to $1'), m(2, 'Add and subtract money up to $1')],
}

/** The IXL topic for a skill at a level (undefined if we haven't mapped that skill). */
export const ixlRef = (skillId: string, level: number): IxlRef | undefined => {
  const levels = IXL_LEVELS[skillId]
  return levels && levels[Math.min(Math.max(level, 1), levels.length) - 1]
}

export const gradeName = (grade: number) => (grade <= 0 ? 'Kindergarten' : `Grade ${grade}`)
