/** Which part of the finger meets the string. `none` = the finger can't play in this pose. */
export const StrikeSurface = {
  nail: 'nail',
  pad: 'pad',
  none: 'none',
} as const;

export type StrikeSurface = (typeof StrikeSurface)[keyof typeof StrikeSurface];
