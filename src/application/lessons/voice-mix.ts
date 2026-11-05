import type { Settings } from '@domain/settings/settings';

/**
 * Volume of each voice right now. The lesson mix (guide / me) is a lesson setting: it applies only
 * while a lesson runs and comes back the next time one starts — free playing is always at full level.
 *
 * @remarks
 * - Self-play sounds through the guide voice, so the guide is at full level while the instrument plays itself.
 */
export function voiceMix(s: Settings, isInLesson: boolean, hasGuide: boolean, isSelfPlaying = false): { player: number; guide: number } {
  return {
    player: isInLesson ? s.playerVolume : 1,
    guide: isSelfPlaying ? 1 : isInLesson && hasGuide ? s.guideVolume : 0,
  };
}
