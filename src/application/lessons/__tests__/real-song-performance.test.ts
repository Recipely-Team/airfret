import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { performSong } from '@application/__fixtures__/perform-song';
import type { PluckRequest } from '@domain/audio/pluck-request';
import { SONGS } from '@domain/lessons/catalog/song-catalog';

/** A score as written by `tools/songs/midi-to-notes.mjs --reference`: [beat, midi] per note. */
interface Score {
  readonly bpm: number;
  readonly notes: readonly (readonly [number, number])[];
}

/**
 * The real pieces, each with the length of the real thing from first note to last: for the Prelude
 * Pablo Casals' 1938 recording (141.5 s, measured by `tests/songs`), for Claro de Luna its score's tempo.
 */
const PIECES = [
  { song: 'bach-prelude', score: 'bach-prelude', realSeconds: 141.5, instruments: ['acoustic', 'nylon', 'clean', 'drive', 'banjo'] },
  { song: 'bach-prelude-bass', score: 'bach-prelude-bass', realSeconds: 141.5, instruments: ['bass', 'bass5'] },
  { song: 'claro-de-luna', score: 'claro-de-luna', realSeconds: null, instruments: ['nylon', 'acoustic', 'clean', 'drive', 'banjo'] },
] as const;
/** A played note is the score's note when it has the same pitch and lands this close (s). */
const MATCH_WINDOW = 0.03;
/** Allowed drift of the whole performance against the real piece's length. */
const REAL_LENGTH_TOLERANCE = 0.02;
const SECONDS_PER_MINUTE = 60;

function loadScore(name: string): Score {
  return JSON.parse(readFileSync(new URL(`../../__fixtures__/scores/${name}.json`, import.meta.url), 'utf8')) as Score;
}

/** Pairs every score note with a played note of the same pitch, nearest in time; both on a first-note-at-0 clock. */
function compare(score: Score, plucks: readonly PluckRequest[], secondsPerBeat: number) {
  const wanted = [...new Map(score.notes.map(([b, m]) => [`${b}:${m}`, { t: (b - (score.notes[0]?.[0] ?? 0)) * secondsPerBeat, midi: m }])).values()];
  const t0 = Math.min(...plucks.map((p) => p.when));
  const free = plucks.map((p) => ({ t: p.when - t0, midi: p.midi, isUsed: false }));
  const errors: number[] = [];
  const missed: { t: number; midi: number }[] = [];
  for (const w of wanted) {
    let best: (typeof free)[number] | null = null;
    for (const p of free) if (!p.isUsed && p.midi === w.midi && Math.abs(p.t - w.t) <= MATCH_WINDOW && (!best || Math.abs(p.t - w.t) < Math.abs(best.t - w.t))) best = p;
    if (!best) missed.push(w);
    else {
      best.isUsed = true;
      errors.push(best.t - w.t);
    }
  }
  const pairs = wanted.filter((w) => !missed.includes(w)).map((w, i) => [w.t, w.t + (errors[i] ?? 0)] as const);
  return { wanted: wanted.length, missed, extra: free.filter((p) => !p.isUsed).length, worst: Math.max(...errors.map(Math.abs)), tempo: slope(pairs), length: Math.max(...free.map((p) => p.t)) };
}

/** Least-squares slope of played time against score time: 1 means exactly the score's tempo. */
function slope(pairs: readonly (readonly [number, number])[]): number {
  const mx = pairs.reduce((s, [x]) => s + x, 0) / pairs.length;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length;
  return pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / pairs.reduce((s, [x]) => s + (x - mx) ** 2, 0);
}

describe('Real songs — the guide plays each complete piece at full tempo, note for note as written', () => {
  for (const piece of PIECES) {
    for (const instrument of piece.instruments) {
      it(`${piece.song} on ${instrument}: every note of the score, on time, nothing extra, never slowed down`, () => {
        const song = SONGS.find((s) => s.id === piece.song)!;
        const score = loadScore(piece.score);
        const { plucks, instrument: inst } = performSong(piece.song, instrument);
        const { tuning, frets } = inst;
        const r = compare(score, plucks, SECONDS_PER_MINUTE / song.bpm);

        expect(r.missed.slice(0, 5), `${r.missed.length} of ${r.wanted} score notes not played`).toEqual([]);
        expect(r.extra, 'notes played that are not in the score').toBe(0);
        expect(r.worst, 'worst timing error, s').toBeLessThan(MATCH_WINDOW);
        expect(r.tempo).toBeCloseTo(1, 3);
        // Same speed as the real thing: the performance lasts as long as the recording (or the score).
        const real = piece.realSeconds ?? ((score.notes.at(-1)?.[0] ?? 0) - (score.notes[0]?.[0] ?? 0)) * (SECONDS_PER_MINUTE / score.bpm);
        expect(Math.abs(r.length / real - 1), `played ${r.length.toFixed(1)} s, real ${real.toFixed(1)} s`).toBeLessThan(REAL_LENGTH_TOLERANCE);
        // Every note is fingered on a real string of this instrument, within its frets.
        for (const p of plucks) {
          const fret = p.midi - (tuning[p.string] ?? Infinity);
          expect(fret >= 0 && fret <= frets, `${p.midi} on string ${p.string}`).toBe(true);
        }
      });
    }
  }

  it('the Prelude really is at Casals’ speed, not the slower practice tempo or the faster score marking', () => {
    const score = loadScore('bach-prelude');
    const song = SONGS.find((s) => s.id === 'bach-prelude')!;
    const beats = (score.notes.at(-1)?.[0] ?? 0) - (score.notes[0]?.[0] ?? 0);
    expect(beats * (SECONDS_PER_MINUTE / song.bpm)).toBeCloseTo(141.5, -0.5);
    expect(song.bpm).toBeLessThan(score.bpm);
  });
});
