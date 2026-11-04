import type { DrumPlayer } from '@application/drums/drum-player';
import type { BackingTrack } from '@application/lessons/backing-track';
import { songLibrary } from '@application/lessons/song-library';
import { voiceMix } from '@application/lessons/voice-mix';
import type { GuidePlayer } from '@application/lessons/guide-player';
import type { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { Player } from '@application/play/player';
import type { SettingsStore } from '@application/settings/settings-store';
import { TOUR_CHORDS } from '@application/tour/tour-chords';
import { Voice } from '@domain/audio/voice';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { computeKitLayout } from '@domain/drums/compute-kit-layout';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { computeLayout } from '@domain/fretboard/compute-layout';
import type { Instrument } from '@domain/instruments/instrument';
import { instrumentById } from '@domain/instruments/instrument-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import { chordSetById } from '@domain/lessons/catalog/chord-set-catalog';
import type { Song } from '@domain/lessons/catalog/song';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { knownChord } from '@domain/music/chords/chord-voicing';
import { withVoice } from '@domain/instruments/voice-catalog';
import { effectiveTuning } from '@domain/music/tuning-catalog';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { AppUi } from '@presentation/app/app-ui';
import { launchFeature } from '@presentation/app/launch-feature';
import { stageHint } from '@presentation/app/stage-hint';
import { TourController } from '@presentation/app/tour-controller';
import type { Route } from '@presentation/routing/route';
import { videoToScreen } from '@presentation/canvas/screen-mapping';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';
import { tourInstrument } from '@presentation/app/tour-instrument';
import { t } from '@presentation/i18n/translator';

const MS_PER_SECOND = 1000;
const ERROR_TOAST_MS = 6000;

interface Services {
  readonly store: SettingsStore;
  readonly sound: SoundOutputInterface;
  readonly tracker: HandTrackerInterface;
  readonly player: Player;
  readonly drums: DrumPlayer;
  readonly renderer: StageRenderer;
  readonly backing: BackingTrack;
  readonly guide: GuidePlayer;
  readonly startLesson: StartLessonUseCase;
}

/**
 * **AirfretApp** — the running app: settings → instrument, camera → player, tour, lessons, frame loop.
 *
 * @remarks
 * - Owns the session state: the active lesson or tour, if any.
 */
export class AirfretApp {
  private lesson: LessonSession | null = null;
  private isStarted = false;
  private hasCamera = false;
  private lastHandsAt = 0;
  private readonly tours: TourController;
  /** The page under any overlay: home or an instrument. */
  private base: Route = { kind: 'home' };

  constructor(
    private readonly s: Services,
    private readonly ui: AppUi,
  ) {
    this.tours = new TourController(ui.tourBar, () => this.apply(), () => {
      const first = SONGS.find((song) => song.course === 1);
      if (first) this.openIntro(first);
    });
    s.player.onEvent = (e) => {
      this.tours.onEvent(e);
      const played = e.recognized ? { chord: e.recognized.name, recognized: e.recognized } : e.chord !== undefined ? { chord: e.chord } : e.midi === undefined ? {} : { midi: e.midi };
      this.lesson?.input(e.when, played);
    };
  }

  get isDrums(): boolean {
    return this.s.store.value.instrument === DRUMS_ID;
  }

  /** The page under any overlay (home or an instrument) — what the instrument picker shows. */
  get baseRoute(): Route {
    return this.base;
  }

  get isOnStage(): boolean {
    return this.base.kind === 'instrument';
  }

  /** Shows a route: home, an instrument page, or an overlay (lessons, a lesson, Explore) on top of the current page. */
  show(route: Route): void {
    if (route.kind === 'home' || route.kind === 'instrument') {
      this.base = route;
      this.ui.drawer.close();
      this.ui.explore.close();
      this.ui.intro.hide();
    }
    if (route.kind === 'home') {
      this.stopLesson();
      this.endTour();
    }
    if (route.kind === 'instrument' && route.instrument !== this.s.store.value.instrument) this.pickInstrument(route.instrument);
    if ((route.kind === 'lessons' || route.kind === 'lesson') && this.base.kind === 'home') this.base = { kind: 'instrument', instrument: this.s.store.value.instrument };
    if (route.kind === 'lessons') this.ui.drawer.open();
    if (route.kind === 'lesson') {
      const song = songLibrary(this.s.store.value).find((x) => x.id === route.songId);
      if (song) this.ui.intro.show(song);
    }
    if (route.kind === 'explore') this.ui.explore.open();
    this.ui.home.show(this.base.kind === 'home');
    this.syncCamera();
    this.ui.start.show(this.isOnStage && !this.isStarted);
    this.s.store.update({});
  }

  /** The camera runs only on an instrument page: nothing is watched while no instrument is open. */
  private syncCamera(): void {
    if (!this.hasCamera) return;
    if (this.isOnStage) void this.s.tracker.resume();
    else this.s.tracker.pause();
  }

  /** Back to the page under the overlays. */
  closeOverlay(): void {
    this.ui.replaceRoute(this.base);
  }

  get hasLesson(): boolean {
    return this.lesson !== null || this.tours.session !== null;
  }

  /** Called from the start button: unlocks audio, then tries the camera. */
  async start(): Promise<void> {
    const audio = await this.s.sound.start(this.instrument());
    if (!audio.isOk) {
      this.ui.start.status(audio.failure.detail);
      return;
    }
    this.isStarted = true;
    this.apply();
    this.ui.start.status(t('app.loadingModel'));
    const camera = await this.s.tracker.start();
    this.hasCamera = camera.isOk;
    if (!camera.isOk) this.ui.toast.show(t('app.cameraError'), ERROR_TOAST_MS);
    this.lastHandsAt = performance.now() / MS_PER_SECOND;
    this.ui.start.hide();
    const isFirstRun = !this.s.store.value.hasSeenExplore;
    this.s.store.update({ hasSeenExplore: true });
    if (isFirstRun && tourInstrument(this.s.store.value.instrument) === this.s.store.value.instrument) this.startTour();
  }

  /** The selected instrument in its chosen voice, with the tuning and capo applied to its open strings. */
  private instrument(): Instrument {
    const st = this.s.store.value;
    const base = withVoice(instrumentById(st.instrument), st.voices[st.instrument]);
    return { ...base, tuning: effectiveTuning(base.tuning, st.tuning, st.capo) };
  }

  /** Re-applies instrument, layout, chords and mix after any settings, lesson or tour change. */
  apply(): void {
    const st = this.s.store.value;
    const inst = this.instrument();
    this.s.sound.setInstrument(inst);
    this.s.sound.setVolume(st.volume);
    const mix = voiceMix(st, this.lesson !== null, this.lesson?.opts.hasGuide ?? false);
    this.s.sound.setVoiceVolume(Voice.player, mix.player);
    this.s.sound.setVoiceVolume(Voice.guide, mix.guide);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.s.renderer.resize(w, h);
    const chords = this.tours.session ? TOUR_CHORDS : this.lesson?.song.mode === PlayMode.chord ? this.lesson.chordSet : chordSetById(st.chordSet).chords.filter(knownChord);
    this.s.drums.configure(computeKitLayout(w, h, st.isLefty), w, h, st.hihatMode);
    const layout = computeLayout(w, h, inst.tuning.length, st.isLefty, inst.maxFret);
    if (this.base.kind === 'instrument' && this.base.instrument !== st.instrument) {
      this.base = { kind: 'instrument', instrument: st.instrument };
      this.ui.replaceRoute(this.base);
    }
    this.s.player.configure({ layout, instrument: inst, mode: st.mode, chords, strumFilter: st.strumFilter, capo: st.capo });
  }

  pickInstrument(id: string): void {
    const st = this.s.store.value;
    const patch = this.hasLesson ? { instrument: id } : { instrument: id, mode: st.mode === PlayMode.free ? PlayMode.free : instrumentById(id).defaultMode, tuning: 'standard' };
    this.s.store.update(id === 'drive' && st.chordSet === 'pop' && !this.hasLesson ? { ...patch, chordSet: 'rock' } : patch);
  }

  openIntro(song: Song): void {
    this.ui.navigate({ kind: 'lesson', songId: song.id });
  }

  beginLesson(song: Song): void {
    const st = this.s.store.value;
    const opts = {
      tempo: st.lessonTempo,
      shouldWait: st.lessonMode === LessonMode.wait,
      hasGuide: st.lessonMode === LessonMode.shadow,
      // Course patterns are already simple; library songs can be thinned to one strum per bar.
      isEasy: song.course === undefined && st.isLessonEasy,
      hasDrums: st.hasLessonDrums,
      latency: st.latencyMs / MS_PER_SECOND,
    };
    const session = this.s.startLesson.execute(song, opts, this.s.sound.now);
    if (!session.isOk) {
      this.ui.toast.show(session.failure.detail);
      return;
    }
    this.endTour();
    this.lesson = session.value;
    this.s.guide.reset();
    const mode = song.mode === PlayMode.chord && st.mode === PlayMode.free ? PlayMode.free : song.mode;
    this.s.store.update({ instrument: song.instrument, mode, tuning: song.tuning ?? 'standard' }); // charted for one tuning
    this.ui.hud.show(song.title, opts.hasGuide);
  }

  stopLesson(): void {
    this.lesson = null;
    this.ui.hud.hide();
    this.apply();
  }

  startTour(): void {
    this.stopLesson();
    this.tours.start(this.hasCamera);
    this.s.store.update({ mode: PlayMode.chord, instrument: tourInstrument(this.s.store.value.instrument) });
  }

  skipTourStep(): void {
    this.tours.skip();
  }

  endTour(): void {
    this.tours.end();
  }

  /** From the home page or the menu: open the tour's instrument (`tourInstrument`) and run the tour. */
  tourFromAnywhere(): void {
    this.ui.navigate({ kind: 'instrument', instrument: tourInstrument(this.s.store.value.instrument) });
    this.startTour();
  }

  /** One animation frame. */
  frame = (): void => {
    const nowMs = performance.now();
    const now = nowMs / MS_PER_SECOND;
    const audioNow = this.s.sound.now;
    this.track(nowMs, now, audioNow);
    if (this.lesson) this.tickLesson(this.lesson, audioNow);
    this.tours.tick(this.s.player, now);
    const st = this.s.store.value;
    if (!this.isOnStage) {
      requestAnimationFrame(this.frame);
      return;
    }
    if (this.isDrums) this.s.renderer.drums(this.s.drums, st.pedalBindings, now, stageHint({ isStarted: this.isStarted, hasCamera: this.hasCamera, isDrums: this.isDrums, secondsWithoutHands: now - this.lastHandsAt }), { brightness: st.brightness, isHidden: st.isCameraHidden });
    else this.s.renderer.draw(this.s.player, this.lesson, this.tours.session, audioNow, now, stageHint({ isStarted: this.isStarted, hasCamera: this.hasCamera, isDrums: this.isDrums, secondsWithoutHands: now - this.lastHandsAt }), { brightness: st.brightness, isHidden: st.isCameraHidden });
    requestAnimationFrame(this.frame);
  };

  private track(nowMs: number, now: number, audioNow: number): void {
    if (!this.hasCamera || !this.isOnStage) return;
    const hands = this.s.tracker.detect(nowMs);
    if (!hands) return;
    if (hands.length) this.lastHandsAt = now;
    const frame = this.s.tracker.frameSize();
    const px = hands.map((hand) => hand.landmarks.map((p) => videoToScreen(p, frame, window.innerWidth, window.innerHeight)));
    if (this.isDrums) this.s.drums.updateHands(px, now, audioNow, now);
    else this.s.player.updateHands(px, now, audioNow, !this.ui.pointer.isDown);
  }

  private tickLesson(lesson: LessonSession, audioNow: number): void {
    lesson.update(audioNow, (beat, when) => this.s.backing.schedule(beat, when, lesson.song.beatsPerBar, lesson.opts.hasDrums));
    if (lesson.opts.hasGuide) this.s.guide.update(lesson, this.s.player.instrument, audioNow);
    this.ui.hud.update(lesson, audioNow);
    if (!lesson.isDone) return;
    const best = this.s.store.value.best[lesson.song.id] ?? 0;
    if (lesson.accuracy() > best) this.s.store.update({ best: { ...this.s.store.value.best, [lesson.song.id]: lesson.accuracy() } });
    this.ui.result.show(lesson);
    this.stopLesson();
  }

  /** Explore's "Try it": sets the app up for one feature and says what to do. */
  tryFeature(id: string): void {
    launchFeature(id, {
      store: this.s.store,
      ui: this.ui,
      reset: () => {
        this.stopLesson();
        this.endTour();
      },
      startTour: () => this.tourFromAnywhere(),
      firstLesson: () => SONGS.find((song) => song.course === 1),
    });
  }
}
