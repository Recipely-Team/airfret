// Standard MIDI File reader for the song tools: note-ons with start beat, length and velocity, plus the
// score's tempo and meter. All tracks are merged; beats are quarter notes.

/** Default tempo of a MIDI file without a tempo event (µs per quarter = 500 000). */
const DEFAULT_BPM = 120;
const MICROS_PER_MINUTE = 60e6;

export function parseMidi(buf) {
  let p = 0;
  const u32 = () => ((buf[p++] << 24) | (buf[p++] << 16) | (buf[p++] << 8) | buf[p++]) >>> 0;
  const u16 = () => (buf[p++] << 8) | buf[p++];
  const vlq = () => {
    let v = 0;
    let b;
    do {
      b = buf[p++];
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80);
    return v;
  };
  if (buf.toString('latin1', 0, 4) !== 'MThd') throw new Error('not a MIDI file');
  p = 10;
  const tracks = u16();
  const division = u16();
  p = 14;
  const notes = [];
  const tempos = [];
  let meter = null;
  for (let t = 0; t < tracks; t++) {
    while (buf.toString('latin1', p, p + 4) !== 'MTrk') p++;
    p += 4;
    const end = u32() + p;
    let tick = 0;
    let status = 0;
    const open = new Map();
    while (p < end) {
      tick += vlq();
      let s = buf[p];
      if (s & 0x80) p++;
      else s = status;
      if (s === 0xff) {
        const type = buf[p++];
        const len = vlq();
        if (type === 0x51) tempos.push({ beat: tick / division, bpm: MICROS_PER_MINUTE / ((buf[p] << 16) | (buf[p + 1] << 8) | buf[p + 2]) });
        if (type === 0x58 && !meter) meter = { numerator: buf[p], denominator: 2 ** buf[p + 1] };
        p += len;
        continue;
      }
      if (s === 0xf0 || s === 0xf7) {
        p += vlq();
        continue;
      }
      status = s;
      const kind = s & 0xf0;
      const a = buf[p++];
      const b = kind === 0xc0 || kind === 0xd0 ? 0 : buf[p++];
      const key = `${s & 0x0f}:${a}`;
      if (kind === 0x90 && b > 0) open.set(key, { tick, vel: b / 127 });
      else if (kind === 0x80 || (kind === 0x90 && b === 0)) {
        const start = open.get(key);
        if (start !== undefined) notes.push({ midi: a, beat: start.tick / division, dur: (tick - start.tick) / division, vel: start.vel });
        open.delete(key);
      }
    }
    p = end;
  }
  notes.sort((x, y) => x.beat - y.beat || y.midi - x.midi);
  const distinct = [...new Map(tempos.map((x) => [x.beat, x])).values()].sort((x, y) => x.beat - y.beat);
  return { notes, tempos: distinct.length ? distinct : [{ beat: 0, bpm: DEFAULT_BPM }], meter: meter ?? { numerator: 4, denominator: 4 } };
}
