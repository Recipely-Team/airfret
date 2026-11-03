/** An instrument's effect chain: strings go in, the coloured signal comes out. */
export interface AudioChain {
  readonly input: AudioNode;
  readonly output: AudioNode;
  /** How much of the chain feeds the shared reverb, 0–1. */
  readonly reverbSend: number;
}
