import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { Player } from '@application/play/player';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { strumStringYs } from '@domain/fretboard/neck-geometry';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { StrumFilter } from '@domain/settings/strum-filter';

const W = 1440;
const H = 900;
/** An A major shape, as the self-playing hand would hold it: x 0 2 2 2 0. */
const A_SHAPE = { frets: [0, 0, 2, 2, 2, 0], bends: [0, 0, 0, 0, 0, 0], presses: [], barre: -1 };

function performing(mode: PlayMode) {
  const sound = new FakeSoundOutput();
  const player = new Player(sound);
  const inst = instrumentById('acoustic');
  const layout = computeLayout(W, H, inst.tuning.length, false, inst.maxFret);
  player.configure({ layout, instrument: inst, mode, chords: ['G', 'C'], strumFilter: StrumFilter.both, capo: 0 });
  player.isPerforming = true;
  player.fretting = A_SHAPE;
  // The self-playing hand, as `showPerformance` puts it on the stage: a hand whose finger can't strike.
  player.strumHand = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  const ys = strumStringYs(layout);
  const x = (layout.strumX0 + layout.strumX1) / 2;
  player.pointer({ x, y: (ys[0] ?? 0) - 40 }, 1, 0);
  player.pointer({ x, y: (ys[ys.length - 1] ?? 0) + 40 }, 1.03, 0);
  return { sound, player };
}

describe('Playing along while the instrument plays itself', () => {
  for (const mode of Object.values(PlayMode)) {
    it(`a stroke in ${mode} mode sounds what the self-playing hand holds, not the selected chord`, () => {
      const { sound } = performing(mode);
      // E2 A2 E3 A3 C#4 E4
      expect(sound.plucks.map((p) => p.midi)).toEqual([40, 45, 52, 57, 61, 64]);
    });
  }

  it('a mouse stroke plays even though the self-playing hand is drawn as the strumming hand (it was judged by that hand and dropped)', () => {
    const { sound, player } = performing(PlayMode.chord);
    expect(sound.plucks).toHaveLength(6);
    expect(player.strike).toBe('nail');
  });

  it("the player's strokes leave the self-playing pick's trail alone", () => {
    const { player } = performing(PlayMode.chord);
    expect(player.trail).toEqual([]);
  });

  it('a finger resting on a string during self-play stops it in both voices — one guitar, whoever plucked it', () => {
    const { sound, player } = performing(PlayMode.chord);
    const ys = strumStringYs(player.layout);
    const x = (player.layout.strumX0 + player.layout.strumX1) / 2;
    player.pointer(null, 1.5, 0);
    for (let t = 2; t < 2.4; t += 1 / 60) player.pointer({ x, y: ys[2] ?? 0 }, t, 0);
    expect(sound.touches).toContain(2);
    expect(sound.touchedVoices.at(-1)).toEqual(['player', 'guide']);
  });

  it('outside self-play a resting finger stops only the player\'s own string', () => {
    const { sound, player } = performing(PlayMode.chord);
    player.isPerforming = false;
    const ys = strumStringYs(player.layout);
    const x = (player.layout.strumX0 + player.layout.strumX1) / 2;
    player.pointer(null, 1.5, 0);
    for (let t = 2; t < 2.4; t += 1 / 60) player.pointer({ x, y: ys[2] ?? 0 }, t, 0);
    expect(sound.touchedVoices.at(-1)).toEqual(['player']);
  });
});
