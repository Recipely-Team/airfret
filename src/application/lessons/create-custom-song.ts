import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { CustomSongInput } from '@application/lessons/custom-song-input';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { knownChord } from '@domain/music/chords/chord-voicing';

const BPM = { min: 40, max: 220 } as const;
const MAX_TITLE = 60;
/** Custom songs get an id that can never collide with the built-in catalogue. */
const ID_PREFIX = 'my-';

/**
 * Turns typed-in chords into a playable song, or explains what is wrong.
 *
 * @remarks
 * - "G D Em C" (bare chords) last one bar each; "G:2" lasts 2 beats.
 * - Every chord must have a guitar shape; the chart must parse.
 */
export function createCustomSong(input: CustomSongInput, takenIds: readonly string[]): Result<Song, Failure> {
  const title = input.title.trim().slice(0, MAX_TITLE);
  if (!title) return fail(new Failure(FailureCode.invalidChart, 'custom.error.title'));
  if (!(input.bpm >= BPM.min && input.bpm <= BPM.max)) return fail(new Failure(FailureCode.invalidChart, 'custom.error.bpm'));
  const tokens = input.chords.trim().split(/[\s,|]+/).filter(Boolean);
  if (!tokens.length) return fail(new Failure(FailureCode.invalidChart, 'custom.error.empty'));
  const normalized = tokens.map((tok) => (tok.includes(':') ? tok : `${tok}:${input.beatsPerBar}`));
  const unknown = normalized.map((tok) => tok.split(':')[0] ?? '').find((c) => !knownChord(c));
  if (unknown !== undefined) return fail(new Failure(FailureCode.invalidChart, `custom.error.chord:${unknown}`));
  let id = `${ID_PREFIX}${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'song'}`;
  for (let n = 2; takenIds.includes(id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`;
  const song: Song = {
    id, title, credit: 'credit.mine', level: 1, bpm: Math.round(input.bpm), beatsPerBar: input.beatsPerBar,
    mode: PlayMode.chord, instrument: 'acoustic', chords: normalized.join(' '), pattern: input.pattern, subdiv: 2, about: 'about.mine',
  };
  const chart = parseSong(song, false);
  return chart.isOk ? ok(song) : fail(chart.failure);
}
