import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { PIANO_ID } from '@domain/keys/piano-id';
import { ChainKind } from '@domain/instruments/chain-kind';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import type { Song } from '@domain/lessons/catalog/song';

const isBass = (instrumentId: string) => instrumentById(instrumentId).chain === ChainKind.bass;

/**
 * The songs an instrument can play by itself in the *Watch it play* mode: every guitar song on any guitar (and
 * the banjo), every bass song on either bass — the player's own songs included. Its own showcase piece comes first.
 */
export function watchableSongs(songs: readonly Song[], instrumentId: string): Song[] {
  // The self-playing hand is a guitarist's; the drums and the piano don't play by themselves yet.
  // …nor can it finger a saz's in-between frets yet.
  if (instrumentId === DRUMS_ID || instrumentId === PIANO_ID || instrumentById(instrumentId).fretCents) return [];
  const fits = songs.filter((s) => s.instrument !== DRUMS_ID && isBass(s.instrument) === isBass(instrumentId));
  const own = DEMO_SONG_BY_INSTRUMENT[instrumentId];
  return [...fits.filter((s) => s.id === own), ...fits.filter((s) => s.id !== own)];
}
