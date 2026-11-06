import { seededRandom } from '@core/math/seeded-random';
import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { Instrument } from '@domain/instruments/instrument';
import { StrumMark } from '@domain/lessons/chart/strum-mark';
import type { Target } from '@domain/lessons/chart/target';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import { chordNotes } from '@domain/music/chords/chord-voicing';
import type { FingeredNote } from '@domain/music/fingering/fingered-note';
import { planFingering } from '@domain/music/fingering/plan-fingering';

const LOOKAHEAD = 0.15;
/** Stroke strength by where it falls in the bar. */
const ACCENT = { downbeat: 0.86, onBeat: 0.74, offBeat: 0.56, up: 0.46, note: 0.7 } as const;
/** Fingerstyle balance: the melody sings over the bass, inner voices sit underneath. */
const VOICING = { bass: 0.62, inner: 0.5 } as const;
/** Gap between strings in a strum: a hard stroke sweeps faster (≈7 ms), a soft one slower (≈15 ms). */
const STAGGER = { soft: 0.015, hard: 0.007 } as const;
/** Each string the pick passes takes a little of its energy. */
const PER_STRING_LOSS = 0.04;
/** Upstrokes catch only the top strings. */
const UP_STRINGS = 4;
/** Human variation: timing (s) and strike position (fraction of the string). */
const HUMAN = { timing: 0.005, position: 0.035, level: 0.06 } as const;
/** Over the soundhole, where a guitarist strums. */
const POSITION = 0.22;
const SEED = 7;
const EPSILON = 1e-6;

/**
 * **GuidePlayer** — the guitarist you shadow. It plays every lesson target on the guide voice the way a
 * player would, not like a sequencer.
 *
 * @remarks
 * - Dynamics: the downbeat is strongest, on-beats full, off-beats lighter, upstrokes lightest.
 * - Strums: downstrokes sweep low → high across every chord tone with the nail; upstrokes catch the top
 *   strings with the pad. Harder strokes sweep faster; the pick loses a little energy on each string.
 * - Feel: a few milliseconds of timing spread and a slightly different spot on the string each stroke
 *   (seeded, so the same lesson always sounds the same).
 * - Strings are re-struck while ringing (the worklet blends into the vibration), so the chord sustains.
 * - Note charts are fingered for the whole piece up front (`planFingering`) on the instrument's real fret
 *   range, so melody, bass and inner voices each get a string and notes ring on as a guitarist lets them.
 */
export class GuidePlayer {
  private next = 0;
  private rand = seededRandom(SEED);
  private plan: { chart: SongChart; key: string; notes: FingeredNote[][] } | null = null;

  constructor(private readonly sound: SoundOutputInterface) {}

  reset(): void {
    this.next = 0;
    this.rand = seededRandom(SEED);
  }

  update(session: LessonSession, instrument: Instrument, audioNow: number): void {
    const targets = session.chart.targets;
    while (this.next < targets.length) {
      const tg = targets[this.next] as Target;
      const when = session.timeOfBeat(tg.beat);
      if (when > audioNow + LOOKAHEAD) return;
      this.next++;
      if (when >= audioNow - 0.02) this.play(tg, instrument, when, session.song.beatsPerBar, this.fingering(session.chart, instrument)[tg.index] ?? []);
    }
  }

  /** The planned fingering of every target, recomputed only when the chart or the strings change. */
  private fingering(chart: SongChart, instrument: Instrument): FingeredNote[][] {
    const key = `${instrument.tuning.join(',')}/${instrument.frets}`;
    if (this.plan?.chart !== chart || this.plan.key !== key) {
      const onsets = chart.targets.map((t) => (t.midi === undefined ? [] : [t.midi, ...(t.harmony ?? [])]));
      this.plan = { chart, key, notes: planFingering(onsets, instrument.tuning, instrument.frets) };
    }
    return this.plan.notes;
  }

  private play(tg: Target, instrument: Instrument, when: number, beatsPerBar: number, fingered: readonly FingeredNote[]): void {
    const tuning = instrument.tuning;
    if (tg.chord === undefined) {
      const start = this.humanTime(when);
      const bass = Math.min(...fingered.map((n) => n.midi));
      for (const n of fingered) {
        const amp = n.midi === tg.midi ? ACCENT.note : n.midi === bass ? VOICING.bass : VOICING.inner;
        this.pluck(n.string, n.midi, amp, start, StrikeSurface.pad);
      }
      return;
    }
    const isUp = tg.strum === StrumMark.up;
    const amp = this.accent(tg.beat, beatsPerBar, isUp);
    const tones = chordNotes(tg.chord, tuning, instrument.chordShapes).map((midi, string) => ({ midi, string })).filter((n): n is { midi: number; string: number } => n.midi !== null);
    const strings = isUp ? tones.reverse().slice(0, UP_STRINGS) : tones;
    const stagger = STAGGER.soft + (STAGGER.hard - STAGGER.soft) * amp;
    const start = this.humanTime(when);
    strings.forEach((n, i) => this.pluck(n.string, n.midi, amp * (1 - PER_STRING_LOSS * i), start + i * stagger, isUp ? StrikeSurface.pad : StrikeSurface.nail));
  }

  private accent(beat: number, beatsPerBar: number, isUp: boolean): number {
    if (isUp) return ACCENT.up;
    const inBar = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
    if (inBar < EPSILON) return ACCENT.downbeat;
    return Math.abs(beat - Math.round(beat)) < EPSILON ? ACCENT.onBeat : ACCENT.offBeat;
  }

  private humanTime(when: number): number {
    return when + (this.rand() * 2 - 1) * HUMAN.timing;
  }

  private pluck(string: number, midi: number, amp: number, when: number, attack: StrikeSurface): void {
    const level = amp * (1 + (this.rand() * 2 - 1) * HUMAN.level);
    const position = POSITION + (this.rand() * 2 - 1) * HUMAN.position;
    this.sound.pluck({ string, midi, amp: level, when, isMuted: false, position, voice: Voice.guide, attack, isPalmMuted: false });
  }
}
