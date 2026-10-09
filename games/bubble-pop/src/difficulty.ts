/** How hard Bubble Pop is for an IXL math grade (0 = Kindergarten). */
// Harder as the IXL grade goes up: more bubbles to choose from, and they fall faster.
export function settingsFor(grade: number) {
  return {
    bubbles: grade >= 4 ? 5 : grade >= 2 ? 4 : 3,
    fallSeconds: grade >= 4 ? 7 : grade >= 2 ? 10 : 14,
  }
}
