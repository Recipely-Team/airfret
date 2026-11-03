// Physical string bank — extended Karplus–Strong with a fractional, time-varying delay line.
//
// Each voice is a digital waveguide loop:
//   delay line (cubic Hermite fractional read) → loss + brightness filter → dispersion allpass → back in.
// The loop delay is period − (filter delays), so pitch is exact, and because the read point is
// fractional and can move while the string rings, the same voice can bend, slide and hammer on.
//
// Messages (port):
//   { type: 'pluck',  when, string, freq, amp, t60, bright, pick, pan, stiffness }
//   { type: 'retune', when, string, freq, glide, excite, t60 }  legato pitch change on a ringing string
//   { type: 'damp',   when, string }                            string = -1 damps everything

const MAX_VOICES = 32;
const BUF = 8192; // power of two: covers periods down to ~6 Hz at 48 kHz
const MASK = BUF - 1;
const SILENCE = 1e-5;

class Voice {
  constructor() {
    this.buf = new Float32Array(BUF);
    this.active = false;
  }
}

class StringBank extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = Array.from({ length: MAX_VOICES }, () => new Voice());
    this.queue = [];
    this.port.onmessage = (e) => {
      this.queue.push(e.data);
      this.queue.sort((a, b) => a.when - b.when);
    };
  }

  /**
   * Phase delay (samples) of the loop filters at angular frequency w, so the delay line can be
   * shortened by exactly that much and the fundamental lands on pitch:
   *   two-tap lowpass  H1 = (1−S) + S·e^{−jw}
   *   allpass          H2 = (a + e^{−jw}) / (1 + a·e^{−jw})
   */
  static filterDelay(S, a, w) {
    const phi1 = -Math.atan2(S * Math.sin(w), 1 - S + S * Math.cos(w));
    const phi2 = Math.atan2(-Math.sin(w), a + Math.cos(w)) - Math.atan2(-a * Math.sin(w), 1 + a * Math.cos(w));
    return -(phi1 + phi2) / w;
  }

  setPitch(v, freq, glideSeconds) {
    const period = sampleRate / freq;
    const w = (2 * Math.PI * freq) / sampleRate;
    v.target = Math.max(4, period - StringBank.filterDelay(v.S, v.ap, w));
    // One-pole glide towards the new delay; ~5 time constants per glide time.
    v.glide = glideSeconds > 0 ? 1 - Math.exp(-5 / (glideSeconds * sampleRate)) : 1;
    if (v.glide === 1) v.delay = v.target;
    v.g = Math.pow(10, -3 / (Math.max(0.01, v.t60) * freq));
    v.freq = freq;
  }

  dampString(string) {
    for (const v of this.voices) {
      if (v.active && !v.releasing && (string < 0 || v.string === string)) {
        v.releasing = true;
        v.release = Math.pow(10, -3 / (0.035 * sampleRate)); // −60 dB in ~35 ms, no click
      }
    }
  }

  ringing(string) {
    return this.voices.find((v) => v.active && !v.releasing && v.string === string);
  }

  allocate() {
    let best = null;
    for (const v of this.voices) {
      if (!v.active) return v;
      if (!best || v.env * v.level < best.env * best.level) best = v;
    }
    return best;
  }

  /** Writes a pick-shaped noise burst into the last `period` samples of the line. */
  excite(v, amp, bright, pick) {
    const N = Math.max(2, Math.round(v.delay));
    const M = Math.max(1, Math.round(pick * N));
    const noise = new Float32Array(N);
    for (let i = 0; i < N; i++) noise[i] = Math.random() * 2 - 1;
    // Softer strokes are darker: the excitation lowpass closes as amplitude falls.
    const a = Math.min(0.92, Math.max(0, 0.95 - 0.55 * amp - 0.25 * bright));
    let lp1 = 0;
    let lp2 = 0;
    let mean = 0;
    const shaped = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // Comb at the pick point: plucking at 1/k of the length removes every k-th harmonic.
      const x = noise[i] - 0.9 * noise[(i - M + N) % N];
      lp1 = a * lp1 + (1 - a) * x;
      lp2 = a * lp2 + (1 - a) * lp1;
      shaped[i] = lp2;
      mean += lp2;
    }
    mean /= N;
    let peak = 1e-9;
    for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(shaped[i] - mean));
    for (let i = 0; i < N; i++) {
      const idx = (v.w - N + i + BUF) & MASK;
      v.buf[idx] = v.buf[idx] * (1 - amp) + ((shaped[i] - mean) / peak) * amp;
    }
  }

  pluck(m) {
    this.dampString(m.string);
    const v = this.allocate();
    v.buf.fill(0);
    v.w = 0;
    v.S = 0.5 - 0.45 * Math.min(1, Math.max(0, m.bright));
    // Stiff strings: negative allpass coefficient → upper partials slightly sharp (inharmonicity).
    v.ap = -Math.min(0.35, Math.max(0, m.stiffness ?? 0.1));
    v.t60 = m.t60;
    v.prev = 0;
    v.apX = 0;
    v.apY = 0;
    v.env = 1;
    v.level = 1;
    v.amp = m.amp;
    v.releasing = false;
    v.release = 1;
    v.string = m.string;
    v.quiet = 0;
    const p = Math.min(1, Math.max(-1, m.pan || 0));
    v.gl = Math.cos(((p + 1) * Math.PI) / 4);
    v.gr = Math.sin(((p + 1) * Math.PI) / 4);
    this.setPitch(v, m.freq, 0);
    this.excite(v, 1, m.bright, m.pick || 0.13);
    v.level = m.amp;
    v.active = true;
  }

  retune(m) {
    const v = this.ringing(m.string);
    if (!v) return;
    if (m.t60) v.t60 = m.t60;
    this.setPitch(v, m.freq, m.glide || 0);
    // A hammer-on or pull-off puts a little new energy into the string.
    if (m.excite > 0) this.excite(v, Math.min(0.6, m.excite), 0.4, 0.2);
  }

  handle(m) {
    if (m.type === 'pluck') this.pluck(m);
    else if (m.type === 'retune') this.retune(m);
    else if (m.type === 'damp') this.dampString(m.string);
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    const L = out[0];
    const R = out[1] || out[0];
    const frames = L.length;
    const blockEnd = currentTime + frames / sampleRate;
    let start = 0;
    while (start < frames) {
      let end = frames;
      while (this.queue.length && this.queue[0].when < blockEnd) {
        const offset = Math.floor((this.queue[0].when - currentTime) * sampleRate);
        if (offset > start) {
          end = Math.min(end, offset);
          break;
        }
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
      const buf = v.buf;
      const S = v.S;
      const ap = v.ap;
      const g = v.g;
      const rel = v.release;
      const level = v.level;
      let { w, prev, apX, apY, env, delay } = v;
      let blockPeak = 0;
      for (let i = from; i < to; i++) {
        delay += (v.target - delay) * v.glide;
        // Cubic Hermite read at w − delay.
        const pos = w - delay;
        const i1 = Math.floor(pos);
        const f = pos - i1;
        const xm1 = buf[(i1 - 1) & MASK];
        const x0 = buf[i1 & MASK];
        const x1 = buf[(i1 + 1) & MASK];
        const x2 = buf[(i1 + 2) & MASK];
        const c1 = 0.5 * (x1 - xm1);
        const c2 = xm1 - 2.5 * x0 + 2 * x1 - 0.5 * x2;
        const c3 = 0.5 * (x2 - xm1) + 1.5 * (x0 - x1);
        const y = ((c3 * f + c2) * f + c1) * f + x0;
        // Loss + brightness: two-tap lowpass (delay S).
        const lp = (1 - S) * y + S * prev;
        prev = y;
        // Dispersion allpass.
        const d = ap * lp + apX - ap * apY;
        apX = lp;
        apY = d;
        buf[w & MASK] = d * g;
        w = (w + 1) & MASK;
        env *= rel;
        const s = y * env * level;
        L[i] += s * v.gl;
        R[i] += s * v.gr;
        const as = s < 0 ? -s : s;
        if (as > blockPeak) blockPeak = as;
      }
      v.w = w;
      v.prev = prev;
      v.apX = apX;
      v.apY = apY;
      v.env = env;
      v.delay = delay;
      if (blockPeak < SILENCE) {
        v.quiet += to - from;
        if (v.quiet > delay + 256) v.active = false;
      } else {
        v.quiet = 0;
      }
    }
  }
}

registerProcessor('string-bank', StringBank);
