/** The small noises around a played string, beside the notes themselves. */

/** Strumming strings the fretting hand mutes: a short band of noise, lower on the bass. */
export const CHUCK = { guitarHz: 2200, bassHz: 700, q: 1.2, attack: 0.003, length: 0.06 } as const;
/** Pick hitting the string: a 3 ms bright tick, louder for harder strokes. */
export const PICK = { highpassHz: 3000, level: 0.09, length: 0.004 } as const;
/** Fingertip landing on a string. */
export const TOUCH = { bandHz: 3200, level: 0.025, length: 0.03 } as const;
/** Fingers sliding over wound strings: a short rising squeak. */
export const SQUEAK = { fromHz: 1400, toHz: 3200, q: 6, level: 0.05, length: 0.12 } as const;
