/** A chord held over a span of beats. */
export interface Segment {
  readonly beat: number;
  readonly dur: number;
  readonly chord: string;
}
