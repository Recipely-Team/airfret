/**
 * One way of striking a hand drum, as the synth should voice it: the drum's resonant modes (a membrane's pitch
 * may sag as it settles — `toHz`), and a burst of noise for the slap, the snares or the jingles.
 */
export interface HandStroke {
  /** i18n key of the stroke's name, shown on the drum (düm, tek, bass, open…). */
  readonly label: string;
  readonly modes: readonly { readonly hz: number; readonly toHz?: number; readonly decay: number; readonly level: number }[];
  readonly noise?: { readonly type: 'lowpass' | 'bandpass' | 'highpass'; readonly hz: number; readonly length: number; readonly level: number };
}
