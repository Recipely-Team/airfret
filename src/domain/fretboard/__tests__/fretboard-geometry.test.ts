import { describe, expect, it } from 'vitest';
import { chordSlots, slotAt } from '@domain/fretboard/chord-grid';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { fretAt, onStrumSide, strumStringYs } from '@domain/fretboard/neck-geometry';

const l = computeLayout(1440, 900, 6, false, 12);
const mid = (n: number) => ((l.fretX[n - 1] ?? 0) + (l.fretX[n] ?? 0)) / 2;

describe('fretboard geometry', () => {
  it('maps each fret zone on the neck to its fret number', () => {
    for (const n of [1, 5, 12]) expect(fretAt(l, { x: mid(n), y: l.centerY })).toBe(n);
  });

  it('reads the strum area as "not on the neck" (open strings)', () => {
    expect(fretAt(l, { x: l.strumX0, y: l.centerY })).toBe(0);
  });

  it('finds every chord box in a two-row grid by its centre', () => {
    for (const s of chordSlots(l, 8)) expect(slotAt(l, 8, { x: (s.x0 + s.x1) / 2, y: (s.y0 + s.y1) / 2 })).toBe(s.index);
  });

  it('mirrors the whole instrument for left-handed players', () => {
    const r = computeLayout(1440, 900, 6, true, 12);
    expect(r.nutX).toBeGreaterThan(r.neckEndX);
    expect(onStrumSide(r, { x: 100, y: 0 })).toBe(true);
    for (const s of chordSlots(r, 4)) expect(slotAt(r, 4, { x: (s.x0 + s.x1) / 2, y: r.centerY })).toBe(s.index);
  });

  it('draws the lowest string on top', () => {
    const ys = strumStringYs(l);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1]!);
  });
});
