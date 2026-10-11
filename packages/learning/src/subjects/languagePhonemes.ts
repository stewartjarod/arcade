import type { Skill } from '../core/types'
import type { IxlRef } from '../ixl/map'
import { p, r, rowSkill, type Row } from './languageFinalEarly'

/**
 * The IXL phoneme topics (blending, segmenting, manipulation) without isolated sounds. The browser voice reads a
 * letter by its name ("see", not "kuh"), so these never ask the voice to say a single sound: they use whole
 * words and position words ("without the first sound"), and the letters in a blend are only shown, never read.
 * Every wrong answer was checked by hand: no homophones of the right answer, and none is also a correct answer.
 */

/** A row whose read-aloud differs from what's shown (the shown parts are letters, which the voice can't say as sounds). */
const r2 = (q: string, say: string, a: string, w1: string, w2: string, w3: string): Row => ({ q, say, a, w: [w1, w2, w3] })

/** Blend parts into a word, then count the sounds in a word (IXL: Phoneme blending and segmenting). */
const soundBlend = rowSkill(
  'soundBlend',
  ['Put the parts of a word together', 'How many sounds? (short words)', 'How many sounds? (words with blends)'],
  [
    [
      r2(`Put the parts together: m + ap. What word do they make?`, "Put the two parts together. What word do they make?", "map", "mop", "nap", "men"),
      r2(`Put the parts together: c + at. What word do they make?`, "Put the two parts together. What word do they make?", "cat", "cot", "cut", "cap"),
      r2(`Put the parts together: b + ed. What word do they make?`, "Put the two parts together. What word do they make?", "bed", "bad", "bud", "bid"),
      r2(`Put the parts together: h + en. What word do they make?`, "Put the two parts together. What word do they make?", "hen", "hat", "hit", "ten"),
      r2(`Put the parts together: p + ig. What word do they make?`, "Put the two parts together. What word do they make?", "pig", "pin", "peg", "pug"),
      r2(`Put the parts together: d + og. What word do they make?`, "Put the two parts together. What word do they make?", "dog", "dig", "dug", "log"),
      r2(`Put the parts together: s + un. What word do they make?`, "Put the two parts together. What word do they make?", "sun", "sad", "sip", "bun"),
      r2(`Put the parts together: r + ug. What word do they make?`, "Put the two parts together. What word do they make?", "rug", "run", "rag", "rig"),
      r2(`Put the parts together: f + an. What word do they make?`, "Put the two parts together. What word do they make?", "fan", "fin", "fun", "pan"),
      r2(`Put the parts together: l + ip. What word do they make?`, "Put the two parts together. What word do they make?", "lip", "lap", "lid", "tip"),
      r2(`Put the parts together: j + ar. What word do they make?`, "Put the two parts together. What word do they make?", "jar", "jam", "jaw", "car"),
      r2(`Put the parts together: w + et. What word do they make?`, "Put the two parts together. What word do they make?", "wet", "web", "wit", "pet"),
      r2(`Put the parts together: t + op. What word do they make?`, "Put the two parts together. What word do they make?", "top", "tip", "tap", "hop"),
      r2(`Put the parts together: n + ut. What word do they make?`, "Put the two parts together. What word do they make?", "nut", "net", "not", "cut"),
      r2(`Put the two words together: sun + flower. What word do they make?`, "Put the two words together. What word do they make?", "sunflower", "sunshine", "flowerpot", "snowflake"),
      r2(`Put the two words together: rain + bow. What word do they make?`, "Put the two words together. What word do they make?", "rainbow", "raincoat", "bowtie", "snowball"),
      r2(`Put the two words together: cup + cake. What word do they make?`, "Put the two words together. What word do they make?", "cupcake", "cupboard", "pancake", "cakewalk"),
      r2(`Put the two words together: foot + ball. What word do they make?`, "Put the two words together. What word do they make?", "football", "baseball", "footprint", "basketball"),
      r2(`Put the two words together: butter + fly. What word do they make?`, "Put the two words together. What word do they make?", "butterfly", "firefly", "butterball", "dragonfly"),
      r2(`Put the two words together: star + fish. What word do they make?`, "Put the two words together. What word do they make?", "starfish", "goldfish", "starlight", "jellyfish"),
    ],
    [
      p("🐱", `How many sounds do you hear in "cat"?`, "3", "2", "4", "5"),
      p("🐶", `How many sounds do you hear in "dog"?`, "3", "2", "4", "5"),
      p("☀️", `How many sounds do you hear in "sun"?`, "3", "2", "4", "5"),
      p("🚌", `How many sounds do you hear in "bus"?`, "3", "2", "4", "5"),
      p("🐷", `How many sounds do you hear in "pig"?`, "3", "2", "4", "5"),
      p("🐟", `How many sounds do you hear in "fish"?`, "3", "2", "4", "5"),
      p("🚢", `How many sounds do you hear in "ship"?`, "3", "2", "4", "5"),
      p("🌧️", `How many sounds do you hear in "rain"?`, "3", "2", "4", "5"),
      p("🌳", `How many sounds do you hear in "tree"?`, "3", "2", "4", "5"),
      p("🌙", `How many sounds do you hear in "moon"?`, "3", "2", "4", "5"),
      p("🐑", `How many sounds do you hear in "sheep"?`, "3", "2", "4", "5"),
      p("🦆", `How many sounds do you hear in "duck"?`, "3", "2", "4", "5"),
      p("🚲", `How many sounds do you hear in "bike"?`, "3", "2", "4", "5"),
      p("🥚", `How many sounds do you hear in "egg"?`, "2", "3", "1", "4"),
      p("🐝", `How many sounds do you hear in "bee"?`, "2", "3", "1", "4"),
      p("🌊", `How many sounds do you hear in "sea"?`, "2", "3", "1", "4"),
      p("🧸", `How many sounds do you hear in "toy"?`, "2", "3", "1", "4"),
      p("⬆️", `How many sounds do you hear in "up"?`, "2", "3", "1", "4"),
    ],
    [
      p("🐸", `How many sounds do you hear in "frog"?`, "4", "3", "5", "2"),
      p("🚩", `How many sounds do you hear in "flag"?`, "4", "3", "5", "2"),
      p("🥛", `How many sounds do you hear in "milk"?`, "4", "3", "5", "2"),
      p("🕐", `How many sounds do you hear in "clock"?`, "4", "3", "5", "2"),
      p("🚚", `How many sounds do you hear in "truck"?`, "4", "3", "5", "2"),
      p("🥁", `How many sounds do you hear in "drum"?`, "4", "3", "5", "2"),
      p("🦀", `How many sounds do you hear in "crab"?`, "4", "3", "5", "2"),
      p("🏊", `How many sounds do you hear in "swim"?`, "4", "3", "5", "2"),
      p("🖌️", `How many sounds do you hear in "brush"?`, "4", "3", "5", "2"),
      p("❄️", `How many sounds do you hear in "snow"?`, "3", "2", "4", "5"),
      p("💦", `How many sounds do you hear in "splash"?`, "5", "4", "6", "3"),
      p("🌱", `How many sounds do you hear in "plant"?`, "5", "4", "6", "3"),
      r(`How many sounds do you hear in "stamp"?`, "5", "4", "6", "3"),
      r(`How many sounds do you hear in "stick"?`, "4", "3", "5", "2"),
      r(`How many sounds do you hear in "twist"?`, "5", "4", "6", "3"),
    ],
  ],
)

