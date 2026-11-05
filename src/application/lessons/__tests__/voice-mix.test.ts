import { describe, expect, it } from 'vitest';
import { voiceMix } from '@application/lessons/voice-mix';
import { DEFAULT_SETTINGS } from '@domain/settings/default-settings';

const quietMe = { ...DEFAULT_SETTINGS, playerVolume: 0.2, guideVolume: 0.9 };

describe('voiceMix', () => {
  it('does not carry the lesson’s "me" volume into free playing (it used to)', () => {
    expect(voiceMix(quietMe, false, false).player).toBe(1);
  });

  it('brings the lesson mix back inside a lesson', () => {
    expect(voiceMix(quietMe, true, true)).toEqual({ player: 0.2, guide: 0.9 });
  });

  it('keeps the guide silent outside shadow lessons', () => {
    expect(voiceMix(quietMe, true, false).guide).toBe(0);
    expect(voiceMix(quietMe, false, true).guide).toBe(0);
  });

  it('plays self-play at full level, not muted by the guide being silent outside lessons (Watch it play was nearly silent)', () => {
    expect(voiceMix(quietMe, false, false, true).guide).toBe(1);
  });
});
