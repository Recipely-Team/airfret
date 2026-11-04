import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { performSong } from '@application/__fixtures__/perform-song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { decode } from '../../tools/calibrate/decode.mjs';
import { audioChroma, FPS } from '../../tools/songs/chroma.mjs';
import { align } from '../../tools/songs/dtw.mjs';
import { onsets, onsetScore, pitchRecall, spectrogram, WINDOW } from '../../tools/songs/transcribe.mjs';
import { render } from './render-performance';

/**
 * The real recording the Prelude is held against: Pablo Casals, 1938 (Naxos Historical restoration),
 * public domain on Wikimedia Commons. Pinned by hash so the reference can never silently change.
 */
const CASALS = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Bach_-_Cello_Suite_no._1_in_G_major%2C_BWV_1007_-_I._Pr%C3%A9lude.ogg',
  sha256: '07a927151e6870bd5892f59aad0459a95096acac92fa282ffceb65dd39eb4908',
  path: 'tools/songs/.cache/casals-bwv1007-prelude.ogg',
} as const;
const CASES = [
  { song: 'bach-prelude', score: 'bach-prelude', instruments: ['acoustic', 'nylon', 'clean', 'drive'] },
  { song: 'bach-prelude-bass', score: 'bach-prelude-bass', instruments: ['bass'] },
  { song: 'claro-de-luna', score: 'claro-de-luna', instruments: ['nylon', 'acoustic', 'clean'] },
] as const;
/**
 * What the rendered audio must show, measured against the written score. Pitch recall can't reach 1:
 * a note struck again while the same pitch still rings (the repeated A3 of Claro de Luna's triplets on a
 * long-sustaining electric) differs from what was there only by its attack.
 */
const MIN = { onsetF: 0.9, pitchRecall: 0.8 } as const;
/** The same check run on the score shifted a semitone must fail: proof it hears pitch, not just activity. */
const MAX_WRONG_PITCH_RECALL = 0.2;
/** Against the real recording: same piece (similarity clearly above a different piece), same speed. */
const RECORDING = { tempoTolerance: 0.05, similarityMargin: 0.1 } as const;
const SECONDS_PER_MINUTE = 60;

interface Score {
  readonly notes: readonly (readonly [number, number])[];
}

const scoreOf = (name: string): Score => JSON.parse(readFileSync(`src/application/__fixtures__/scores/${name}.json`, 'utf8')) as Score;

async function casals(): Promise<Float32Array> {
  if (!existsSync(CASALS.path)) {
    mkdirSync('tools/songs/.cache', { recursive: true });
    const res = await fetch(CASALS.url, { headers: { 'User-Agent': 'airfret-song-tests/1.0' } });
    writeFileSync(CASALS.path, Buffer.from(await res.arrayBuffer()));
  }
  const hash = createHash('sha256').update(readFileSync(CASALS.path)).digest('hex');
  if (hash !== CASALS.sha256) throw new Error(`Casals reference changed (sha256 ${hash})`);
  return decode(CASALS.path) as Float32Array;
}

/** Renders a performance and returns it with the score on the same clock (first note = first pluck). */
function renderSong(songId: string, scoreName: string, instrumentId: string, tempo = 1) {
  const song = SONGS.find((s) => s.id === songId)!;
  const { plucks, instrument } = performSong(songId, instrumentId, tempo);
  const out = render(plucks, instrument);
  const t0 = Math.min(...plucks.map((p) => p.when));
  const spb = SECONDS_PER_MINUTE / (song.bpm * tempo);
  const raw = scoreOf(scoreName).notes;
  const first = raw[0]?.[0] ?? 0;
  const notes = [...new Map(raw.map(([b, m]) => [`${b}:${m}`, [t0 + (b - first) * spb, m] as const])).values()];
  return { ...out, notes, firstNote: t0, lastNote: Math.max(...plucks.map((p) => p.when)) };
}

/** Seconds of `b` that the alignment maps second `t` of `a` to. */
function mapped(path: readonly (readonly [number, number])[], t: number): number {
  const f = Math.round(t * FPS);
  return ((path.find(([p]) => p >= f) ?? path.at(-1))?.[1] ?? 0) / FPS;
}

describe('Real songs, rendered with the real samples, against the score and the real recording', () => {
  for (const c of CASES) {
    for (const instrument of c.instruments) {
      it(`${c.song} on ${instrument}: every written note can be heard, on time`, () => {
        const r = renderSong(c.song, c.score, instrument);
        const spec = spectrogram(r.audio, WINDOW.pitch);
        const written = [...new Set(r.notes.map(([t]) => Math.round(t * 1000) / 1000))].sort((a, b) => a - b);
        const onset = onsetScore(written, onsets(spectrogram(r.audio, WINDOW.onsets)));
        const pitch = pitchRecall(spec, r.notes);
        const wrong = pitchRecall(spec, r.notes.map(([t, m]) => [t, m + 1] as const));
        console.info(`${c.song}/${instrument}: ${r.recorded} recorded + ${r.synthesised} synth notes · onset F ${onset.f.toFixed(3)} (P ${onset.precision.toFixed(3)} R ${onset.recall.toFixed(3)}) · pitch recall ${pitch.toFixed(3)} (a semitone off: ${wrong.toFixed(3)})`);
        expect(onset.f).toBeGreaterThan(MIN.onsetF);
        expect(pitch).toBeGreaterThan(MIN.pitchRecall);
        expect(wrong).toBeLessThan(MAX_WRONG_PITCH_RECALL);
      });
    }
  }

  it('the Prelude lines up with Casals’ recording — the same music, at the same speed', async () => {
    const recording = audioChroma(await casals());
    const ours = renderSong('bach-prelude', 'bach-prelude', 'acoustic');
    const other = renderSong('claro-de-luna', 'claro-de-luna', 'nylon');
    const slowed = renderSong('bach-prelude', 'bach-prelude', 'acoustic', 0.75);
    const same = align(audioChroma(ours.audio), recording);
    const different = align(audioChroma(other.audio), recording);
    const speed = (r: typeof ours, path: typeof same.path) => (mapped(path, r.lastNote) - mapped(path, r.firstNote)) / (r.lastNote - r.firstNote);
    const ratio = speed(ours, same.path);
    const slowRatio = speed(slowed, align(audioChroma(slowed.audio), recording).path);
    console.info(`Prelude vs Casals: similarity ${same.similarity.toFixed(3)} (other piece ${different.similarity.toFixed(3)}), Casals takes ${ratio.toFixed(3)}× our time (slowed control ${slowRatio.toFixed(3)}×)`);
    expect(same.similarity - different.similarity).toBeGreaterThan(RECORDING.similarityMargin);
    expect(Math.abs(ratio - 1)).toBeLessThan(RECORDING.tempoTolerance);
    // The check would catch a slowed-down practice version.
    expect(Math.abs(slowRatio - 1)).toBeGreaterThan(RECORDING.tempoTolerance);
  });
});
