import { describe, expect, it } from 'vitest';
import { HAND_DRUMS } from '@domain/drums/hand/hand-drum-catalog';
import { HAND_RHYTHMS, rhythmsFor } from '@domain/drums/hand/rhythms/hand-rhythm-catalog';
import { parseRhythm } from '@domain/drums/hand/rhythms/parse-rhythm';

describe('The rhythms the hand drums play by themselves', () => {
  it('give every hand drum at least two rhythms', () => {
    for (const d of HAND_DRUMS) expect(rhythmsFor(d.id).length, d.id).toBeGreaterThanOrEqual(2);
  });

  it('are written in whole bars, every stroke on a head the drum has', () => {
    for (const r of HAND_RHYTHMS) {
      const steps = r.phrase.trim().split(/\s+/).length;
      expect(steps % (r.beatsPerBar * r.subdiv), r.id).toBe(0);
      const strokes = parseRhythm(r.phrase, r.subdiv, r.beatsPerBar, r.bars);
      expect(strokes, r.id).not.toBeNull();
      for (const id of r.drums) {
        const drum = HAND_DRUMS.find((d) => d.id === id);
        expect(drum, `${r.id} on ${id}`).toBeDefined();
        for (const s of strokes ?? []) expect(drum!.heads[s.head], `${r.id} on ${id}`).toBeDefined();
      }
    }
  });

  it('read a maqsum as düm tek, tek düm, tek — with ghost strokes soft', () => {
    const s = parseRhythm('D T . T D . T . D T k T D k T k', 2, 4, 2)!;
    expect(s.slice(0, 5).map((x) => [x.beat, x.part])).toEqual([[0, 'center'], [0.5, 'edge'], [1.5, 'edge'], [2, 'center'], [3, 'edge']]);
    const ghost = s.find((x) => x.beat === 6.5)!;
    expect(ghost.part).toBe('edgeLeft');
    expect(ghost.velocity).toBeLessThan(0.5);
    expect(parseRhythm('0D+1T', 1, 1, 1)!.map((x) => x.head)).toEqual([0, 1]);
    expect(parseRhythm('D Q', 2, 1, 1)).toBeNull();
  });
});
