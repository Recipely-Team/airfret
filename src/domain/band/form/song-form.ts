import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

/** A stanza repeats the tune this closely (share of its notes the same) to count as the same music. */
const SAME = 0.9;
/** A stanza is at least this many notes long. */
const MIN_STANZA = 6;
/** A song that doesn't repeat its tune is split in phrases this many bars long (two of them for a short song). */
const PHRASE_BARS = 4;
const LONG_SONG_BARS = 32;
const EPS = 1e-6;
const LABELS = 'ABCDEFGHIJKLMNOP';

/** A section of the song before it is planned: where it lies and what it repeats. */
export interface SongPart {
  readonly start: number;
  readonly end: number;
  readonly label: string;
  readonly occurrence: number;
}

/**
 * The song's sections, as an arranger reads its form:
 * - a strophic song — the same tune sung stanza after stanza (the Izmir March's four) — is split at each stanza, all
 *   with the same label;
 * - any other at its phrases (four bars; eight in a long song), each labelled by its tune, so a refrain that comes
 *   back gets the label it had.
 * A chord song (no tune) is split by its chords' bars the same way.
 */
export function songForm(song: Song, chart: SongChart): SongPart[] {
  const notes = chart.targets.filter((t) => t.midi !== undefined);
  const period = stanzaLength(notes.map((t) => `${t.midi}:${t.dur.toFixed(3)}`));
  if (period) {
    const starts = notes.filter((_, i) => i % period === 0).map((t, k) => (k === 0 ? 0 : t.beat));
    return starts.map((start, k) => ({ start, end: starts[k + 1] ?? chart.length, label: 'A', occurrence: k }));
  }
  const bars = Math.ceil(chart.length / song.beatsPerBar - EPS);
  const phrase = (bars >= LONG_SONG_BARS ? PHRASE_BARS * 2 : PHRASE_BARS) * song.beatsPerBar;
  const parts: { start: number; end: number; key: string }[] = [];
  for (let start = 0; start < chart.length - EPS; start += phrase) {
    const end = Math.min(chart.length, start + phrase);
    const key = notes.filter((t) => t.beat >= start - EPS && t.beat < end - EPS).map((t) => `${(t.beat - start).toFixed(3)}:${t.midi}`).join(' ');
    parts.push({ start, end, key });
  }
  // A last phrase shorter than half a phrase joins the one before it.
  const last = parts[parts.length - 1];
  if (parts.length > 1 && last && last.end - last.start < phrase / 2) {
    parts.pop();
    const before = parts.pop();
    if (before) parts.push({ ...before, end: last.end, key: before.key + last.key });
  }
  const keys: string[] = [];
  const seen = new Map<string, number>();
  return parts.map((p) => {
    if (!keys.includes(p.key)) keys.push(p.key);
    const occurrence = seen.get(p.key) ?? 0;
    seen.set(p.key, occurrence + 1);
    return { start: p.start, end: p.end, label: LABELS.charAt(keys.indexOf(p.key) % LABELS.length), occurrence };
  });
}

/** The length (in notes) of the stanza a tune repeats, if it repeats one at least twice; else null. */
function stanzaLength(notes: readonly string[]): number | null {
  for (let p = MIN_STANZA; p * 2 <= notes.length; p++) {
    if (notes.length % p > p / 2 && notes.length % p !== 0) continue;
    let same = 0;
    for (let i = p; i < notes.length; i++) if (notes[i] === notes[i - p]) same++;
    if (same / (notes.length - p) >= SAME) return p;
  }
  return null;
}
