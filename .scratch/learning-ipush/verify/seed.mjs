// Seeds the guest learner as "placed" (so new topics can come up) and optional extras.
export function seedJs(subject, grade) {
  const learning = { v: 2, ratings: {}, seen: {}, fast: {}, facts: {}, last: {}, calibrated: {}, placement: { [subject]: { g: grade, n: 30 } }, played: { [subject]: grade } }
  return `localStorage.setItem('arcade:p:guest:learning:v2', ${JSON.stringify(JSON.stringify(learning))})`
}
