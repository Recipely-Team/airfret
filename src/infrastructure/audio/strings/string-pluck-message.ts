/** A `pluck` message for the string-bank worklet (`public/worklets/strings.js`). */
export interface StringPluckMessage {
  readonly type: 'pluck';
  readonly when: number;
  readonly string: number;
  readonly freq: number;
  readonly amp: number;
  /** Seconds to −60 dB. */
  readonly t60: number;
  /** 0 = dark, 1 = bright. */
  readonly bright: number;
  /** Dispersion (inharmonicity) of the string. */
  readonly stiffness: number;
  /** Strike point as a fraction from the bridge. */
  readonly pick: number;
  /** −1 left … 1 right. */
  readonly pan: number;
}
