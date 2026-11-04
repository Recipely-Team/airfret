import { DRUMS_ID } from '@domain/drums/drums-id';

/**
 * How the home page groups the instruments, by what a player is looking for: a guitar sound, a bass
 * line or a beat. Every instrument appears once; ids match `INSTRUMENT_SLUGS`.
 */
export const HOME_GROUPS: readonly { readonly label: string; readonly ids: readonly string[] }[] = [
  { label: 'home.group.guitars', ids: ['acoustic', 'nylon', 'clean', 'drive', 'banjo'] },
  { label: 'home.group.bass', ids: ['bass', 'bass5'] },
  { label: 'home.group.drums', ids: [DRUMS_ID] },
];
