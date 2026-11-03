import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { BackingTrack } from '@application/lessons/backing-track';

describe('BackingTrack', () => {
  it('clicks the count-in with an accent on the downbeat, even with drums on', () => {
    const sound = new FakeSoundOutput();
    const track = new BackingTrack(sound);
    [-4, -3.5, -3].forEach((b, i) => track.schedule(b, i, 4, true));
    expect(sound.clicks).toEqual([{ when: 0, isAccent: true }, { when: 2, isAccent: false }]);
    expect(sound.drums).toEqual([]);
  });

  it('plays kick on 1 and 3 and snare on 2 and 4 in 4/4', () => {
    const sound = new FakeSoundOutput();
    const track = new BackingTrack(sound);
    [0, 1, 2, 3].forEach((b) => track.schedule(b, b, 4, true));
    expect(sound.drums.filter((d) => d.kind !== 'hat').map((d) => d.kind)).toEqual(['kick', 'snare', 'kick', 'snare']);
  });
});
