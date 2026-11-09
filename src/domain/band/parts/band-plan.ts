import type { BandSection } from '@domain/band/form/band-section';
import type { LeadTurn } from '@domain/band/form/lead-rotation';

/** What every part is written against: the song's sections as planned, and who else is in the band. */
export interface BandPlan {
  readonly sections: readonly BandSection[];
  /** Someone plays the bass: the tune drops its written bass, chords answer on the afterbeats. */
  readonly hasBass: boolean;
  /** Someone plays chords in a pattern: held parts wait for the fuller sections. */
  readonly hasHarmony: boolean;
  /** Chords stacked in fourths (Ilerici's quartal harmony) instead of the song's triads. */
  readonly isQuartal?: boolean;
  /** Per section (by index): who takes the tune over there, if not the melody (none: the melody leads throughout). */
  readonly leads?: readonly (LeadTurn | null)[];
}
