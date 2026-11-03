import { describe, expect, it } from 'vitest';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { LessonSession } from '@domain/lessons/session/lesson-session';

const song = SONGS.find((s) => s.id === 'c-em-am')!;
const noop = () => {};

function session(shouldWait: boolean): LessonSession {
  const chart = parseSong(song, true);
  if (!chart.isOk) throw new Error('chart');
  const s = new LessonSession(song, chart.value, { tempo: 1, shouldWait, isEasy: true, hasDrums: false, latency: 0, hasGuide: false });
  s.start(0);
  return s;
}

describe('LessonSession — play along', () => {
  it('scores an on-time hit perfect, a wrong chord wrong, and skipped targets missed', () => {
    const s = session(false);
    const [first, second] = s.chart.targets;
    const t0 = s.timeOfBeat(first!.beat);
    s.update(t0 - 0.01, noop);
    expect(s.input(t0, { chord: 'Em' })).toBe('perfect');
    const t1 = s.timeOfBeat(second!.beat);
    s.update(t1 - 0.01, noop);
    expect(s.input(t1 + 0.1, { chord: 'G' })).toBe('wrong');
    for (let t = t1; t < s.timeOfBeat(s.chart.length) + 1; t += 0.05) s.update(t, noop);
    expect(s.isDone).toBe(true);
    expect(s.counts.perfect).toBe(1);
    expect(s.counts.miss).toBe(s.chart.targets.length - 1);
  });

  it('ignores strums nowhere near a target', () => {
    const s = session(false);
    expect(s.input(s.timeOfBeat(s.chart.targets[0]!.beat) - 1, { chord: 'Em' })).toBeNull();
  });
});

describe('LessonSession — wait mode', () => {
  it('freezes on a target until the right chord, then continues from that beat', () => {
    const s = session(true);
    const beats: number[] = [];
    const t0 = s.timeOfBeat(s.chart.targets[0]!.beat);
    s.update(t0 + 2, (b) => beats.push(b));
    expect(s.isWaiting).toBe(true);
    expect(s.beatAt(t0 + 5)).toBe(0);
    expect(Math.max(...beats)).toBeLessThanOrEqual(0);
    expect(s.input(t0 + 5, { chord: 'Am' })).toBe('wrong');
    expect(s.input(t0 + 6, { chord: 'Em' })).toBe('good');
    expect(s.isWaiting).toBe(false);
    expect(s.beatAt(t0 + 6 + 60 / song.bpm)).toBeCloseTo(1);
  });
});

describe('LessonSession — free-mode chords and edges', () => {
  it('accepts a recognized chord by root and quality, whatever the voicing', () => {
    const s = session(false);
    const t0 = s.timeOfBeat(s.chart.targets[0]!.beat);
    s.update(t0 - 0.01, noop);
    expect(s.input(t0, { chord: 'Em/B', recognized: { root: 4, quality: 'm' } })).toBe('perfect');
  });

  it('rejects a recognized chord with the right root but the wrong quality', () => {
    const s = session(false);
    const t0 = s.timeOfBeat(s.chart.targets[0]!.beat);
    s.update(t0 - 0.01, noop);
    expect(s.input(t0, { chord: 'E', recognized: { root: 4, quality: '' } })).toBe('wrong');
  });

  it('ignores input before it starts, and reports zero accuracy and progress at the start', () => {
    const chart = parseSong(song, true);
    if (!chart.isOk) throw new Error('chart');
    const s = new LessonSession(song, chart.value, { tempo: 1, shouldWait: false, isEasy: true, hasDrums: false, latency: 0, hasGuide: false });
    expect(s.input(0, { chord: 'Em' })).toBeNull();
    expect(s.accuracy()).toBe(0);
    s.start(0);
    expect(s.progress(0)).toBe(0);
    expect(s.hasStarted).toBe(true);
  });
});
