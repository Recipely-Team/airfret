/** Which signal chain (body, amp, cabinet) colours an instrument's raw strings. */
export const ChainKind = {
  acoustic: 'acoustic',
  nylon: 'nylon',
  clean: 'clean',
  drive: 'drive',
  bass: 'bass',
  banjo: 'banjo',
  piano: 'piano',
  saz: 'saz',
  kopuz: 'kopuz',
  ukulele: 'ukulele',
  mandolin: 'mandolin',
  balalaika: 'balalaika',
  bouzouki: 'bouzouki',
  harpsichord: 'harpsichord',
} as const;

export type ChainKind = (typeof ChainKind)[keyof typeof ChainKind];
