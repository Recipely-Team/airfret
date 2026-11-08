import { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import { InstrumentKind } from '@domain/band/seating/instrument-kind';
import { BandStyle } from '@domain/band/band-style';
import type { InstrumentProfile } from '@domain/band/seating/instrument-profile';

const CHORDS: Readonly<Record<InstrumentKind, readonly BandPattern[]>> = {
  fretted: [BandPattern.strum, BandPattern.arpeggio, BandPattern.afterbeat, BandPattern.block, BandPattern.held],
  keys: [BandPattern.block, BandPattern.afterbeat, BandPattern.arpeggio, BandPattern.alberti, BandPattern.held],
  zither: [BandPattern.arpeggio, BandPattern.afterbeat, BandPattern.held],
  mallet: [BandPattern.arpeggio, BandPattern.afterbeat, BandPattern.held],
  wind: [BandPattern.held],
  brass: [BandPattern.afterbeat, BandPattern.held],
  bowed: [BandPattern.held],
  drum: [],
};
const BASS: readonly BandPattern[] = [BandPattern.root, BandPattern.rootFifth, BandPattern.walk, BandPattern.octave];
const PLUCKED: ReadonlySet<InstrumentKind> = new Set([InstrumentKind.fretted, InstrumentKind.zither, InstrumentKind.mallet, InstrumentKind.keys]);

/** An instrument that reaches this low can take the bass (a cello, a bassoon, a guitar's low strings). */
const CAN_BASS_FROM = 48;

/** The roles an instrument can take, for the player to choose from: a drum keeps the beat; one line can't play chords. */
export function rolesFor(profile: InstrumentProfile): readonly BandRole[] {
  if (profile.isDrum) return [BandRole.rhythm, BandRole.off];
  const roles: BandRole[] = [BandRole.melody, BandRole.double, BandRole.heterophony];
  roles.push(profile.isMonophonic ? BandRole.counter : BandRole.harmony, BandRole.pad);
  if (profile.low <= CAN_BASS_FROM) roles.push(BandRole.bass);
  roles.push(BandRole.off);
  return roles;
}

/** The patterns an instrument of this family can play in this role (the first is its most natural), for the player to choose from. */
export function patternsFor(role: BandRole, kind: InstrumentKind): readonly BandPattern[] {
  if (role === BandRole.harmony || role === BandRole.pad) return role === BandRole.pad ? [BandPattern.held] : CHORDS[kind];
  if (role === BandRole.bass) return BASS;
  if (role === BandRole.heterophony) return PLUCKED.has(kind) ? [BandPattern.tremolo, BandPattern.legato] : [BandPattern.legato];
  return [];
}

/**
 * The pattern the band gives a chord instrument: a march's afterbeats, else its family's own idiom — but never one a
 * chord instrument before it already plays, so two never strike the same chords at the same moments.
 */
export function defaultPattern(role: BandRole, kind: InstrumentKind, style: BandStyle, taken: readonly BandPattern[]): BandPattern | undefined {
  const options = patternsFor(role, kind);
  if (role === BandRole.bass) return style === BandStyle.march ? BandPattern.rootFifth : undefined;
  if (role === BandRole.harmony && style === BandStyle.march && options.includes(BandPattern.afterbeat) && !taken.includes(BandPattern.afterbeat)) return BandPattern.afterbeat;
  return options.find((p) => !taken.includes(p)) ?? options[0];
}
