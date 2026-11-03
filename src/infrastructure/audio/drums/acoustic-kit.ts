import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import { DrumArticulation } from '@domain/drums/drum-articulation';
import { DrumPiece } from '@domain/drums/drum-piece';
import { metalBank } from '@infrastructure/audio/drums/metal-bank';

const SILENT = 0.0001;
const TOM_HZ: Readonly<Record<string, number>> = { tom1: 210, tom2: 160, floor: 104 };
/** Cymbal voices: oscillator base, filter band, decay seconds and level. */
const CYMBAL = {
  hatClosed: { base: 40, band: 10000, low: 7000, decay: 0.06, level: 0.5 },
  hatOpen: { base: 40, band: 9000, low: 6000, decay: 0.55, level: 0.45 },
  hatPedal: { base: 40, band: 8000, low: 6000, decay: 0.035, level: 0.35 },
  crash: { base: 61, band: 7000, low: 3000, decay: 1.9, level: 0.42 },
  ride: { base: 55, band: 8500, low: 4500, decay: 1.4, level: 0.26 },
} as const;

/**
 * **AcousticKit** — a synthesised acoustic drum kit.
 *
 * @remarks
 * - Kick: sine swept 150 → 48 Hz plus a beater click. Snare: shell modes + band-passed wires; nearer
 *   the rim the shell fades and the wires brighten; a rimshot adds a sharp crack.
 * - Toms: membranes whose pitch drops as they decay (tension relaxes after the strike).
 * - Cymbals: an inharmonic metal bank through band filters; the open hi-hat can be choked.
 */
export class AcousticKit {
  private openHat: GainNode | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  hit(r: DrumHitRequest): void {
    const t = Math.max(r.when, this.ctx.currentTime);
    const v = Math.min(1, Math.max(0.05, r.velocity));
    switch (r.piece) {
      case DrumPiece.kick: return this.kick(t, v);
      case DrumPiece.snare: return this.snare(t, v, r.radius, r.articulation === DrumArticulation.rim);
      case DrumPiece.tom1:
      case DrumPiece.tom2:
      case DrumPiece.floor: return this.tom(t, v, TOM_HZ[r.piece] ?? 150, r.radius);
      case DrumPiece.hihat: return this.hat(t, v, r.articulation);
      case DrumPiece.crash: return void this.cymbal(t, v, CYMBAL.crash);
      case DrumPiece.ride: return r.articulation === DrumArticulation.bell ? this.bell(t, v) : this.ride(t, v);
    }
  }

  choke(when: number): void {
    const t = Math.max(when, this.ctx.currentTime);
    this.openHat?.gain.cancelScheduledValues(t);
    this.openHat?.gain.setTargetAtTime(0, t, 0.012);
    this.openHat = null;
  }

  private kick(t: number, v: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    this.env(o, t, 1.0 * v, 0.45);
    this.noiseHit(t, 'highpass', 2500, 0.8, 0.25 * v, 0.006);
  }

  private snare(t: number, v: number, radius: number, isRim: boolean): void {
    const shell = (1 - radius * 0.7) * v;
    for (const [hz, k] of [[185, 0.5], [330, 0.25]] as const) {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(hz * (1 + radius * 0.15), t);
      o.frequency.exponentialRampToValueAtTime(hz * 0.92, t + 0.08);
      this.env(o, t, k * shell, 0.13);
    }
    this.noiseHit(t, 'highpass', 1500 + radius * 2500, 0.7, 0.55 * v, 0.2 + v * 0.06);
    this.noiseHit(t, 'peaking', 5200, 1, 0.2 * v, 0.12);
    if (isRim) {
      this.noiseHit(t, 'bandpass', 3200, 2, 0.6 * v, 0.012);
      const o = this.ctx.createOscillator();
      o.frequency.value = 460;
      this.env(o, t, 0.35 * v, 0.05);
    }
  }

  private tom(t: number, v: number, hz: number, radius: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(hz * (1.35 + radius * 0.1), t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.12);
    this.env(o, t, 0.85 * v, 0.55 + (1 - v) * 0.1);
    this.noiseHit(t, 'bandpass', 1200, 0.8, 0.15 * v * (0.5 + radius), 0.03);
  }

  private hat(t: number, v: number, articulation: string): void {
    if (articulation === DrumArticulation.hatOpen) {
      this.choke(t);
      this.openHat = this.cymbal(t, v, CYMBAL.hatOpen);
    } else {
      this.choke(t);
      this.cymbal(t, v, articulation === DrumArticulation.hatPedal ? CYMBAL.hatPedal : CYMBAL.hatClosed);
    }
  }

  private ride(t: number, v: number): void {
    this.cymbal(t, v, CYMBAL.ride);
    const ping = this.ctx.createOscillator();
    ping.type = 'triangle';
    ping.frequency.value = 2650;
    this.env(ping, t, 0.07 * v, 0.6);
  }

  private bell(t: number, v: number): void {
    for (const [hz, k] of [[1010, 0.18], [1520, 0.12], [2230, 0.08]] as const) {
      const o = this.ctx.createOscillator();
      o.frequency.value = hz;
      this.env(o, t, k * v, 1.3);
    }
    this.cymbal(t, v * 0.5, CYMBAL.ride);
  }

  private cymbal(t: number, v: number, c: (typeof CYMBAL)[keyof typeof CYMBAL]): GainNode {
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = c.band * (0.85 + 0.3 * v);
    band.Q.value = 0.6;
    const low = this.ctx.createBiquadFilter();
    low.type = 'highpass';
    low.frequency.value = c.low;
    band.connect(low).connect(this.out);
    const env = metalBank(this.ctx, c.base, t, c.decay, band);
    const decay = c.decay * (0.7 + 0.5 * v);
    env.gain.setValueAtTime(c.level * v, t);
    env.gain.exponentialRampToValueAtTime(SILENT, t + decay);
    this.noiseHit(t, 'highpass', c.low, 0.7, c.level * 0.35 * v, decay * 0.6);
    return env;
  }

  private env(src: OscillatorNode, t: number, level: number, length: number): void {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(SILENT, t + length);
    src.connect(g).connect(this.out);
    src.start(t);
    src.stop(t + length + 0.05);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, q: number, level: number, length: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (type === 'peaking') f.gain.value = 9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(SILENT, t + length);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.4);
    src.stop(t + length + 0.05);
  }
}