/** Take a sound away and say what is left (IXL: Phoneme manipulation). */
const soundDrop = rowSkill(
  'soundDrop',
  ['Say it without the first sound', 'Say it without the last sound', 'Say it without the first sound (blends)'],
  [
    [
      r(`Say "meat" without the first sound. What word is left?`, "eat", "mat", "neat", "heat"),
      r(`Say "ball" without the first sound. What word is left?`, "all", "bell", "bat", "call"),
      r(`Say "hat" without the first sound. What word is left?`, "at", "ham", "hit", "cat"),
      r(`Say "bit" without the first sound. What word is left?`, "it", "bat", "big", "fit"),
      r(`Say "cold" without the first sound. What word is left?`, "old", "gold", "cod", "told"),
      r(`Say "hand" without the first sound. What word is left?`, "and", "band", "sand", "hang"),
      r(`Say "bear" without the first sound. What word is left?`, "air", "bar", "beer", "ear"),
      r(`Say "bone" without the first sound. What word is left?`, "own", "bun", "bond", "cone"),
      r(`Say "wink" without the first sound. What word is left?`, "ink", "win", "wing", "sink"),
      r(`Say "year" without the first sound. What word is left?`, "ear", "yes", "yarn", "hear"),
      r(`Say "meal" without the first sound. What word is left?`, "eel", "mail", "meat", "seal"),
    ],
    [
      r(`Say "cart" without the last sound. What word is left?`, "car", "cat", "can", "cab"),
      r(`Say "tent" without the last sound. What word is left?`, "ten", "tan", "tin", "net"),
      r(`Say "bark" without the last sound. What word is left?`, "bar", "bag", "bat", "bake"),
      r(`Say "farm" without the last sound. What word is left?`, "far", "fan", "fat", "form"),
      r(`Say "milk" without the last sound. What word is left?`, "mill", "mild", "mile", "mix"),
      r(`Say "belt" without the last sound. What word is left?`, "bell", "bet", "bent", "best"),
      r(`Say "mask" without the last sound. What word is left?`, "mass", "map", "mat", "mast"),
      r(`Say "pant" without the last sound. What word is left?`, "pan", "pen", "pat", "paint"),
    ],
    [
      r(`Say "stop" without the first sound. What word is left?`, "top", "shop", "step", "tap"),
      r(`Say "plate" without the first sound. What word is left?`, "late", "plane", "plot", "lake"),
      r(`Say "blend" without the first sound. What word is left?`, "lend", "bend", "bland", "bled"),
      r(`Say "snail" without the first sound. What word is left?`, "nail", "mail", "sail", "snow"),
      r(`Say "spin" without the first sound. What word is left?`, "pin", "spun", "sip", "spill"),
      r(`Say "brake" without the first sound. What word is left?`, "rake", "bake", "break", "brave"),
      r(`Say "clap" without the first sound. What word is left?`, "lap", "cap", "clip", "flap"),
      r(`Say "flip" without the first sound. What word is left?`, "lip", "flap", "slip", "fit"),
      r(`Say "trap" without the first sound. What word is left?`, "rap", "tap", "tip", "trip"),
      r(`Say "smile" without the first sound. What word is left?`, "mile", "smell", "slime", "while"),
    ],
  ],
)

export const READING_PH: Skill[] = [soundBlend, soundDrop]

const e = (grade: number, category: string): IxlRef => ({ subject: 'ela', grade, category })

export const LANGUAGE_PH_IXL: Record<string, IxlRef[]> = {
  'reading.soundBlend': [e(0, 'Phoneme blending and segmenting'), e(0, 'Phoneme blending and segmenting'), e(1, 'Phoneme blending and segmenting')],
  'reading.soundDrop': [e(0, 'Phoneme manipulation'), e(1, 'Phoneme manipulation'), e(2, 'Phoneme manipulation')],
}
