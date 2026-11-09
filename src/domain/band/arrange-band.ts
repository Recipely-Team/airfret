import type { BandArrangement } from '@domain/band/band-arrangement';
import { BandHarmony } from '@domain/band/band-harmony';
import { BandStyle } from '@domain/band/band-style';
import { planEnergy } from '@domain/band/form/energy-plan';
import { rotateLeads } from '@domain/band/form/lead-rotation';
import { songForm } from '@domain/band/form/song-form';
import type { MemberChoice } from '@domain/band/member-choice';
import { drumBars } from '@domain/band/parts/drum-bars';
import { writePart } from '@domain/band/parts/write-part';
import { roleLevel } from '@domain/band/seating/balance';
import { BandRole } from '@domain/band/seating/band-role';
import { profileOf } from '@domain/band/seating/profile-of';
import { seatBand } from '@domain/band/seating/seat-band';
import { songDrumSpan } from '@domain/drums/song-drums';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

/** A song with no tune read (chords only) is arranged as if its tune lay around middle C. */
const MIDDLE = { low: 60, high: 72 } as const;

/**
 * Arranges `song` for a band — the whole system of the research report in order: the instruments are seated (the
 * player's choices first), the song's form is read and each section given its energy, then every member's part is
 * written against that plan (a drum gets its plan bar by bar). Where a section comes back, the tune may pass to
 * another voice (`rotateLeads`), each part's level following its job there. `energy` holds one level throughout (1–5); null lets
 * the band build up over the form; `harmony` builds the chords in triads or in fourths.
 */
export function arrangeBand(song: Song, chart: SongChart, ids: readonly string[], style: BandStyle = BandStyle.auto, energy: number | null = null, choices: Readonly<Record<string, MemberChoice>> = {}, harmony: BandHarmony = BandHarmony.western): BandArrangement {
  const pitches = chart.targets.flatMap((t) => (t.midi === undefined ? [] : [t.midi]));
  const tune = pitches.length ? { low: Math.min(...pitches), high: Math.max(...pitches) } : MIDDLE;
  const profiles = ids.map(profileOf);
  const seats = seatBand(profiles, tune, style, choices);
  const sections = planEnergy(songForm(song, chart), style, energy);
  const hasBass = seats.some((s) => s.role === BandRole.bass);
  // The tune passes around only over chords and a bass: the melody's own written bass is covered while it steps back.
  const canRotate = hasBass && song.mode === PlayMode.note && chart.targets.some((t) => t.harmony?.length);
  const leads = rotateLeads(sections, seats, profiles, tune, style, choices, canRotate);
  // Quartal harmony when asked for — never on a Western-tonal march (the research report's hard rule).
  const isQuartal = harmony === BandHarmony.quartal && !song.isMarch;
  const plan = { sections, hasBass, hasHarmony: seats.some((s) => s.role === BandRole.harmony), leads, isQuartal };
  const span = songDrumSpan(song, chart);
  const parts = seats.map((seat) => {
    if (seat.role === BandRole.rhythm) return { seat, song, drumPlan: drumBars(seat, plan, span, song.beatsPerBar) };
    const levels = leads.map((t) => (t?.lead === seat.id ? roleLevel(seat.role, BandRole.melody) : t && seat.role === BandRole.melody ? roleLevel(BandRole.melody, t.gives.role) : 1));
    return { seat, song: writePart(song, chart, seat, plan), ...(levels.some((l) => l !== 1) ? { levels } : {}) };
  });
  return { seats, sections, plan, parts };
}
