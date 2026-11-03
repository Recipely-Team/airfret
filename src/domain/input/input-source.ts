/** Where a binding comes from. USB foot switches usually appear as keys; e-drum pedals as MIDI. */
export const InputSource = {
  key: 'key',
  mouse: 'mouse',
  gamepad: 'gamepad',
  midi: 'midi',
} as const;

export type InputSource = (typeof InputSource)[keyof typeof InputSource];
