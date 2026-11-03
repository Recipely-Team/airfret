import type { Settings } from '@domain/settings/settings';

/**
 * Volume of each voice right now. The lesson mix (guide / me) is a lesson setting: it applies only
 * while a lesson runs and comes back the next time one starts — free playing is always at full level.
 */
export function voiceMix(s: Settings, isInLesson: boolean, hasGuide: boolean): { player: number; guide: number } {
  return {
    player: isInLesson ? s.playerVolume : 1,
    guide: isInLesson && hasGuide ? s.guideVolume : 0,
  };
}
