import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { Voice } from '@domain/audio/voice';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { KeyboardInstrument } from '@domain/keys/keyboard-instrument';
import { PIANO_LOWEST_MIDI } from '@domain/keys/piano';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { chartNotes } from '@domain/performance/chart-notes';
import { fitNotes } from '@domain/performance/fit-notes';
import type { TimedNote } from '@domain/performance/timed-note';

/** Notes are handed to the audio clock this far ahead of when they sound, seconds. */
const LOOKAHEAD = 0.2;
/** The first note sounds this soon after *Watch it play*, seconds. */
const FIRST_NOTE_AFTER = 0.3;
/** A key rises this long before the note's full length (articulation), seconds; never shorter than `MIN_NOTE`. */
const LIFT = 0.03;
const MIN_NOTE = 0.06;
/** A bar that rings on (a marimba) shows its key down this long, seconds. */
const STRUCK_SHOWN = 0.18;
/** A keyboard without dynamics strikes every note at this strength. */
const FIXED_LEVEL = 0.7;
const STRIKE_POINT = 0.12;

interface Scheduled {
  readonly midi: number;
  readonly velocity: number;
  readonly at: number;
  readonly end: number;
}

/**
 * **KeysPerformer** — a keyboard or wind playing a song by itself: the piece fitted to its range (a wind keeps the
 * melody alone), each note struck on the audio clock and, on a damped instrument, let go at its end.
 */
export class KeysPerformer {
  private notes: Scheduled[] = [];
  private nextStart = 0;
  private nextShown = 0;
  private ends: Scheduled[] = [];
  private keyboard: KeyboardInstrument | null = null;
  /** When the last note is over, on the audio clock. */
  private endAt = 0;

  constructor(private readonly sound: SoundOutputInterface) {}

  get isPlaying(): boolean {
    return this.keyboard !== null;
  }

  /** The keys the piece uses after fitting, and whether each is the tune — what the keyboard should show. */
  keysUsed(song: Song, keyboard: KeyboardInstrument): { midi: number; isMelody: boolean }[] {
    return this.fitted(song, keyboard).map((n) => ({ midi: n.midi, isMelody: n.isMelody }));
  }

  start(song: Song, keyboard: KeyboardInstrument, audioNow: number): boolean {
    const chart = parseSong(song, false);
    if (!chart.isOk) return false;
    const notes = this.fitted(song, keyboard);
    if (!notes.length) return false;
    const spb = 60 / song.bpm;
    const first = Math.min(...notes.map((n) => n.beat));
    const t0 = audioNow + FIRST_NOTE_AFTER;
    this.notes = notes
      .map((n) => {
        const at = t0 + (n.beat - first) * spb;
        return { midi: n.midi, velocity: n.velocity, at, end: at + Math.max(MIN_NOTE, n.dur * spb - LIFT) };
      })
      .sort((a, b) => a.at - b.at);
    this.nextStart = 0;
    this.nextShown = 0;
    this.ends = [];
    this.endAt = Math.max(...this.notes.map((n) => n.end));
    this.keyboard = keyboard;
    return true;
  }

  stop(audioNow: number): void {
    // Every note already handed to the clock and not yet over stops now.
    if (this.keyboard?.isDamped) for (const n of this.notes.slice(0, this.nextStart)) if (n.end > audioNow) this.sound.damp(n.midi - PIANO_LOWEST_MIDI, audioNow);
    this.keyboard = null;
    this.notes = [];
    this.ends = [];
  }

  /**
   * Hands what comes up next to the audio clock; returns the keys down now and those struck since the last frame,
   * or null once the piece has ended.
   */
  update(audioNow: number): { down: number[]; struck: { midi: number; velocity: number }[] } | null {
    const kb = this.keyboard;
    if (!kb) return null;
    const struck: { midi: number; velocity: number }[] = [];
    while (this.nextStart < this.notes.length && (this.notes[this.nextStart]?.at ?? Infinity) <= audioNow + LOOKAHEAD) {
      const n = this.notes[this.nextStart++];
      if (!n) break;
      this.sound.pluck({
        string: n.midi - PIANO_LOWEST_MIDI, midi: n.midi, amp: kb.isTouchSensitive ? n.velocity : FIXED_LEVEL, when: n.at, isMuted: false,
        position: STRIKE_POINT, voice: Voice.player, attack: StrikeSurface.pad, isPalmMuted: false,
      });
      this.ends.push(n);
    }
    // Each note is let go on the clock, once, as its end comes up (a bar instrument's rings on).
    this.ends = this.ends.filter((n) => {
      if (n.end > audioNow + LOOKAHEAD) return true;
      if (kb.isDamped) this.sound.damp(n.midi - PIANO_LOWEST_MIDI, n.end);
      return false;
    });
    const down = this.notes.filter((n) => n.at <= audioNow && audioNow < (kb.isDamped ? n.end : n.at + STRUCK_SHOWN)).map((n) => n.midi);
    while (this.nextShown < this.nextStart && (this.notes[this.nextShown]?.at ?? Infinity) <= audioNow) {
      const n = this.notes[this.nextShown++];
      if (n) struck.push({ midi: n.midi, velocity: n.velocity });
    }
    if (this.nextStart >= this.notes.length && !this.ends.length && audioNow > this.endAt) {
      this.keyboard = null;
      return null;
    }
    return { down, struck };
  }

  private fitted(song: Song, keyboard: KeyboardInstrument): TimedNote[] {
    const chart = parseSong(song, false);
    if (!chart.isOk) return [];
    return fitNotes(chartNotes(song, chart.value), keyboard.low, keyboard.high, keyboard.isMonophonic === true);
  }
}
