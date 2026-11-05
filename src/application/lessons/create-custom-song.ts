import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { CustomSongInput } from '@application/lessons/custom-song-input';
import { readMelody } from '@application/lessons/read-melody';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { knownChord } from '@domain/music/chords/chord-voicing';

const BPM = { min: 40, max: 220 } as const;
const MAX_TITLE = 60;
/** Custom songs get an id that can never collide with the built-in catalogue. */
const ID_PREFIX = 'my-';

/**
 * Turns typed-in chords — or a melody — into a playable song, or explains what is wrong.
 *
 * @remarks
 * - A melody (`G4:1 A4:0.5 r:1`, or pasted JSON — see `readMelody`) becomes a note-mode song; pasted JSON
 *   brings its own tempo and meter.
 * - "G D Em C" (bare chords) last one bar each; "G:2" lasts 2 beats.
 * - Every chord must have a guitar shape; the chart must parse.
 */
export function createCustomSong(input: CustomSongInput, takenIds: readonly string[]): Result<Song, Failure> {
  const title = input.title.trim().slice(0, MAX_TITLE);
  if (!title) return fail(new Failure(FailureCode.invalidChart, 'custom.error.title'));
  const melody = readMelody(input.chords);
  if (melody && !melody.isOk) return melody;
  const bpm = melody?.value.bpm ?? input.bpm;
  if (!(bpm >= BPM.min && bpm <= BPM.max)) return fail(new Failure(FailureCode.invalidChart, 'custom.error.bpm'));
  const id = freeId(title, takenIds);
  if (melody) {
    const song: Song = {
      id, title, credit: 'credit.mine', level: 1, bpm: Math.round(bpm), beatsPerBar: melody.value.beatsPerBar ?? input.beatsPerBar,
      mode: PlayMode.note, instrument: 'acoustic', notes: melody.value.notes, about: 'about.mine',
    };
    const chart = parseSong(song, false);
    return chart.isOk ? ok(song) : fail(chart.failure);
  }
  const tokens = input.chords.trim().split(/[\s,|]+/).filter(Boolean);
  if (!tokens.length) return fail(new Failure(FailureCode.invalidChart, 'custom.error.empty'));
  const normalized = tokens.map((tok) => (tok.includes(':') ? tok : `${tok}:${input.beatsPerBar}`));
  const unknown = normalized.map((tok) => tok.split(':')[0] ?? '').find((c) => !knownChord(c));
  if (unknown !== undefined) return fail(new Failure(FailureCode.invalidChart, `custom.error.chord:${unknown}`));
  const song: Song = {
    id, title, credit: 'credit.mine', level: 1, bpm: Math.round(bpm), beatsPerBar: input.beatsPerBar,
    mode: PlayMode.chord, instrument: 'acoustic', chords: normalized.join(' '), pattern: input.pattern, subdiv: 2, about: 'about.mine',
  };
  const chart = parseSong(song, false);
  return chart.isOk ? ok(song) : fail(chart.failure);
}

/** An id from the title that can never collide with the catalogue or another of the player's songs. */
function freeId(title: string, takenIds: readonly string[]): string {
  let id = `${ID_PREFIX}${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'song'}`;
  for (let n = 2; takenIds.includes(id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`;
  return id;
}
