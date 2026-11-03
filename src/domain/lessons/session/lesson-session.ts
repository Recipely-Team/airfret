import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import type { Target } from '@domain/lessons/chart/target';
import { Grade } from '@domain/lessons/session/grade';
import type { Judgement } from '@domain/lessons/session/judgement';
import { LessonClock } from '@domain/lessons/session/lesson-clock';
import type { LessonOptions } from '@domain/lessons/session/lesson-options';
import type { PlayedInput } from '@domain/lessons/session/played-input';
import { TimingWindow } from '@domain/lessons/session/timing-window';

const SECONDS_PER_MINUTE = 60;
const GOOD_WEIGHT = 0.6;
const HALF_BEAT = 0.5;
const LOOKAHEAD = 0.12;
const LATE_TOLERANCE_BEATS = 0.05;

type Scored = typeof Grade.perfect | typeof Grade.good | typeof Grade.miss;

/**
 * **LessonSession** — one run through a song: clock, beat scheduling and judging.
 *
 * @remarks
 * - Begins with a one-bar count-in (negative beats).
 * - Wait mode freezes the clock on each target until it is played right.
 * - Play-along mode grades each input against the nearest open target and marks skipped ones missed.
 */
export class LessonSession {
  readonly bps: number;
  /** Chords in order of first appearance — they become the neck's chord boxes. */
  readonly chordSet: readonly string[];
  private readonly clock: LessonClock;
  private readonly results: (Scored | undefined)[];
  private next = 0;
  private scheduledTo = 0;
  private started = false;
  private done = false;
  private streakNow = 0;
  private streakBest = 0;
  private readonly tally = { perfect: 0, good: 0, miss: 0 };
  private readonly log: Judgement[] = [];

  constructor(
    readonly song: Song,
    readonly chart: SongChart,
    readonly opts: LessonOptions,
  ) {
    this.bps = (song.bpm * opts.tempo) / SECONDS_PER_MINUTE;
    this.clock = new LessonClock(this.bps);
    this.results = chart.targets.map(() => undefined);
    this.chordSet = [...new Set(chart.segments.map((s) => s.chord))];
  }

  get hasStarted(): boolean { return this.started; }
  get isDone(): boolean { return this.done; }
  get isWaiting(): boolean { return this.clock.isPaused; }
  get streak(): number { return this.streakNow; }
  get bestStreak(): number { return this.streakBest; }
  get counts(): Readonly<{ perfect: number; good: number; miss: number }> { return this.tally; }
  get judgements(): readonly Judgement[] { return this.log; }
  get nextTarget(): Target | undefined { return this.chart.targets[this.next]; }

  resultOf(target: Target): Scored | undefined {
    return this.results[target.index];
  }

  accuracy(): number {
    const judged = this.tally.perfect + this.tally.good + this.tally.miss;
    return judged ? (this.tally.perfect + GOOD_WEIGHT * this.tally.good) / judged : 0;
  }

  beatAt(audioTime: number): number { return this.clock.beatAt(audioTime); }
  timeOfBeat(beat: number): number { return this.clock.timeOfBeat(beat); }

  progress(audioNow: number): number {
    return Math.min(1, Math.max(0, this.beatAt(audioNow) / this.chart.length));
  }

  start(audioNow: number): void {
    this.clock.start(audioNow, -this.song.beatsPerBar);
    this.scheduledTo = -this.song.beatsPerBar - HALF_BEAT;
    this.started = true;
  }

  /** Advances: freezes in wait mode, schedules half-beats slightly ahead, marks late targets missed. */
  update(audioNow: number, schedule: (beat: number, when: number) => void): void {
    if (!this.started || this.done) return;
    const beat = this.beatAt(audioNow);
    const tgt = this.nextTarget;
    if (this.opts.shouldWait && tgt && !this.isWaiting && beat >= tgt.beat) this.clock.pauseAt(tgt.beat);
    if (!this.isWaiting) this.scheduleAhead(audioNow, beat, tgt, schedule);
    if (!this.opts.shouldWait) this.missLate(beat);
    if (this.next >= this.chart.targets.length && beat >= this.chart.length) this.done = true;
  }

  /** Grades a strum or note played at `audioTime`; null when it wasn't near any target. */
  input(audioTime: number, played: PlayedInput): Grade | null {
    const tgt = this.nextTarget;
    if (!this.started || this.done || !tgt) return null;
    const t = audioTime - this.opts.latency;
    return this.opts.shouldWait ? this.inputWaiting(tgt, t, audioTime, played) : this.inputPlayAlong(t, played);
  }

  private inputWaiting(tgt: Target, t: number, audioTime: number, played: PlayedInput): Grade | null {
    const early = this.timeOfBeat(tgt.beat) - t;
    if (!this.isWaiting && early > TimingWindow.good * TimingWindow.waitEarlyFactor) return null;
    if (!matches(tgt, played)) return this.feedback(Grade.wrong);
    const grade = !this.isWaiting && early <= TimingWindow.perfect ? Grade.perfect : Grade.good;
    this.judge(tgt, grade);
    if (this.isWaiting) this.clock.resume(audioTime);
    return grade;
  }

  private inputPlayAlong(t: number, played: PlayedInput): Grade | null {
    let best: Target | null = null;
    let bestErr = Infinity;
    for (const x of this.chart.targets.slice(this.next)) {
      const err = Math.abs(this.timeOfBeat(x.beat) - t);
      if (err > TimingWindow.good && this.timeOfBeat(x.beat) > t) break;
      if (err <= TimingWindow.good && err < bestErr) [best, bestErr] = [x, err];
    }
    if (!best) return null;
    if (!matches(best, played)) return this.feedback(Grade.wrong);
    while (this.next < best.index) this.judge(this.chart.targets[this.next] as Target, Grade.miss);
    const grade = bestErr <= TimingWindow.perfect ? Grade.perfect : Grade.good;
    this.judge(best, grade);
    return grade;
  }

  private scheduleAhead(audioNow: number, beat: number, tgt: Target | undefined, schedule: (beat: number, when: number) => void): void {
    const horizon = this.beatAt(audioNow + LOOKAHEAD);
    const limit = this.opts.shouldWait && tgt ? Math.min(horizon, tgt.beat) : horizon;
    for (let b = this.scheduledTo + HALF_BEAT; b <= limit + 1e-9; b += HALF_BEAT) {
      if (b >= beat - LATE_TOLERANCE_BEATS) schedule(b, this.timeOfBeat(b));
      this.scheduledTo = b;
    }
  }

  private missLate(beat: number): void {
    const window = TimingWindow.good * this.bps;
    let tgt = this.nextTarget;
    while (tgt && tgt.beat + window < beat) {
      this.judge(tgt, Grade.miss);
      tgt = this.nextTarget;
    }
  }

  private feedback(grade: Grade): Grade {
    this.log.push({ grade, at: performance.now() });
    if (grade === Grade.wrong) this.streakNow = 0;
    return grade;
  }

  private judge(target: Target, grade: Scored): void {
    this.results[target.index] = grade;
    this.tally[grade]++;
    this.streakNow = grade === Grade.miss ? 0 : this.streakNow + 1;
    this.streakBest = Math.max(this.streakBest, this.streakNow);
    this.log.push({ grade, at: performance.now() });
    this.next++;
  }
}

function matches(target: Target, played: PlayedInput): boolean {
  return target.chord !== undefined ? target.chord === played.chord : target.midi === played.midi;
}
