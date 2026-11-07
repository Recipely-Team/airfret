/** How much changed in the strumming area this frame, and where (0 top … 1 bottom) the change was centred. */
export interface MotionSample {
  readonly energy: number;
  readonly cy: number;
}
