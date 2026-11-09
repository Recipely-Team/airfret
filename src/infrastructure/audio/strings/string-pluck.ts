import { partnerOf } from '@infrastructure/audio/strings/course-pair';
import { clamp } from '@core/math/clamp';
import type { PluckRequest } from '@domain/audio/pluck-request';
import { StrikeSurface } from '@domain/gesture/strike-surface';
import type { Instrument } from '@domain/instruments/instrument';
import { midiToFreq } from '@domain/music/pitch';
import type { StringPluckMessage } from '@infrastructure/audio/strings/string-pluck-message';

const Level = { mutedPluck: 0.8, minAmp: 0.05 } as const;
const Muted = { t60: 0.09, brightness: 0.6 } as const;
/** Palm resting by the bridge: notes still pitch, but die in a quarter second and lose their top. */
const PalmMuted = { t60: 0.25, brightness: 0.5 } as const;
/** Nail vs fleshy pad: the nail adds brightness and a pick-like tick; the pad rounds the attack off. */
const ATTACK_BRIGHTNESS = { nail: 0.12, pad: -0.18 } as const;
/** Banjo: fitted to its recordings (tools/calibrate/fit.mjs; at the top of the searched range). */
/**
 * String stiffness (inharmonicity) per chain: a piano's thick steel strings are among the stiffest. The mandolin's and
 * bouzouki's fitted 2026-11-10 to real notes (Freesound CC0: Taku19810729's mandolin scale, JustMog's bouzouki):
 * inharmonicity 3.5 → 1.7 and 6.7 → 3.8, tone colour closer too.
 */
const STIFFNESS = { acoustic: 0.12, nylon: 0.05, clean: 0.1, drive: 0.1, bass: 0.22, banjo: 0.35, piano: 0.3, saz: 0.18, kopuz: 0.12, ukulele: 0.05, mandolin: 0.35, balalaika: 0.1, bouzouki: 0.35, harpsichord: 0.08 } as const;
/** Decay laws are stated at 110 Hz: T60(f) = t60 · (110 / f)^t60Exponent. */
const DECAY_REFERENCE_HZ = 110;
const STEREO_WIDTH = 0.5;
/** Plucking nearer the bridge than this is brighter, farther is darker. */
const NEUTRAL_POSITION = 0.2;
const POSITION_BRIGHTNESS = 1.1;

/** Seconds a note of `freq` rings on this instrument before it has decayed by 60 dB. */
export function ringSeconds(inst: Instrument, freq: number): number {
  return inst.t60 * Math.pow(DECAY_REFERENCE_HZ / freq, inst.t60Exponent);
}

/** Left–right place of a string in the stereo image, low strings left. */
export function stringPan(inst: Instrument, string: number): number {
  // A 12-string's paired string sits with its partner.
  return (partnerOf(string) / Math.max(1, inst.tuning.length - 1) - 0.5) * STEREO_WIDTH;
}

/**
 * The string model's parameters for one pluck: level, decay, brightness from stroke strength, strike
 * point and finger surface, mutes. Shared by the live engine and the offline song renderer
 * (`tests/songs`), so both voice a note identically.
 */
export function stringPluck(inst: Instrument, r: PluckRequest): StringPluckMessage {
  const freq = midiToFreq(r.midi);
  const level = Math.min(1, Math.max(Level.minAmp, r.amp));
  const attack = r.attack === StrikeSurface.pad ? ATTACK_BRIGHTNESS.pad : ATTACK_BRIGHTNESS.nail;
  const tone = inst.bright * (0.75 + 0.25 * level) + (NEUTRAL_POSITION - r.position) * POSITION_BRIGHTNESS + attack;
  return {
    type: 'pluck',
    when: r.when,
    string: r.string,
    freq,
    amp: inst.level * level * (r.isMuted ? Level.mutedPluck : 1),
    t60: r.isMuted ? Muted.t60 : r.isPalmMuted ? PalmMuted.t60 : ringSeconds(inst, freq),
    bright: r.isMuted ? inst.bright * Muted.brightness : clamp(r.isPalmMuted ? tone * PalmMuted.brightness : tone, 0.05, 1),
    stiffness: STIFFNESS[inst.chain],
    pick: r.position,
    pan: stringPan(inst, r.string),
  };
}
