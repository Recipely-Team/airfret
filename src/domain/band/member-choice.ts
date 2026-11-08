import type { BandPattern } from '@domain/band/seating/band-pattern';
import type { BandRole } from '@domain/band/seating/band-role';

/** What the player chose for one band member, over what the band would choose itself: any of it may be left to the band. */
export interface MemberChoice {
  readonly role?: BandRole;
  readonly pattern?: BandPattern;
  /** Its level, 0–1.5 (1: where the arrangement puts it). */
  readonly level?: number;
  /** The section it comes in at (0: from the start), instead of when the build-up brings it in. */
  readonly from?: number;
}
