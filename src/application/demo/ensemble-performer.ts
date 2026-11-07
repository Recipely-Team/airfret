import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { parseGroove } from '@domain/drums/grooves/parse-groove';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { parseRhythm } from '@domain/drums/hand/rhythms/parse-rhythm';
import { grooveForSong, rhythmForSong, songDrumSpan } from '@domain/drums/song-drums';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import { playableRange } from '@domain/music/fretted-range';
import { chartNotes } from '@domain/performance/chart-notes';
import { fitNotes } from '@domain/performance/fit-notes';

/** Notes are handed to the audio clock this far ahead, seconds. */
const LOOKAHEAD = 0.2;
/** The first note sounds this soon after the start — as the leading instrument's does, so they begin together. */
const FIRST_NOTE_AFTER = 0.3;

/** One event of the band: when it sounds (audio clock) and how. */
interface Scheduled {
  readonly at: number;
  readonly fire: () => void;
}
/** The drum voices a band member who drums plays through (the engine's kit and hand drums). */
type DrumVoices = Pick<SoundOutputInterface, 'hitDrum' | 'hitHandDrum' | 'prepareHandStrokes'>;

/**
 * **EnsemblePerformer** — the instruments that join one playing by itself: each plays the same song, moved into its
 * own range by octaves (a wind plays the tune alone, one note at a time), on the same clock as the leading instrument.
 * A drum in the band plays the song's beat instead — the kit a beat in its meter, a hand drum its rhythm — from the
 * first full bar to the last.
 */
export class EnsemblePerformer {
  private notes: Scheduled[] = [];
  private next = 0;

  constructor(
    private readonly out: EnsembleOutputInterface,
    private readonly drums?: DrumVoices,
  ) {}

  get isPlaying(): boolean {
    return this.next < this.notes.length;
  }

  /** Starts `members` on `song` (a melody or a chord chart; a drum rhythm has nothing to join in). */
  start(song: Song, members: readonly string[], audioNow: number): void {
    this.stop();
    if (song.mode !== PlayMode.note && song.mode !== PlayMode.chord) return;
    const chart = parseSong(song, false);
    if (!chart.isOk) return;
    const all = chartNotes(song, chart.value);
    if (!all.length) return;
    const spb = 60 / song.bpm;
    const span = songDrumSpan(song, chart.value);
    // The song's first note sounds just after now, as the leading instrument's does: every part keeps that beat.
    const at = (beat: number) => audioNow + FIRST_NOTE_AFTER + (beat - span.first) * spb;
    const scheduled: Scheduled[] = [];
    for (const id of members) {
      if (id === DRUMS_ID || handDrumFor(id)) {
        scheduled.push(...this.drumPart(id, song, span, at));
        continue;
      }
      if (!this.out.canPlay(id)) continue;
      const kb = keyboardFor(id);
      const range = kb ? { low: kb.low, high: kb.high } : playableRange(instrumentById(id));
      for (const n of fitNotes(all, range.low, range.high, kb?.isMonophonic === true)) {
        const when = at(n.beat);
        scheduled.push({ at: when, fire: () => this.out.play(id, n.midi, n.velocity, when, n.dur * spb) });
      }
    }
    this.notes = scheduled.sort((a, b) => a.at - b.at);
  }

  /** Hands the notes coming up to the audio clock. */
  update(audioNow: number): void {
    while (this.next < this.notes.length && (this.notes[this.next]?.at ?? Infinity) <= audioNow + LOOKAHEAD) {
      this.notes[this.next++]?.fire();
    }
  }

  /** A drum's part: the kit's beat or a hand drum's rhythm for the song, from its first full bar. */
  private drumPart(id: string, song: Song, span: { start: number; bars: number }, at: (beat: number) => number): Scheduled[] {
    const drums = this.drums;
    if (!drums) return [];
    if (id === DRUMS_ID) {
      return parseGroove(grooveForSong(song, span.bars)).map((h) => {
        const when = at(span.start + h.beat);
        return { at: when, fire: () => drums.hitDrum({ piece: h.piece, velocity: h.velocity, radius: 0, articulation: h.articulation, when }) };
      });
    }
    const drum = handDrumFor(id);
    if (!drum) return [];
    drums.prepareHandStrokes(drum.heads.flatMap((head) => [head.center, head.edge, ...(head.edgeLeft ? [head.edgeLeft] : [])]));
    const r = rhythmForSong(song, id, span.bars);
    return (parseRhythm(r.phrase, r.subdiv, r.beatsPerBar, r.bars) ?? []).flatMap((st) => {
      const head = drum.heads[st.head];
      if (!head) return [];
      const stroke = st.part === 'center' ? head.center : st.part === 'edgeLeft' ? (head.edgeLeft ?? head.edge) : head.edge;
      const when = at(span.start + st.beat);
      return [{ at: when, fire: () => drums.hitHandDrum(stroke, st.velocity, when) }];
    });
  }

  stop(): void {
    if (this.notes.length) this.out.silence();
    this.notes = [];
    this.next = 0;
  }
}
