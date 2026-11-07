import { HandDrumPerformer } from '@application/drums/hand-drum-performer';
import type { HandDrumPlayer } from '@application/drums/hand-drum-player';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import type { HandRhythm } from '@domain/drums/hand/rhythms/hand-rhythm';
import { rhythmsFor } from '@domain/drums/hand/rhythms/hand-rhythm-catalog';
import type { Point } from '@domain/fretboard/point';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import type { Settings } from '@domain/settings/settings';
import type { InstrumentStage } from '@presentation/app/stages/instrument-stage';
import type { StagePerformance } from '@presentation/app/stages/stage-performance';
import type { CameraView } from '@presentation/canvas/camera-view';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';
import { t } from '@presentation/i18n/translator';

const MS = 1000;
/** A self-playing rhythm's entry in the song list is named `<drum>-<rhythm>`. */
const SEPARATOR = '-';

/**
 * Every hand drum's page (darbuka, congas, handpan…): `HandDrumPlayer`; a click or tap strikes once per press.
 * Playing by itself, it plays the drum's traditional rhythms, each stroke rippling where it lands.
 */
export class HandDrumStage implements InstrumentStage, StagePerformance {
  private readonly down = new Set<number>();
  private readonly performer: HandDrumPerformer;
  private drumId = '';

  constructor(private readonly drums: HandDrumPlayer, sound: SoundOutputInterface) {
    this.performer = new HandDrumPerformer(sound);
  }

  get performance(): StagePerformance {
    return this;
  }

  get isPlaying(): boolean {
    return this.performer.isPlaying;
  }

  handles(instrumentId: string): boolean {
    return handDrumFor(instrumentId) !== undefined;
  }

  fit(w: number, h: number, st: Settings): void {
    this.drumId = st.instrument;
    this.drums.configure(st.instrument, w, h);
  }

  track(hands: readonly (readonly Point[])[], now: number, audioNow: number): void {
    this.drums.updateHands(hands, now, audioNow);
  }

  draw(renderer: StageRenderer, now: number, hint: string | null, camera: CameraView): void {
    renderer.handDrum(this.drums, now, hint, camera);
  }

  pointer(id: number, p: Point | null, audioNow: number): void {
    if (!p) {
      this.down.delete(id);
      return;
    }
    if (this.down.has(id)) return;
    this.down.add(id);
    this.drums.tap(p, audioNow, performance.now() / MS);
  }

  sustain(): void {
    // A drum has no pedal to hold.
  }

  songs(): Song[] {
    return rhythmsFor(this.drumId).map((r) => this.asSong(r));
  }

  play(song: Song, audioNow: number): boolean {
    const drum = handDrumFor(this.drumId);
    const rhythm = rhythmsFor(this.drumId).find((r) => `${this.drumId}${SEPARATOR}${r.id}` === song.id);
    if (!drum || !rhythm) return false;
    return this.performer.start(rhythm, drum, audioNow);
  }

  stop(): void {
    this.performer.stop();
  }

  perform(audioNow: number): boolean {
    const landed = this.performer.update(audioNow);
    if (!landed) return false;
    const now = performance.now() / MS;
    for (const s of landed) this.drums.show(s, now);
    return true;
  }

  /** A rhythm as the song list shows it: its name in the page's language, the drum, the tempo. */
  private asSong(r: HandRhythm): Song {
    return {
      id: `${this.drumId}${SEPARATOR}${r.id}`, title: t(r.title), credit: 'credit.traditional', level: 1, bpm: r.bpm, beatsPerBar: r.beatsPerBar,
      mode: PlayMode.free, instrument: this.drumId, about: r.about, notes: r.phrase, subdiv: r.subdiv,
    };
  }
}
