import type { DrumHitRequest } from '@domain/audio/drum-hit-request';
import { DrumArticulation } from '@domain/drums/drum-articulation';
import { DrumPiece } from '@domain/drums/drum-piece';
import type { AcousticKit } from '@infrastructure/audio/drums/acoustic-kit';

/** A recorded stroke's loudness still follows the hit within its band: from this share at the softest to full. */
const FLOOR = 0.55;
/** An open hi-hat closes this fast when the pedal comes down (or the next hat is struck). */
const CHOKE = 0.012;
const EXT = '.m4a';
const MANIFEST = 'manifest.json';

/** The recorded kit's takes per piece, as `tools/samples/kit.mjs` writes them: bands soft → hard, takes in each. */
interface KitManifest {
  readonly pieces: Readonly<Record<string, readonly (readonly string[])[]>>;
}

/**
 * **RecordedKit** — the drum kit played from real recordings (the MuldjordKit, FreePats, CC BY 4.0): each piece in
 * four strength bands with two takes each, taken in turn so repeated strokes don't sound machine-made; the open
 * hi-hat choked by the pedal or the next hat stroke.
 *
 * @remarks
 * - Measured against the recordings, the synthesised kit was far off: a snare and cymbals twice as bright (all hiss),
 *   toms an octave high and cut to a quarter of their ring, a ride ringing 0.5 s instead of 3.7 s — so the synth now
 *   only stands in while the recordings load, and for the rim click the kit wasn't recorded with.
 */
export class RecordedKit {
  private manifest: KitManifest | null = null;
  private isLoading = false;
  private readonly buffers = new Map<string, AudioBuffer>();
  private turn = 0;
  private openHat: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly synth: AcousticKit,
    /** Where the recordings are served (`…/samples/kit/`). */
    private readonly base: string,
  ) {}

  /** Starts loading the kit's recordings (once). */
  prepare(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    void fetch(`${this.base}${MANIFEST}`)
      .then((r) => r.json() as Promise<KitManifest>)
      .then((m) => {
        this.manifest = m;
        return Promise.all(Object.values(m.pieces).flat(2).map((file) => this.load(file)));
      })
      .catch(() => undefined);
  }

  hit(r: DrumHitRequest): void {
    const key = keyOf(r);
    const buffer = key ? this.take(key, r.velocity) : undefined;
    if (!buffer) {
      this.prepare();
      this.synth.hit(r);
      return;
    }
    const t = Math.max(r.when, this.ctx.currentTime);
    const v = Math.min(1, Math.max(0.05, r.velocity));
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = FLOOR + (1 - FLOOR) * v;
    source.connect(gain).connect(this.out);
    if (r.piece === DrumPiece.hihat) this.choke(t);
    source.start(t);
    if (key === 'hatOpen') this.openHat = { source, gain };
  }

  choke(when: number): void {
    const t = Math.max(when, this.ctx.currentTime);
    this.synth.choke(t);
    if (!this.openHat) return;
    this.openHat.gain.gain.setTargetAtTime(0, t, CHOKE);
    this.openHat.source.stop(t + CHOKE * 6);
    this.openHat = null;
  }

  /** The take for a stroke of this strength: its band, the next take in turn. */
  private take(key: string, velocity: number): AudioBuffer | undefined {
    const bands = this.manifest?.pieces[key];
    if (!bands?.length) return undefined;
    const band = bands[Math.min(bands.length - 1, Math.floor(Math.max(0, velocity) * bands.length))] ?? [];
    const file = band[this.turn++ % Math.max(1, band.length)];
    return file === undefined ? undefined : this.buffers.get(file);
  }

  private load(file: string): Promise<void> {
    return fetch(`${this.base}${file}${EXT}`)
      .then((r) => r.arrayBuffer())
      .then((b) => this.ctx.decodeAudioData(b))
      .then((buffer) => void this.buffers.set(file, buffer))
      .catch(() => undefined);
  }
}

/** The recording a stroke plays: by piece and articulation; none for the rim click (the synth plays it). */
function keyOf(r: DrumHitRequest): string | undefined {
  switch (r.piece) {
    case DrumPiece.snare: return r.articulation === DrumArticulation.rim ? undefined : 'snare';
    case DrumPiece.hihat: return r.articulation === DrumArticulation.hatOpen ? 'hatOpen' : r.articulation === DrumArticulation.hatPedal ? 'hatPedal' : 'hatClosed';
    case DrumPiece.ride: return r.articulation === DrumArticulation.bell ? 'bell' : 'ride';
    default: return r.piece;
  }
}
