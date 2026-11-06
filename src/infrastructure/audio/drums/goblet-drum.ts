import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import { DrumPiece } from '@domain/drums/drum-piece';

const SILENT = 0.0001;
/** Düm: the head's fundamental, pitched down as the skin settles, with its quicker second mode. */
const DOUM = { fromHz: 128, toHz: 92, glide: 0.08, decay: 0.5, level: 0.9, mode2: 1.59, mode2Decay: 0.18, thumpHz: 260, thumpLength: 0.03 } as const;
/** Tek and ka: the rim's ring (a few partials of the body) and the click of the fingertip. */
const RIM = {
  tek: { partials: [740, 1180, 1690, 2480], decay: 0.16, level: 0.42, clickHz: 3200 },
  ka: { partials: [620, 990, 1420], decay: 0.1, level: 0.32, clickHz: 2400 },
} as const;
const CLICK_LENGTH = 0.012;

/**
 * **GobletDrum** — a synthesised darbuka: düm, tek and ka.
 *
 * @remarks
 * - Düm is the open head: a sine membrane mode gliding down as it decays, its second mode (×1.59 for a
 *   circular membrane) dying faster, under a soft felt thump of low-passed noise.
 * - Tek and ka are struck at the rim: the drum body rings in a few inharmonic partials for a fraction of a
 *   second, over a sharp band of noise — ka lower and more damped than tek.
 */
export class GobletDrum {
  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  /** Whether this drum voices the stroke (the kit voices the rest). */
  static plays(piece: DrumPiece): boolean {
    return piece === DrumPiece.doum || piece === DrumPiece.tek || piece === DrumPiece.ka;
  }

  hit(r: DrumHitRequest): void {
    const t = Math.max(r.when, this.ctx.currentTime);
    const v = Math.min(1, Math.max(0.05, r.velocity));
    if (r.piece === DrumPiece.doum) this.doum(t, v);
    else this.rim(t, v, r.piece === DrumPiece.tek ? RIM.tek : RIM.ka);
  }

  private doum(t: number, v: number): void {
    this.mode(t, DOUM.fromHz, DOUM.toHz, DOUM.decay, DOUM.level * v);
    this.mode(t, DOUM.fromHz * DOUM.mode2, DOUM.toHz * DOUM.mode2, DOUM.mode2Decay, DOUM.level * v * 0.35);
    this.burst(t, 'lowpass', DOUM.thumpHz, DOUM.thumpLength, 0.5 * v);
  }

  private rim(t: number, v: number, kind: (typeof RIM)[keyof typeof RIM]): void {
    kind.partials.forEach((hz, i) => this.mode(t, hz, hz, kind.decay / (1 + i * 0.35), (kind.level * v) / (1 + i * 0.6)));
    this.burst(t, 'bandpass', kind.clickHz, CLICK_LENGTH, kind.level * v);
  }

  /** One decaying sine mode, gliding from one pitch to another. */
  private mode(t: number, fromHz: number, toHz: number, decay: number, level: number): void {
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(fromHz, t);
    osc.frequency.exponentialRampToValueAtTime(toHz, t + DOUM.glide);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(SILENT, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(SILENT, t + decay * 3);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + decay * 3 + 0.05);
  }

  private burst(t: number, type: BiquadFilterType, hz: number, length: number, level: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(SILENT, t + length);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.01);
  }
}
