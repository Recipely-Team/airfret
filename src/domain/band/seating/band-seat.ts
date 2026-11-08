import type { BandPattern } from '@domain/band/seating/band-pattern';
import type { BandRole } from '@domain/band/seating/band-role';
import type { InstrumentKind } from '@domain/band/seating/instrument-kind';

/** One instrument's place in the band: its job, how it plays it, when it comes in and how loud it sits. */
export interface BandSeat {
  readonly id: string;
  readonly kind: InstrumentKind;
  readonly role: BandRole;
  /** How it plays its part; none: as the build-up goes (a bass from roots to root and fifth). */
  readonly pattern?: BandPattern;
  /** Which chord tone a held inner part takes (0: the third, 1: the fifth, 2: the root), so two never double. */
  readonly voice?: number;
  /** The note it sits around (the middle of its range). */
  readonly centre: number;
  /** 0–1.5: where the arrangement sets it in the mix (the tune in front), times the player's own level. */
  readonly gain: number;
  /** The section it comes in at, when the player chose one (else the build-up decides). */
  readonly from?: number;
  /** The first rhythm instrument: the one that keeps the usul from the first bar (Turkish practice). */
  readonly isLeadDrum?: boolean;
  /** Set when the player's choice had to be adjusted: an i18n key saying why. */
  readonly hint?: string;
}
