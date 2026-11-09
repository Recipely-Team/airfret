import { ChainKind } from '@domain/instruments/chain-kind';
import type { Instrument } from '@domain/instruments/instrument';
import { PlayMode } from '@domain/instruments/play-mode';
import { SAZ_FRET_CENTS } from '@domain/instruments/saz-frets';
import { UKULELE_SHAPES } from '@domain/music/chords/ukulele-shapes';
import { BALALAIKA_TUNING, BASS5_TUNING, BASS6_TUNING, BASS_TUNING, GREEK_BOUZOUKI_TUNING, GUITAR7_TUNING, GUITAR_TUNING, IRISH_BOUZOUKI_TUNING, KOPUZ_TUNING, MANDOLIN_TUNING, SAZ_TUNING, UKULELE_TUNING } from '@domain/music/tunings';
import { WORLD_TUNINGS } from '@domain/music/world-tunings';

const MAX_FRET = 12;
/** Fret counts of the professional instruments each voice models. */
const FRETS = { steel: 20, classical: 19, electric: 22, extended: 24, bass: 24, banjo: 22 } as const;
/** A saz's courses: an octave string below the top and bottom courses (G2, A2), a unison pair in the middle. */
const SAZ_COURSES = [-12, 0, -12];
/** Frets on screen: one octave of the saz's 17. */
const SAZ_VISIBLE_FRETS = 17;
/** Melody instruments without guitar chord shapes play notes and free fingering. */
const MELODY_MODES = [PlayMode.note, PlayMode.free];
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
 * - Ukulele (its own chord shapes), mandolin, balalaika and the Irish and Greek bouzoukis: tunings and courses
 *   from the sources in `world-tunings.ts`; synth voices only, their decay and brightness set by ear until
 *   freely licensed recordings are found.
 * - The saz (baglama) has 17 frets an octave at Tura's ratios (`fretCents`), three courses with octave strings,
 *   and plays real baglama recordings (the kopuz's set) up to G4, the synth above. Its decay (3.2 s·(110/f)^0.6) and
 *   brightness are set by ear from a wire-strung long-neck lute, not measured — the first recordings replace them.
 *   `tests/songs/instruments-vs-real.audio.test.ts` holds every instrument against those recordings.
 */
export const INSTRUMENTS: readonly Instrument[] = [
  { id: 'acoustic', name: 'inst.acoustic', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.steel, t60: 9.4, t60Exponent: 0.42, bright: 0.62, pick: 0.12, level: 0.42, chain: ChainKind.acoustic, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'twelve', name: 'inst.twelve', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.steel, t60: 9.4, t60Exponent: 0.42, bright: 0.62, pick: 0.12, level: 0.34, chain: ChainKind.acoustic, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true, courses: TWELVE_COURSES },
  { id: 'ukulele', name: 'inst.ukulele', tuning: UKULELE_TUNING, maxFret: MAX_FRET, frets: 15, t60: 3.5, t60Exponent: 0.6, bright: 0.42, pick: 0.18, level: 0.5, chain: ChainKind.ukulele, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true, chordShapes: UKULELE_SHAPES, tunings: WORLD_TUNINGS.ukulele },
  { id: 'nylon', name: 'inst.nylon', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.classical, t60: 8.6, t60Exponent: 0.73, bright: 0.3, pick: 0.2, level: 0.5, chain: ChainKind.nylon, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'clean', name: 'inst.clean', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.7, pick: 0.1, level: 0.38, chain: ChainKind.clean, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'guitar7', name: 'inst.guitar7', tuning: GUITAR7_TUNING, maxFret: MAX_FRET, frets: FRETS.extended, t60: 21.4, t60Exponent: 0.8, bright: 0.68, pick: 0.1, level: 0.36, chain: ChainKind.clean, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'drive', name: 'inst.drive', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.electric, t60: 21.4, t60Exponent: 0.8, bright: 0.72, pick: 0.11, level: 0.3, chain: ChainKind.drive, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
  { id: 'bass', name: 'inst.bass', tuning: BASS_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'bass5', name: 'inst.bass5', tuning: BASS5_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.22, pick: 0.22, level: 0.85, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'bass6', name: 'inst.bass6', tuning: BASS6_TUNING, maxFret: MAX_FRET, frets: FRETS.bass, t60: 7.9, t60Exponent: 0.49, bright: 0.24, pick: 0.22, level: 0.8, chain: ChainKind.bass, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true },
  { id: 'saz', name: 'inst.saz', tuning: SAZ_TUNING, maxFret: SAZ_VISIBLE_FRETS, frets: 23, t60: 3.2, t60Exponent: 0.6, bright: 0.86, pick: 0.07, level: 0.42, chain: ChainKind.saz, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true, courses: SAZ_COURSES, fretCents: SAZ_FRET_CENTS, modes: [PlayMode.note, PlayMode.free] },
  { id: 'kopuz', name: 'inst.kopuz', tuning: KOPUZ_TUNING, maxFret: MAX_FRET, frets: 12, t60: 2.6, t60Exponent: 0.6, bright: 0.55, pick: 0.15, level: 0.45, chain: ChainKind.kopuz, defaultMode: PlayMode.note, voice: 'recorded', isRecorded: true, modes: MELODY_MODES },
  { id: 'mandolin', name: 'inst.mandolin', tuning: MANDOLIN_TUNING, maxFret: MAX_FRET, frets: 20, t60: 4, t60Exponent: 0.6, bright: 0.85, pick: 0.1, level: 0.36, chain: ChainKind.mandolin, defaultMode: PlayMode.note, voice: 'fitted', isRecorded: false, courses: [0, 0, 0, 0], tunings: WORLD_TUNINGS.mandolin, modes: MELODY_MODES },
  { id: 'balalaika', name: 'inst.balalaika', tuning: BALALAIKA_TUNING, maxFret: MAX_FRET, frets: 24, t60: 2.4, t60Exponent: 0.6, bright: 0.8, pick: 0.12, level: 0.42, chain: ChainKind.balalaika, defaultMode: PlayMode.note, voice: 'fitted', isRecorded: false, tunings: WORLD_TUNINGS.balalaika, modes: MELODY_MODES },
  // Decay measured on real bouzouki notes (JustMog, Freesound CC0): T60 = 7.9 s·(110/f)^0.43.
  { id: 'bouzouki', name: 'inst.bouzouki', tuning: IRISH_BOUZOUKI_TUNING, maxFret: MAX_FRET, frets: 24, t60: 7.9, t60Exponent: 0.43, bright: 0.72, pick: 0.11, level: 0.36, chain: ChainKind.bouzouki, defaultMode: PlayMode.note, voice: 'fitted', isRecorded: false, courses: [0, 0, 0, 0], tunings: WORLD_TUNINGS.irishBouzouki, modes: MELODY_MODES },
  { id: 'greekBouzouki', name: 'inst.greekBouzouki', tuning: GREEK_BOUZOUKI_TUNING, maxFret: MAX_FRET, frets: 26, t60: 5, t60Exponent: 0.5, bright: 0.8, pick: 0.1, level: 0.4, chain: ChainKind.bouzouki, defaultMode: PlayMode.note, voice: 'fitted', isRecorded: false, courses: [12, 0, 0], tunings: WORLD_TUNINGS.greekBouzouki, modes: MELODY_MODES },
  { id: 'banjo', name: 'inst.banjo', tuning: GUITAR_TUNING, maxFret: MAX_FRET, frets: FRETS.banjo, t60: 1.36, t60Exponent: 0.7, bright: 0.97, pick: 0.09, level: 0.4, chain: ChainKind.banjo, defaultMode: PlayMode.chord, voice: 'recorded', isRecorded: true },
];

const FALLBACK: Instrument = INSTRUMENTS[0] as Instrument;

/** Looks up an instrument, falling back to the acoustic guitar for unknown ids. */
export function instrumentById(id: string): Instrument {
  return INSTRUMENTS.find((i) => i.id === id) ?? FALLBACK;
}
