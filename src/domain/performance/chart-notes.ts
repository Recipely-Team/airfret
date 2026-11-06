import { chordRoot } from '@domain/music/chords/chord-voicing';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import type { TimedNote } from '@domain/performance/timed-note';

const LEVEL = { melody: 0.78, harmony: 0.5, bass: 0.6, chord: 0.45 } as const;
/** The lowest bass note of a chord accompaniment (G2) — its root is placed in the octave from here. */
const BASS_FROM = 43;
/** The lowest note of the chord above it (G3). */
const CHORD_FROM = 55;
/** A struck chord is let go a little before the next beat, as a hand lifts. */
const CHORD_HOLD = 0.85;
const OCTAVE = 12;

/**
 * The notes of a song as a keyboard or wind plays it, in beats.
 *
 * @remarks
 * - A melody keeps its notes; the bass and inner voices under it ring until the next ones come.
 * - A chord song becomes an accompaniment: the root in the bass at each bar, the chord struck on every beat.
 */
export function chartNotes(song: Song, chart: SongChart): TimedNote[] {
  if (song.mode === PlayMode.chord) return chordNotes(song, chart);
  const notes: TimedNote[] = [];
  const withHarmony = chart.targets.filter((t) => t.harmony?.length);
  for (const t of chart.targets) {
    if (t.midi === undefined) continue;
    notes.push({ beat: t.beat, dur: t.dur, midi: t.midi, velocity: LEVEL.melody, isMelody: true });
    if (!t.harmony?.length) continue;
    const next = withHarmony.find((h) => h.beat > t.beat);
    const ring = (next?.beat ?? chart.length) - t.beat;
    for (const midi of t.harmony) notes.push({ beat: t.beat, dur: ring, midi, velocity: LEVEL.harmony, isMelody: false });
  }
  return notes;
}

function chordNotes(song: Song, chart: SongChart): TimedNote[] {
  const notes: TimedNote[] = [];
  for (const seg of chart.segments) {
    const tones = chordTones(seg.chord);
    const root = tones[0] ?? 0;
    const bass = BASS_FROM + ((root - BASS_FROM) % OCTAVE + OCTAVE) % OCTAVE;
    const upper = tones.map((pc) => CHORD_FROM + ((pc - CHORD_FROM) % OCTAVE + OCTAVE) % OCTAVE);
    const end = seg.beat + seg.dur;
    for (let bar = seg.beat; bar < end - 1e-6; bar += song.beatsPerBar) {
      notes.push({ beat: bar, dur: Math.min(song.beatsPerBar, end - bar), midi: bass, velocity: LEVEL.bass, isMelody: false });
    }
    for (let beat = seg.beat; beat < end - 1e-6; beat += 1) {
      // The top voice of the chord carries the line a wind plays from a chord chart.
      upper.forEach((midi, i) => notes.push({ beat, dur: Math.min(1, end - beat) * CHORD_HOLD, midi, velocity: LEVEL.chord, isMelody: i === upper.length - 1 }));
    }
  }
  return notes;
}

/** The pitch classes of a chord symbol, root first: "Am" → A, C, E; "G7" → G, B, D, F. */
export function chordTones(symbol: string): number[] {
  const root = chordRoot(symbol);
  const q = symbol.replace(/^[A-G][#b]?/, '').split('/')[0] ?? '';
  const isMinor = /^m(?!aj)/.test(q);
  const third = q.startsWith('sus4') ? 5 : q.startsWith('sus2') ? 2 : q.startsWith('dim') ? 3 : isMinor ? 3 : 4;
  const fifth = q.startsWith('dim') ? 6 : q.startsWith('aug') ? 8 : 7;
  const seventh = q.includes('maj7') ? 11 : q.includes('7') ? 10 : null;
  const tones = [0, third, fifth, ...(seventh === null ? [] : [seventh])];
  return tones.map((i) => (root + i) % OCTAVE);
}
