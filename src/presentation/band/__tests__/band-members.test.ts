import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { createBandMember } from '@presentation/band/band-members';

const tune: Song = {
  id: 't', title: 't', credit: 'c', level: 1, bpm: 120, beatsPerBar: 4, mode: PlayMode.note, instrument: 'acoustic', about: 'a',
  notes: 'E4:1 G4:1 A4:2',
};

describe('An instrument added to the band while it plays', () => {
  it('waits for its place on the page instead of stopping the band (it used to throw every frame: the others fell silent and nothing was drawn)', () => {
    const sound = new FakeSoundOutput();
    for (const id of ['acoustic', 'piano', 'davul', 'drums', 'bass']) {
      const member = createBandMember(id, sound);
      member.play(tune, 0);
      expect(() => member.perform(0.5, 0.5), id).not.toThrow();
      member.fit(640, 360);
      expect(() => member.perform(0.6, 0.6), id).not.toThrow();
    }
  });

  it('plays its notes once it has its place', () => {
    const sound = new FakeSoundOutput();
    const guitar = createBandMember('acoustic', sound);
    guitar.play(tune, 0);
    guitar.perform(0.1, 0.1);
    guitar.fit(640, 360);
    for (let t = 0.1; t < 3; t += 1 / 60) guitar.perform(t, t);
    expect(sound.plucks.length).toBeGreaterThan(0);
  });
});
