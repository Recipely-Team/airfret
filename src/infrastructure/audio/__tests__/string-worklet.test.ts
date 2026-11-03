import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SR = 48000;
const BLOCK = 128;
const SOURCE = readFileSync('public/worklets/strings.js', 'utf8');

interface Processor {
  port: { onmessage: (e: { data: unknown }) => void };
  process(inputs: unknown[], outputs: Float32Array[][]): boolean;
}

/** Runs the worklet outside the browser with the globals AudioWorkletGlobalScope provides. */
function render(message: Record<string, unknown>, seconds = 1, later: Record<string, unknown>[] = []): Float32Array {
  let Proc: (new () => Processor) | undefined;
  const scope = {
    sampleRate: SR,
    currentTime: 0,
    AudioWorkletProcessor: class { port = { onmessage: (_e: { data: unknown }) => {} }; },
    registerProcessor: (_name: string, c: new () => Processor) => (Proc = c),
  };
  new Function('scope', `with (scope) { ${SOURCE} }`)(scope);
  const p = new Proc!();
  p.port.onmessage({ data: { type: 'pluck', when: 0, string: 0, amp: 0.8, t60: 4, bright: 0.6, pick: 0.12, pan: 0, stiffness: 0.1, ...message } });
  for (const m of later) p.port.onmessage({ data: { string: 0, ...m } });
  const out = new Float32Array(SR * seconds);
  for (let i = 0; i < out.length; i += BLOCK) {
    const L = new Float32Array(BLOCK);
    p.process([], [[L, new Float32Array(BLOCK)]]);
    scope.currentTime += BLOCK / SR;
    out.set(L.subarray(0, Math.min(BLOCK, out.length - i)), i);
  }
  return out;
}

/** Autocorrelation pitch over a window (default 0.2–0.5 s), refined with a parabola. */
function pitch(x: Float32Array, expected: number, from = 0.2, to = 0.5): number {
  const a = x.subarray(from * SR, to * SR);
  const corr = (lag: number) => a.reduce((s, v, i) => (i + lag < a.length ? s + v * (a[i + lag] ?? 0) : s), 0);
  let best = Math.floor(SR / (expected * 1.25));
  let bestCorr = -Infinity;
  for (let lag = best; lag < SR / (expected * 0.8); lag++) {
    const c = corr(lag);
    if (c > bestCorr) [best, bestCorr] = [lag, c];
  }
  const [y0, y1, y2] = [corr(best - 1), corr(best), corr(best + 1)];
  return SR / (best + (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2));
}

describe('string worklet', () => {
  it.each([41.2, 110, 329.63, 987.77])('is in tune at %f Hz (within 2 cents)', (freq) => {
    const cents = 1200 * Math.log2(pitch(render({ freq }), freq) / freq);
    expect(Math.abs(cents)).toBeLessThan(2);
  });

  it.each([0, 0.2, 0.35])('stays in tune with string stiffness %f (dispersion is compensated)', (stiffness) => {
    const cents = 1200 * Math.log2(pitch(render({ freq: 659.26, stiffness }), 659.26) / 659.26);
    expect(Math.abs(cents)).toBeLessThan(2);
  });

  it('bends a ringing string up a whole tone without re-plucking it', () => {
    const x = render({ freq: 196 }, 1, [{ type: 'retune', when: 0.3, freq: 220, glide: 0.08 }]);
    const cents = 1200 * Math.log2(pitch(x, 220, 0.5, 0.9) / 220);
    expect(Math.abs(cents)).toBeLessThan(3);
    expect(Math.max(...x.subarray(0.5 * SR).map(Math.abs))).toBeGreaterThan(0.05);
  });

  it('decays to silence quickly when palm-muted', () => {
    const x = render({ freq: 110, t60: 0.09 }, 0.5);
    expect(Math.max(...x.subarray(0.3 * SR).map(Math.abs))).toBeLessThan(1e-4);
  });
});
