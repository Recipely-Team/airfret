/**
 * The band's overall texture — the one control that sets every default (the research report's "texture preset"):
 * - **auto**: chosen from the instruments, building up over the song's form;
 * - **full**: everyone from the start, the climax kept to the end;
 * - **quiet**: never past a gentle middle level — a tune, a bass, soft chords;
 * - **folk**: one melody in many renderings over the rhythm (Turkish heterophony), no added chords;
 * - **march**: oom-pah — bass on the strong beats, chords on the afterbeats, a march beat.
 */
export const BandStyle = {
  auto: 'auto',
  full: 'full',
  quiet: 'quiet',
  folk: 'folk',
  march: 'march',
} as const;
export type BandStyle = (typeof BandStyle)[keyof typeof BandStyle];
