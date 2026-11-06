import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { Groove } from '@domain/drums/grooves/groove';
import type { GrooveHit } from '@domain/drums/grooves/groove-hit';
import { parseGroove } from '@domain/drums/grooves/parse-groove';

/** Hits are handed to the audio clock this far ahead of when they sound, seconds. */
const LOOKAHEAD = 0.2;
/** The first hit sounds this soon after *Watch it play*, seconds. */
const FIRST_AFTER = 0.3;
/** The groove is over this long after its last hit (the crash rings), seconds. */
const TAIL = 1.2;

/**
 * **KitPerformer** — the drum kit playing a groove by itself: each hit handed to the audio clock a little ahead and
 * reported as it lands, for the kit to light.
 */
export class KitPerformer {
  private hits: (GrooveHit & { at: number })[] = [];
  private nextSound = 0;
  private nextShown = 0;
  private endAt = 0;
  private isOn = false;

  constructor(private readonly sound: SoundOutputInterface) {}

  get isPlaying(): boolean {
    return this.isOn;
  }

  start(groove: Groove, audioNow: number): boolean {
    const spb = 60 / groove.bpm;
    const t0 = audioNow + FIRST_AFTER;
    this.hits = parseGroove(groove).map((h) => ({ ...h, at: t0 + h.beat * spb }));
    if (!this.hits.length) return false;
    this.nextSound = 0;
    this.nextShown = 0;
    this.endAt = (this.hits[this.hits.length - 1]?.at ?? t0) + TAIL;
    this.isOn = true;
    return true;
  }

  stop(): void {
    this.isOn = false;
    this.hits = [];
  }

  /** Sounds what comes up next; returns the hits landing since the last frame, or null once the groove is over. */
  update(audioNow: number): GrooveHit[] | null {
    if (!this.isOn) return null;
    while (this.nextSound < this.hits.length && (this.hits[this.nextSound]?.at ?? Infinity) <= audioNow + LOOKAHEAD) {
      const h = this.hits[this.nextSound++];
      if (h) this.sound.hitDrum({ piece: h.piece, velocity: h.velocity, radius: 0, articulation: h.articulation, when: h.at });
    }
    const landed: GrooveHit[] = [];
    while (this.nextShown < this.nextSound && (this.hits[this.nextShown]?.at ?? Infinity) <= audioNow) {
      const h = this.hits[this.nextShown++];
      if (h) landed.push(h);
    }
    if (audioNow > this.endAt) {
      this.stop();
      return null;
    }
    return landed;
  }
}
