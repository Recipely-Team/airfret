// Renders one plucked note from the real worklet (public/worklets/strings.js) outside the browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SR } from './analyze.mjs';

const SOURCE = readFileSync(fileURLToPath(new URL('../../public/worklets/strings.js', import.meta.url)), 'utf8');
const BLOCK = 128;

export function renderNote({ freq, amp = 0.8, t60, bright, pick, stiffness, seconds = 3 }) {
  let Proc;
  const scope = {
    sampleRate: SR,
    currentTime: 0,
    AudioWorkletProcessor: class { port = { onmessage: () => {} }; },
    registerProcessor: (_n, c) => (Proc = c),
  };
  new Function('scope', `with (scope) { ${SOURCE} }`)(scope);
  const p = new Proc();
  p.port.onmessage({ data: { type: 'pluck', when: 0, string: 0, freq, amp, t60, bright, pick, pan: 0, stiffness } });
  const out = new Float32Array(Math.round(SR * seconds));
  for (let i = 0; i < out.length; i += BLOCK) {
    const L = new Float32Array(BLOCK);
    p.process([], [[L, new Float32Array(BLOCK)]]);
    scope.currentTime += BLOCK / SR;
    out.set(L.subarray(0, Math.min(BLOCK, out.length - i)), i);
  }
  return out;
}
