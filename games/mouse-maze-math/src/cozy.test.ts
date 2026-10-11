import { describe, expect, test } from 'vitest'
import { cheeseFromFinish, doorHint, isCozy, wordlessToast, wordsHint } from './cozy'

describe('picture-first screens for the youngest players', () => {
  test('kindergarten and grade 1 are cozy; grade 2 and up are not', () => {
    expect(isCozy(0)).toBe(true)
    expect(isCozy(1)).toBe(true)
    expect(isCozy(2)).toBe(false)
    expect(isCozy(5)).toBe(false)
  })

  test('cozy hints are pictures only, with no words for a non-reader to skip over', () => {
    expect(doorHint(true)).not.toMatch(/[a-z]/i)
    expect(wordsHint(true)).not.toMatch(/[a-z]/i)
  })

  test('older players keep the sentences', () => {
    expect(doorHint(false)).toBe('Which door leads to the cheese? 🧀')
    expect(wordsHint(false)).toContain('Read the answers below')
  })

  test('cheese at the end of a maze adds the 20 bonus only for a repeat sticker', () => {
    expect(cheeseFromFinish(75, true)).toBe(75)
    expect(cheeseFromFinish(75, false)).toBe(95)
  })

  test('toasts keep their emoji and numbers, or fall back to one picture', () => {
    expect(wordlessToast('⚡ Quick! +5 🧀', 'good')).toBe('⚡ +5 🧀')
    expect(wordlessToast('Yes, Ava! +10 🧀', 'good')).toBe('+10 🧀')
    expect(wordlessToast('Dead end! Try another problem', 'bad')).toBe('🙈')
    expect(wordlessToast('Nice! One more!', 'good')).toBe('🎉')
    expect(wordlessToast('🧀 Cheese Cupboards', 'good')).toBe('🧀')
  })
})
