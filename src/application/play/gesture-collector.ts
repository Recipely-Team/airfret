import type { PlayEvent } from '@application/play/play-event';
import type { StrumDirection } from '@domain/gesture/strum-direction';
import { recognizeChord } from '@domain/music/chords/recognize-chord';

/** A strum is over when no string has been crossed for this long, seconds. */
const GESTURE_END = 0.07;

/**
 * **GestureCollector** — gathers the notes of one strum in free mode, then names the chord they
 * form, so a lesson can judge what was actually played rather than what was pointed at.
 */
export class GestureCollector {
  private pending: { when: number; dir: StrumDirection; amp: number; isMuted: boolean; notes: number[]; lastT: number } | null = null;

  constructor(private readonly emit: (e: PlayEvent) => void) {}

  add(t: number, when: number, dir: StrumDirection, amp: number, isMuted: boolean, midi: number | null, isNewGesture: boolean): void {
    if (isNewGesture) this.flush();
    this.pending ??= { when, dir, amp, isMuted, notes: [], lastT: t };
    this.pending.lastT = t;
    this.pending.amp = Math.max(this.pending.amp, amp);
    if (midi !== null) this.pending.notes.push(midi);
  }

  /** Call every frame: emits the strum once it has ended. */
  tick(t: number): void {
    if (this.pending && t - this.pending.lastT > GESTURE_END) this.flush();
  }

  private flush(): void {
    const g = this.pending;
    this.pending = null;
    if (!g) return;
    const recognized = g.isMuted ? null : recognizeChord(g.notes);
    const base = { when: g.when, dir: g.dir, amp: g.amp, isMuted: g.isMuted };
    this.emit(recognized ? { ...base, chord: recognized.name, recognized } : base);
  }
}
