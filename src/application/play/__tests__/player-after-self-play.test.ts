import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DemoPerformer } from '@application/demo/demo-performer';
import { showPerformance } from '@application/demo/show-performance';
import { Player } from '@application/play/player';
import { chordSlots } from '@domain/fretboard/chord-grid';
import { computeLayout } from '@domain/fretboard/compute-layout';
import type { Point } from '@domain/fretboard/point';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { StrumFilter } from '@domain/settings/strum-filter';
import { HandLandmark } from '@domain/tracking/hand-landmark';

const inst = instrumentById('acoustic');
const layout = computeLayout(1440, 900, 6, false, 12);
const CHORDS = ['G', 'C', 'D', 'Em'];
const FRAME = 1 / 30;

function strummer(tip: Point): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ ...tip, z: 0 }));
  pts[HandLandmark.wrist] = { x: tip.x, y: tip.y - 130, z: 0 };
  pts[HandLandmark.indexMcp] = { x: tip.x, y: tip.y - 70, z: 0 };
  pts[HandLandmark.pinkyMcp] = { x: tip.x + 40, y: tip.y - 70, z: 0 };
  pts[HandLandmark.middleMcp] = { x: tip.x + 15, y: tip.y - 70, z: 0 };
  pts[HandLandmark.indexPip] = { x: tip.x, y: tip.y - 40, z: 0 };
  pts[HandLandmark.indexTip] = tip;
  return pts;
}

function fretter(tip: Point): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: tip.x, y: tip.y + 70 }));
  pts[HandLandmark.wrist] = { x: tip.x, y: tip.y + 140 };
  pts[HandLandmark.middleMcp] = { x: tip.x, y: tip.y + 60 };
  for (const [t, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]] as const) {
    pts[pip] = { x: tip.x, y: tip.y + 40 };
    pts[t] = { x: tip.x, y: tip.y };
  }
  return pts;
}

function fresh(mode: PlayMode) {
  const sound = new FakeSoundOutput();
  const player = new Player(sound);
  player.configure({ layout, instrument: inst, mode, chords: CHORDS, strumFilter: StrumFilter.both, capo: 0 });
  return { sound, player };
}

/** Thirty seconds of the Prelude by itself, the player's strumming hand hovering beside the strings as it would. */
function afterSelfPlay(mode: PlayMode) {
  const f = fresh(mode);
  const demo = new DemoPerformer(f.sound);
  const song = SONGS.find((s) => s.id === 'bach-prelude');
  if (!song || !demo.start(song, inst, 0).isOk) throw new Error('demo');
  const idle = strummer({ x: layout.strumX1 + 120, y: layout.centerY });
  let t = 0;
  for (; t < 30; t += FRAME) {
    f.sound.now = t;
    f.player.strikeAlong([idle], t, t, true);
    showPerformance(f.player, demo.update(layout, inst, 0, t), t);
  }
  demo.stop();
  showPerformance(f.player, null, t);
  return { ...f, t };
}

/** The same two seconds of playing: the fretting hand on the third chord box, the strumming hand sweeping down and up. */
function play(player: Player, sound: FakeSoundOutput, t0: number) {
  sound.plucks.length = 0;
  sound.touches.length = 0;
  const box = chordSlots(layout, CHORDS.length)[2] ?? { x0: 0, x1: 0 };
  const tip = { x: (box.x0 + box.x1) / 2, y: layout.centerY };
  const ys = strumStringYs(layout);
  const top = (ys[0] ?? 0) - 40;
  const bottom = (ys[ys.length - 1] ?? 0) + 40;
  const x = (layout.strumX0 + layout.strumX1) / 2;
  for (let i = 0; i < 60; i++) {
    const t = t0 + i * FRAME;
    const phase = (i % 20) / 20;
    const y = phase < 0.5 ? top + (bottom - top) * phase * 2 : bottom - (bottom - top) * (phase - 0.5) * 2;
    sound.now = t;
    player.updateHands([fretter(tip), strummer({ x, y })], t, t, true);
  }
  return { plucks: sound.plucks.map((p) => [p.string, p.midi, p.voice, p.isMuted, p.isPalmMuted]), touches: [...sound.touches], chord: player.chord, slot: player.slot };
}

describe('Playing yourself after the instrument has played by itself', () => {
  for (const mode of Object.values(PlayMode)) {
    it(`${mode} mode: your hands play exactly as they would on a fresh start (it seemed to glitch after a long self-play)`, () => {
      const used = afterSelfPlay(mode);
      const clean = fresh(mode);
      const a = play(used.player, used.sound, used.t + 1);
      const b = play(clean.player, clean.sound, used.t + 1);
      expect(a.plucks.length).toBeGreaterThan(0);
      expect(a).toEqual(b);
    });
  }
});
