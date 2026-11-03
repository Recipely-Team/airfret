/** A chord identified from sounding notes. */
export interface RecognizedChord {
  /** Root pitch class, 0 = C. */
  readonly root: number;
  /** Quality suffix as written in chord symbols: '' (major), 'm', '7', 'maj7', 'm7', 'sus2', … */
  readonly quality: string;
  /** Lowest sounding pitch class. */
  readonly bass: number;
  /** Display name, with a slash bass when it isn't the root, e.g. "D/F#". */
  readonly name: string;
}
