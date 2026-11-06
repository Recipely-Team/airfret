import type { DrumPlayer } from '@application/drums/drum-player';
import type { PianoPlayer } from '@application/keys/piano-player';
import { computeKeyboardLayout } from '@domain/keys/compute-keyboard-layout';
import { PIANO_ID } from '@domain/keys/piano-id';
import type { BackingTrack } from '@application/lessons/backing-track';
import { songLibrary } from '@application/lessons/song-library';
import { voiceMix } from '@application/lessons/voice-mix';
import type { GuidePlayer } from '@application/lessons/guide-player';
import type { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { Player } from '@application/play/player';
import { selectedInstrument } from '@application/settings/selected-instrument';
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
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { knownChord } from '@domain/music/chords/chord-voicing';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { AppUi } from '@presentation/app/app-ui';
import { CameraController } from '@application/camera/camera-controller';
import { DemoController } from '@presentation/app/demo-controller';
import { lessonOptions } from '@presentation/app/lesson-options';
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
  readonly piano: PianoPlayer;
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
  private isAudioOn = false;
  private lastHandsAt = 0;
  readonly tours: TourController;
  /** The page under any overlay: home or an instrument. */
  private base: Route = { kind: 'home' };
  /** The instrument playing by itself (outside lessons). */
  readonly demo: DemoController;
  private readonly camera: CameraController;

  constructor(
    private readonly s: Services,
    private readonly ui: AppUi,
  ) {
    this.tours = new TourController(ui.tourBar, () => this.s.store.update({}), () => {
      const first = SONGS.find((song) => song.course === 1);
      if (first) this.ui.navigate({ kind: 'lesson', songId: first.id });
    });
    // Self-play sounds through the guide voice and is a mode in the toolbar: re-render when it starts or stops.
    const showStart = (isPlaying: boolean) => { this.ui.start.show(this.isOnStage && !this.isStarted && !isPlaying); this.s.store.update({}); };
    this.demo = new DemoController({
      player: s.player, sound: s.sound, startAudio: () => this.startAudio(), instrumentId: () => s.store.value.instrument, instrument: () => this.instrument(),
      songs: () => songLibrary(s.store.value), prepare: (song) => s.store.update({ tuning: song.tuning ?? 'standard' }), onChange: showStart,
    });
    // When tracking stops, the last tracked hands leave the stage.
    this.camera = new CameraController(s.tracker, () => this.ui.toast.show(t('app.cameraError'), ERROR_TOAST_MS), () => s.player.updateHands([], performance.now() / MS_PER_SECOND, s.sound.now, false));
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
    void this.syncCamera();
    this.ui.start.show(this.isOnStage && !this.isStarted);
    this.s.store.update({});
  }

  /** The camera runs only on an instrument page after Start, and only while the player hasn't turned it off. */
  private syncCamera(): Promise<void> {
    return this.camera.sync(this.isStarted && this.isOnStage && !this.s.store.value.isCameraOff);
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
    if (!(await this.startAudio())) return;
    this.demo.leave();
    this.isStarted = true;
    if (!this.s.store.value.isCameraOff) this.ui.start.status(t('app.loadingModel'));
    await this.syncCamera();
    this.lastHandsAt = performance.now() / MS_PER_SECOND;
    this.ui.start.hide();
    const isFirstRun = !this.s.store.value.hasSeenExplore;
    this.s.store.update({ hasSeenExplore: true });
    if (isFirstRun && tourInstrument(this.s.store.value.instrument) === this.s.store.value.instrument) this.startTour();
  }

  /** Unlocks audio once (Start, or the demo before Start); false when the browser refuses. */
  private async startAudio(): Promise<boolean> {
    if (this.isAudioOn) return true;
    const audio = await this.s.sound.start(this.instrument());
    if (!audio.isOk) this.ui.start.status(audio.failure.detail);
    this.isAudioOn = audio.isOk;
    if (audio.isOk) this.apply();
    return audio.isOk;
  }

  private instrument(): Instrument {
    return selectedInstrument(this.s.store.value);
  }

  /** Re-applies instrument, layout, chords and mix after any settings, lesson or tour change. */
  apply(): void {
    const st = this.s.store.value;
    const inst = this.instrument();
    this.s.sound.setInstrument(inst);
    this.s.sound.setVolume(st.volume);
    const mix = voiceMix(st, this.lesson !== null, this.lesson?.opts.hasGuide ?? false, this.demo.isPlaying);
    this.s.sound.setVoiceVolume(Voice.player, mix.player);
    this.s.sound.setVoiceVolume(Voice.guide, mix.guide);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.s.renderer.resize(w, h);
    const chords = this.tours.session ? TOUR_CHORDS : this.lesson?.song.mode === PlayMode.chord ? this.lesson.chordSet : chordSetById(st.chordSet).chords.filter(knownChord);
    this.s.drums.configure(computeKitLayout(w, h, st.isLefty), w, h, st.hihatMode);
    this.s.piano.configure(computeKeyboardLayout(w, h));
    const layout = computeLayout(w, h, inst.tuning.length, st.isLefty, inst.maxFret);
    if (this.base.kind === 'instrument' && this.base.instrument !== st.instrument) {
      this.base = { kind: 'instrument', instrument: st.instrument };
      this.ui.replaceRoute(this.base);
    }
    this.s.player.configure({ layout, instrument: inst, mode: st.mode, chords, strumFilter: st.strumFilter, capo: st.capo });
    void this.syncCamera();
  }

  pickInstrument(id: string): void {
    this.demo.stop();
    const st = this.s.store.value;
    const patch = this.hasLesson ? { instrument: id } : { instrument: id, mode: st.mode === PlayMode.free ? PlayMode.free : instrumentById(id).defaultMode, tuning: 'standard' };
    this.s.store.update(id === 'drive' && st.chordSet === 'pop' && !this.hasLesson ? { ...patch, chordSet: 'rock' } : patch);
  }

  beginLesson(song: Song): void {
    this.demo.leave();
    const st = this.s.store.value;
    const opts = lessonOptions(st, song);
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
    this.demo.leave();
    this.lesson = null;
    this.ui.hud.hide();
    this.apply();
  }

  startTour(): void {
    this.stopLesson();
    this.tours.start(this.camera.isOn);
    this.s.store.update({ mode: PlayMode.chord, instrument: tourInstrument(this.s.store.value.instrument) });
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
    const hint = this.demo.isPlaying ? null : stageHint({ isStarted: this.isStarted, hasCamera: this.camera.isOn, instrument: st.instrument, secondsWithoutHands: now - this.lastHandsAt });
    // The self-playing hand is drawn as a skeleton: it isn't in the camera picture.
    const camera = { brightness: st.brightness, isHidden: st.isCameraHidden || this.demo.isPlaying };
    if (this.isDrums) this.s.renderer.drums(this.s.drums, st.pedalBindings, now, hint, camera);
    else if (st.instrument === PIANO_ID) this.s.renderer.piano(this.s.piano, now, hint, camera);
    else {
      this.demo.tick(now);
      this.s.renderer.draw(this.s.player, this.lesson, this.tours.session, audioNow, now, hint, camera);
    }
    requestAnimationFrame(this.frame);
  };

  private track(nowMs: number, now: number, audioNow: number): void {
    if (!this.camera.isOn || !this.isOnStage) return;
    const hands = this.s.tracker.detect(nowMs);
    if (!hands) return;
    if (hands.length) this.lastHandsAt = now;
    const frame = this.s.tracker.frameSize();
    const px = hands.map((hand) => hand.landmarks.map((p) => videoToScreen(p, frame, window.innerWidth, window.innerHeight)));
    if (this.isDrums) this.s.drums.updateHands(px, now, audioNow, now);
    else if (this.s.store.value.instrument === PIANO_ID) this.s.piano.updateHands(px, now, audioNow);
    else if (this.demo.isPlaying) this.s.player.strikeAlong(px, now, audioNow, !this.ui.pointer.isDown);
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
}
