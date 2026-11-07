import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import type { DrumPlayer } from '@application/drums/drum-player';
import { HandDrumPlayer } from '@application/drums/hand-drum-player';
import { PianoPlayer } from '@application/keys/piano-player';
import type { Player } from '@application/play/player';
import type { Point } from '@domain/fretboard/point';
import { clearHands } from '@presentation/app/clear-hands';
import { HandDrumStage } from '@presentation/app/stages/hand-drum-stage';
import { KeysStage } from '@presentation/app/stages/keys-stage';

const hand: Point[] = Array.from({ length: 21 }, (_, i) => ({ x: 400 + i, y: 300 + i }));

describe('Turning the camera off', () => {
  it('leaves no hand skeleton on the keys, the hand drums, the kit or the guitar', () => {
    const sound = new FakeSoundOutput();
    const piano = new PianoPlayer(sound);
    piano.fit(1280, 800, 'piano', 0);
    const drum = new HandDrumPlayer(sound);
    drum.configure('darbuka', 1280, 800);
    piano.updateHands([hand], 0, 0);
    drum.updateHands([hand], 0, 0);
    const cleared: string[] = [];
    const player = { updateHands: (h: unknown[]) => h.length === 0 && cleared.push('guitar') } as unknown as Player;
    const kit = { updateHands: (h: unknown[]) => h.length === 0 && cleared.push('kit') } as unknown as DrumPlayer;
    clearHands({ player, drums: kit, stages: [new KeysStage(piano, sound), new HandDrumStage(drum, sound)], sound }, 1);
    expect(piano.hands).toEqual([]);
    expect(drum.hands).toEqual([]);
    expect(cleared).toEqual(['guitar', 'kit']);
  });
});
