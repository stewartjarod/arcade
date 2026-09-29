/**
 * The shape every subject follows. A subject is a list of skills; a skill makes
 * questions ("items") at a level. Everything else — ratings, i+1 scheduling,
 * remembering missed facts, saving — is shared and lives in core/.
 */

/** How a question can be answered. Games say which ones they can show. */
export type Format = 'number' | 'choice' | 'letters'

export interface Prompt {
  /** What to show. Keep it short — young readers! */
  text: string
  /** Read this aloud (text-to-speech). If `listen` is true, the question only works with sound. */
  say?: string
  /** A big picture to show with the question. */
  emoji?: string
  /** A drawing (e.g. a clock face), as an SVG string. */
  svg?: string
  /** Show like a math sum, with "= ?" after it. */
  sum?: boolean
}

export interface Item {
  /** Full skill id, e.g. "math.add". Filled in by the scheduler. */
  skill: string
  level: number
  /** Identifies this exact fact ("7×8", "because") so a missed one can come back later. */
  key: string
  prompt: Prompt
  /** The right answer, as text ("12", "cat", "Mars"). */
  answer: string
  formats: Format[]
  /** The question needs sound (e.g. "tap the word you hear"). Skipped where speech isn't available. */
  listen?: boolean
  /** Believable wrong answers for multiple choice. */
  wrong(count: number): string[]
  /** Score a response 0..1 (partial credit allowed). Default: exact match, ignoring case and spaces. */
  check?(response: string): number
  /** Seconds a fluent kid needs. Set it to give quick answers a small bonus; leave out for no speed bonus. */
  seconds?: number
}

/** What a skill's generate() returns; formats and listen default to the skill's. */
export type ItemSpec = Omit<Item, 'skill' | 'level' | 'formats'> & { formats?: Format[] }

export interface Skill {
  /** Short id inside its subject, e.g. "add". */
  id: string
  /** Friendly name for a level: "Adding up to 20". */
  label(level: number): string
  /** The hardest level that has its own questions. */
  maxLevel: number
  /** How its questions can be answered. */
  formats: Format[]
  /** Its questions need sound. */
  listen?: boolean
  /** Skills that must reach a level first. */
  unlocksAfter?: { skill: string; level: number }[]
  /** Starting level for a new player, by school grade (0 = kindergarten). Missing = locked/1. */
  startByGrade?: Record<number, number>
  /** Make a question at a level. */
  generate(level: number): ItemSpec
  /** Rebuild a question from its key, to re-ask a fact they missed. */
  fromKey?(key: string, level: number): ItemSpec | null
}

export interface Subject {
  id: string
  name: string
  emoji: string
  skills: Skill[]
}
