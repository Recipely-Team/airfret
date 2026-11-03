// Lesson runtime: song clock, metronome/drum scheduling and judging.

import { noteToMidi } from '../music/theory';
import type { Song } from './songs';

export interface Segment {
  beat: number;
  dur: number;
  chord: string;
}

export interface Target {
  beat: number;
  /** Chord name (chord mode). */
  chord?: string;
  /** MIDI pitch (note mode). */
  midi?: number;
  dur: number;
  strum?: 'D' | 'U';
  result?: 'perfect' | 'good' | 'miss';
}

export type Grade = 'perfect' | 'good' | 'miss' | 'wrong';

export interface LessonOptions {
  tempo: number; // 0.5–1
  wait: boolean;
  easy: boolean;
  drums: boolean;
  /** Seconds to subtract from input times (camera + processing delay). */
  latency: number;
}

export interface Judgement {
  grade: Grade;
  target?: Target;
  at: number; // performance time, for UI animation
}

const PERFECT = 0.085;
const GOOD = 0.17;

export function parseSong(song: Song, easy: boolean): { segments: Segment[]; targets: Target[]; length: number } {
  const segments: Segment[] = [];
  const targets: Target[] = [];
  let beat = 0;
  if (song.mode === 'chord') {
    const sub = song.subdiv ?? 2;
    const pattern = song.pattern ?? 'D.'.repeat(song.beatsPerBar);
    for (const tok of song.chords!.trim().split(/\s+/)) {
      const [chord, len] = tok.split(':');
      const dur = Number(len);
      segments.push({ beat, dur, chord });
      if (easy) {
        // One strum on each chord change, and on every bar line inside long chords.
        for (let b = beat; b < beat + dur - 1e-6; b += song.beatsPerBar) {
          targets.push({ beat: b, chord, dur: Math.min(song.beatsPerBar, beat + dur - b), strum: 'D' });
        }
      } else {
        const slots = Math.round(dur * sub);
        for (let k = 0; k < slots; k++) {
          const at = beat + k / sub;
          const inBar = Math.round((at % song.beatsPerBar) * sub) % pattern.length;
          const ch = pattern[inBar];
          if (ch === 'D' || ch === 'U') targets.push({ beat: at, chord, dur: 1 / sub, strum: ch });
        }
      }
      beat += dur;
    }
  } else {
    for (const tok of song.notes!.trim().split(/\s+/)) {
      const [name, len] = tok.split(':');
      const dur = Number(len);
      if (name !== 'r') targets.push({ beat, midi: noteToMidi(name), dur });
      beat += dur;
    }
  }
  return { segments, targets, length: beat };
}

export class Lesson {
  readonly song: Song;
  readonly opts: LessonOptions;
  readonly segments: Segment[];
  readonly targets: Target[];
  readonly length: number;
  readonly bps: number;
  /** Unique chords in order of first appearance — they become the neck slots. */
  readonly chordSet: string[];

  private anchorTime = 0; // audio time at anchorBeat
  private anchorBeat = 0;
  private paused = false;
  private scheduledTo = 0;
  private next = 0; // index of first unjudged target
  done = false;
  started = false;
  streak = 0;
  bestStreak = 0;
  counts = { perfect: 0, good: 0, miss: 0 };
  judgements: Judgement[] = [];

  constructor(song: Song, opts: LessonOptions) {
    this.song = song;
    this.opts = opts;
    const parsed = parseSong(song, opts.easy);
    this.segments = parsed.segments;
    this.targets = parsed.targets;
    this.length = parsed.length;
    this.bps = (song.bpm * opts.tempo) / 60;
    this.chordSet = [...new Set(parsed.segments.map((s) => s.chord))];
  }

  /** Start with a one-bar count-in. */
  start(audioNow: number): void {
    this.anchorBeat = -this.song.beatsPerBar;
    this.anchorTime = audioNow + 0.15;
    this.scheduledTo = this.anchorBeat - 0.5;
    this.started = true;
  }

  beatAt(audioTime: number): number {
    if (this.paused) return this.anchorBeat;
    return this.anchorBeat + (audioTime - this.anchorTime) * this.bps;
  }

  timeOfBeat(beat: number): number {
    return this.anchorTime + (beat - this.anchorBeat) / this.bps;
  }

  get isWaiting(): boolean {
    return this.paused;
  }

