import type { HandStroke } from '@domain/drums/hand/hand-stroke';

const SILENT = 0.0001;
/** A membrane sags to its settled pitch this fast after the strike. */
const GLIDE = 0.08;
/** The strike's attack: a fingertip or palm on skin or steel. */
const ATTACK = 0.002;
/** Each mode rings this many times its decay constant before it is stopped. */
const TAIL = 3;

/** A recorded stroke's loudness still follows the hit within its band: from this share at the softest to full. */
const RECORDING_FLOOR = 0.55;
const RECORDING_EXT = '.m4a';

/**
 * **HandDrumVoice** — plays any hand-drum stroke from its description (`HandStroke`).
 *
 * @remarks
 * - A stroke with recordings plays the take for its strength (bands soft → hard, takes in turn), loaded ahead by
 *   `prepare`; until they are in — or if they fail — the synth voices it.
 * - The synth: each resonant mode a sine that may glide down to its settled pitch and decays exponentially, plus
 *   a filtered noise burst (slap, snares, jingles, a fingertip's click).
 */
export class HandDrumVoice {
  private readonly loading = new Map<string, Promise<void>>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private turn = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
    /** Where the recordings are served (`…/samples/hand-drums/`). */
    private readonly base: string,
  ) {}

  /** Starts loading every recording these strokes use. */
  prepare(strokes: readonly HandStroke[]): void {
    for (const s of strokes) for (const file of s.recording?.layers.flat() ?? []) this.load(file);
  }

  hit(stroke: HandStroke, velocity: number, when: number): void {
    const t = Math.max(when, this.ctx.currentTime);
    const v = Math.min(1, Math.max(0.05, velocity));
    if (stroke.recording && this.playRecording(stroke.recording, v, t)) return;
    for (const m of stroke.modes) this.mode(t, m.hz, m.toHz ?? m.hz, m.decay, m.level * v);
    if (stroke.noise) this.burst(t, stroke.noise.type, stroke.noise.hz, stroke.noise.length, stroke.noise.level * v);
  }

  private playRecording(rec: NonNullable<HandStroke['recording']>, v: number, t: number): boolean {
    const band = rec.layers[Math.min(rec.layers.length - 1, Math.floor(v * rec.layers.length))] ?? [];
    const file = band[this.turn++ % Math.max(1, band.length)];
    const buffer = file === undefined ? undefined : this.buffers.get(file);
    if (!buffer) {
      if (file !== undefined) this.load(file);
      return false;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rec.rate ?? 1;
    const g = this.ctx.createGain();
    g.gain.value = (rec.gain ?? 1) * (RECORDING_FLOOR + (1 - RECORDING_FLOOR) * v);
    src.connect(g).connect(this.out);
    src.start(t);
    return true;
  }

  private load(file: string): void {
    if (this.loading.has(file)) return;
    this.loading.set(file, fetch(`${this.base}${file}${RECORDING_EXT}`)
      .then((r) => r.arrayBuffer())
      .then((b) => this.ctx.decodeAudioData(b))
      .then((buffer) => void this.buffers.set(file, buffer))
      .catch(() => undefined));
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
