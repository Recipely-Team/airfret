import type { PlayEvent } from '@application/play/play-event';
import type { Player } from '@application/play/player';
import { TourHint } from '@application/tour/tour-hint';
import { StrumDirection } from '@domain/gesture/strum-direction';

const HOLD_SECONDS = { hands: 1, point: 0.4, mute: 0.3 } as const;
const SOFT = 0.5;
const LOUD = 0.75;

interface Step {
  readonly id: string;
  readonly hint: TourHint;
  /** Chord the hint points at (chip steps). */
  readonly chord?: string;
}

const STEPS: readonly Step[] = [
  { id: 'hands', hint: TourHint.hands },
  { id: 'point', hint: TourHint.chip, chord: 'Em' },
  { id: 'strum', hint: TourHint.strings },
  { id: 'dynamics', hint: TourHint.strings },
  { id: 'change', hint: TourHint.chip, chord: 'Am' },
  { id: 'mute', hint: TourHint.neck },
  { id: 'done', hint: TourHint.none },
];

/**
 * **TourSession** — the first-time walkthrough: one action per step, checked against what the
 * player actually does, advancing on its own.
 */
export class TourSession {
  private index = 0;
  private heldSince: number | null = null;
  private wasSoft = false;
  private wasLoud = false;

  constructor(hasCamera: boolean) {
    if (!hasCamera) this.index = 1;
  }

  get step(): Step {
    return STEPS[this.index] ?? (STEPS[STEPS.length - 1] as Step);
  }

  /** 1-based number of the current step among the action steps, and how many there are. */
  get progress(): { at: number; of: number } {
    return { at: Math.min(this.index + 1, STEPS.length - 1), of: STEPS.length - 1 };
  }

  get isDone(): boolean {
    return this.step.id === 'done';
  }

  skip(): void {
    this.advance();
  }

  /** Every frame: checks the pose-based steps (hands visible, pointing, fist). */
  update(player: Player, now: number): void {
    const id = this.step.id;
    const isHolding =
      (id === 'hands' && player.fretHand !== null && player.strumHand !== null) ||
      (id === 'point' && player.chord === this.step.chord) ||
      (id === 'mute' && player.isMuted);
    if (!isHolding) {
      this.heldSince = null;
      return;
    }
    this.heldSince ??= now;
    const need = id === 'hands' ? HOLD_SECONDS.hands : id === 'point' ? HOLD_SECONDS.point : HOLD_SECONDS.mute;
    if (now - this.heldSince >= need) this.advance();
  }

  /** On every strum: checks the playing steps. */
  onEvent(e: PlayEvent): void {
    const id = this.step.id;
    if (id === 'strum' && e.dir === StrumDirection.down && !e.isMuted) this.advance();
    else if (id === 'dynamics') {
      this.wasSoft ||= e.amp < SOFT;
      this.wasLoud ||= e.amp >= LOUD;
      if (this.wasSoft && this.wasLoud) this.advance();
    } else if (id === 'change' && e.chord === this.step.chord) this.advance();
  }

  private advance(): void {
    this.index = Math.min(STEPS.length - 1, this.index + 1);
    this.heldSince = null;
  }
}
