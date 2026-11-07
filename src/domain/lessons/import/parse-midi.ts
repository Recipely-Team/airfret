import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { ImportedScore } from '@domain/lessons/import/imported-score';

const DEFAULT_BPM = 120;
const MICROS_PER_MINUTE = 60e6;
const HEADER = 'MThd';
const TRACK = 'MTrk';
const META = 0xff;
const SYSEX = [0xf0, 0xf7];
const TEMPO = 0x51;
const METER = 0x58;
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
/** Program change and channel pressure carry one data byte, every other channel message two. */
const ONE_BYTE = [0xc0, 0xd0];
/** General MIDI channel 10 is percussion: no pitches to play. */
const DRUM_CHANNEL = 9;

/** A Standard MIDI File (every track merged, drums left out) as notes in quarter-note beats, with its first tempo and meter. */
export function parseMidi(bytes: Uint8Array): Result<ImportedScore, Failure> {
  const text = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (bytes.length < 14 || text(0) !== HEADER) return fail(new Failure(FailureCode.unreadableScore, 'not a MIDI file'));
  let p = 10;
  const byte = () => bytes[p++] ?? 0;
  const u16 = () => (byte() << 8) | byte();
  const u32 = () => ((byte() << 24) | (byte() << 16) | (byte() << 8) | byte()) >>> 0;
  const vlq = () => {
    let v = 0;
    let b: number;
    do {
      b = byte();
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80 && p < bytes.length);
    return v;
  };
  const tracks = u16();
  const division = u16() || 1;
  const notes: { beat: number; dur: number; midi: number }[] = [];
  let bpm: number | null = null;
  let beatsPerBar: number | null = null;
  for (let t = 0; t < tracks && p < bytes.length; t++) {
    while (p < bytes.length && text(p) !== TRACK) p++;
    p += 4;
    const end = Math.min(bytes.length, u32() + p);
    let tick = 0;
    let status = 0;
    const open = new Map<string, number>();
    while (p < end) {
      tick += vlq();
      let s = bytes[p] ?? 0;
      if (s & 0x80) p++;
      else s = status;
      if (s === META) {
        const type = byte();
        const len = vlq();
        if (type === TEMPO && bpm === null) bpm = MICROS_PER_MINUTE / (((bytes[p] ?? 0) << 16) | ((bytes[p + 1] ?? 0) << 8) | (bytes[p + 2] ?? 0));
        if (type === METER && beatsPerBar === null) beatsPerBar = ((bytes[p] ?? 4) * 4) / 2 ** (bytes[p + 1] ?? 2);
        p += len;
        continue;
      }
      if (SYSEX.includes(s)) {
        // Read the length first: `p += vlq()` would add it to p as it was before the length was read.
        const skip = vlq();
        p += skip;
        continue;
      }
      status = s;
      const kind = s & 0xf0;
      const a = byte();
      const b = ONE_BYTE.includes(kind) ? 0 : byte();
      if ((s & 0x0f) === DRUM_CHANNEL) continue;
      const key = `${s & 0x0f}:${a}`;
      if (kind === NOTE_ON && b > 0) open.set(key, tick);
      else if (kind === NOTE_OFF || kind === NOTE_ON) {
        const start = open.get(key);
        if (start !== undefined) notes.push({ beat: start / division, dur: (tick - start) / division, midi: a });
        open.delete(key);
      }
    }
    p = end;
  }
  if (!notes.length) return fail(new Failure(FailureCode.unreadableScore, 'no notes'));
  return ok({ bpm: Math.round(bpm ?? DEFAULT_BPM), beatsPerBar: beatsPerBar ?? 4, notes: notes.sort((x, y) => x.beat - y.beat || y.midi - x.midi) });
}
