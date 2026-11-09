/**
 * How the band's chords are built (the research report's harmony style):
 * - **western**: the song's own chords, in triads (functional harmony);
 * - **quartal**: Kemal Ilerici's "dörtlü armoni" for Turkish music — chords stacked in fourths from the tune's own
 *   scale, by his rules. Never on a Western-tonal march: those keep their chords.
 */
export const BandHarmony = {
  western: 'western',
  quartal: 'quartal',
} as const;
export type BandHarmony = (typeof BandHarmony)[keyof typeof BandHarmony];
