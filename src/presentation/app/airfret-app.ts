import type { BackingTrack } from '@application/lessons/backing-track';
import type { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { Player } from '@application/play/player';
import type { SettingsStore } from '@application/settings/settings-store';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { computeLayout } from '@domain/fretboard/compute-layout';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { chordSetById } from '@domain/lessons/catalog/chord-set-catalog';
import type { Song } from '@domain/lessons/catalog/song';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { knownChord } from '@domain/music/chord-voicing';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import { videoToScreen } from '@presentation/canvas/screen-mapping';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';
import { t } from '@presentation/i18n/translator';
import type { AppUi } from '@presentation/app/app-ui';

const MS_PER_SECOND = 1000;
const NO_HANDS_HINT_AFTER = 2.5;
const ERROR_TOAST_MS = 6000;

/**
 * **AirfretApp** — the running app: settings → instrument, camera → player, lessons, and the frame loop.
 *
 * @remarks
 * - Owns the one mutable piece of session state: the active lesson, if any.
 */
export class AirfretApp {
  private lesson: LessonSession | null = null;
  private isStarted = false;
  private hasCamera = false;
  private lastHandsAt = 0;

  constructor(
    private readonly store: SettingsStore,
    private readonly sound: SoundOutputInterface,
    private readonly tracker: HandTrackerInterface,
    private readonly player: Player,
    private readonly renderer: StageRenderer,
    private readonly backing: BackingTrack,
    private readonly startLesson: StartLessonUseCase,
    private readonly ui: AppUi,
  ) {
    player.onEvent = (e) => this.lesson?.input(e.when, e.chord === undefined ? (e.midi === undefined ? {} : { midi: e.midi }) : { chord: e.chord });
  }

  get hasLesson(): boolean {
    return this.lesson !== null;
  }

  /** Called from the start button: unlocks audio, then tries the camera. */
  async start(): Promise<void> {
    const audio = await this.sound.start(instrumentById(this.store.value.instrument));
    if (!audio.isOk) {
      this.ui.start.status(audio.failure.detail);
      return;
    }
    this.sound.setVolume(this.store.value.volume);
    this.isStarted = true;
    this.ui.start.status(t('app.loadingModel'));
    const camera = await this.tracker.start();
    this.hasCamera = camera.isOk;
    if (!camera.isOk) this.ui.toast.show(t('app.cameraError'), ERROR_TOAST_MS);
    this.lastHandsAt = performance.now() / MS_PER_SECOND;
    this.ui.start.hide();
  }

  /** Re-applies instrument, layout and chords after any settings or lesson change. */
  apply(): void {
    const s = this.store.value;
    const inst = instrumentById(s.instrument);
    this.sound.setInstrument(inst);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
    const chords = this.lesson && this.lesson.song.mode === PlayMode.chord ? this.lesson.chordSet : chordSetById(s.chordSet).chords.filter(knownChord);
    this.player.configure({ layout: computeLayout(w, h, inst.tuning.length, s.isLefty, inst.maxFret), instrument: inst, mode: s.mode, chords, strumFilter: s.strumFilter });
  }

  pickInstrument(id: string): void {
    const patch = this.lesson ? { instrument: id } : { instrument: id, mode: instrumentById(id).defaultMode };
    this.store.update(id === 'drive' && this.store.value.chordSet === 'pop' && !this.lesson ? { ...patch, chordSet: 'rock' } : patch);
  }

  beginLesson(song: Song): void {
    const s = this.store.value;
    const opts = { tempo: s.lessonTempo, shouldWait: s.shouldLessonWait, isEasy: s.isLessonEasy, hasDrums: s.hasLessonDrums, latency: s.latencyMs / MS_PER_SECOND };
    const session = this.startLesson.execute(song, opts, this.sound.now);
    if (!session.isOk) {
      this.ui.toast.show(session.failure.detail);
      return;
    }
    this.ui.drawer.select(song);
    this.ui.drawer.close();
    this.lesson = session.value;
    this.store.update({ instrument: song.instrument, mode: song.mode });
    this.ui.hud.show(song.title);
  }

  stopLesson(): void {
    this.lesson = null;
    this.ui.hud.hide();
    this.store.update({});
  }

  /** One animation frame. */
  frame = (): void => {
    const nowMs = performance.now();
    const now = nowMs / MS_PER_SECOND;
    const audioNow = this.sound.now;
    this.track(nowMs, now, audioNow);
    if (this.lesson) this.tickLesson(this.lesson, audioNow);
    this.renderer.draw(this.player, this.lesson, audioNow, now, this.hint(now));
    requestAnimationFrame(this.frame);
  };

  private track(nowMs: number, now: number, audioNow: number): void {
    if (!this.hasCamera) return;
    const hands = this.tracker.detect(nowMs);
    if (!hands) return;
    if (hands.length) this.lastHandsAt = now;
    const frame = this.tracker.frameSize();
    const px = hands.map((hand) => hand.landmarks.map((p) => videoToScreen(p, frame, window.innerWidth, window.innerHeight)));
    this.player.updateHands(px, now, audioNow, !this.ui.pointer.isDown);
  }

  private tickLesson(lesson: LessonSession, audioNow: number): void {
    lesson.update(audioNow, (beat, when) => this.backing.schedule(beat, when, lesson.song.beatsPerBar, lesson.opts.hasDrums));
    this.ui.hud.update(lesson, audioNow);
    if (!lesson.isDone) return;
    const best = this.store.value.best[lesson.song.id] ?? 0;
    if (lesson.accuracy() > best) this.store.update({ best: { ...this.store.value.best, [lesson.song.id]: lesson.accuracy() } });
    this.ui.result.show(lesson);
    this.stopLesson();
  }

  private hint(now: number): string | null {
    if (!this.isStarted) return null;
    if (!this.hasCamera) return t('app.mouseHint');
    return now - this.lastHandsAt > NO_HANDS_HINT_AFTER ? t('app.noHands') : null;
  }
}
