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
} as const;

export type ChainKind = (typeof ChainKind)[keyof typeof ChainKind];
