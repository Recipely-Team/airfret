import { describe, expect, it } from 'vitest';
import { FakeSoundOutput } from '@application/__fixtures__/fake-sound-output';
import { DrumPlayer } from '@application/drums/drum-player';
import { PedalRouter } from '@application/drums/pedal-router';
import { SettingsStore } from '@application/settings/settings-store';
import { DrumPiece } from '@domain/drums/drum-piece';
import { assignBinding } from '@domain/input/binding-match';
import { InputSource } from '@domain/input/input-source';
import { PedalAction } from '@domain/input/pedal-action';
import { DEFAULT_SETTINGS } from '@domain/settings/default-settings';
import type { Settings } from '@domain/settings/settings';

class MemoryRepo {
  s: Settings = DEFAULT_SETTINGS;
  load(): Settings {
    return this.s;
  }
  save(s: Settings): void {
    this.s = s;
  }
}

function setup() {
  const sound = new FakeSoundOutput();
  const drums = new DrumPlayer(sound);
  const store = new SettingsStore(new MemoryRepo());
  const router = new PedalRouter(store, drums, () => ({ audio: 0, wall: 0 }));
  return { sound, drums, store, router };
}

describe('PedalRouter', () => {
  it('kicks on the default Space key and reports the input as used', () => {
    const { sound, router } = setup();
    expect(router.handle({ binding: { source: InputSource.key, code: 'Space' }, isDown: true, velocity: 0.8 })).toBe(true);
    expect(sound.drumHits.map((h) => h.piece)).toEqual([DrumPiece.kick]);
  });

  it('follows a reassigned binding: a MIDI note moved to the hi-hat pedal works the hi-hat', () => {
    const { drums, store, router } = setup();
    const midi = { source: InputSource.midi, code: '50' };
    store.update({ pedalBindings: assignBinding(store.value.pedalBindings, PedalAction.hihatPedal, midi) });
    router.handle({ binding: midi, isDown: true, velocity: 1 });
    expect(drums.pedalDown.has(PedalAction.hihatPedal)).toBe(true);
    router.handle({ binding: midi, isDown: false, velocity: 0 });
    expect(drums.pedalDown.size).toBe(0);
  });

  it('ignores inputs nothing is bound to', () => {
    const { sound, router } = setup();
    expect(router.handle({ binding: { source: InputSource.key, code: 'KeyQ' }, isDown: true, velocity: 0.8 })).toBe(false);
    expect(sound.drumHits).toEqual([]);
  });
});
