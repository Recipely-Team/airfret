import type { ChainKind } from '@domain/instruments/chain-kind';
import type { PlayMode } from '@domain/instruments/play-mode';

/** A playable instrument: tuning plus the string-model parameters that give it its voice. */
export interface Instrument {
  readonly id: string;
  /** i18n key for the display name. */
  readonly name: string;
  readonly tuning: readonly number[];
  readonly maxFret: number;
  /** Seconds for the fundamental to decay to −60 dB at 110 Hz. */
  readonly t60: number;
  /** Higher notes ring shorter: T60(f) = t60 · (110 / f)^t60Exponent. */
  readonly t60Exponent: number;
  /** 0 = dark and soft, 1 = bright and metallic. */
  readonly bright: number;
  /** Pluck point as a fraction of string length (0.5 = middle, warm). */
  readonly pick: number;
  /** Output trim per pluck. */
  readonly level: number;
  readonly chain: ChainKind;
  readonly defaultMode: PlayMode;
}
