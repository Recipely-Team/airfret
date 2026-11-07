/** How often a hidden tab moves a self-playing song on, ms: well within the 0.2 s its notes are scheduled ahead. */
const HIDDEN_TICK_MS = 50;

/**
 * A hidden tab gets no animation frames, so a song playing by itself (an instrument's, or the band's) would stop
 * once its scheduled notes ran out: while the tab is hidden, `tick` moves it on on a timer instead. The sound is never
 * silenced for a hidden tab — the player may well be listening from another one.
 */
export function keepPlayingWhileHidden(doc: Pick<Document, 'hidden' | 'addEventListener'>, tick: () => void): void {
  let timer: ReturnType<typeof setInterval> | undefined;
  doc.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    timer = doc.hidden ? setInterval(tick, HIDDEN_TICK_MS) : undefined;
  });
}
