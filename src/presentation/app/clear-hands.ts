import type { Player } from '@application/play/player';
import type { DrumPlayer } from '@application/drums/drum-player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';

/**
 * Tracking stopped (the camera turned off, or lost): every stage forgets the hands it last saw, so no skeleton is
 * left hanging on screen and no key or string stays held.
 */
export function clearHands(s: { readonly player: Player; readonly drums: DrumPlayer; readonly stages: readonly InstrumentStage[]; readonly sound: SoundOutputInterface }, now: number): void {
  const audioNow = s.sound.now;
  s.player.updateHands([], now, audioNow, false);
  s.drums.updateHands([], now, audioNow, now);
  for (const stage of s.stages) stage.track([], now, audioNow);
}
