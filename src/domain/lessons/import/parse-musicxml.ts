import { Failure } from '@core/failure/failure';
import { FailureCode } from '@core/failure/failure-code';
import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-factories';
import type { ImportedScore } from '@domain/lessons/import/imported-score';

const STEPS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const OCTAVE = 12;
const DEFAULT_BPM = 120;
const QUARTER_NOTES_PER_WHOLE = 4;

const tag = (xml: string, name: string) => new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml)?.[1]?.trim();
const has = (xml: string, name: string) => new RegExp(`<${name}[\\s/>]`).test(xml);

/**
 * A MusicXML score (an uncompressed `.musicxml` export from MuseScore, Sibelius, Finale…): its first part as notes
 * in quarter-note beats. Chords, rests, ties, several voices (`<backup>` / `<forward>`), the time signature and the
 * tempo are read; a compressed `.mxl` must be exported uncompressed first.
 */
export function parseMusicXml(xml: string): Result<ImportedScore, Failure> {
  if (!/<score-partwise[\s>]/.test(xml)) return fail(new Failure(FailureCode.unreadableScore, 'not a partwise MusicXML score'));
  const part = /<part\s[^>]*>([\s\S]*?)<\/part>/.exec(xml)?.[1] ?? '';
  const notes: { beat: number; dur: number; midi: number }[] = [];
  let divisions = 1;
  let beat = 0;
  let lastStart = 0;
  let beatsPerBar: number | null = null;
  const tempo = /<sound[^>]*\btempo="([\d.]+)"/.exec(part)?.[1];
  for (const m of part.matchAll(/<(note|backup|forward|attributes)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
    const [, kind, body = ''] = m;
    if (kind === 'attributes') {
      divisions = Number(tag(body, 'divisions') ?? divisions) || divisions;
      const beats = tag(body, 'beats');
      const type = tag(body, 'beat-type');
      if (beats && type && beatsPerBar === null) beatsPerBar = (Number(beats) * QUARTER_NOTES_PER_WHOLE) / Number(type);
      continue;
    }
    const dur = Number(tag(body, 'duration') ?? 0) / divisions;
    if (kind === 'backup') {
      beat -= dur;
      continue;
    }
    if (kind === 'forward') {
      beat += dur;
      continue;
    }
    if (has(body, 'grace')) continue;
    const isChord = has(body, 'chord');
    const start = isChord ? lastStart : beat;
    if (!isChord) {
      lastStart = beat;
      beat += dur;
    }
    if (has(body, 'rest')) continue;
    const step = tag(body, 'step');
    const octave = tag(body, 'octave');
    if (!step || octave === undefined) continue;
    const midi = (Number(octave) + 1) * OCTAVE + (STEPS[step] ?? 0) + Math.round(Number(tag(body, 'alter') ?? 0));
    // A tied continuation lengthens the note it continues.
    const prev = [...notes].reverse().find((n) => n.midi === midi && Math.abs(n.beat + n.dur - start) < 1e-6);
    if (/<tie[^>]*type="stop"/.test(body) && prev) prev.dur += dur;
    else notes.push({ beat: start, dur, midi });
  }
  if (!notes.length) return fail(new Failure(FailureCode.unreadableScore, 'no notes'));
  const title = tag(xml, 'work-title') ?? tag(xml, 'movement-title');
  return ok({ ...(title ? { title } : {}), bpm: Math.round(Number(tempo ?? DEFAULT_BPM)), beatsPerBar: beatsPerBar ?? 4, notes: notes.sort((a, b) => a.beat - b.beat || b.midi - a.midi) });
}
