import { DEMO_SONG_BY_INSTRUMENT } from '@application/demo/demo-songs';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { isKeyboard, keyboardFor } from '@domain/keys/keyboard-instruments';
import { PlayMode } from '@domain/instruments/play-mode';
import { ChainKind } from '@domain/instruments/chain-kind';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { GUITAR_STRING_COUNT } from '@domain/music/tunings';
import type { Song } from '@domain/lessons/catalog/song';

const isBass = (instrumentId: string) => instrumentById(instrumentId).chain === ChainKind.bass;

/**
 * The songs an instrument can play by itself in the *Watch it play* mode: every guitar song on any guitar (and
 * the banjo), every bass song on either bass — the player's own songs included. Its own showcase piece comes first.
 */
export function watchableSongs(songs: readonly Song[], instrumentId: string): Song[] {
  // The self-playing hand is a guitarist's; the drums and keyboards don't play by themselves yet.
  // …and plays guitar or bass songs: not a ukulele's, a mandolin's or a saz's (fewer strings, other ranges).
  const inst = instrumentById(instrumentId);
  // Only fretted instruments in the catalogue (an unknown id falls back to the acoustic guitar).
  if (inst.id !== instrumentId || instrumentId === DRUMS_ID || isKeyboard(instrumentId) || (!isBass(instrumentId) && inst.tuning.length < GUITAR_STRING_COUNT)) return [];
  const fits = songs.filter((s) => s.instrument !== DRUMS_ID && isBass(s.instrument) === isBass(instrumentId));
  const own = DEMO_SONG_BY_INSTRUMENT[instrumentId];
  return [...fits.filter((s) => s.id === own), ...fits.filter((s) => s.id !== own)];
}

/**
 * The songs a keyboard or wind can play by itself: every melody (its own range found by octaves) and, on a keyboard
 * that plays chords, every chord song as an accompaniment. Its showcase piece comes first.
 */
export function keyboardSongs(songs: readonly Song[], instrumentId: string): Song[] {
  const kb = keyboardFor(instrumentId);
  if (!kb) return [];
  const fits = songs.filter((s) => s.instrument !== DRUMS_ID && (s.mode === PlayMode.note || (s.mode === PlayMode.chord && !kb.isMonophonic)));
  const own = DEMO_SONG_BY_INSTRUMENT[instrumentId];
  return [...fits.filter((s) => s.id === own), ...fits.filter((s) => s.id !== own)];
}
