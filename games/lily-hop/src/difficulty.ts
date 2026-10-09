/** How hard Lily Hop is for an IXL math grade (0 = Kindergarten). */
// Harder as the grade goes up: a longer pond, and from grade 2 the gator also swims on its own.
export function pondFor(grade: number) {
  return {
    pads: Math.min(6 + grade * 2, 16),
    gatorEvery: grade >= 4 ? 8 : grade >= 2 ? 14 : 0, // seconds between sneaky swims (0 = only when you miss)
  }
}
