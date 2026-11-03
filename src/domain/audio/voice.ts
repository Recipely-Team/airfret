/** Who is playing: the player, or the guide guitarist the player shadows. Each has its own volume. */
export const Voice = {
  player: 'player',
  guide: 'guide',
} as const;

export type Voice = (typeof Voice)[keyof typeof Voice];
