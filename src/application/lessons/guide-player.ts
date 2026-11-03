import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { Instrument } from '@domain/instruments/instrument';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import type { Target } from '@domain/lessons/chart/target';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { chordNotes } from '@domain/music/chords/chord-voicing';
import { findPosition } from '@domain/music/find-position';

const LOOKAHEAD = 0.15;
/** A real strum sweeps the strings in ~10 ms each. */
const STRUM_STAGGER = 0.011;
const AMP = { down: 0.72, up: 0.5, note: 0.7 } as const;
/** Over the soundhole: the warm spot a guitarist strums. */
const POSITION = 0.22;

/**
 * **GuidePlayer** — the guitarist you shadow: plays every target of a lesson on the guide voice,
 * scheduled slightly ahead on the audio clock so it is exactly on the beat.
 */
export class GuidePlayer {
  private next = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  reset(): void {
    this.next = 0;
  }

  update(session: LessonSession, instrument: Instrument, audioNow: number): void {
    const targets = session.chart.targets;
    while (this.next < targets.length) {
      const tg = targets[this.next] as Target;
      const when = session.timeOfBeat(tg.beat);
      if (when > audioNow + LOOKAHEAD) return;
      this.next++;
      if (when >= audioNow - 0.02) this.play(tg, instrument, when);
    }
  }

  private play(tg: Target, instrument: Instrument, when: number): void {
    const tuning = instrument.tuning;
    if (tg.chord !== undefined) {
      const isUp = tg.strum === StrumMark.up;
      const notes = chordNotes(tg.chord, tuning).map((midi, string) => ({ midi, string })).filter((n): n is { midi: number; string: number } => n.midi !== null);
      // Upstrokes catch mostly the high strings.
      const played = isUp ? notes.reverse().slice(0, 4) : notes;
      played.forEach((n, i) => this.pluck(n.string, n.midi, isUp ? AMP.up : AMP.down, when + i * STRUM_STAGGER));
    } else if (tg.midi !== undefined) {
      const pos = findPosition(tg.midi, tuning, instrument.maxFret);
      if (pos) this.pluck(pos.string, tg.midi, AMP.note, when);
    }
  }

  private pluck(string: number, midi: number, amp: number, when: number): void {
    this.sound.pluck({ string, midi, amp, when, isMuted: false, position: POSITION, voice: Voice.guide, attack: StrikeSurface.nail, isPalmMuted: false });
  }
}
