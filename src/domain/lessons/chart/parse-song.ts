import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { Segment } from '@domain/lessons/chart/segment';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import type { Target } from '@domain/lessons/chart/target';
import { noteToMidi } from '@domain/music/pitch';

const REST = 'r';
/** Joins the notes of one onset: "E4+B3". */
const CHORD_JOIN = '+';
const FRACTION = '/';
const DEFAULT_SUBDIV = 2;
const EPSILON = 1e-6;

/**
 * Expands a song's text notation into a chart.
 *
 * @remarks
 * - `isEasy` keeps one downstroke per chord change and per bar line instead of the full pattern.
 */
export function parseSong(song: Song, isEasy: boolean): Result<SongChart, Failure> {
  const tokens = (song.mode === PlayMode.chord ? song.chords : song.notes)?.trim().split(/\s+/) ?? [];
  const parsed = tokens.map((tok) => tok.split(':')).map(([name, len]) => ({ name: name ?? '', dur: parseLength(len ?? '') }));
  if (!parsed.length || parsed.some((p) => !p.name || !(p.dur > 0))) {
    return fail(new Failure(FailureCode.invalidChart, `${song.id}: bad token`));
  }
  return song.mode === PlayMode.chord ? ok(chordChart(song, parsed, isEasy)) : noteChart(song, parsed);
}

function chordChart(song: Song, parsed: { name: string; dur: number }[], isEasy: boolean): SongChart {
  const sub = song.subdiv ?? DEFAULT_SUBDIV;
  const pattern = song.pattern ?? 'D.'.repeat(song.beatsPerBar);
  const segments: Segment[] = [];
  const targets: Target[] = [];
  let beat = 0;
  for (const { name: chord, dur } of parsed) {
    segments.push({ beat, dur, chord });
    const add = (at: number, len: number, strum: StrumMark) => targets.push({ index: targets.length, beat: at, dur: len, chord, strum });
    if (isEasy) {
      for (let b = beat; b < beat + dur - EPSILON; b += song.beatsPerBar) add(b, Math.min(song.beatsPerBar, beat + dur - b), StrumMark.down);
    } else {
      for (let k = 0; k < Math.round(dur * sub); k++) {
        const at = beat + k / sub;
        const mark = pattern[Math.round((at % song.beatsPerBar) * sub) % pattern.length];
        if (mark === StrumMark.down || mark === StrumMark.up) add(at, 1 / sub, mark);
      }
    }
    beat += dur;
  }
  return { segments, targets, length: beat };
}

function noteChart(song: Song, parsed: { name: string; dur: number }[]): Result<SongChart, Failure> {
  const targets: Target[] = [];
  let beat = 0;
  for (const { name, dur } of parsed) {
    if (name !== REST) {
      const pitches = name.split(CHORD_JOIN).map(noteToMidi);
      const [midi, ...harmony] = pitches;
      if (midi === undefined || pitches.some((p) => p === null)) return fail(new Failure(FailureCode.invalidChart, `${song.id}: bad note ${name}`));
      const rest = harmony as number[];
      targets.push(rest.length ? { index: targets.length, beat, midi: midi as number, dur, harmony: rest } : { index: targets.length, beat, midi: midi as number, dur });
    }
    beat += dur;
  }
  return ok({ segments: [], targets, length: beat });
}

/** "2", "0.5" or a fraction such as "1/3" (triplets stay exact); NaN when malformed. */
function parseLength(text: string): number {
  if (!text.includes(FRACTION)) return Number(text);
  const [num, den] = text.split(FRACTION).map(Number);
  return num !== undefined && den !== undefined && den > 0 ? num / den : NaN;
}
