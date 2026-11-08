import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import type { PluckRequest } from '@domain/audio/pluck-request';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';

/** A plucked or struck note rings at most this long, seconds, unless damped first (a recording ends sooner anyway). */
const RING = 8;

/**
 * One band member's sound: what its own player plays — a keyboard's keys, a guitar's strings — sounds from that
 * instrument's recordings in the band's mix; its drums go to the engine's drums. Everything else (the engine's own
 * instrument, volumes, the metronome) is left alone, so several members play side by side. `gain` sets its place
 * in the mix (the tune in front, the chords behind).
 */
export function memberSound(instrumentId: string, band: EnsembleOutputInterface, sound: SoundOutputInterface, gain: number | (() => number) = 1): SoundOutputInterface {
  // A function: the level is read at each note, so moving its slider is heard at once.
  const level = typeof gain === 'function' ? gain : () => gain;
  // What each string (or key) is sounding: a new note on it, a damp or a fingertip ends the last.
  const ringing = new Map<number, number>();
  const end = (string: number, when: number) => {
    if (string < 0) {
      band.release(instrumentId, null, when);
      ringing.clear();
      return;
    }
    const midi = ringing.get(string);
    if (midi === undefined) return;
    band.release(instrumentId, midi, when);
    ringing.delete(string);
  };
  return {
    get now() {
      return sound.now;
    },
    start: (instrument) => sound.start(instrument),
    setInstrument: () => undefined,
    setVolume: () => undefined,
    pluck: (r: PluckRequest) => {
      if (r.isMuted) return;
      end(r.string, r.when);
      ringing.set(r.string, r.midi);
      band.play(instrumentId, r.midi, r.amp * level(), r.when, RING);
    },
    retune: () => undefined,
    setVoiceVolume: () => undefined,
    damp: (string, when) => end(string, when),
    silence: () => {
      band.release(instrumentId, null, 0);
      ringing.clear();
    },
    chuck: () => undefined,
    touch: (string, when) => end(string, when),
    hitDrum: (request) => sound.hitDrum({ ...request, velocity: request.velocity * level() }),
    hitHandDrum: (stroke, velocity, when) => sound.hitHandDrum(stroke, velocity * level(), when),
    prepareHandStrokes: (strokes) => sound.prepareHandStrokes(strokes),
    prepareKit: () => sound.prepareKit(),
    chokeHiHat: (when) => sound.chokeHiHat(when),
    click: () => undefined,
    drum: () => undefined,
  };
}
