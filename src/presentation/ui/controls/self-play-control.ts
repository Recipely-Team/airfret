/** What the toolbar's *Watch it play* mode needs from self-play. */
export interface SelfPlayControl {
  /** The current instrument has a piece to play by itself. */
  isOffered(): boolean;
  /** The mode is on (a song may or may not be playing). */
  isOn(): boolean;
  enter(): void;
  leave(): void;
}
