import { DrumKind } from '@domain/audio/drum-kind';

const CLICK = { accentHz: 1760, beatHz: 1320, accentGain: 0.5, beatGain: 0.3, length: 0.04 } as const;
const KICK = { startHz: 140, endHz: 42, sweep: 0.12, gain: 0.9, length: 0.35 } as const;
const SNARE = { bandHz: 1800, q: 0.7, gain: 0.45, length: 0.18, bodyHz: 220, bodyEndHz: 160, bodyGain: 0.35, bodyLength: 0.1 } as const;
const HAT = { highpassHz: 7000, gain: 0.16, length: 0.05 } as const;
const SILENT = 0.0001;

/**
 * **DrumKit** — synthesised metronome click, kick, snare and hi-hat.
 */
export class DrumKit {
  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  click(when: number, isAccent: boolean): void {
    const o = this.ctx.createOscillator();
    o.frequency.value = isAccent ? CLICK.accentHz : CLICK.beatHz;
    this.envelope(o, when, isAccent ? CLICK.accentGain : CLICK.beatGain, CLICK.length);
  }

  play(kind: DrumKind, when: number, amp: number): void {
    if (kind === DrumKind.kick) this.kick(when, amp);
    else if (kind === DrumKind.snare) this.snare(when, amp);
    else this.hat(when, amp);
  }

  private kick(when: number, amp: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(KICK.startHz, when);
    o.frequency.exponentialRampToValueAtTime(KICK.endHz, when + KICK.sweep);
    this.envelope(o, when, KICK.gain * amp, KICK.length);
  }

  private snare(when: number, amp: number): void {
    this.noiseHit('bandpass', SNARE.bandHz, SNARE.q, when, SNARE.gain * amp, SNARE.length);
    const body = this.ctx.createOscillator();
    body.frequency.setValueAtTime(SNARE.bodyHz, when);
    body.frequency.exponentialRampToValueAtTime(SNARE.bodyEndHz, when + SNARE.bodyLength * 0.8);
    this.envelope(body, when, SNARE.bodyGain * amp, SNARE.bodyLength);
  }

  private hat(when: number, amp: number): void {
    this.noiseHit('highpass', HAT.highpassHz, 0.7, when, HAT.gain * amp, HAT.length);
  }

  private noiseHit(type: BiquadFilterType, freq: number, q: number, when: number, level: number, length: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.decay(when, level, length);
    src.connect(f).connect(g);
    src.start(when, Math.random() * 0.5);
    src.stop(when + length + 0.05);
  }

  private envelope(src: OscillatorNode, when: number, level: number, length: number): void {
    src.connect(this.decay(when, level, length));
    src.start(when);
    src.stop(when + length + 0.05);
  }

  private decay(when: number, level: number, length: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, when);
    g.gain.exponentialRampToValueAtTime(SILENT, when + length);
    g.connect(this.out);
    return g;
  }
}
