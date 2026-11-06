/**
 * One way of striking a hand drum: real recordings when there are some, else as the synth should voice it: the drum's resonant modes (a membrane's pitch
 * may sag as it settles — `toHz`), and a burst of noise for the slap, the snares or the jingles.
 */
export interface HandStroke {
  /** i18n key of the stroke's name, shown on the drum (düm, tek, bass, open…). */
  readonly label: string;
  readonly modes: readonly { readonly hz: number; readonly toHz?: number; readonly decay: number; readonly level: number }[];
  readonly noise?: { readonly type: 'lowpass' | 'bandpass' | 'highpass'; readonly hz: number; readonly length: number; readonly level: number };
  /**
   * Recordings of the real stroke (files in `public/samples/hand-drums/`, see CREDITS.md): bands from soft to hard,
   * the takes of a band played in turn, at `rate` (a deeper stroke from a recording played slower) and `gain`.
   * The modes and noise above voice it until the recordings have loaded, or if they can't.
   */
  readonly recording?: { readonly layers: readonly (readonly string[])[]; readonly rate?: number; readonly gain?: number };
}
