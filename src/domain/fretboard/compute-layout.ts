import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import { SEMITONES_PER_OCTAVE } from '@domain/music/note-names';

/** Proportions of the screen the instrument occupies. */
const Proportion = {
  centerY: 0.6,
  spreadOfHeight: 0.12,
  spreadOfWidth: 0.09,
  nutTaper: 0.8,
  nutX: 0.1,
  neckEndX: 0.55,
  strumX0: 0.58,
  /** The bridge: strings end here. */
  strumX1: 0.86,
  /** Share of real (12-TET) fret spacing; the rest is even spacing so high frets stay hittable. */
  realSpacing: 0.55,
} as const;

/** Builds the fretboard geometry for a screen size, string count and handedness. */
export function computeLayout(w: number, h: number, strings: number, isLefty: boolean, maxFret: number): FretboardLayout {
  const spreadBody = Math.min(h * Proportion.spreadOfHeight, w * Proportion.spreadOfWidth);
  const mx = (x: number) => (isLefty ? w - x : x);
  const nut = w * Proportion.nutX;
  const end = w * Proportion.neckEndX;
  const real = (n: number) =>
    (1 - Math.pow(2, -n / SEMITONES_PER_OCTAVE)) / (1 - Math.pow(2, -maxFret / SEMITONES_PER_OCTAVE));
  const fretX: number[] = [];
  for (let n = 0; n <= maxFret; n++) {
    const t = Proportion.realSpacing * real(n) + (1 - Proportion.realSpacing) * (n / maxFret);
    fretX.push(mx(nut + (end - nut) * t));
  }
  return {
    w,
    h,
    isLefty,
    strings,
    nutX: mx(nut),
    neckEndX: mx(end),
    strumX0: mx(w * Proportion.strumX0),
    strumX1: mx(w * Proportion.strumX1),
    centerY: h * Proportion.centerY,
    spreadNut: spreadBody * Proportion.nutTaper,
    spreadBody,
    fretX,
    maxFret,
  };
}
