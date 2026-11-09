import type { BandSection } from '@domain/band/form/band-section';
import type { BandPlan } from '@domain/band/parts/band-plan';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import { DRUMS_ID } from '@domain/drums/drums-id';

/**
 * The energy at which each role comes in (the research report's texture plan): the tune from the first note; at 2 a
 * bass, chords and the beat; at 3 an inner line; at 4 the held pads, the doublings and the fills — the full band. A
 * drone holds from the first note, under everything.
 */
const ENTRY: Readonly<Record<BandRole, number>> = { melody: 1, heterophony: 2, harmony: 2, bass: 2, rhythm: 2, counter: 3, double: 4, pad: 4, fills: 4, drone: 1, off: Infinity };
/** Held chords come in with the chords when no one plays chords in a pattern. */
const PAD_ALONE = 2;
/** In a Turkish ensemble the leading drum keeps the usul from the first bar; the others join at 3. */
const LEAD_HAND_DRUM = 1;
const OTHER_HAND_DRUM = 3;

/** Whether a band member plays in a section: as the player set it (from a section on), else when its role comes in. */
export function isPlaying(seat: BandSeat, section: BandSection, plan: BandPlan): boolean {
  if (seat.role === BandRole.off) return false;
  if (seat.from !== undefined) return section.index >= seat.from;
  return section.energy >= entryOf(seat, plan);
}

/** The energy a seat comes in at. */
export function entryOf(seat: BandSeat, plan: BandPlan): number {
  if (seat.role === BandRole.rhythm && seat.id !== DRUMS_ID) return seat.isLeadDrum ? LEAD_HAND_DRUM : OTHER_HAND_DRUM;
  if (seat.role === BandRole.pad && !plan.hasHarmony) return PAD_ALONE;
  return ENTRY[seat.role];
}

/** The section a beat falls in (the last one past the end). */
export function sectionAt(sections: readonly BandSection[], beat: number): BandSection | undefined {
  return sections.find((s) => beat >= s.start - 1e-6 && beat < s.end - 1e-6) ?? sections[sections.length - 1];
}
