import { describe, expect, it } from 'vitest';
import { Lesson, parseSong } from '../src/lesson/lesson';
import { SONGS } from '../src/lesson/songs';
import { BASS_TUNING, chordNotes, findPosition, GUITAR_TUNING, knownChord, noteToMidi } from '../src/music/theory';
import { chordSlots, computeLayout, fretAt, slotAt, strumStringYs } from '../src/play/layout';
import { StrumDetector } from '../src/play/strum';

const H = 800;
const ys = [300, 340, 380, 420, 460, 500];

describe('StrumDetector', () => {
  it('fires every string once, low to high, on a fast downstroke', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 250 }, 0, ys, H);
    const out = d.update({ x: 0, y: 560 }, 0.033, ys, H);
    expect(out.map((c) => c.string)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(out.every((c) => c.dir === 1)).toBe(true);
    // Sub-frame timing increases monotonically through the strum.
    for (let i = 1; i < out.length; i++) expect(out[i].frac).toBeGreaterThan(out[i - 1].frac);
  });

  it('reverses order on an upstroke', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 560 }, 0, ys, H);
    const out = d.update({ x: 0, y: 250 }, 0.033, ys, H);
    expect(out.map((c) => c.string)).toEqual([5, 4, 3, 2, 1, 0]);
  });

  it('ignores jitter around a string', () => {
    const d = new StrumDetector();
    let fired = 0;
    for (let i = 0; i < 60; i++) {
      fired += d.update({ x: 0, y: 380 + (i % 2 ? 4 : -4) }, i / 30, ys, H).length;
    }
    expect(fired).toBe(0);
  });

  it('does not strum when the hand reappears somewhere else', () => {
    const d = new StrumDetector();
    d.update({ x: 0, y: 250 }, 0, ys, H);
    d.update(null, 0.1, ys, H);
    d.update(null, 0.3, ys, H);
    expect(d.update({ x: 0, y: 560 }, 0.33, ys, H)).toEqual([]);
  });
});

describe('layout', () => {
  const l = computeLayout(1440, 900, 6, false);

  it('maps neck positions to frets in order', () => {
    const y = l.centerY;
    expect(fretAt(l, { x: (l.fretX[0] + l.fretX[1]) / 2, y })).toBe(1);
    expect(fretAt(l, { x: (l.fretX[4] + l.fretX[5]) / 2, y })).toBe(5);
    expect(fretAt(l, { x: (l.fretX[11] + l.fretX[12]) / 2, y })).toBe(12);
    expect(fretAt(l, { x: l.strumX0, y })).toBe(0);
  });

  it('finds chord slots in both rows', () => {
    const slots = chordSlots(l, 8);
    for (const s of slots) {
      expect(slotAt(l, 8, { x: (s.x0 + s.x1) / 2, y: (s.y0 + s.y1) / 2 })).toBe(s.index);
    }
  });

  it('mirrors for left-handed players', () => {
    const r = computeLayout(1440, 900, 6, true);
    expect(r.nutX).toBeGreaterThan(r.neckEndX);
    const slots = chordSlots(r, 4);
    for (const s of slots) {
      expect(slotAt(r, 4, { x: (s.x0 + s.x1) / 2, y: r.centerY })).toBe(s.index);
    }
  });

  it('spaces strum strings top to bottom', () => {
    const s = strumStringYs(l);
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
  });
});

describe('theory', () => {
  it('voices chords on guitar and bass', () => {
    expect(chordNotes('C', GUITAR_TUNING)).toEqual([null, 48, 52, 55, 60, 64]);
    expect(chordNotes('Am', BASS_TUNING)).toEqual([noteToMidi('A1'), noteToMidi('E2'), noteToMidi('A2'), noteToMidi('C3')]);
  });

  it('knows every chord used by the lessons', () => {
    for (const s of SONGS.filter((x) => x.mode === 'chord')) {
      for (const seg of parseSong(s, false).segments) expect(knownChord(seg.chord), `${s.id}: ${seg.chord}`).toBe(true);
    }
  });

  it('can play every melody note on its instrument', () => {
    for (const s of SONGS.filter((x) => x.mode === 'note')) {
      const tuning = s.instrument === 'bass' ? BASS_TUNING : GUITAR_TUNING;
      for (const tg of parseSong(s, false).targets) {
        expect(findPosition(tg.midi!, tuning, 12), `${s.id}: ${tg.midi}`).not.toBeNull();
      }
    }
  });
});

describe('Lesson', () => {
  const song = SONGS.find((s) => s.id === 'first-strums')!;

  it('patterns line up with the bar', () => {
    for (const s of SONGS.filter((x) => x.mode === 'chord')) {
      expect(s.pattern!.length, s.id).toBe(s.beatsPerBar * (s.subdiv ?? 2));
    }
  });

  it('scores a play-along run', () => {
    const l = new Lesson(song, { tempo: 1, wait: false, easy: true, drums: false, latency: 0 });
    l.start(0);
    const sched = () => {};
    // Hit the first target exactly, play the wrong chord on the second, skip the rest.
    const t0 = l.timeOfBeat(l.targets[0].beat);
    l.update(t0 - 0.01, sched);
    expect(l.input(t0, { chord: 'Em' })).toBe('perfect');
    const t1 = l.timeOfBeat(l.targets[1].beat);
    l.update(t1 - 0.01, sched);
    expect(l.input(t1 + 0.1, { chord: 'Am' })).toBe('wrong');
    for (let t = t1; t < l.timeOfBeat(l.length) + 1; t += 0.05) l.update(t, sched);
    expect(l.done).toBe(true);
    expect(l.counts.perfect).toBe(1);
    expect(l.counts.miss).toBe(l.targets.length - 1);
  });

  it('waits for the right chord in wait mode', () => {
    const l = new Lesson(song, { tempo: 1, wait: true, easy: true, drums: false, latency: 0 });
    l.start(0);
    const clicks: number[] = [];
    const sched = (b: number) => clicks.push(b);
    const t0 = l.timeOfBeat(l.targets[0].beat);
    l.update(t0 + 2, sched);
    expect(l.isWaiting).toBe(true);
    expect(l.beatAt(t0 + 5)).toBe(0);
    // No clicks are scheduled past the target we're waiting on.
    expect(Math.max(...clicks)).toBeLessThanOrEqual(0);
    expect(l.input(t0 + 5, { chord: 'Am' })).toBe('wrong');
    expect(l.input(t0 + 6, { chord: 'Em' })).toBe('good');
    expect(l.isWaiting).toBe(false);
    expect(l.beatAt(t0 + 6)).toBe(0);
    expect(l.beatAt(t0 + 6 + 60 / song.bpm)).toBeCloseTo(1);
  });
});
