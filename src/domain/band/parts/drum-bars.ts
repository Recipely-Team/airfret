import { isPlaying, sectionAt } from '@domain/band/parts/entries';
import type { BandPlan } from '@domain/band/parts/band-plan';
import type { BandSeat } from '@domain/band/seating/band-seat';
import { DRUMS_ID } from '@domain/drums/drums-id';

/** How a drum plays a bar: 0 silent, 1 light (the downbeats, no backbeat), 2 its full pattern, 3 that with a crash. */
const LIGHT = 1;
const FULL = 2;
const CRASH = 3;
/** The kit plays light at energy 2, its full beat from 3, a crash opening each section at 4 and up. */
const KIT_FULL_FROM = 3;
const CRASH_FROM = 4;

/**
 * A drum's part bar by bar (from the song's first full bar): silent until its role comes in, light at the lowest
 * level it plays, its full pattern above, a crash on the first bar of every loud section — and silent in the
 * strip-back bar before the final section, so the last climax lands.
 */
export function drumBars(seat: BandSeat, plan: BandPlan, span: { start: number; bars: number }, beatsPerBar: number): number[] {
  return Array.from({ length: span.bars }, (_, b) => {
    const at = span.start + b * beatsPerBar;
    const section = sectionAt(plan.sections, at);
    if (!section || !isPlaying(seat, section, plan)) return 0;
    if (section.isThinEnd && at >= section.end - beatsPerBar - 1e-6) return 0;
    const isKit = seat.id === DRUMS_ID;
    if (isKit && section.energy < KIT_FULL_FROM) return LIGHT;
    if (!isKit && section.energy <= 1) return LIGHT;
    const isFirstBar = Math.abs(at - section.start) < beatsPerBar - 1e-6;
    return isFirstBar && section.energy >= CRASH_FROM && section.index > 0 ? CRASH : FULL;
  });
}
