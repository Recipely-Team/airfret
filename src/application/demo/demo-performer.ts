import { chordFretting, holdNotes, noteFretting } from '@application/demo/demo-fretting';
import type { DemoFrame } from '@application/demo/demo-frame';
import { ghostFretHand, ghostStrumHand } from '@application/demo/ghost-hands';
import { recordingSoundOutput } from '@application/demo/recording-sound-output';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-factories';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { Fretting } from '@domain/fretboard/fretting/fretting';
import { stringY } from '@domain/fretboard/neck-geometry';
import type { Point } from '@domain/fretboard/point';
import type { Instrument } from '@domain/instruments/instrument';
import type { Song } from '@domain/lessons/catalog/song';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { planFingering } from '@domain/music/fingering/plan-fingering';

/** Fingers land this long before the note they fret, as a real hand gets there first, seconds. */
const FRET_LEAD = 0.06;
/** The pick starts moving to its next string this long before it plays it, seconds. */
const PICK_REACH = 0.25;
/** Over the soundhole, as a fraction from the strum area's neck end to the bridge. */
const PICK_AT = 0.3;
/** Plucks older than this are forgotten, seconds. */
const KEEP = 1;
/** The first note sounds this soon after *Watch it play*, seconds — no count-in bar of silence first. */
const FIRST_NOTE_AFTER = 0.3;
const DEMO_OPTIONS = { tempo: 1, shouldWait: false, isEasy: false, hasGuide: true, hasDrums: false, latency: 0 } as const;

/**
 * **DemoPerformer** — the instrument playing a song by itself, to show what it can do: the lesson's guide
 * guitarist plays it at full tempo, and the stage sees a hand doing it — fingers landing on the frets
 * just before each note, the pick crossing each string as it sounds, the strings vibrating.
 *
 * @remarks
 * - Sound is the guide's, scheduled sample-accurately; the picture follows the same plucks on the audio clock.
 * - Chords are held in their standard shapes and fingers; melodies are fingered as the guide plays them
 *   (`planFingering`), one finger per fret, letting earlier notes ring while the hand stays in position.
 */
export class DemoPerformer {
  private session: LessonSession | null = null;
  private readonly guide: GuidePlayer;
  private readonly startLesson = new StartLessonUseCase();
  private plucks: PluckRequest[] = [];
  private shown = 0;
  private nextTarget = 0;
  private held: { string: number; fret: number }[] = [];
  private fretting: Fretting | null = null;
  private chord = '';
  private plan: { midi: number; string: number; fret: number }[][] = [];

  constructor(sound: SoundOutputInterface) {
    this.guide = new GuidePlayer(recordingSoundOutput(sound, (r) => this.plucks.push(r)));
  }

  get isPlaying(): boolean {
    return this.session !== null;
  }

  get song(): Song | null {
    return this.session?.song ?? null;
  }

  start(song: Song, instrument: Instrument, audioNow: number): Result<void, Failure> {
    // A lesson opens with a count-in bar; a demo shouldn't make you wait through it (3.4 s on the Prelude).
    const counted = this.startLesson.execute(song, DEMO_OPTIONS, audioNow);
    if (!counted.isOk) return counted;
    const countIn = counted.value.timeOfBeat(0) - audioNow;
    const started = this.startLesson.execute(song, DEMO_OPTIONS, audioNow - countIn + FIRST_NOTE_AFTER);
    if (!started.isOk) return started;
    this.session = started.value;
    this.guide.reset();
    this.plucks = [];
    this.shown = 0;
    this.nextTarget = 0;
    this.held = [];
    this.fretting = null;
    this.chord = '';
    const onsets = started.value.chart.targets.map((t) => (t.midi === undefined ? [] : [t.midi, ...(t.harmony ?? [])]));
    this.plan = planFingering(onsets, instrument.tuning, instrument.frets);
    return ok(undefined);
  }

  stop(): void {
    this.session = null;
  }

  /** Advances the song to `audioNow`; null once it has ended (or was never started). */
  update(l: FretboardLayout, instrument: Instrument, capo: number, audioNow: number): DemoFrame | null {
    const session = this.session;
    if (!session) return null;
    session.update(audioNow, () => {});
    this.guide.update(session, instrument, audioNow);
    if (session.isDone) {
      this.stop();
      return null;
    }
    this.advanceHand(session, l.strings, capo, audioNow);
    this.plucks.sort((a, b) => a.when - b.when);
    const hits: { string: number; amp: number }[] = [];
    while (this.shown < this.plucks.length && (this.plucks[this.shown]?.when ?? Infinity) <= audioNow) {
      const p = this.plucks[this.shown++];
      if (p) hits.push({ string: p.string, amp: p.amp });
    }
    const pick = this.pickAt(l, audioNow);
    this.forget(audioNow);
    const fretting = this.fretting ?? chordFretting('', l.strings, capo);
    return { fretting, hits, pick, fretHand: ghostFretHand(l, fretting, capo), strumHand: ghostStrumHand(l, pick), chord: this.chord };
  }

  /** Lands the fingers for every target that is about to sound. */
  private advanceHand(session: LessonSession, strings: number, capo: number, audioNow: number): void {
    const targets = session.chart.targets;
    while (this.nextTarget < targets.length) {
      const tg = targets[this.nextTarget];
      if (!tg || session.timeOfBeat(tg.beat) - FRET_LEAD > audioNow) return;
      this.nextTarget++;
      if (tg.chord !== undefined) {
        this.chord = tg.chord;
        this.fretting = chordFretting(tg.chord, strings, capo);
      } else {
        this.chord = '';
        this.held = holdNotes(this.held, (this.plan[tg.index] ?? []).map((n) => ({ string: n.string, fret: n.fret })));
        this.fretting = noteFretting(this.held, strings, capo);
      }
    }
  }

  /** The pick on the string it last played, travelling to the next one as that note comes up. */
  private pickAt(l: FretboardLayout, audioNow: number): Point {
    const x = l.strumX0 + (l.strumX1 - l.strumX0) * PICK_AT;
    const spacing = (2 * l.spreadBody) / Math.max(1, l.strings - 1);
    const yOf = (s: number) => stringY(l, s, x);
    const prev = this.plucks[this.shown - 1];
    const next = this.plucks[this.shown];
    const from = prev ? { y: yOf(prev.string), t: prev.when } : { y: yOf(0) - spacing, t: audioNow };
    if (!next || next.when - audioNow > PICK_REACH) return { x, y: from.y };
    const start = Math.max(from.t, next.when - PICK_REACH);
    const k = next.when > start ? Math.min(1, Math.max(0, (audioNow - start) / (next.when - start))) : 1;
    return { x, y: from.y + (yOf(next.string) - from.y) * k };
  }

  private forget(audioNow: number): void {
    const old = this.plucks.findIndex((p) => p.when > audioNow - KEEP);
    const drop = Math.min(old < 0 ? this.plucks.length : old, Math.max(0, this.shown - 1));
    if (drop > 0) {
      this.plucks = this.plucks.slice(drop);
      this.shown -= drop;
    }
  }
}
