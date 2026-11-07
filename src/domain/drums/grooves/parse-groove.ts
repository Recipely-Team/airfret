import { DrumArticulation } from '@domain/drums/drum-articulation';
import { DrumPiece } from '@domain/drums/drum-piece';
import type { Groove } from '@domain/drums/grooves/groove';
import type { GrooveHit } from '@domain/drums/grooves/groove-hit';

const LEVEL = { accent: 1, hit: 0.75, ghost: 0.3 } as const;
const REST = '.';

/** A groove's hits, every lane looped to `bars` bars, a crash opening it and closing it on the next downbeat. */
export function parseGroove(g: Groove): GrooveHit[] {
  const hits: GrooveHit[] = [];
  const stepsPerBar = g.beatsPerBar * g.subdiv;
  for (const [piece, lane] of Object.entries(g.lanes) as [DrumPiece, string][]) {
    const steps = lane.replace(/\s+/g, '');
    const phraseBars = Math.max(1, Math.round(steps.length / stepsPerBar));
    for (let loop = 0; loop * phraseBars < g.bars; loop++) {
      for (let i = 0; i < steps.length; i++) {
        const ch = steps.charAt(i);
        if (ch === REST) continue;
        hits.push({ beat: (loop * steps.length + i) / g.subdiv, piece, velocity: level(ch), articulation: articulation(piece, ch) });
      }
    }
  }
  const end = g.bars * g.beatsPerBar;
  hits.push({ beat: 0, piece: DrumPiece.crash, velocity: LEVEL.accent, articulation: DrumArticulation.normal });
  hits.push({ beat: end, piece: DrumPiece.crash, velocity: LEVEL.accent, articulation: DrumArticulation.normal });
  hits.push({ beat: end, piece: DrumPiece.kick, velocity: LEVEL.accent, articulation: DrumArticulation.normal });
  return hits.sort((a, b) => a.beat - b.beat);
}

function level(ch: string): number {
  if (ch === 'X') return LEVEL.accent;
  if (ch === 'g') return LEVEL.ghost;
  return LEVEL.hit;
}

function articulation(piece: DrumPiece, ch: string): DrumArticulation {
  if (piece === DrumPiece.hihat) return ch === 'o' ? DrumArticulation.hatOpen : ch === 'p' ? DrumArticulation.hatPedal : DrumArticulation.hatClosed;
  if (piece === DrumPiece.snare && ch === 'r') return DrumArticulation.rim;
  if (piece === DrumPiece.ride && ch === 'b') return DrumArticulation.bell;
  return DrumArticulation.normal;
}
