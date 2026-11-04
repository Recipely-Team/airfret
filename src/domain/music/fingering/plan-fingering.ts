import type { FingeredNote } from '@domain/music/fingering/fingered-note';

/** Widest stretch (frets between the lowest and highest stopped note) a hand holds comfortably. */
const COMFORT_SPAN = 4;
/** Cost per fret of stretch beyond that, and per fret the hand travels between onsets. */
const Cost = { overStretch: 6, travel: 1, height: 0.04, cutRinging: 0.6, dropped: 1000 } as const;
/** Candidate shapes kept per onset; plenty for six strings, and keeps long pieces fast. */
const MAX_CANDIDATES = 64;

interface Shape {
  readonly notes: readonly FingeredNote[];
  readonly cost: number;
  /** Lowest stopped fret, or null when every note is open. */
  readonly position: number | null;
}

/**
 * Fingers a whole piece the way a guitarist would: every note of an onset on its own string, the hand
 * moving as little as possible, and earlier notes left ringing where another string can take the new one.
 *
 * @remarks
 * - `onsets[i]` lists the pitches sounded together, melody first. A pitch that can't be fitted is left out,
 *   melody last, then the bass (the lowest pitch), then inner voices.
 * - Shortest path (Viterbi) over candidate shapes per onset: stretch and height inside a shape,
 *   hand travel and cut-off ringing strings between shapes.
 */
export function planFingering(onsets: readonly (readonly number[])[], tuning: readonly number[], frets: number): FingeredNote[][] {
  const layers = onsets.map((pitches) => shapes(pitches, tuning, frets));
  const totals: number[][] = [];
  const back: number[][] = [];
  layers.forEach((layer, i) => {
    const prev = layers[i - 1];
    const prevTotals = totals[i - 1];
    const from: number[] = [];
    totals.push(layer.map((shape, j) => {
      if (!prev || !prevTotals) return shape.cost;
      let best = Infinity;
      prev.forEach((p, k) => {
        const c = (prevTotals[k] ?? Infinity) + move(p, shape);
        if (c < best) {
          best = c;
          from[j] = k;
        }
      });
      return best + shape.cost;
    }));
    back.push(from);
  });
  const out: FingeredNote[][] = [];
  let j = argMin(totals.at(-1) ?? []);
  for (let i = layers.length - 1; i >= 0; i--) {
    out.unshift([...(layers[i]?.[j]?.notes ?? [])]);
    j = back[i]?.[j] ?? 0;
  }
  return out;
}

/** Every way to put the onset's pitches on distinct strings, cheapest first. */
function shapes(pitches: readonly number[], tuning: readonly number[], frets: number): Shape[] {
  const order = priority(pitches);
  const found: Shape[] = [];
  const place = (k: number, used: FingeredNote[], dropped: number): void => {
    const midi = order[k];
    if (midi === undefined) {
      found.push(shape(used, dropped));
      return;
    }
    const options = tuning
      .map((open, string) => ({ midi, string, fret: midi - open }))
      .filter((n) => n.fret >= 0 && n.fret <= frets && !used.some((u) => u.string === n.string));
    for (const n of options) place(k + 1, [...used, n], dropped);
    if (!options.length) place(k + 1, used, dropped + 1);
  };
  place(0, [], 0);
  return found.sort((a, b) => a.cost - b.cost).slice(0, MAX_CANDIDATES);
}

/** Melody first, then the bass, then the inner voices top-down. */
function priority(pitches: readonly number[]): number[] {
  const [melody, ...rest] = pitches;
  if (melody === undefined) return [];
  const [bass, ...inner] = [...rest].sort((a, b) => a - b);
  return bass === undefined ? [melody] : [melody, bass, ...inner.reverse()];
}

function shape(notes: FingeredNote[], dropped: number): Shape {
  const stopped = notes.filter((n) => n.fret > 0).map((n) => n.fret);
  const position = stopped.length ? Math.min(...stopped) : null;
  const span = stopped.length ? Math.max(...stopped) - Math.min(...stopped) : 0;
  const cost = Math.max(0, span - COMFORT_SPAN) * Cost.overStretch + (position ?? 0) * Cost.height + dropped * Cost.dropped;
  return { notes: [...notes].sort((a, b) => b.midi - a.midi), cost, position };
}

function move(from: Shape, to: Shape): number {
  const travel = from.position !== null && to.position !== null ? Math.abs(from.position - to.position) * Cost.travel : 0;
  const cuts = to.notes.filter((n) => from.notes.some((f) => f.string === n.string && f.midi !== n.midi)).length;
  return travel + cuts * Cost.cutRinging;
}

function argMin(xs: readonly number[]): number {
  let best = 0;
  xs.forEach((x, i) => {
    if (x < (xs[best] ?? Infinity)) best = i;
  });
  return best;
}
