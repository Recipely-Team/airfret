// Offline renderer for the real-song audio tests: turns the guide's performance into the sound the app
// would make, without a browser. It follows WebAudioEngine.pluck exactly —
//   recorded note (same SampleSet choice, detune, level, one note per string, 30 ms release) when the
//   instrument's set covers it, else the real string-bank worklet (public/worklets/strings.js, run here
//   in a sandbox) with the same parameters (`stringPluck`).
// Not modelled: the body / amp chains and the shared reverb, which colour the sound but not what is played.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { Instrument } from '@domain/instruments/instrument';
import type { AudioBufferEntry } from '@infrastructure/audio/samples/audio-buffer-entry';
import type { SampleManifest } from '@infrastructure/audio/samples/sample-manifest';
import { SampleSet } from '@infrastructure/audio/samples/sample-set';
import { SAMPLE_SET_BY_INSTRUMENT } from '@infrastructure/audio/samples/sample-sets';
import { stringPluck } from '@infrastructure/audio/strings/string-pluck';
import { decode } from '../../tools/calibrate/decode.mjs';

export const SR = 48000;
const BLOCK = 128;
/** Mirrors SamplePlayer / load-sample-set / WebAudioEngine. */
const PREFERRED_LAYER = 1;
const MIN_GAIN = 0.05;
const RELEASE_SECONDS = 0.03;
const SAMPLE_BUS = 0.9;
const TAIL_SECONDS = 3;

export interface Rendered {
  readonly audio: Float32Array;
  /** How many notes came from recordings and how many from the synth. */
  readonly recorded: number;
  readonly synthesised: number;
}

const cache = new Map<string, SampleSet>();

/** The instrument's sample set as the app loads it (one dynamic layer), decoded at `SR`. */
export function loadSet(setId: string): SampleSet {
  const hit = cache.get(setId);
  if (hit) return hit;
  const dir = `public/samples/${setId}`;
  const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8')) as SampleManifest;
  const layers = [...new Set(manifest.samples.map((s) => s.layer))].sort((a, b) => Math.abs(a - PREFERRED_LAYER) - Math.abs(b - PREFERRED_LAYER));
  const entries: AudioBufferEntry[] = manifest.samples
    .filter((s) => s.layer === (layers[0] ?? 0))
    .map((ref) => {
      const data = decode(`${dir}/${ref.file}`) as Float32Array;
      const buffer = { duration: data.length / SR, length: data.length, sampleRate: SR, numberOfChannels: 1, getChannelData: () => data } as unknown as AudioBuffer;
      return { ref, buffer };
    });
  const set = new SampleSet(entries);
  cache.set(setId, set);
  return set;
}

/** `useSamples: false` renders the string synth alone (the app's fallback voice). */
export function render(plucks: readonly PluckRequest[], inst: Instrument, { useSamples = true } = {}): Rendered {
  const end = Math.max(...plucks.map((p) => p.when)) + TAIL_SECONDS;
  const out = new Float32Array(Math.ceil(end * SR));
  const setId = SAMPLE_SET_BY_INSTRUMENT[inst.id];
  const set = setId && useSamples ? loadSet(setId) : null;
  const synth = new WorkletSandbox();
  const active = new Map<string, { start: number; buffer: Float32Array; rate: number; gain: number; stopAt: number }>();
  let recorded = 0;
  let synthesised = 0;
  const notes: { start: number; buffer: Float32Array; rate: number; gain: number; stopAt: number }[] = [];
  for (const r of [...plucks].sort((a, b) => a.when - b.when)) {
    const key = `${r.voice}:${r.string}`;
    const prev = active.get(key);
    if (prev) prev.stopAt = Math.min(prev.stopAt, r.when);
    const choice = !r.isMuted && !r.isPalmMuted ? set?.choose(r.string, r.midi) : null;
    if (choice) {
      const buffer = choice.buffer.getChannelData(0);
      const note = { start: r.when, buffer, rate: Math.pow(2, choice.detune / 1200), gain: Math.max(MIN_GAIN, Math.min(1, r.amp)) * SAMPLE_BUS, stopAt: Infinity };
      notes.push(note);
      active.set(key, note);
      synth.post({ type: 'damp', when: r.when, string: r.string });
      recorded++;
    } else {
      active.delete(key);
      synth.post(stringPluck(inst, r));
      synthesised++;
    }
  }
  for (const n of notes) mixNote(out, n);
  synth.renderInto(out);
  return { audio: out, recorded, synthesised };
}

/** Adds one recording, re-pitched by resampling, cut with the player's exponential release. */
function mixNote(out: Float32Array, n: { start: number; buffer: Float32Array; rate: number; gain: number; stopAt: number }): void {
  const first = Math.round(n.start * SR);
  const length = n.buffer.length / n.rate;
  for (let i = 0; i < length && first + i < out.length; i++) {
    const t = n.start + i / SR;
    const release = t > n.stopAt ? Math.exp(-(t - n.stopAt) / RELEASE_SECONDS) : 1;
    if (release < 1e-4) break;
    const pos = i * n.rate;
    const k = Math.floor(pos);
    const f = pos - k;
    const v = (n.buffer[k] ?? 0) * (1 - f) + (n.buffer[k + 1] ?? 0) * f;
    out[first + i] = (out[first + i] ?? 0) + v * n.gain * release;
  }
}

/** The string-bank AudioWorklet, unmodified, running in a sandbox that provides the worklet globals. */
class WorkletSandbox {
  private readonly scope: { currentTime: number; Bank?: new () => { port: { onmessage: (e: { data: unknown }) => void }; process: (i: unknown, o: Float32Array[][]) => boolean } };
  private readonly messages: unknown[] = [];

  constructor() {
    this.scope = { currentTime: 0 };
    const globals = {
      sampleRate: SR,
      AudioWorkletProcessor: class {
        port = { onmessage: (_e: unknown) => {}, postMessage: () => {} };
      },
      registerProcessor: (_name: string, cls: never) => {
        this.scope.Bank = cls;
      },
    };
    const context = vm.createContext(globals);
    Object.defineProperty(context, 'currentTime', { get: () => this.scope.currentTime });
    vm.runInContext(readFileSync('public/worklets/strings.js', 'utf8'), context);
  }

  post(message: unknown): void {
    this.messages.push(message);
  }

  renderInto(out: Float32Array): void {
    const Bank = this.scope.Bank;
    if (!Bank || !this.messages.some((m) => (m as { type: string }).type === 'pluck')) return;
    const bank = new Bank();
    for (const data of this.messages) bank.port.onmessage({ data });
    for (let start = 0; start < out.length; start += BLOCK) {
      this.scope.currentTime = start / SR;
      const L = new Float32Array(BLOCK);
      const R = new Float32Array(BLOCK);
      bank.process([], [[L, R]]);
      for (let i = 0; i < BLOCK && start + i < out.length; i++) out[start + i] = (out[start + i] ?? 0) + ((L[i] ?? 0) + (R[i] ?? 0)) / 2;
    }
  }
}
