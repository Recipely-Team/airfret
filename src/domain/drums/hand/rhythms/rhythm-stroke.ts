/** One stroke of a rhythm, at a beat: which head, which of its strokes (centre, edge, the left hand's edge), how hard. */
export interface RhythmStroke {
  readonly beat: number;
  readonly head: number;
  readonly part: 'center' | 'edge' | 'edgeLeft';
  readonly velocity: number;
}
