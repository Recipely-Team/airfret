import type { Voice } from '@domain/audio/voice';
import type { StrikeSurface } from '@domain/gesture/strike-surface';

/** One string being plucked. */
export interface PluckRequest {
  readonly string: number;
  readonly midi: number;
  /** Stroke strength, 0–1. */
  readonly amp: number;
  /** Audio-clock time; 0 = now. */
  readonly when: number;
  readonly isMuted: boolean;
  /**
   * Where along the vibrating length the string was struck, as a fraction from the bridge:
   * ~0.05 right at the bridge (thin, bright), ~0.25 over the soundhole (warm), ~0.5 mid-string (round, dark).
   */
  readonly position: number;
  readonly voice: Voice;
  /** Part of the finger that hit the string: the nail is brighter with a sharper attack. */
  readonly attack: StrikeSurface;
  /** Strumming palm resting on the strings by the bridge: short, dark "chug". */
  readonly isPalmMuted: boolean;
}
