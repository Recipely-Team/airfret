import type { HandStroke } from '@domain/drums/hand/hand-stroke';

/** One head of a hand drum: where it sits on screen, how it looks, and what each kind of stroke sounds like. */
export interface HandDrumHead {
  readonly cxOfWidth: number;
  readonly cyOfHeight: number;
  /** Radius as a share of the screen width (capped by the height the same way for every drum). */
  readonly size: number;
  /** Height over width of the head as seen: < 1 seen from above, ~1 facing the player. */
  readonly flatten: number;
  readonly look: 'goblet' | 'frame' | 'box' | 'barrel' | 'steel' | 'davul';
  /** Strokes nearer the rim than this (share of the radius) are edge strokes; ≥ 1 means the head has no edge stroke. */
  readonly edgeAt: number;
  readonly center: HandStroke;
  /** The edge stroke of the right hand, and of the left when `edgeLeft` doesn't differ. */
  readonly edge: HandStroke;
  readonly edgeLeft?: HandStroke;
  /**
   * A handpan field: placed on a ring round the shell instead of by screen share (`angle` in degrees, `radius` and
   * `size` as shares of the shell's radius), so the layout keeps its shape on any screen.
   */
  readonly ring?: { readonly angle: number; readonly radius: number };
}
