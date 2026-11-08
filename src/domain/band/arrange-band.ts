import type { BandArrangement } from '@domain/band/band-arrangement';
import { BandStyle } from '@domain/band/band-style';
import { planEnergy } from '@domain/band/form/energy-plan';
import { songForm } from '@domain/band/form/song-form';
import type { MemberChoice } from '@domain/band/member-choice';
import { drumBars } from '@domain/band/parts/drum-bars';
import { writePart } from '@domain/band/parts/write-part';
import { BandRole } from '@domain/band/seating/band-role';
import { profileOf } from '@domain/band/seating/profile-of';
import { seatBand } from '@domain/band/seating/seat-band';
import { songDrumSpan } from '@domain/drums/song-drums';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

/** A song with no tune read (chords only) is arranged as if its tune lay around middle C. */
const MIDDLE = { low: 60, high: 72 } as const;

/**
 * Arranges `song` for a band — the whole system of the research report in order: the instruments are seated (the
 * player's choices first), the song's form is read and each section given its energy, then every member's part is
 * written against that plan (a drum gets its plan bar by bar). `energy` holds one level throughout (1–5); null lets
 * the band build up over the form.
 */
export function arrangeBand(song: Song, chart: SongChart, ids: readonly string[], style: BandStyle = BandStyle.auto, energy: number | null = null, choices: Readonly<Record<string, MemberChoice>> = {}): BandArrangement {
  const pitches = chart.targets.flatMap((t) => (t.midi === undefined ? [] : [t.midi]));
  const tune = pitches.length ? { low: Math.min(...pitches), high: Math.max(...pitches) } : MIDDLE;
  const seats = seatBand(ids.map(profileOf), tune, style, choices);
  const sections = planEnergy(songForm(song, chart), style, energy);
  const plan = { sections, hasBass: seats.some((s) => s.role === BandRole.bass), hasHarmony: seats.some((s) => s.role === BandRole.harmony) };
  const span = songDrumSpan(song, chart);
  const parts = seats.map((seat) =>
    seat.role === BandRole.rhythm ? { seat, song, drumPlan: drumBars(seat, plan, span, song.beatsPerBar) } : { seat, song: writePart(song, chart, seat, plan) },
  );
  return { seats, sections, plan, parts };
}
