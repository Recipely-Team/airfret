import type { PartEvent } from '@domain/band/parts/part-event';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { midiToName } from '@domain/music/pitch';

/** Beats are written as exact fractions when they are (triplets as thirds), else with this many decimals. */
const PLACES = 6;
const DENOMINATORS = [1, 2, 4, 8, 16, 3, 6, 12, 24] as const;
const EPS = 1e-6;

/**
 * A part written as a melody song of its own (rests between its events), keeping the song's tempo, meter and the
 * rest — so it plays and shows on any instrument as a song does. An event that would start inside the one before is
 * left out (one voice at a time).
 */
export function writtenSong(song: Song, events: readonly PartEvent[], length = 0): Song {
  const tokens: string[] = [];
  let at = 0;
  for (const e of [...events].sort((a, b) => a.beat - b.beat)) {
    if (e.beat < at - EPS || e.dur < EPS || !e.midis.length) continue;
    if (e.beat > at + EPS) tokens.push(`r:${len(e.beat - at)}`);
    tokens.push(`${[...e.midis].sort((a, b) => b - a).map(midiToName).join('+')}:${len(e.dur)}`);
    at = e.beat + e.dur;
  }
  // Silent to the song's end, so a part that plays little (or nothing) still lasts the song.
  if (length > at + EPS) tokens.push(`r:${len(length - at)}`);
  const part: Song = { ...song, mode: PlayMode.note, notes: tokens.join(' ') };
  delete (part as { chords?: string }).chords;
  return part;
}

function len(beats: number): string {
  for (const d of DENOMINATORS) {
    const n = Math.round(beats * d);
    if (Math.abs(beats * d - n) < EPS * d) return d === 1 ? String(n) : `${n}/${d}`;
  }
  return String(Number(beats.toFixed(PLACES)));
}
