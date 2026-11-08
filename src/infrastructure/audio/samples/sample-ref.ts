/** One recorded note in a sample set, as written by `tools/samples/prepare.mjs`. */
export interface SampleRef {
  /** File name within the set folder. */
  readonly file: string;
  /** MIDI note the string was recorded at. */
  readonly midi: number;
  /** Lowest and highest MIDI note this sample should cover when nothing nearer exists. */
  readonly lo: number;
  readonly hi: number;
  /** Which open string (0 = lowest) this was played on, or -1 when the source doesn't say. */
  readonly string: number;
  /** Dynamic layer, 0 = softest. */
  readonly layer: number;
  /** Measured tuning error, cents to add on playback to land in tune. */
  readonly cents: number;
  /**
   * A held note's loop, seconds into the file (`tools/samples/sustain.mjs --loop`): it repeats seamlessly while the
   * note is held, so a short recording of a bowed or blown note can last as long as it is played.
   */
  readonly loopStart?: number;
  readonly loopEnd?: number;
}
