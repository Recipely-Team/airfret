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
  const parsed = tokens.map((tok) => tok.split(':')).map(([name, len]) => ({ name: name ?? '', dur: Number(len) }));
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
      const midi = noteToMidi(name);
      if (midi === null) return fail(new Failure(FailureCode.invalidChart, `${song.id}: bad note ${name}`));
      targets.push({ index: targets.length, beat, midi, dur });
    }
    beat += dur;
  }
  return ok({ segments: [], targets, length: beat });
}
