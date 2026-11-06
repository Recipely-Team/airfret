/**
 * Ukulele chord shapes, frets per string in the order it is held (G · C · E · A, re-entrant G4 C4 E4 A4): every
 * chord the chord sets and lessons use, in first position. Each was checked note by note against the chord.
 */
export const UKULELE_SHAPES: Readonly<Record<string, readonly (number | null)[]>> = {
  C: [0, 0, 0, 3], C5: [0, 0, 3, 3], Cadd9: [0, 2, 0, 3], C7: [0, 0, 0, 1],
  D: [2, 2, 2, 0], D5: [2, 2, 5, 0], D7: [2, 2, 2, 3], Dm: [2, 2, 1, 0],
  E: [1, 4, 0, 2], E5: [4, 4, 0, 2], E7: [1, 2, 0, 2], Em: [0, 4, 3, 2],
  F: [2, 0, 1, 0], F5: [5, 5, 1, 3],
  G: [0, 2, 3, 2], G5: [0, 2, 3, 5], G7: [0, 2, 1, 2],
  A: [2, 1, 0, 0], A5: [2, 4, 0, 0], A7: [0, 1, 0, 0], Am: [2, 0, 0, 0], Am7: [0, 0, 0, 0],
  B5: [4, 6, 2, 2], Bm: [4, 2, 2, 2], B7: [2, 3, 2, 2], Bb: [3, 2, 1, 1], 'F#m': [2, 1, 2, 0],
};
