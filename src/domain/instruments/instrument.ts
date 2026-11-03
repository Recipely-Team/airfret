import type { ChainKind } from '@domain/instruments/chain-kind';
import type { PlayMode } from '@domain/instruments/play-mode';

/** A playable instrument: tuning plus the string-model parameters that give it its voice. */
export interface Instrument {
  readonly id: string;
  /** i18n key for the display name. */
  readonly name: string;
  readonly tuning: readonly number[];
  readonly maxFret: number;
  /** Seconds to decay to -60 dB at 110 Hz; higher notes decay faster. */
  readonly t60: number;
  /** 0 = dark and soft, 1 = bright and metallic. */
  readonly bright: number;
  /** Pluck point as a fraction of string length (0.5 = middle, warm). */
  readonly pick: number;
  /** Output trim per pluck. */
  readonly level: number;
  readonly chain: ChainKind;
  readonly defaultMode: PlayMode;
}
