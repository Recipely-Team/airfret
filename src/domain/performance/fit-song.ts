import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { midiToName, noteToMidi } from '@domain/music/pitch';

const OCTAVE = 12;
const MAX_SHIFT_OCTAVES = 3;
const REST = 'r';

/**
 * A melody song moved by whole octaves into an instrument's range (as written when it fits): the tune folded in
 * where it still sticks out, the bass and inner voices the instrument can't reach left out. A chord song is unchanged.
 */
export function fitSong(song: Song, low: number, high: number): Song {
  if (song.mode !== PlayMode.note || !song.notes) return song;
  const tokens = song.notes.trim().split(/\s+/).map((tok) => {
    const [name = '', len = ''] = tok.split(':');
    return { pitches: name === REST ? [] : name.split('+').map((p) => noteToMidi(p)), len };
  });
  if (tokens.some((t) => t.pitches.some((p) => p === null))) return song;
  const melody = tokens.flatMap((t) => (t.pitches[0] === undefined || t.pitches[0] === null ? [] : [t.pitches[0]]));
  if (!melody.length) return song;
  const mid = (Math.min(...melody) + Math.max(...melody)) / 2;
  const centre = (low + high) / 2;
  let shift = 0;
  let bestScore = -Infinity;
  for (let k = -MAX_SHIFT_OCTAVES; k <= MAX_SHIFT_OCTAVES; k++) {
    const inside = melody.filter((m) => m + k * OCTAVE >= low && m + k * OCTAVE <= high).length;
    const score = inside * 1000 - Math.abs(k) * 100 - Math.abs(mid + k * OCTAVE - centre);
    if (score > bestScore) {
      bestScore = score;
      shift = k * OCTAVE;
    }
  }
  if (shift === 0 && melody.every((m) => m >= low && m <= high) && tokens.every((t) => t.pitches.every((p) => p !== null && p >= low && p <= high))) return song;
  const notes = tokens
    .map(({ pitches, len }) => {
      const [tune, ...rest] = pitches as number[];
      if (tune === undefined) return `${REST}:${len}`;
      const kept = [fold(tune + shift, low, high), ...rest.map((p) => p + shift).filter((p) => p >= low && p <= high)];
      return `${[...new Set(kept)].map(midiToName).join('+')}:${len}`;
    })
    .join(' ');
  return { ...song, notes };
}

function fold(midi: number, low: number, high: number): number {
  let m = midi;
  while (m < low) m += OCTAVE;
  while (m > high) m -= OCTAVE;
  return m;
}
