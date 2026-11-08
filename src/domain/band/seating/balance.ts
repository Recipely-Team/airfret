import { BandRole } from '@domain/band/seating/band-role';

/**
 * Each role's place under the tune, dB (the research report's balance table: a counter a level below the tune, the
 * chords two; one level ≈ 4–6 dB). Adjustable by ear: these are the values the report calls inference, not sourced.
 */
const ROLE_DB: Readonly<Record<BandRole, number>> = { melody: 0, double: -4, heterophony: -4, counter: -5, harmony: -8, pad: -10, bass: -3, rhythm: -4, off: -120 };
/** The weight a plucked or keyboard instrument has against a woodwind: the reference the others are scaled to. */
const REFERENCE_WEIGHT = 1.5;
const DB_PER_GAIN = 20;

/**
 * Where a band member sits in the mix: its role's level under the tune, a loud family (brass) brought down to its
 * neighbours unless it leads, instruments sharing a role scaled so together they weigh no more than one (1/√n),
 * then the player's own level on top.
 */
export function seatGain(role: BandRole, weight: number, sharing: number, level = 1): number {
  const family = role === BandRole.melody ? 1 : Math.min(1, Math.sqrt(REFERENCE_WEIGHT / Math.max(weight, 0.1)));
  return 10 ** (ROLE_DB[role] / DB_PER_GAIN) * family * (1 / Math.sqrt(Math.max(1, sharing))) * level;
}
