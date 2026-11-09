import type { BandSection } from '@domain/band/form/band-section';
import type { BandPlan } from '@domain/band/parts/band-plan';
import type { ChordSpan } from '@domain/band/harmony/chord-span';
import { chordTimeline } from '@domain/band/harmony/chord-timeline';
import { type Busyness, comp } from '@domain/band/harmony/comping';
import { isPlaying, sectionAt } from '@domain/band/parts/entries';
import { bassLine, bassTop, heterophony, innerLine } from '@domain/band/parts/lines';
import { drone, fills, homeOf } from '@domain/band/parts/punctuation';
import type { PartEvent } from '@domain/band/parts/part-event';
import { type Cadence, isPerfectUnder, quartalChord } from '@domain/band/harmony/quartal';
import { type Lane, voiceChord } from '@domain/band/harmony/voicing';
import { writtenSong } from '@domain/band/parts/written-song';
import { BandPattern } from '@domain/band/seating/band-pattern';
import { BandRole } from '@domain/band/seating/band-role';
import type { BandSeat } from '@domain/band/seating/band-seat';
import { InstrumentKind } from '@domain/band/seating/instrument-kind';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

const EPS = 1e-6;
const OCTAVE = 12;
/** A quartal chord stacks three voices under the tune (as the lane allows). */
const QUARTAL_VOICES = 3;
/** The families whose notes hold as long as they're played (a breath, a bow): a drone on them is one note, held. */
const HELD: ReadonlySet<InstrumentKind> = new Set([InstrumentKind.wind, InstrumentKind.brass, InstrumentKind.bowed]);
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
 *   at first, root and fifth from the middle level when none was chosen); **drone** the home note held under it all;
 *   **fills** runs or stabs in the tune's holds and rests;
 * - silent in the sections its role hasn't come in for; bass and chords drop out in the strip-back bar; the last chord
 *   is held to the end;
 * - where the tune passes to another voice (`plan.leads`), that voice plays it there and the melody takes its job. A tune with no bass written under it has no chords to read: every part plays the tune its way.
 */
export function writePart(song: Song, chart: SongChart, seat: BandSeat, plan: BandPlan): Song {
  if (seat.role === BandRole.rhythm) return song;
  const leads = plan.leads ?? [];
  const own = eventsFor(song, chart, seat, plan);
  if (!leads.some((t) => t && (t.lead === seat.id || seat.role === BandRole.melody))) return own ? writtenSong(song, own, chart.length) : song;
  // The tune passes around: each section as this seat plays it there — the tune, its own part, or the job it took over.
  const tune = tuneOf(chart);
  const gave = new Map<string, readonly PartEvent[]>();
  const events = plan.sections.flatMap((s) => {
    const turn = leads[s.index];
    let list: readonly PartEvent[] = own ?? tune;
    if (turn?.lead === seat.id) list = tune.map((n) => ({ ...n, midis: n.midis.map((m) => m + turn.shift) }));
    else if (turn && seat.role === BandRole.melody) {
      const key = JSON.stringify(turn.gives);
      list = gave.get(key) ?? eventsFor(song, chart, { ...seat, ...turn.gives }, plan) ?? [];
      gave.set(key, list);
    }
    return list.filter((e) => e.beat >= s.start - EPS && e.beat < s.end - EPS);
  });
  return writtenSong(song, events, chart.length);
}

