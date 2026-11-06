import type { HandStroke } from '@domain/drums/hand/hand-stroke';

const SILENT = 0.0001;
/** A membrane sags to its settled pitch this fast after the strike. */
const GLIDE = 0.08;
/** The strike's attack: a fingertip or palm on skin or steel. */
const ATTACK = 0.002;
/** Each mode rings this many times its decay constant before it is stopped. */
const TAIL = 3;

/**
 * **HandDrumVoice** — plays any hand-drum stroke from its description (`HandStroke`): each resonant mode a sine
 * that may glide down to its settled pitch and decays exponentially, plus a filtered noise burst (slap, snares,
 * jingles, a fingertip's click). Darbuka, congas, tabla and handpan are all data for this one synth.
 */
export class HandDrumVoice {
  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  hit(stroke: HandStroke, velocity: number, when: number): void {
    const t = Math.max(when, this.ctx.currentTime);
    const v = Math.min(1, Math.max(0.05, velocity));
    for (const m of stroke.modes) this.mode(t, m.hz, m.toHz ?? m.hz, m.decay, m.level * v);
    if (stroke.noise) this.burst(t, stroke.noise.type, stroke.noise.hz, stroke.noise.length, stroke.noise.level * v);
  }

  private mode(t: number, fromHz: number, toHz: number, decay: number, level: number): void {
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(fromHz, t);
    if (toHz !== fromHz) osc.frequency.exponentialRampToValueAtTime(toHz, t + GLIDE);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(SILENT, t);
    g.gain.exponentialRampToValueAtTime(level, t + ATTACK);
    g.gain.exponentialRampToValueAtTime(SILENT, t + decay * TAIL);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + decay * TAIL + 0.05);
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
