import { BandRole } from '@domain/band/band-role';
import type { BandSeat } from '@domain/band/band-seat';
import type { ChordSpan } from '@domain/band/chord-span';
import { chordTimeline } from '@domain/band/chord-timeline';
import { CompPattern } from '@domain/band/comp-pattern';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import { midiToName } from '@domain/music/pitch';

const OCTAVE = 12;
const FIFTH = 7;
/**
 * Chords are voiced close, from here up — above the muddy low interval limits, under the tune; each pattern in its own
 * register, so two chord instruments don't sound the same notes.
 */
const VOICED_FROM: Readonly<Record<CompPattern, number>> = { afterbeat: 55, arpeggio: 64, held: 60 };
/** An afterbeat is a short stab; an arpeggio runs in eighths, up and back. */
const STAB = 0.5;
const STEP = 0.5;
const ARPEGGIO = [0, 1, 2, 1] as const;
/** Beats are written with this many decimals (triplets stay within a millionth of a beat). */
const PLACES = 6;
const EPS = 1e-6;

interface Event {
  readonly beat: number;
  readonly dur: number;
  /** Highest first. */
  readonly midis: readonly number[];
}

/**
 * A seat's part of `song`, written as a song of its own, so it plays and shows as any song does:
 * - **melody** the tune (without the written bass when someone plays the bass); **double** the tune alone;
 * - **bass** each chord's bass on the strong beats, root then fifth (the march's "oom");
 * - **harmony** the chords — on the afterbeats ("pah"; on every beat with no bass under them), as a running arpeggio,
 *   or held — voiced close in the middle register;
 * - **counter** one held chord tone a chord, each moving to the nearest of its tones in the next;
 * - **rhythm** the song itself (a drum reads its meter and tempo).
 * A tune with no chords to read gives every part the tune.
 */
export function writePart(song: Song, chart: SongChart, seat: BandSeat, hasBass: boolean): Song {
  if (seat.role === BandRole.rhythm) return song;
  const chords = chordTimeline(song, chart);
  const tune = () => written(song, chart.targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi] }])));
  if (seat.role === BandRole.melody) return hasBass && song.mode === PlayMode.note && chords.length ? tune() : song;
  if (seat.role === BandRole.double || !chords.length) return song.mode === PlayMode.note ? tune() : song;
  const events = seat.role === BandRole.bass ? bassLine(song, chords)
    : seat.role === BandRole.counter ? counterLine(chords, seat)
      : comping(song, chords, seat.pattern ?? CompPattern.held, hasBass);
  return written(song, events);
}

function bassLine(song: Song, chords: readonly ChordSpan[]): Event[] {
  const pulse = song.beatsPerBar % 2 === 0 ? song.beatsPerBar / 2 : song.beatsPerBar;
  return chords.flatMap((c) => {
    const out: Event[] = [];
    for (let beat = c.beat, k = 0; beat < c.end - EPS; beat = nextOn(beat, pulse), k++) out.push({ beat, dur: Math.min(nextOn(beat, pulse), c.end) - beat, midis: [k % 2 === 0 ? c.bass : c.bass + FIFTH] });
    return out;
  });
}

function comping(song: Song, chords: readonly ChordSpan[], pattern: CompPattern, hasBass: boolean): Event[] {
  return chords.flatMap((c) => {
    const voiced = voice(c.tones, VOICED_FROM[pattern]);
    if (pattern === CompPattern.held) return [{ beat: c.beat, dur: c.end - c.beat, midis: [...voiced].reverse() }];
    const out: Event[] = [];
    if (pattern === CompPattern.arpeggio) {
      for (let beat = c.beat, k = 0; beat < c.end - EPS; beat += STEP, k++) out.push({ beat, dur: Math.min(STEP, c.end - beat), midis: [voiced[ARPEGGIO[k % ARPEGGIO.length] ?? 0] ?? voiced[0] ?? 0] });
      return out;
    }
    // Afterbeats: the weak beats of the bar (in two, the "ands"), answering the bass; with no bass, every beat.
    const step = song.beatsPerBar === 2 && hasBass ? STEP : 1;
    for (let beat = Math.ceil(c.beat / step - EPS) * step; beat < c.end - EPS; beat += step) {
      if (hasBass && isStrong(beat, song.beatsPerBar)) continue;
      out.push({ beat, dur: Math.min(STAB, c.end - beat), midis: [...voiced].reverse() });
    }
    return out;
  });
}

function counterLine(chords: readonly ChordSpan[], seat: BandSeat): Event[] {
  let last = seat.centre;
  return chords.map((c) => {
    const pc = c.tones[((seat.voice ?? 0) + 1) % c.tones.length] ?? c.tones[0] ?? 0;
    // The chord tone's octave nearest the line's last note: a held line moves by step, never leaps.
    const near = last + ((((pc - last) % OCTAVE) + OCTAVE + OCTAVE / 2) % OCTAVE) - OCTAVE / 2;
    last = near;
    return { beat: c.beat, dur: c.end - c.beat, midis: [near] };
  });
}

/** The strong beats: the bar's first, and its middle in an even meter. */
function isStrong(beat: number, beatsPerBar: number): boolean {
  const pos = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
  return pos < EPS || (beatsPerBar % 2 === 0 && beatsPerBar > 2 && Math.abs(pos - beatsPerBar / 2) < EPS);
}

/** The next beat on the pulse after `beat` (a chord that starts off it moves to it next). */
function nextOn(beat: number, pulse: number): number {
  return (Math.floor(beat / pulse + EPS) + 1) * pulse;
}

/** Pitch classes voiced close upward from `from`, root first. */
function voice(tones: readonly number[], from: number): number[] {
  return tones.map((pc) => from + ((((pc - from) % OCTAVE) + OCTAVE) % OCTAVE)).sort((a, b) => a - b);
}

/** Events written as a melody song (rests between them), keeping the song's tempo, meter and everything else. */
function written(song: Song, events: readonly Event[]): Song {
  const tokens: string[] = [];
  let at = 0;
  for (const e of [...events].sort((a, b) => a.beat - b.beat)) {
    if (e.beat > at + EPS) tokens.push(`r:${len(e.beat - at)}`);
    tokens.push(`${e.midis.map(midiToName).join('+')}:${len(e.dur)}`);
    at = e.beat + e.dur;
  }
  const part: Song = { ...song, mode: PlayMode.note, notes: tokens.join(' ') };
  delete (part as { chords?: string }).chords;
  return part;
}

function len(beats: number): string {
  return String(Number(beats.toFixed(PLACES)));
}