/** A seat's events through the song for its role; null: it plays the song as written (the tune with its bass). */
function eventsFor(song: Song, chart: SongChart, seat: BandSeat, plan: BandPlan): PartEvent[] | null {
  if (seat.role === BandRole.off) return [];
  const tune = tuneOf(chart);
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
  if (seat.role === BandRole.melody) return plan.hasBass && song.mode === PlayMode.note && chords.length ? tune : null;
  if (seat.role === BandRole.drone) {
    const low = tune.length ? Math.min(...tune.map((n) => n.midis[0] ?? 0)) : null;
    return drone(homeOf(tune, chords), low, seat.centre, chart.length, song.beatsPerBar, HELD.has(seat.kind), !HELD.has(seat.kind)).filter(plays);
  }
  if (seat.role === BandRole.fills) return fills(tune, chords, seat.centre, seat.kind === InstrumentKind.keys).filter(plays);
  if (song.mode !== PlayMode.note && seat.role !== BandRole.bass && seat.role !== BandRole.harmony && seat.role !== BandRole.pad) return null;
  if (seat.role === BandRole.double || seat.role === BandRole.heterophony || !chords.length) {
    const pattern = seat.role === BandRole.double ? BandPattern.legato : seat.pattern ?? BandPattern.legato;
    return heterophony(tune, pattern, seat.centre, busy(0)).filter(plays);
  }
  const isLine = seat.role === BandRole.counter || (seat.role === BandRole.pad && seat.voice !== undefined);
  const events = isLine ? linesOf(seat, chords, tune, plan) : chordPart(song, seat, chords, tune, plan, busy);
  return events.filter(plays).filter((e) => !inStripBack(e, seat, at(e.beat), song.beatsPerBar));
}

/** The song's tune, note by note. */
function tuneOf(chart: SongChart): PartEvent[] {
  return chart.targets.flatMap((t) => (t.midi === undefined ? [] : [{ beat: t.beat, dur: t.dur, midis: [t.midi] }]));
}

/** A chord or bass part through the song, each chord voiced nearest the one before (voice leading). */
function chordPart(song: Song, seat: BandSeat, chords: readonly ChordSpan[], tune: readonly PartEvent[], plan: BandPlan, busy: (beat: number) => Busyness): PartEvent[] {
  let previous: readonly number[] | null = null;
  let perfectRun = 0;
  const scale = new Set(tune.flatMap((n) => n.midis.map((m) => ((m % OCTAVE) + OCTAVE) % OCTAVE)));
  return chords.flatMap((c, i) => {
    const section = sectionAt(plan.sections, c.beat);
    const isEnding = i === chords.length - 1 && !!section?.isFinal;
    if (seat.role === BandRole.bass) {
      if (isEnding) return [{ beat: c.beat, dur: c.end - c.beat, midis: [c.bass] }];
      return bassLine(c, seat.pattern ?? (busy(c.beat) === 0 ? BandPattern.root : BandPattern.rootFifth), song.beatsPerBar, chords[i + 1]?.bass ?? null);
    }
    const pattern = seat.role === BandRole.pad ? BandPattern.held : seat.pattern ?? BandPattern.held;
    const lane = pattern === BandPattern.held ? LANE.pad : pattern === BandPattern.arpeggio || pattern === BandPattern.alberti ? LANE.broken : LANE.comp;
    const over = tune.filter((n) => n.beat < c.end - EPS && n.beat + n.dur > c.beat + EPS);
    const tuneLow = over.length ? Math.min(...over.map((n) => n.midis[0] ?? 0)) : null;
    let chord: number[];
    if (plan.isQuartal && tuneLow !== null) {
      // A cadence lands on a perfect interval: the chord before it leaves room, so no three come in a row.
      const isBeforeCadence = i + 1 < chords.length && cadenceOf(chords, i + 1, plan) !== 'none';
      chord = quartalChord(tuneLow, scale, { low: Math.max(lane.low, plan.hasBass ? bassTop(c) + 1 : 0), high: lane.high }, QUARTAL_VOICES, cadenceOf(chords, i, plan), perfectRun + (isBeforeCadence ? 1 : 0));
      perfectRun = isPerfectUnder(tuneLow, chord) ? perfectRun + 1 : 0;
    } else chord = voiceChord(c.tones, lane, tuneLow, previous, plan.hasBass ? bassTop(c) : null);
    previous = chord;
    return comp(c, chord, isEnding ? BandPattern.held : pattern, busy(c.beat), song.beatsPerBar, plan.hasBass);
  });
}

/** Where a chord falls: the song's last (the final cadence), a section's last (a half cadence), or mid-phrase. */
function cadenceOf(chords: readonly ChordSpan[], i: number, plan: BandPlan): Cadence {
  const c = chords[i];
  const section = c ? sectionAt(plan.sections, c.beat) : undefined;
  if (!c || !section || Math.abs(section.end - c.end) > EPS) return 'none';
  return i === chords.length - 1 && section.isFinal ? 'final' : 'half';
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
