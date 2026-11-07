import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import { loadSampleSet } from '@infrastructure/audio/samples/load-sample-set';
import type { SampleSet } from '@infrastructure/audio/samples/sample-set';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';

/** Each joining instrument plays a little under the leading one, and a little into the room. */
const LEVEL = { member: 0.55, room: 0.25 } as const;
/** A note ends with a short fade, seconds, so it never clicks. */
const RELEASE = 0.08;
/** The quietest a note plays, whatever its velocity. */
const MIN_GAIN = 0.15;

/**
 * **WebAudioEnsemble** — the instruments that join one playing by itself. Each loads its own recordings (the same
 * sets the app plays them with) and plays each note from the one nearest its pitch, re-pitched, for the note's
 * length, into the engine's mix and room.
 */
export class WebAudioEnsemble implements EnsembleOutputInterface {
  private readonly sets = new Map<string, Promise<SampleSet | null>>();
  private readonly loaded = new Map<string, SampleSet | null>();
  private readonly bus: GainNode;
  private readonly sounding = new Map<AudioBufferSourceNode, { id: string; midi: number; start: number; gain: GainNode }>();

  constructor(private readonly at: { ctx: AudioContext; mix: AudioNode; room: AudioNode }) {
    this.bus = at.ctx.createGain();
    this.bus.gain.value = LEVEL.member;
    this.bus.connect(at.mix);
    const room = at.ctx.createGain();
    room.gain.value = LEVEL.room;
    this.bus.connect(room).connect(at.room);
  }

  canPlay(instrumentId: string): boolean {
    return SAMPLE_SET_BY_INSTRUMENT[instrumentId] !== undefined;
  }

  prepare(instrumentIds: readonly string[]): void {
    for (const id of instrumentIds) {
      const setId = SAMPLE_SET_BY_INSTRUMENT[id];
      if (!setId || this.sets.has(id)) continue;
      const pending = loadSampleSet(this.at.ctx, import.meta.env.BASE_URL, setId).catch(() => null);
      this.sets.set(id, pending);
      void pending.then((set) => this.loaded.set(id, set));
    }
  }

  play(instrumentId: string, midi: number, velocity: number, when: number, dur: number): void {
    const choice = this.loaded.get(instrumentId)?.choose(-1, midi);
    if (!choice) return;
    const ctx = this.at.ctx;
    const start = Math.max(when, ctx.currentTime);
    const source = ctx.createBufferSource();
    source.buffer = choice.buffer;
    source.detune.value = choice.detune;
    const gain = ctx.createGain();
    const level = Math.max(MIN_GAIN, Math.min(1, velocity));
    const end = start + Math.min(dur, choice.buffer.duration);
    gain.gain.setValueAtTime(level, start);
    gain.gain.setTargetAtTime(0, end, RELEASE / 3);
    source.connect(gain).connect(this.bus);
    source.start(start);
    source.stop(end + RELEASE * 2);
    this.sounding.set(source, { id: instrumentId, midi, start, gain });
    source.onended = () => this.sounding.delete(source);
  }

  release(instrumentId: string, midi: number | null, when: number): void {
    const at = Math.max(when, this.at.ctx.currentTime);
    for (const [source, n] of this.sounding) {
      if (n.id !== instrumentId || (midi !== null && n.midi !== midi) || n.start >= at) continue;
      n.gain.gain.cancelScheduledValues(at);
      n.gain.gain.setTargetAtTime(0, at, RELEASE / 3);
      source.stop(at + RELEASE * 2);
    }
  }

  silence(): void {
    const now = this.at.ctx.currentTime;
    for (const s of this.sounding.keys()) s.stop(now);
    this.sounding.clear();
  }
}
