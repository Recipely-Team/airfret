import { DRUMS_ID } from '@domain/drums/drums-id';
import { HAND_DRUMS } from '@domain/drums/hand/hand-drum-catalog';
import { PIANO_ID } from '@domain/keys/piano-id';

/**
 * How the home page groups the instruments, by what a player is looking for: a guitar sound, a bass
 * line, keys, a wind or a beat. Every instrument appears once; ids match `INSTRUMENT_SLUGS`.
 */
export const HOME_GROUPS: readonly { readonly label: string; readonly ids: readonly string[] }[] = [
  { label: 'home.group.guitars', ids: ['acoustic', 'twelve', 'nylon', 'ukulele', 'clean', 'guitar7', 'drive'] },
  { label: 'home.group.folk', ids: ['saz', 'kopuz', 'mandolin', 'balalaika', 'bouzouki', 'greekBouzouki', 'banjo'] },
  { label: 'home.group.bass', ids: ['bass', 'bass5', 'bass6'] },
  { label: 'home.group.keys', ids: [PIANO_ID, 'harpsichord', 'marimba', 'xylophone', 'glockenspiel'] },
  { label: 'home.group.winds', ids: ['flute', 'clarinet', 'oboe', 'bassoon', 'trumpet', 'horn', 'trombone', 'tuba'] },
  { label: 'home.group.drums', ids: [DRUMS_ID, ...HAND_DRUMS.map((d) => d.id)] },
];
