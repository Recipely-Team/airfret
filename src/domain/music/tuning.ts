/** An alternate tuning: semitone offsets per string from standard, low string first. */
export interface Tuning {
  readonly id: string;
  /** i18n key. */
  readonly name: string;
  readonly offsets: readonly number[];
}
