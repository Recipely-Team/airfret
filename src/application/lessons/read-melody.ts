import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import { noteToMidi } from '@domain/music/pitch';

/** A melody read from what the player typed or pasted, in the song notation ("G4:1 r:0.5"). */
export interface Melody {
  readonly notes: string;
  /** From pasted JSON only; otherwise the form's tempo and meter apply. */
  readonly bpm?: number;
  readonly beatsPerBar?: number;
}

const REST = 'r';
/** "G4:1", "r:0.5", "E4+B3:1/3": pitch (or several joined with +) : beats. */
const TOKEN = /^(r|[A-Ga-g][#b]?-?\d(\+[A-Ga-g][#b]?-?\d)*):(\d+(\.\d+)?|\d+\/\d+)$/;

/**
 * Reads a melody, or returns null when the text isn't one (then it is read as chords).
 *
 * @remarks
 * - Text: tokens in the song notation, `G4:1 A4:0.5 r:1`.
 * - JSON, as melody tools export it: `{ "tempo": 108, "timeSignature": "4/4", "notes": [{ "note": "G4",
 *   "duration": 1 }, { "note": null, "duration": 1 }] }` — `null` is a rest, durations are in beats.
 */
export function readMelody(text: string): Result<Melody, Failure> | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return fromJson(trimmed);
  const tokens = trimmed.split(/[\s,|]+/).filter(Boolean);
  if (!tokens.length || !tokens.some((tok) => TOKEN.test(tok) && !tok.startsWith(`${REST}:`))) return null;
  const bad = tokens.find((tok) => !TOKEN.test(tok) || !pitchesOk(tok));
  if (bad !== undefined) return fail(new Failure(FailureCode.invalidChart, `custom.error.note:${bad}`));
  return ok({ notes: tokens.join(' ') });
}

function pitchesOk(token: string): boolean {
  const [pitches = ''] = token.split(':');
  return pitches === REST || pitches.split('+').every((p) => noteToMidi(p) !== null);
}

function fromJson(text: string): Result<Melody, Failure> {
  const broken = fail(new Failure(FailureCode.invalidChart, 'custom.error.json'));
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return broken;
  }
  if (typeof data !== 'object' || data === null) return broken;
  const { tempo, timeSignature, notes } = data as { tempo?: unknown; timeSignature?: unknown; notes?: unknown };
  if (!Array.isArray(notes) || !notes.length) return broken;
  const tokens: string[] = [];
  for (const n of notes as unknown[]) {
    const { note, duration } = (typeof n === 'object' && n !== null ? n : {}) as { note?: unknown; duration?: unknown };
    if (typeof duration !== 'number' || !(duration > 0)) return broken;
    if (note !== null && note !== undefined && typeof note !== 'string') return broken;
    const pitch = note ?? REST;
    const token = `${pitch}:${duration}`;
    if (!TOKEN.test(token) || !pitchesOk(token)) return fail(new Failure(FailureCode.invalidChart, `custom.error.note:${pitch}`));
    tokens.push(token);
  }
  const meter = typeof timeSignature === 'string' ? Number(timeSignature.split('/')[0]) : NaN;
  return ok({
    notes: tokens.join(' '),
    ...(typeof tempo === 'number' ? { bpm: tempo } : {}),
    ...(meter > 0 ? { beatsPerBar: meter } : {}),
  });
}
