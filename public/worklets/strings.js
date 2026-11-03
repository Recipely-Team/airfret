// Extended Karplus–Strong string bank.
//
// One processor plays every string of the instrument. Each pluck allocates a
// voice; plucking a string again damps the voice already ringing on it, the
// way a real string is stopped by the next pick stroke.
//
// Messages (port):
//   { type: 'pluck', when, string, freq, amp, t60, bright, pick, pan }
//   { type: 'damp',  when, string }        string = -1 damps everything

const MAX_VOICES = 32;
const SILENCE = 1e-5;

class Voice {
  constructor(maxLen) {
    this.buf = new Float32Array(maxLen);
    this.active = false;
  }
}

class StringBank extends AudioWorkletProcessor {
  constructor() {
    super();
    const maxLen = Math.ceil(sampleRate / 25) + 8; // lowest supported pitch: 25 Hz
    this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(maxLen));
    this.queue = [];
    this.port.onmessage = (e) => {
      this.queue.push(e.data);
      this.queue.sort((a, b) => a.when - b.when);
    };
  }

  dampString(string) {
    for (const v of this.voices) {
      if (v.active && !v.releasing && (string < 0 || v.string === string)) {
        v.releasing = true;
        // -60 dB in ~35 ms: quick, but long enough not to click.
        v.release = Math.pow(10, -3 / (0.035 * sampleRate));
      }
    }
  }

  allocate() {
    let best = null;
    for (const v of this.voices) {
      if (!v.active) return v;
      if (!best || v.env * v.level < best.env * best.level) best = v;
    }
    return best;
  }

  pluck(m) {
    this.dampString(m.string);
    const v = this.allocate();
    const S = 0.5 - 0.45 * Math.min(1, Math.max(0, m.bright));
    const period = sampleRate / m.freq;
    let N = Math.floor(period - S - 0.1);
    N = Math.min(v.buf.length, Math.max(2, N));
    const d = period - S - N; // fractional delay for the allpass, in (0.1, 1.1]
    v.C = (1 - d) / (1 + d);
    v.N = N;
    v.S = S;
    v.g = Math.pow(10, -3 / (Math.max(0.01, m.t60) * m.freq));
    v.idx = 0;
    v.prev = 0;
    v.apIn = 0;
    v.apOut = 0;
    v.env = 1;
    v.level = m.amp;
    v.releasing = false;
    v.release = 1;
    v.string = m.string;
    v.quiet = 0;
    const p = Math.min(1, Math.max(-1, m.pan || 0));
    v.gl = Math.cos((p + 1) * Math.PI / 4);
    v.gr = Math.sin((p + 1) * Math.PI / 4);

    // Excitation: white noise → pick-position comb → velocity-dependent lowpass.
    const buf = v.buf;
    const noise = new Float32Array(N);
    for (let i = 0; i < N; i++) noise[i] = Math.random() * 2 - 1;
    const M = Math.max(1, Math.round((m.pick || 0.13) * N));
    // Softer strokes are darker: the lowpass coefficient rises as amp falls.
    const a = Math.min(0.92, Math.max(0, 0.75 - 0.55 * m.amp - 0.25 * m.bright + 0.2));
    let lp1 = 0;
    let lp2 = 0;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      const x = noise[i] - 0.9 * noise[(i - M + N) % N];
      lp1 = a * lp1 + (1 - a) * x;
      lp2 = a * lp2 + (1 - a) * lp1;
      buf[i] = lp2;
      mean += lp2;
    }
    mean /= N;
    let peak = 1e-9;
    for (let i = 0; i < N; i++) {
      buf[i] -= mean;
      peak = Math.max(peak, Math.abs(buf[i]));
    }
    for (let i = 0; i < N; i++) buf[i] /= peak;
    v.active = true;
  }

  handle(m) {
    if (m.type === 'pluck') this.pluck(m);
    else if (m.type === 'damp') this.dampString(m.string);
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    const L = out[0];
    const R = out[1] || out[0];
    const frames = L.length;
    const blockEnd = currentTime + frames / sampleRate;

    // Split the block at each scheduled event so plucks are sample-accurate.
    let start = 0;
    while (start < frames) {
      let end = frames;
      while (this.queue.length && this.queue[0].when < blockEnd) {
        const offset = Math.floor((this.queue[0].when - currentTime) * sampleRate);
        if (offset > start) { end = Math.min(end, offset); break; }
        this.handle(this.queue.shift());
      }
      this.render(L, R, start, end);
      start = end;
    }
    return true;
  }

  render(L, R, from, to) {
    for (const v of this.voices) {
      if (!v.active) continue;
      const { buf, N, S, C, g } = v;
      let { idx, prev, apIn, apOut, env } = v;
      const rel = v.release;
      const level = v.level;
      let blockPeak = 0;
      for (let i = from; i < to; i++) {
        const y0 = buf[idx];
        const lp = (1 - S) * y0 + S * prev;
        prev = y0;
        const ap = C * lp + apIn - C * apOut;
        apIn = lp;
        apOut = ap;
        buf[idx] = ap * g;
        if (++idx >= N) idx = 0;
        env *= rel;
        const s = y0 * env * level;
        L[i] += s * v.gl;
        R[i] += s * v.gr;
        const as = s < 0 ? -s : s;
        if (as > blockPeak) blockPeak = as;
      }
      v.idx = idx; v.prev = prev; v.apIn = apIn; v.apOut = apOut; v.env = env;
      if (blockPeak < SILENCE) {
        // Require a full period of silence so a zero crossing never kills a voice.
        v.quiet += to - from;
        if (v.quiet > N + 256) v.active = false;
      } else {
        v.quiet = 0;
      }
    }
  }
}

registerProcessor('string-bank', StringBank);
