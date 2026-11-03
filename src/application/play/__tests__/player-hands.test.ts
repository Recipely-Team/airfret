import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { Player } from '@application/play/player';
import { chordSlots } from '@domain/fretboard/chord-grid';
import { computeLayout } from '@domain/fretboard/compute-layout';
import type { Point } from '@domain/fretboard/point';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { StrumFilter } from '@domain/settings/strum-filter';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const inst = instrumentById('acoustic');
const layout = computeLayout(1440, 900, 6, false, 12);
const CHORDS = ['G', 'C', 'D', 'Em'];

/** A 21-point hand at `at`, index finger pointing to `tip`; `isFist` curls every finger. */
function hand(at: Point, tip: Point, isFist = false): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: at.x, y: at.y + 10 }));
  pts[HandLandmark.wrist] = { x: at.x, y: at.y + 80 };
  pts[HandLandmark.middleMcp] = at;
  for (const [tipIdx, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]] as const) {
    pts[pip] = { x: at.x, y: at.y - 20 };
    pts[tipIdx] = isFist ? { x: at.x, y: at.y + 40 } : { x: at.x, y: at.y - 60 };
  }
  if (!isFist) pts[HandLandmark.indexTip] = tip;
  return pts;
}

function setup() {
  const sound = new FakeSoundOutput();
  const player = new Player(sound);
  player.configure({ layout, instrument: inst, mode: PlayMode.chord, chords: CHORDS, strumFilter: StrumFilter.both });
  return { sound, player };
}

describe('Player with camera hands', () => {
  it('selects the chord box the fretting index finger points at', () => {
    const { player } = setup();
    const box = chordSlots(layout, CHORDS.length)[2]!;
    const tip = { x: (box.x0 + box.x1) / 2, y: layout.centerY };
    for (let i = 0; i < 5; i++) player.updateHands([hand(tip, tip)], i / 30, 0, true);
    expect(player.chord).toBe('D');
    expect(player.fretHand).not.toBeNull();
  });

  it('mutes and damps the strings when the fretting hand closes into a fist on the neck', () => {
    const { sound, player } = setup();
    const palm = { x: (layout.nutX + layout.neckEndX) / 2, y: layout.centerY };
    for (let i = 0; i < 3; i++) player.updateHands([hand(palm, palm, true)], i / 30, 0, true);
    expect(player.isMuted).toBe(true);
    expect(sound.damps).toContain(-1);
  });

  it('assigns the hand on the right to strumming and plays the strings it crosses', () => {
    const { sound, player } = setup();
    const x = (layout.strumX0 + layout.strumX1) / 2;
    const fretTip = { x: layout.nutX + 50, y: layout.centerY };
    const above = { x, y: layout.centerY - layout.spreadBody - 40 };
    const below = { x, y: layout.centerY + layout.spreadBody + 40 };
    player.updateHands([hand(fretTip, fretTip), hand(above, above)], 0, 0, true);
    player.updateHands([hand(fretTip, fretTip), hand(below, below)], 0.03, 0, true);
    expect(player.strumHand).not.toBeNull();
    expect(sound.plucks.length).toBeGreaterThan(0);
  });

  it('lets the mouse strum instead of the camera while it is held', () => {
    const { sound, player } = setup();
    const x = (layout.strumX0 + layout.strumX1) / 2;
    const above = { x, y: layout.centerY - layout.spreadBody - 40 };
    const below = { x, y: layout.centerY + layout.spreadBody + 40 };
    player.updateHands([hand(above, above)], 0, 0, false);
    player.updateHands([hand(below, below)], 0.03, 0, false);
    expect(sound.plucks).toEqual([]);
  });
});
