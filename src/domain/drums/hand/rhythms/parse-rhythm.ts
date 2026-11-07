import type { RhythmStroke } from '@domain/drums/hand/rhythms/rhythm-stroke';

const PARTS: Readonly<Record<string, RhythmStroke['part']>> = { d: 'center', t: 'edge', k: 'edgeLeft' };
const LEVEL = { full: 0.9, ghost: 0.4 } as const;
const REST = '.';
const TOKEN = /^(\d?)([DTKdtk])$/;

/** The strokes of a rhythm's phrase looped `bars` times (see `HandRhythm`); null when a token is malformed. */
export function parseRhythm(phrase: string, subdiv: number, beatsPerBar: number, bars: number): RhythmStroke[] | null {
  const tokens = phrase.trim().split(/\s+/);
  const stepsPerBar = beatsPerBar * subdiv;
  const phraseBars = Math.max(1, Math.round(tokens.length / stepsPerBar));
  const strokes: RhythmStroke[] = [];
  for (let loop = 0; loop * phraseBars < bars; loop++) {
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i] ?? REST;
      if (tok === REST) continue;
      const beat = (loop * tokens.length + i) / subdiv;
      for (const part of tok.split('+')) {
        const m = TOKEN.exec(part);
        const letter = m?.[2];
        if (!m || !letter) return null;
        const kind = PARTS[letter.toLowerCase()];
        if (!kind) return null;
        strokes.push({ beat, head: Number(m[1] || 0), part: kind, velocity: letter === letter.toUpperCase() ? LEVEL.full : LEVEL.ghost });
      }
    }
  }
  return strokes;
}
