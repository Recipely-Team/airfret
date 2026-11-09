import type { ChordSpan } from '@domain/band/harmony/chord-span';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import { chordTones } from '@domain/performance/chart-notes';

const OCTAVE = 12;
const THIRD = { minor: 3, major: 4 } as const;
const FIFTH = 7;
/** A chord song's bass sits in the octave from G2. */
const BASS_FROM = 43;
const EPS = 1e-6;

/**
 * The chords under a song, in order: a chord song's own; a tune's read from the bass written under it — each bass
 * note a triad's root, minor when the tune over it leans on the minor third (or, where it touches neither, the whole
 * tune does). A tune with no bass written has none: there is nothing to harmonise from.
 */
export function chordTimeline(song: Song, chart: SongChart): ChordSpan[] {
  if (song.mode === PlayMode.chord) {
    return chart.segments.map((seg) => {
      const tones = chordTones(seg.chord);
      return { beat: seg.beat, end: seg.beat + seg.dur, bass: BASS_FROM + (((tones[0] ?? 0) - BASS_FROM) % OCTAVE + OCTAVE) % OCTAVE, tones };
    });
  }
  const changes = chart.targets.filter((t) => t.harmony?.length);
  return changes.map((c, i) => {
    const end = changes[i + 1]?.beat ?? chart.length;
    const bass = Math.min(...(c.harmony ?? []));
    const leans = (step: number, isWhole: boolean) =>
      chart.targets.filter((t) => t.midi !== undefined && (isWhole || (t.beat >= c.beat - EPS && t.beat < end - EPS)) && (((t.midi - bass) % OCTAVE) + OCTAVE) % OCTAVE === step).length;
    const local = leans(THIRD.minor, false) - leans(THIRD.major, false);
    const third = (local !== 0 ? local : leans(THIRD.minor, true) - leans(THIRD.major, true)) > 0 ? THIRD.minor : THIRD.major;
    const root = ((bass % OCTAVE) + OCTAVE) % OCTAVE;
    return { beat: c.beat, end, bass, tones: [root, (root + third) % OCTAVE, (root + FIFTH) % OCTAVE] };
  });
}
