/** Strumming strings the fretting hand mutes: a short band of noise, lower on the bass. */
const CHUCK = { guitarHz: 2200, bassHz: 700, q: 1.2, attack: 0.003, length: 0.06, level: 0.35 } as const;
/** Pick hitting the string: a 3 ms bright tick, louder for harder strokes. */
const PICK = { highpassHz: 3000, q: 0.7, level: 0.09, length: 0.004 } as const;
const SILENT = 0.0001;

/**
 * **StringNoises** — the small sounds a stroke makes beside its notes: the pick's tick and the chuck of muted
 * strings. Nothing sounds between notes (no squeak on a chord change, no scrape when a finger rests on a string).
 * Each is a burst of the shared noise buffer, shaped and sent into the instrument's chain (`into`).
 */
export class StringNoises {
  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly noise: AudioBuffer,
  ) {}

  pick(into: AudioNode, when: number, amp: number): void {
    this.burst(into, 'highpass', PICK.highpassHz, PICK.q, when, PICK.level * Math.min(1, amp), PICK.length);
  }

  chuck(into: AudioNode, when: number, amp: number, isBass: boolean): void {
    const t = Math.max(when, this.ctx.currentTime);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = isBass ? CHUCK.bassHz : CHUCK.guitarHz;
    bp.Q.value = CHUCK.q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(CHUCK.level * amp, t + CHUCK.attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + CHUCK.length);
    this.play(bp, g, into, t, CHUCK.length + 0.02, 0);
  }

  private burst(into: AudioNode, type: BiquadFilterType, freq: number, q: number, when: number, level: number, length: number): void {
    const t = Math.max(when, this.ctx.currentTime);
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(SILENT, t + length);
    this.play(f, g, into, t, length + 0.01, Math.random() * 0.5);
  }

  private play(filter: BiquadFilterNode, gain: GainNode, into: AudioNode, t: number, seconds: number, offset: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.connect(filter).connect(gain).connect(into);
    src.start(t, offset);
    src.stop(t + seconds);
  }
}
