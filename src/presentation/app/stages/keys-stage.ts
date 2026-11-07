import { keyboardSongs } from '@application/demo/watchable-songs';
import { KeysPerformer } from '@application/keys/keys-performer';
import type { PianoPlayer } from '@application/keys/piano-player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Point } from '@domain/fretboard/point';
import { computeKeyboardLayout, shiftLimits } from '@domain/keys/compute-keyboard-layout';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';
import type { Song } from '@domain/lessons/catalog/song';
import type { Settings } from '@domain/settings/settings';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import type { StagePerformance } from '@presentation/app/stages/stage-performance';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';

/** A melody note in view counts this many times a bass note in deciding what the keyboard shows. */
const MELODY_WEIGHT = 4;

/**
 * The keyboard instruments' page (piano, harpsichord, mallets, winds): `PianoPlayer` with the selected one's keys.
 * Playing by itself, it slides the keyboard to show the piece and lights each key as it sounds.
 */
export class KeysStage implements InstrumentStage, StagePerformance {
  private readonly performer: KeysPerformer;
  private size = { w: 0, h: 0 };
  private instrumentId = '';
  private userShift = 0;
  /** The keyboard's slide while a piece plays (null: the player's own). */
  private showShift: number | null = null;

  constructor(private readonly piano: PianoPlayer, sound: SoundOutputInterface) {
    this.performer = new KeysPerformer(sound);
  }

  get performance(): StagePerformance {
    return this;
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying;
  }

  handles(instrumentId: string): boolean {
    return isKeyboard(instrumentId);
  }

  fit(w: number, h: number, st: Settings): void {
    this.size = { w, h };
    this.userShift = st.pianoShift;
    if (st.instrument !== this.instrumentId) this.showShift = null;
    this.instrumentId = st.instrument;
    this.refit();
  }

  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void {
    this.piano.updateHands(hands, now, audioNow);
  }

  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void {
    renderer.piano(this.piano, now, hint, camera);
  }

  pointer(id: number, p: Point | null, audioNow: number): void {
    this.piano.pointer(id, p, audioNow);
  }

  sustain(isDown: boolean, audioNow: number): void {
    this.piano.setSustain(isDown, audioNow);
  }

  songs(all: readonly Song[]): Song[] {
    return keyboardSongs(all, this.instrumentId);
  }

  play(song: Song, audioNow: number): boolean {
    const kb = keyboardFor(this.instrumentId);
    if (!kb) return false;
    this.performer.stop(audioNow);
    this.showShift = this.shiftShowing(this.performer.keysUsed(song, kb));
    this.refit();
    return this.performer.start(song, kb, audioNow);
  }

  stop(audioNow: number): void {
    this.performer.stop(audioNow);
    this.ended();
  }

  perform(audioNow: number): boolean {
    const frame = this.performer.update(audioNow);
    if (!frame) {
      this.ended();
      return false;
    }
    this.piano.shown = new Set(frame.down);
    for (const s of frame.struck) this.piano.glow.set(s.midi, Math.max(this.piano.glow.get(s.midi) ?? 0, s.velocity));
    return true;
  }

  private ended(): void {
    this.piano.shown = new Set();
    this.showShift = null;
    this.refit();
  }

  private refit(): void {
    if (this.size.w > 0) this.piano.fit(this.size.w, this.size.h, this.instrumentId, this.showShift ?? this.userShift);
  }

  /** The slide that shows most of the piece's notes — the tune's above all — nearest the player's own. */
  private shiftShowing(used: readonly { midi: number; isMelody: boolean }[]): number | null {
    const kb = keyboardFor(this.instrumentId);
    if (!kb) return null;
    const { down, up } = shiftLimits(this.size.w, kb);
    let best: number | null = null;
    let bestScore = -Infinity;
    for (let s = down; s <= up; s++) {
      const l = computeKeyboardLayout(this.size.w, this.size.h, s, kb);
      const shown = used.reduce((sum, n) => sum + (n.midi >= l.firstMidi && n.midi <= l.lastMidi ? (n.isMelody ? MELODY_WEIGHT : 1) : 0), 0);
      const score = shown * 10 - Math.abs(s - this.userShift);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return best;
  }
}
