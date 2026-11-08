const OCTAVE = 12;
/** The accompaniment stays at least a minor third under the tune (research report, "keep the backing under the tune"). */
const UNDER_TUNE = 3;
/** Room every close triad fits in under the tune, in one inversion or another (a major sixth: C–E–G's widest, G–C–E). */
const MIN_ROOM = 9;
/** A lane moves down under a low tune no further than C3: a close minor third is still clear there. */
const FLOOR = 48;

/** Where a part's chords may lie, MIDI: its lowest and highest note. */
export interface Lane {
  readonly low: number;
  readonly high: number;
}

/**
 * A chord voiced close inside its lane and under the tune, nearest the voicing before it — the rules a pad or a
 * comping part is written by: close position in the middle register (above the low interval limits, the lane's
 * floor), the top voice at least a minor third under the tune's lowest note over the chord, and each voice moving as
 * little as it can from the last chord (common tones held, the rest by step). Notes low to high.
 */
export function voiceChord(tones: readonly number[], lane: Lane, tuneLow: number | null, previous: readonly number[] | null, bassTop: number | null = null): number[] {
  const top = tuneLow === null ? lane.high : Math.min(lane.high, tuneLow - UNDER_TUNE);
  // Under a low tune the lane moves down with it (to C3 at most, and never onto the bass); with no room even there,
  // the tune's limit gives way — the bass stays the lowest voice.
  const low = Math.max(FLOOR, bassTop === null ? FLOOR : bassTop + 1, Math.min(lane.low, top - MIN_ROOM));
  const hasRoom = top - low >= MIN_ROOM;
  // No room for the whole chord between the bass and the tune: leave out its root (the bass plays it) — as an
  // arranger thins a voicing rather than cross the tune. Only if even that won't fit does the tune's limit give way.
  // Thinning goes on to the third alone, the note that says major or minor.
  if (!hasRoom && tones.length >= 2) {
    for (const kept of [tones.slice(1), tones.slice(1, 2)]) {
      const thinned = voiceChord(kept, { low, high: top }, null, previous, null);
      if (thinned.length && (thinned[0] ?? 0) >= low && (thinned[thinned.length - 1] ?? Infinity) <= top) return thinned;
    }
  }
  const ceiling = hasRoom ? top : lane.high;
  const candidates: number[][] = [];
  for (let base = low; base < low + OCTAVE; base++) {
    const root = tones.findIndex((pc) => ((base - pc) % OCTAVE + OCTAVE) % OCTAVE === 0);
    if (root < 0) continue;
    const voicing = [base];
    for (let k = 1; k < tones.length; k++) {
      const pc = tones[(root + k) % tones.length] ?? 0;
      const last = voicing[voicing.length - 1] ?? base;
      const step = (((pc - last) % OCTAVE) + OCTAVE) % OCTAVE;
      voicing.push(last + (step || OCTAVE));
    }
    candidates.push(voicing);
  }
  const fitting = candidates.filter((v) => (v[v.length - 1] ?? 0) <= ceiling);
  const pool = fitting.length ? fitting : candidates.sort((a, b) => (a[a.length - 1] ?? 0) - (b[b.length - 1] ?? 0)).slice(0, 1);
  const cost = (v: readonly number[]) =>
    previous && previous.length === v.length ? v.reduce((s, n, i) => s + Math.abs(n - (previous[i] ?? n)), 0) : Math.abs((v[0] ?? 0) - low);
  return [...pool].sort((a, b) => cost(a) - cost(b))[0] ?? [];
}
