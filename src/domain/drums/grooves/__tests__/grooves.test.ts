import { describe, expect, it } from 'vitest';
import { DrumArticulation } from '@domain/drums/drum-articulation';
import { DrumPiece } from '@domain/drums/drum-piece';
import { GROOVES } from '@domain/drums/grooves/groove-catalog';
import { parseGroove } from '@domain/drums/grooves/parse-groove';

describe('The grooves the drum kit plays by itself', () => {
  it('are written in whole bars on every lane', () => {
    for (const g of GROOVES) for (const [piece, lane] of Object.entries(g.lanes)) expect(lane.length % (g.beatsPerBar * g.subdiv), `${g.id} ${piece}`).toBe(0);
  });

  it('play a rock beat: snare on two and four, opened and closed by a crash', () => {
    const rock = parseGroove(GROOVES.find((g) => g.id === 'rock')!);
    const snare = rock.filter((h) => h.piece === DrumPiece.snare && h.beat < 4).map((h) => h.beat);
    expect(snare).toEqual([1, 3]);
    const crashes = rock.filter((h) => h.piece === DrumPiece.crash).map((h) => h.beat);
    expect(crashes).toEqual([0, 32]);
  });

  it('voice the hi-hat open, closed or by the pedal, and the snare as a rim click where written', () => {
    const disco = parseGroove(GROOVES.find((g) => g.id === 'disco')!);
    expect(disco.find((h) => h.piece === DrumPiece.hihat && h.beat === 0.5)?.articulation).toBe(DrumArticulation.hatOpen);
    const swing = parseGroove(GROOVES.find((g) => g.id === 'swing')!);
    expect(swing.some((h) => h.articulation === DrumArticulation.hatPedal)).toBe(true);
    const bossa = parseGroove(GROOVES.find((g) => g.id === 'bossa')!);
    expect(bossa.filter((h) => h.piece === DrumPiece.snare).every((h) => h.articulation === DrumArticulation.rim)).toBe(true);
  });
});
