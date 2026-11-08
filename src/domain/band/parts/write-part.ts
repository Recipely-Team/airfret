import type { BandSection } from '@domain/band/form/band-section';
import type { BandPlan } from '@domain/band/parts/band-plan';
import type { ChordSpan } from '@domain/band/parts/chord-span';
import { chordTimeline } from '@domain/band/parts/chord-timeline';
import { type Busyness, comp } from '@domain/band/parts/comping';
import { isPlaying, sectionAt } from '@domain/band/parts/entries';
import { bassLine, bassTop, heterophony, innerLine } from '@domain/band/parts/lines';
import type { PartEvent } from '@domain/band/parts/part-event';
import { type Lane, voiceChord } from '@domain/band/parts/voicing';
import { writtenSong } from '@domain/band/parts/written-song';
import { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

const EPS = 1e-6;
/**
 * Each pattern's register lane, MIDI: comping from G3 (above the low interval limits: a minor third holds from C3, a
 * second from E♭3), broken chords a little wider, held pads lower and closer, all kept under the tune by the voicing.
 */
const LANE: Readonly<Record<'comp' | 'broken' | 'pad', Lane>> = { comp: { low: 55, high: 69 }, broken: { low: 52, high: 72 }, pad: { low: 52, high: 67 } };
/** At the climax an inner line doubles the tune; at 4, with the pads in, it plays only where the tune holds (four layers at most). */
const ALL_ON_TUNE = 5;
const GAPS_ONLY = 4;

/**
 * A seat's part of `song`, across the planned sections, written as a song of its own:
 * - **melody** the tune (without the written bass when someone plays it); **double** the tune in the seat's octave;
 *   **heterophony** the tune in the seat's idiom;
 * - **counter** an inner line (the tune itself at the climax); **pad** held chords (a single-line instrument holds one
 *   chord tone); **harmony** the chords in the seat's pattern, busier as the song builds; **bass** its pattern (roots
 *   at first, root and fifth from the middle level when none was chosen);
 * - silent in the sections its role hasn't come in for; bass and chords drop out in the strip-back bar; the last chord
 *   is held to the end. A tune with no bass written under it has no chords to read: every part plays the tune its way.
 */
export function writePart(song: Song, chart: SongChart, seat: BandSeat, plan: BandPlan): Song {
  if (seat.role === BandRole.rhythm) return song;
  if (seat.role === BandRole.off) return writtenSong(song, [], chart.length);
  const tune: PartEvent[] = chart.targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi] }]));
  const chords = chordTimeline(song, chart);
  const at = (beat: number) => sectionAt(plan.sections, beat);
  const plays = (e: PartEvent) => {
    const s = at(e.beat);
    return !!s && isPlaying(seat, s, plan);
  };
  const busy = (beat: number): Busyness => {
    const e = at(beat)?.energy ?? 2;
    return e <= 2 ? 0 : e === 3 ? 1 : 2;
  };
  if (seat.role === BandRole.melody) return plan.hasBass && song.mode === PlayMode.note && chords.length ? writtenSong(song, tune, chart.length) : song;
  if (song.mode !== PlayMode.note && seat.role !== BandRole.bass && seat.role !== BandRole.harmony && seat.role !== BandRole.pad) return song;
  if (seat.role === BandRole.double || seat.role === BandRole.heterophony || !chords.length) {
    const pattern = seat.role === BandRole.double ? BandPattern.legato : seat.pattern ?? BandPattern.legato;
    return writtenSong(song, heterophony(tune, pattern, seat.centre, busy(0)).filter(plays), chart.length);
  }
  const isLine = seat.role === BandRole.counter || (seat.role === BandRole.pad && seat.voice !== undefined);
  const events = isLine ? linesOf(seat, chords, tune, plan) : chordPart(song, seat, chords, tune, plan, busy);
  return writtenSong(song, events.filter(plays).filter((e) => !inStripBack(e, seat, at(e.beat), song.beatsPerBar)), chart.length);
}

/** A chord or bass part through the song, each chord voiced nearest the one before (voice leading). */
function chordPart(song: Song, seat: BandSeat, chords: readonly ChordSpan[], tune: readonly PartEvent[], plan: BandPlan, busy: (beat: number) => Busyness): PartEvent[] {
  let previous: readonly number[] | null = null;
  return chords.flatMap((c, i) => {
    const isEnding = i === chords.length - 1 && !!sectionAt(plan.sections, c.beat)?.isFinal;
    if (seat.role === BandRole.bass) {
      if (isEnding) return [{ beat: c.beat, dur: c.end - c.beat, midis: [c.bass] }];
      return bassLine(c, seat.pattern ?? (busy(c.beat) === 0 ? BandPattern.root : BandPattern.rootFifth), song.beatsPerBar, chords[i + 1]?.bass ?? null);
    }
    const pattern = seat.role === BandRole.pad ? BandPattern.held : seat.pattern ?? BandPattern.held;
    const lane = pattern === BandPattern.held ? LANE.pad : pattern === BandPattern.arpeggio || pattern === BandPattern.alberti ? LANE.broken : LANE.comp;
    const over = tune.filter((n) => n.beat < c.end - EPS && n.beat + n.dur > c.beat + EPS);
    const tuneLow = over.length ? Math.min(...over.map((n) => n.midis[0] ?? 0)) : null;
    const chord = voiceChord(c.tones, lane, tuneLow, previous, plan.hasBass ? bassTop(c) : null);
    previous = chord;
    return comp(c, chord, isEnding ? BandPattern.held : pattern, busy(c.beat), song.beatsPerBar, plan.hasBass);
  });
}

/** An inner line or held pad tone through the song: per chord, chained by its last note; the tune itself at the climax. */
function linesOf(seat: BandSeat, chords: readonly ChordSpan[], tune: readonly PartEvent[], plan: BandPlan): PartEvent[] {
  let last = seat.centre;
  return chords.flatMap((c) => {
    const s = sectionAt(plan.sections, c.beat);
    if (seat.role === BandRole.counter && (s?.energy ?? 0) >= ALL_ON_TUNE) return tune.filter((n) => n.beat >= c.beat - EPS && n.beat < c.end - EPS);
    const line = innerLine(c, seat.voice ?? 0, last, tune, seat.role === BandRole.counter);
    last = line.last;
    // With the pads in, the line keeps to the tune's held notes and rests: its moving note only.
    return seat.role === BandRole.counter && (s?.energy ?? 0) === GAPS_ONLY ? line.events.slice(1) : line.events;
  });
}

/** In the strip-back bar before the final section, the bass and the chords in a pattern drop out. */
function inStripBack(e: PartEvent, seat: BandSeat, section: BandSection | undefined, beatsPerBar: number): boolean {
  if (!section?.isThinEnd || (seat.role !== BandRole.bass && seat.role !== BandRole.harmony)) return false;
  return e.beat >= section.end - beatsPerBar - EPS;
}
