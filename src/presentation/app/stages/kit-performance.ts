import type { DrumPlayer } from '@application/drums/drum-player';
import { KitPerformer } from '@application/drums/kit-performer';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { GROOVES } from '@domain/drums/grooves/groove-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { StagePerformance } from '@presentation/app/stages/stage-performance';
import { t } from '@presentation/i18n/translator';

const MS = 1000;
/** A groove's entry in the song list is named `groove-<id>`. */
const PREFIX = 'groove-';

/** The drum kit playing by itself: its grooves in the song list, each hit lighting its pad as it lands. */
export class KitPerformance implements StagePerformance {
  private readonly performer: KitPerformer;

  constructor(private readonly drums: DrumPlayer, sound: SoundOutputInterface) {
    this.performer = new KitPerformer(sound);
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying;
  }

  songs(): Song[] {
    return GROOVES.map((g) => ({
      id: `${PREFIX}${g.id}`, title: t(g.title), credit: 'credit.groove', level: 1, bpm: g.bpm, beatsPerBar: g.beatsPerBar,
      mode: PlayMode.free, instrument: DRUMS_ID, about: g.about,
    }));
  }

  play(song: Song, audioNow: number): boolean {
    const groove = GROOVES.find((g) => `${PREFIX}${g.id}` === song.id);
    return groove ? this.performer.start(groove, audioNow) : false;
  }

  stop(): void {
    this.performer.stop();
  }

  perform(audioNow: number): boolean {
    const landed = this.performer.update(audioNow);
    if (!landed) return false;
    const now = performance.now() / MS;
    for (const h of landed) this.drums.lastHit.set(h.piece, { at: now, velocity: h.velocity });
    return true;
  }
}
