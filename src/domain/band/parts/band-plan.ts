import type { BandSection } from '@domain/band/form/band-section';

/** What every part is written against: the song's sections as planned, and who else is in the band. */
export interface BandPlan {
  readonly sections: readonly BandSection[];
  /** Someone plays the bass: the tune drops its written bass, chords answer on the afterbeats. */
  readonly hasBass: boolean;
  /** Someone plays chords in a pattern: held parts wait for the fuller sections. */
  readonly hasHarmony: boolean;
}
