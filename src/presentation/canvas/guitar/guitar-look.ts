/** Materials of one instrument family, in CSS colours. */
export interface GuitarLook {
  readonly style: 'acoustic' | 'classical' | 'electric' | 'bass' | 'banjo';
  /** Top / body finish: base colour, grain line colour, and the darker edge burst. */
  readonly top: string;
  readonly topGrain: string;
  readonly burst: string;
  readonly board: string;
  readonly boardGrain: string;
  readonly headstock: string;
  readonly binding: string;
  readonly inlay: string;
  readonly hardware: string;
  readonly pickguard: string;
  /** Strings: wound and plain colours, and how many of the low strings are wound. */
  readonly wound: string;
  readonly plain: string;
  readonly woundCount: number;
}
