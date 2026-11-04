/** A sample currently sounding on one string, kept so it can be bent, slid or stopped. */
export interface ActiveSample {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
  /** The pitch it is sounding right now (MIDI), updated as it is bent or slid. */
  midi: number;
  /** Its current detune (cents) off the recording; a slide ramps this. */
  detune: number;
}
