import type { PluckRequest } from '@domain/audio/pluck-request';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';

/**
 * A sound output that plays through to the real one and keeps every pluck, so the stage can show each
 * string moving at the moment it sounds. Only `pluck` is watched; everything else is passed on.
 */
export function recordingSoundOutput(sound: SoundOutputInterface, onPluck: (r: PluckRequest) => void): SoundOutputInterface {
  return new Proxy(sound, {
    get(target, key) {
      if (key === 'pluck') {
        return (r: PluckRequest) => {
          onPluck(r);
          target.pluck(r);
        };
      }
      const value: unknown = Reflect.get(target, key);
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  });
}