  get nextTarget(): Target | undefined {
    return this.targets[this.next];
  }

  progress(audioNow: number): number {
    return Math.min(1, Math.max(0, this.beatAt(audioNow) / this.length));
  }

  get accuracy(): number {
    const judged = this.counts.perfect + this.counts.good + this.counts.miss;
    if (!judged) return 0;
    return (this.counts.perfect + 0.6 * this.counts.good) / judged;
  }

  segmentAt(beat: number): Segment | undefined {
    for (let i = this.segments.length - 1; i >= 0; i--) {
      if (this.segments[i].beat <= beat + 1e-6) return this.segments[i];
    }
    return this.segments[0];
  }

  /**
   * Advance the clock. Schedules metronome/drums slightly ahead and marks
   * targets that slipped past as missed.
   */
  update(audioNow: number, sched: (beat: number, when: number) => void): void {
    if (!this.started || this.done) return;
    const beat = this.beatAt(audioNow);
    const tgt = this.targets[this.next];

    if (this.opts.wait && tgt && !this.paused && beat >= tgt.beat) {
      this.paused = true;
      this.anchorBeat = tgt.beat;
    }

    // Lookahead scheduling of clicks (whole beats) and hats (half beats).
    if (!this.paused) {
      const horizon = this.beatAt(audioNow + 0.12);
      const limit = this.opts.wait && tgt ? Math.min(horizon, tgt.beat) : horizon;
      for (let b = this.scheduledTo + 0.5; b <= limit + 1e-9; b += 0.5) {
        if (b >= beat - 0.05) sched(b, this.timeOfBeat(b));
        this.scheduledTo = b;
      }
    }

    if (!this.opts.wait) {
      const windowBeats = GOOD * this.bps;
      while (this.next < this.targets.length && this.targets[this.next].beat + windowBeats < beat) {
        this.judge(this.targets[this.next], 'miss');
      }
    }

    if (this.next >= this.targets.length && beat >= this.length) this.done = true;
  }

  /** A strum (chord mode) or a plucked note (note mode) happened. Returns the grade if it counted. */
  input(audioTime: number, value: { chord?: string; midi?: number }): Grade | null {
    if (!this.started || this.done) return null;
    const t = audioTime - this.opts.latency;
    const tgt = this.targets[this.next];
    if (!tgt) return null;

    const matches = (x: Target) =>
      x.chord !== undefined ? x.chord === value.chord : x.midi === value.midi;

    if (this.opts.wait) {
      // Waiting at a target, or arriving shortly before it.
      const early = this.timeOfBeat(tgt.beat) - t;
      if (this.paused || early <= GOOD * 1.5) {
        if (!matches(tgt)) return this.feedback('wrong');
        const grade: Grade = this.paused ? 'good' : early <= PERFECT ? 'perfect' : 'good';
        this.judge(tgt, grade);
        if (this.paused) {
          this.paused = false;
          this.anchorTime = audioTime;
          // anchorBeat stays at the target's beat: the song resumes from here.
        }
        return grade;
      }
      return null;
    }

    // Play-along: nearest unjudged target inside the window.
    let best: Target | null = null;
    let bestErr = Infinity;
    for (let i = this.next; i < this.targets.length; i++) {
      const x = this.targets[i];
      const err = Math.abs(this.timeOfBeat(x.beat) - t);
      if (err > GOOD && this.timeOfBeat(x.beat) > t) break;
      if (err <= GOOD && !x.result && err < bestErr) {
        best = x;
        bestErr = err;
      }
    }
    if (!best) return null;
    if (!matches(best)) return this.feedback('wrong');
    const grade: Grade = bestErr <= PERFECT ? 'perfect' : 'good';
    // Anything before the hit target that's still open was skipped.
    while (this.targets[this.next] !== best) this.judge(this.targets[this.next], 'miss');
    this.judge(best, grade);
    return grade;
  }

  private feedback(grade: Grade): Grade {
    this.judgements.push({ grade, at: performance.now() });
    if (grade === 'wrong') this.streak = 0;
    return grade;
  }

  private judge(x: Target, grade: 'perfect' | 'good' | 'miss'): void {
    x.result = grade;
    this.counts[grade]++;
    if (grade === 'miss') this.streak = 0;
    else this.bestStreak = Math.max(this.bestStreak, ++this.streak);
    this.judgements.push({ grade, target: x, at: performance.now() });
    this.next++;
  }
}
