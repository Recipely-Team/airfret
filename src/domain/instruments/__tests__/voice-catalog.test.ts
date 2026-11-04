import { describe, expect, it } from 'vitest';
import { INSTRUMENTS, instrumentById } from '@domain/instruments/instrument-catalog';
import { voicesFor, withVoice } from '@domain/instruments/voice-catalog';

describe('Instrument voices', () => {
  it('plays the best-ranked voice when the player has not chosen one', () => {
    for (const inst of INSTRUMENTS) expect(withVoice(inst, undefined).voice, inst.id).toBe(voicesFor(inst.id)[0]?.id);
  });

  it('offers every instrument at least a second option, and the recorded one first', () => {
    for (const inst of INSTRUMENTS) {
      const voices = voicesFor(inst.id);
      expect(voices.length, inst.id).toBeGreaterThanOrEqual(2);
      expect(voices[0]?.isRecorded, inst.id).toBe(true);
      expect(new Set(voices.map((v) => v.id)).size, `${inst.id}: voice ids unique`).toBe(voices.length);
    }
  });

  it('a synth voice turns the recordings off and brings its own decay', () => {
    const classic = withVoice(instrumentById('acoustic'), 'classic');
    expect(classic.isRecorded).toBe(false);
    expect(classic.t60).toBe(4.5);
    expect(withVoice(instrumentById('acoustic'), 'fitted')).toMatchObject({ isRecorded: false, t60: instrumentById('acoustic').t60 });
  });

  it('falls back to the best voice for an unknown or stale choice', () => {
    expect(withVoice(instrumentById('bass'), 'classic').voice).toBe('recorded');
  });

  it('leaves instruments without voices untouched', () => {
    const kit = { ...instrumentById('acoustic'), id: 'drums' };
    expect(withVoice(kit, 'fitted')).toBe(kit);
  });
});
