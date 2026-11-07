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
 * The songs a fretted instrument can play by itself in the *Watch it play* mode: every guitar song on any guitar (and
 * the banjo), every bass song on any bass; on a ukulele, a mandolin, a saz, a balalaika or a bouzouki every melody
 * (moved into its range by octaves when it plays) and, where it has chord shapes, every chord song. The player's own
 * songs included; its showcase piece first.
 */
export function watchableSongs(songs: readonly Song[], instrumentId: string): Song[] {
  const inst = instrumentById(instrumentId);
  // Only fretted instruments in the catalogue (an unknown id falls back to the acoustic guitar).
  if (inst.id !== instrumentId || instrumentId === DRUMS_ID || isKeyboard(instrumentId)) return [];
  const isShortNeck = !isBass(instrumentId) && inst.tuning.length < GUITAR_STRING_COUNT;
  const fits = isShortNeck
    ? songs.filter((s) => s.instrument !== DRUMS_ID && (s.mode === PlayMode.note || (s.mode === PlayMode.chord && inst.chordShapes !== undefined)))
    : songs.filter((s) => s.instrument !== DRUMS_ID && isBass(s.instrument) === isBass(instrumentId));
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
