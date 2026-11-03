import { DrumKind } from '@domain/audio/drum-kind';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';

const HAT_ON_BEAT = 0.9;
const HAT_OFF_BEAT = 0.55;
const SOFT_SNARE = 0.5;
const FULL = 1;
const EPSILON = 1e-6;

/**
 * **BackingTrack** — metronome clicks or a simple drum groove under a lesson.
 *
 * @remarks
 * - The count-in (negative beats) is always clicks.
 * - Groove: hats on eighths; kick on 1 (and 3 in 4/4), snare on the backbeat.
 */
export class BackingTrack {
  constructor(private readonly sound: SoundOutputInterface) {}

  /** Plays whatever falls on half-beat `beat` at audio time `when`. */
  schedule(beat: number, when: number, beatsPerBar: number, hasDrums: boolean): void {
    const isWhole = Math.abs(beat - Math.round(beat)) < EPSILON;
    const inBar = (((Math.round(beat * 2) / 2) % beatsPerBar) + beatsPerBar) % beatsPerBar;
    if (beat < 0 || !hasDrums) {
      if (isWhole) this.sound.click(when, inBar === 0);
      return;
    }
    this.sound.drum(DrumKind.hat, when, isWhole ? HAT_ON_BEAT : HAT_OFF_BEAT);
    if (isWhole) this.groove(inBar, beatsPerBar, when);
  }

  private groove(inBar: number, beatsPerBar: number, when: number): void {
    const isDownbeat = inBar === 0;
    if (beatsPerBar === 4) {
      this.sound.drum(isDownbeat || inBar === 2 ? DrumKind.kick : DrumKind.snare, when, FULL);
    } else if (beatsPerBar === 3) {
      this.sound.drum(isDownbeat ? DrumKind.kick : DrumKind.snare, when, isDownbeat ? FULL : SOFT_SNARE);
    } else if (isDownbeat) {
      this.sound.drum(DrumKind.kick, when, FULL);
    } else if (inBar === beatsPerBar / 2) {
      this.sound.drum(DrumKind.snare, when, FULL);
    }
  }
}
