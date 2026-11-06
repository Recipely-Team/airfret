import type { Tuning } from '@domain/music/tuning';

/**
 * Tunings of instruments the guitar and bass lists don't fit, top string first as each is held. Sources:
 * en.wikipedia.org "Ukulele", "Mandolin", "Balalaika", "Irish bouzouki", "Bouzouki".
 */
export const WORLD_TUNINGS = {
  /** Re-entrant G4 C4 E4 A4; low G drops the G an octave. Both keep the chord shapes' names. */
  ukulele: [
    { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0] },
    { id: 'lowG', name: 'tuning.lowG', offsets: [-12, 0, 0, 0] },
  ],
  /** In fifths like a violin, G3 D4 A4 E5. */
  mandolin: [{ id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0] }],
  /** Prima E4 E4 A4; also "guitar" G3 B3 D4, domra E4 A4 D5, and the folk D4 F#4 A4 and C4 E4 G4. */
  balalaika: [
    { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0] },
    { id: 'guitarStyle', name: 'tuning.guitarStyle', offsets: [-9, -5, -7] },
    { id: 'domra', name: 'tuning.domra', offsets: [0, 5, 5] },
    { id: 'folkD', name: 'tuning.folkD', offsets: [-2, 2, 0] },
    { id: 'folkC', name: 'tuning.folkC', offsets: [-4, 0, -2] },
  ],
  /** Irish G2 D3 A3 D4 (Johnny Moynihan's), or with the top course on E. */
  irishBouzouki: [
    { id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0, 0] },
    { id: 'gdae', name: 'tuning.gdae', offsets: [0, 0, 0, 2] },
  ],
  /** Greek trichordo D3 A3 D4. */
  greekBouzouki: [{ id: 'standard', name: 'tuning.standard', offsets: [0, 0, 0] }],
} as const satisfies Record<string, readonly Tuning[]>;
