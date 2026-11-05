import type { Settings } from '@domain/settings/settings';

/**
 * Self-play's level: the guide strikes gently (its single notes peak at about two thirds of a player's pluck), so
 * a melody played by itself sounded faint next to playing yourself. The master limiter keeps chords clean.
 */
export const SELF_PLAY_LEVEL = 1.5;

/**
 * Volume of each voice right now. The lesson mix (guide / me) is a lesson setting: it applies only
 * while a lesson runs and comes back the next time one starts — free playing is always at full level.
 *
 * @remarks
 * - Self-play sounds through the guide voice, raised to `SELF_PLAY_LEVEL` while the instrument plays itself.
 */
export function voiceMix(s: Settings, isInLesson: boolean, hasGuide: boolean, isSelfPlaying = false): { player: number; guide: number } {
  return {
    player: isInLesson ? s.playerVolume : 1,
    guide: isSelfPlaying ? SELF_PLAY_LEVEL : isInLesson && hasGuide ? s.guideVolume : 0,
  };
}
