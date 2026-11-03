/** Canvas colours as RGB triplets — one warm accent on near-black, per the app's restrained look. */
export const Palette = {
  ink: '236, 232, 225',
  accent: '224, 164, 88',
  miss: '196, 103, 90',
  shade: '9, 9, 10',
} as const;

export const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

/** CSS rgba() from a palette triplet. */
export function rgba(rgb: string, alpha: number): string {
  return `rgba(${rgb}, ${alpha})`;
}
