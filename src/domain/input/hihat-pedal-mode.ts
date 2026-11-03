/**
 * - `holdToClose`: like a real kit — foot down closes the hi-hat, foot up opens it.
 * - `holdToOpen`: easier on a keyboard — the hi-hat stays closed unless you hold the pedal key.
 */
export const HiHatPedalMode = {
  holdToClose: 'holdToClose',
  holdToOpen: 'holdToOpen',
} as const;

export type HiHatPedalMode = (typeof HiHatPedalMode)[keyof typeof HiHatPedalMode];
