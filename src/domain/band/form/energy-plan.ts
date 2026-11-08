import { BandStyle } from '@domain/band/band-style';
import type { BandSection } from '@domain/band/form/band-section';
import type { SongPart } from '@domain/band/form/song-form';

const MAX = 5;
/** The quiet style never goes past this; the full one never below this. */
const QUIET_TOP = 3;
const FULL_FLOOR = 4;
/** Where a build-up starts (a melody, a bass and soft chords), and the level of the section that thins before the end. */
const START = 2;
const DIP = 3;

/**
 * How full each section sounds — the research report's texture plan: the band builds by adding layers as the song goes
 * on (as in Ravel's Boléro, every repeat fuller), thins just before the last section, and plays that one with
 * everyone. A one-section song plays at a middle level. `fixed` (1–5) holds one level throughout instead.
 *
 * - two sections: 3, 5; three: 2, 4, 5; four: 2, 3, 4, 5; more: rising from 2, a dip to 3 before the last, then 5;
 * - before the final section its last bar is a strip-back (bass and beat drop out), so the climax lands.
 */
export function planEnergy(parts: readonly SongPart[], style: BandStyle, fixed: number | null): BandSection[] {
  const n = parts.length;
  const level = (k: number): number => {
    if (fixed !== null) return clamp(fixed);
    if (n === 1) return DIP;
    if (k === n - 1) return MAX;
    if (n >= 5 && k === n - 2) return DIP;
    const climb = n >= 5 ? n - 2 : n - 1;
    return Math.round(START + ((MAX - 1 - START) * k) / Math.max(1, climb - 1));
  };
  return parts.map((p, k) => {
    const raw = n === 2 && fixed === null ? (k === 0 ? DIP : MAX) : level(k);
    const energy = style === BandStyle.quiet ? Math.min(QUIET_TOP, raw) : style === BandStyle.full ? Math.max(FULL_FLOOR, raw) : raw;
    // No strip-back in a quiet band, nor in a folk one: its usul runs from the first bar to the last.
    const hasStripBack = fixed === null && style !== BandStyle.quiet && style !== BandStyle.folk && n >= 2;
    return { ...p, index: k, energy, isThinEnd: hasStripBack && k === n - 2, isFinal: k === n - 1 };
  });
}

function clamp(e: number): number {
  return Math.max(1, Math.min(MAX, Math.round(e)));
}
