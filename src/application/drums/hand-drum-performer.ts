import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { HandDrum } from '@domain/drums/hand/hand-drum';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';
import type { RhythmStroke } from '@domain/drums/hand/rhythms/rhythm-stroke';
import { parseRhythm } from '@domain/drums/hand/rhythms/parse-rhythm';
import type { HandRhythm } from '@domain/drums/hand/rhythms/hand-rhythm';
import type { PerformedStroke } from '@application/drums/performed-stroke';

/** Strokes are handed to the audio clock this far ahead of when they sound, seconds. */
const LOOKAHEAD = 0.2;
/** The first stroke sounds this soon after *Watch it play*, seconds. */
const FIRST_AFTER = 0.3;
/** The piece is over this long after its last stroke (it rings out), seconds. */
const TAIL = 0.6;

interface Timed {
  readonly at: number;
  readonly head: number;
  readonly stroke: HandStroke;
  readonly part: RhythmStroke['part'];
  readonly velocity: number;
}

/**
 * **HandDrumPerformer** — a hand drum playing a rhythm by itself: each stroke handed to the audio clock a little
 * ahead, and shown on its head as it lands.
 */
export class HandDrumPerformer {
  private strokes: Timed[] = [];
  private nextSound = 0;
  private nextShown = 0;
  private endAt = 0;
  private isOn = false;

  constructor(private readonly sound: SoundOutputInterface) {}

  get isPlaying(): boolean {
    return this.isOn;
  }

  /** Starts `rhythm`; its first beat lands at `firstAt` (audio clock), by default just after now. */
  start(rhythm: HandRhythm, drum: HandDrum, audioNow: number, firstAt = audioNow + FIRST_AFTER): boolean {
    const parsed = parseRhythm(rhythm.phrase, rhythm.subdiv, rhythm.beatsPerBar, rhythm.bars);
    if (!parsed?.length) return false;
    const spb = 60 / rhythm.bpm;
    const t0 = firstAt;
    const timed: Timed[] = [];
    for (const s of parsed) {
      const head = drum.heads[s.head];
      if (!head) continue;
      const stroke = s.part === 'center' ? head.center : s.part === 'edgeLeft' ? (head.edgeLeft ?? head.edge) : head.edge;
      timed.push({ at: t0 + s.beat * spb, head: s.head, stroke, part: s.part, velocity: s.velocity });
    }
    if (!timed.length) return false;
    this.strokes = timed.sort((a, b) => a.at - b.at);
    this.nextSound = 0;
    this.nextShown = 0;
    this.endAt = (this.strokes[this.strokes.length - 1]?.at ?? t0) + TAIL;
    this.isOn = true;
    return true;
  }

  stop(): void {
    this.isOn = false;
    this.strokes = [];
  }

  /** Sounds what comes up next; returns the strokes landing since the last frame, or null once the rhythm is over. */
  update(audioNow: number): PerformedStroke[] | null {
    if (!this.isOn) return null;
    while (this.nextSound < this.strokes.length && (this.strokes[this.nextSound]?.at ?? Infinity) <= audioNow + LOOKAHEAD) {
      const s = this.strokes[this.nextSound++];
      if (s) this.sound.hitHandDrum(s.stroke, s.velocity, s.at);
    }
    const landed: PerformedStroke[] = [];
    while (this.nextShown < this.nextSound && (this.strokes[this.nextShown]?.at ?? Infinity) <= audioNow) {
      const s = this.strokes[this.nextShown++];
      if (s) landed.push({ head: s.head, part: s.part, stroke: s.stroke, velocity: s.velocity });
    }
    if (audioNow > this.endAt) {
      this.stop();
      return null;
    }
    return landed;
  }
}
