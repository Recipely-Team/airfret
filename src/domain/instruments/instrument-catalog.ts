import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { BASS5_TUNING, BASS6_TUNING, BASS_TUNING, GUITAR7_TUNING, GUITAR_TUNING } from '@domain/music/tunings';

const MAX_FRET = 12;
/** Fret counts of the professional instruments each voice models. */
const FRETS = { steel: 20, classical: 19, electric: 22, extended: 24, bass: 24, banjo: 22 } as const;
/** A 12-string's courses: octave pairs on the four low strings, unison pairs on B and E. */
const TWELVE_COURSES = [12, 12, 12, 12, 0, 0];

/**
 * Every instrument the app offers, in menu order.
 *
 * @remarks
 * - Decay laws are measured from real recordings (fundamental T60, robust log fit): clean electric
 *   21.4 s·(110/f)^0.8 and bass 7.9 s·(110/f)^0.49 from FreePats; steel acoustic 9.4 s·(110/f)^0.42
 *   (102 notes) and nylon 8.6 s·(110/f)^0.73 (105 notes) from the sample sets in `public/samples/`; the
 *   6-string banjo 1.36 s·(110/f)^0.7 from its 58 CC0 recordings — a drum head stops a note far sooner
 *   than a wooden top, so it barely rings on.
 * - The banjo is tuned like a guitar (the SX guitar banjo it was recorded on), so it plays every guitar
 *   chord, lesson and piece; the 5-string bass adds a low B and voices it from the bass recordings.
 * - The 12-string is the steel-string with a second string per course (`courses`), voiced from the steel
 *   recordings; the 7-string guitar adds a low B to the clean electric (its recordings, 24 frets); the 6-string
 *   bass adds a high C to the five — all three reuse sets already measured, so their decay laws are the same.
 *   `tests/songs/instruments-vs-real.audio.test.ts` holds every instrument against those recordings.
 */
export const INSTRUMENTS: readonly Instrument[] = [
  { id: 'acoustic', name: 'inst.acoustic', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.steel, t60: 9.4, t60Exponent: 0.42, bright: 0.62, pick: 0.12, level: 0.42, chain: ChainKind.acoustic, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'twelve', name: 'inst.twelve', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.steel, t60: 9.4, t60Exponent: 0.42, bright: 0.62, pick: 0.12, level: 0.34, chain: ChainKind.acoustic, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true, courses: TWELVE_COURSES },
  { id: 'nylon', name: 'inst.nylon', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.classical, t60: 8.6, t60Exponent: 0.73, bright: 0.3, pick: 0.2, level: 0.5, chain: ChainKind.nylon, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'clean', name: 'inst.clean', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.7, pick: 0.1, level: 0.38, chain: ChainKind.clean, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'guitar7', name: 'inst.guitar7', tuning: GUITAR7_TUNING, maxFret: MAX_FRET, frets: FRETS.extended, t60: 21.4, t60Exponent: 0.8, bright: 0.68, pick: 0.1, level: 0.36, chain: ChainKind.clean, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'drive', name: 'inst.drive', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.72, pick: 0.11, level: 0.3, chain: ChainKind.drive, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'bass', name: 'inst.bass', tuning: BASS_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'bass5', name: 'inst.bass5', tuning: BASS5_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'bass6', name: 'inst.bass6', tuning: BASS6_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.24, pick: 0.22, level: 0.8, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'banjo', name: 'inst.banjo', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.banjo, t60: 1.36, t60Exponent: 0.7, bright: 0.97, pick: 0.09, level: 0.4, chain: ChainKind.banjo, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
];

const FALLBACK: Instrument = INSTRUMENTS[0] as Instrument;

/** Looks up an instrument, falling back to the acoustic guitar for unknown ids. */
export function instrumentById(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? FALLBACK;
}
