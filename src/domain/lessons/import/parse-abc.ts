import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { ImportedScore } from '@domain/lessons/import/imported-score';

const LETTERS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Sharps are added in this order, flats in the reverse. */
const SHARP_ORDER = 'FCGDAEB';
/** Major keys by number of sharps (negative: flats). */
const MAJOR_KEYS: Readonly<Record<string, number>> = { Cb: -7, Gb: -6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7 };
/** A mode's offset from its relative major, in sharps. */
const MODES: Readonly<Record<string, number>> = { maj: 0, ion: 0, m: -3, min: -3, aeo: -3, mix: -1, dor: -2, phr: -4, lyd: 1, loc: -5 };
const MIDDLE_C = 60;
const OCTAVE = 12;
const QUARTER_NOTES_PER_WHOLE = 4;
const DEFAULT_BPM = 120;
const TOKEN = /\[\d|\|:|:\||::|\||\[[^\]]*\]\d*\/*\d*|\(\d|[_^=]*[A-Ga-g][',]*\d*\/*\d*|[zx]\d*\/*\d*|[<>]+|-|"[^"]*"|![^!]*!|\{[^}]*\}|./g;

/** The sharps (+1) and flats (−1) a key signature puts on each letter, from a K: field such as "G", "Dm", "Bb mix". */
function keySignature(field: string): Map<string, number> {
  const m = /^\s*([A-G][#b]?)\s*([A-Za-z]*)/.exec(field);
  const root = m?.[1] ?? 'C';
  const mode = (m?.[2] ?? '').toLowerCase().slice(0, 3);
  const count = (MAJOR_KEYS[root] ?? 0) + (MODES[mode] ?? (mode === '' ? 0 : MODES[mode.slice(0, 1)] ?? 0));
  const sig = new Map<string, number>();
  const n = Math.max(-7, Math.min(7, count));
  for (let i = 0; i < Math.abs(n); i++) sig.set(n > 0 ? (SHARP_ORDER[i] ?? 'F') : (SHARP_ORDER[SHARP_ORDER.length - 1 - i] ?? 'B'), n > 0 ? 1 : -1);
  return sig;
}

/** "3/2", "/", "//", "2" after a note: its length as a multiple of the unit. */
function lengthOf(text: string): number {
  if (!text) return 1;
  const m = /^(\d*)(\/*)(\d*)$/.exec(text);
  if (!m) return 1;
  const num = m[1] ? Number(m[1]) : 1;
  const slashes = (m[2] ?? '').length;
  const den = m[3] ? Number(m[3]) : 2 ** slashes;
  return slashes ? num / den : num;
}

/**
 * An ABC tune (abcnotation.com, The Session…): its first tune's notes in quarter-note beats. Reads the key, meter,
 * unit length and tempo; accidentals last to the bar line; ties, broken rhythm (`>`), triplets, chords and repeats
 * with first and second endings. Grace notes, decorations and chord symbols are skipped.
 */
export function parseAbc(source: string): Result<ImportedScore, Failure> {
  const lines = source.split(/\r?\n/);
  const field = (k: string) => lines.find((l) => l.startsWith(`${k}:`))?.slice(2).trim();
  const keyLine = lines.findIndex((l) => l.startsWith('K:'));
  if (keyLine < 0) return fail(new Failure(FailureCode.unreadableScore, 'no K: line'));
  const meterText = field('M') ?? '4/4';
  const [mn, md] = meterText === 'C' || meterText === 'C|' ? [4, 4] : meterText.split('/').map(Number);
  const meter = (mn ?? 4) / (md ?? 4);
  const unitText = field('L');
  const unit = unitText ? lengthOf(unitText.replace(/^1/, '')) : meter < 0.75 ? 1 / 16 : 1 / 8;
  const unitBeats = unit * QUARTER_NOTES_PER_WHOLE;
  const q = field('Q');
  const bpmMatch = q ? /(?:(\d+)\/(\d+)\s*=\s*)?(\d+)/.exec(q) : null;
  const bpm = bpmMatch ? Number(bpmMatch[3]) * (bpmMatch[1] ? (Number(bpmMatch[1]) / Number(bpmMatch[2])) * QUARTER_NOTES_PER_WHOLE : 1) : DEFAULT_BPM;
  const sig = keySignature(field('K') ?? 'C');
  const body = lines.slice(keyLine + 1).filter((l) => !/^[A-Za-z]:/.test(l) && !l.startsWith('%')).join(' ');
  const tokens = body.match(TOKEN) ?? [];
  const passes = expandRepeats(tokens);
  const notes: { beat: number; dur: number; midi: number }[] = [];
  let beat = 0;
  let bar = new Map<string, number>();
  let tuplet = { left: 0, scale: 1 };
  let broken = 1;
  let isTied = false;
  const add = (pitches: number[], len: number): number => {
    const dur = len * unitBeats * broken * (tuplet.left > 0 ? tuplet.scale : 1);
    broken = 1;
    if (tuplet.left > 0) tuplet.left--;
    for (const midi of pitches) {
      const last = notes[notes.length - 1];
      if (isTied && last && last.midi === midi && Math.abs(last.beat + last.dur - beat) < 1e-6) last.dur += dur;
      else notes.push({ beat, dur, midi });
    }
    isTied = false;
    return dur;
  };
  for (let i = 0; i < passes.length; i++) {
    const tok = passes[i] ?? '';
    if (tok === '|' || tok === '|:' || tok === ':|' || tok === '::') {
      bar = new Map();
      continue;
    }
    if (tok === '-') {
      isTied = true;
      continue;
    }
    if (/^[<>]+$/.test(tok)) {
      // a>b: the first dotted, the second halved (and the reverse); the first is already placed.
      const factor = tok.startsWith('>') ? 1.5 : 0.5;
      const prev = notes[notes.length - 1];
      if (prev) {
        const was = prev.dur;
        prev.dur = was * factor;
        beat += prev.dur - was;
      }
      broken = 2 - factor;
      continue;
    }
    if (/^\(\d$/.test(tok)) {
      const n = Number(tok.slice(1));
      tuplet = { left: n, scale: n === 3 ? 2 / 3 : n === 2 ? 1.5 : n === 4 ? 0.75 : 2 / 3 };
      continue;
    }
    const rest = /^[zx](.*)$/.exec(tok);
    if (rest) {
      beat += add([], lengthOf(rest[1] ?? ''));
      continue;
    }
    const chord = /^\[([^\]|]*)\](\d*\/*\d*)$/.exec(tok);
    const single = /^[_^=]*[A-Ga-g][',]*(\d*\/*\d*)$/.exec(tok);
    if (!chord && !single) continue;
    const parts = chord ? (chord[1]?.match(/[_^=]*[A-Ga-g][',]*\d*\/*\d*/g) ?? []) : [tok];
    const pitches = parts.map((part) => pitchOf(part, sig, bar));
    const len = chord ? lengthOf(chord[2] ?? '') || lengthOf(/\d*\/*\d*$/.exec(parts[0] ?? '')?.[0] ?? '') : lengthOf(single?.[1] ?? '');
    beat += add(pitches, len);
  }
  if (!notes.length) return fail(new Failure(FailureCode.unreadableScore, 'no notes'));
  const title = field('T');
  return ok({ ...(title ? { title } : {}), bpm: Math.round(bpm), beatsPerBar: meter * QUARTER_NOTES_PER_WHOLE, notes });
}

/** One note's pitch: its letter and octave marks, its own accidental (kept for the rest of the bar) or the key's. */
function pitchOf(note: string, sig: Map<string, number>, bar: Map<string, number>): number {
  const m = /^([_^=]*)([A-Ga-g])([',]*)/.exec(note);
  const letter = (m?.[2] ?? 'C').toUpperCase();
  const isLower = m?.[2] === m?.[2]?.toLowerCase();
  const marks = m?.[3] ?? '';
  const octave = (isLower ? 1 : 0) + (marks.match(/'/g)?.length ?? 0) - (marks.match(/,/g)?.length ?? 0);
  const acc = m?.[1] ?? '';
  const key = `${letter}${octave}`;
  if (acc) bar.set(key, acc.startsWith('=') ? 0 : acc.startsWith('^') ? acc.length : -acc.length);
  const shift = bar.get(key) ?? sig.get(letter) ?? 0;
  return MIDDLE_C + octave * OCTAVE + (LETTERS[letter] ?? 0) + shift;
}

/** The tokens in playing order: |: … :| sections twice, the first time through [1, the second through [2. */
function expandRepeats(tokens: readonly string[]): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '|:') start = out.length;
    if (tok === ':|' || tok === '::') {
      const section = out.slice(start);
      const firstEnding = section.indexOf('[1');
      out.push(...(firstEnding >= 0 ? section.slice(0, firstEnding) : section));
      // Skip the second time's [1 ending: it continues at [2.
      if (tokens[i + 1] === '[2') i++;
      start = out.length;
      continue;
    }
    if (tok !== '[1' && tok !== '[2' && tok !== undefined) out.push(tok);
    else if (tok === '[1') out.push('[1');
  }
  return out.filter((t) => t !== '[1');
}
