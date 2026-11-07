import { InstrumentInfo } from '@presentation/ui/navigation/instrument-info';
import { KitPerformance } from '@presentation/app/stages/kit-performance';
import { SONGS } from '@domain/lessons/catalog/song-catalog';
import { launchFeature } from '@presentation/app/launch-feature';
import '@presentation/styles/style.css';
import { DrumPlayer } from '@application/drums/drum-player';
import { PianoPlayer } from '@application/keys/piano-player';
import { KeysStage } from '@presentation/app/stages/keys-stage';
import { HandDrumStage } from '@presentation/app/stages/hand-drum-stage';
import { HandDrumPlayer } from '@application/drums/hand-drum-player';
import { PedalRouter } from '@application/drums/pedal-router';
import { BackingTrack } from '@application/lessons/backing-track';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { Player } from '@application/play/player';
import { SettingsStore } from '@application/settings/settings-store';
import { WebAudioEngine } from '@infrastructure/audio/web-audio-engine';
import { BrowserClipRecorder } from '@infrastructure/recording/browser-clip-recorder';
import { StageCompositor } from '@infrastructure/recording/stage-compositor';
import { BrowserPedalInput } from '@infrastructure/input/browser-pedal-input';
import { LocalStorageSettingsRepository } from '@infrastructure/storage/local-storage-settings-repository';
import { MediaPipeHandTracker } from '@infrastructure/tracking/mediapipe-hand-tracker';
import { AirfretApp } from '@presentation/app/airfret-app';
import type { AppUi } from '@presentation/app/app-ui';
import { StageRenderer } from '@presentation/canvas/stage-renderer';
import { resolveLanguage, setLanguage } from '@presentation/i18n/translator';
import { openPopover, wirePopovers } from '@presentation/ui/controls/popovers';
import { PedalPanel } from '@presentation/ui/drums/pedal-panel';
import { ExploreGuide } from '@presentation/ui/explore/explore-guide';
import { SettingsPanel } from '@presentation/ui/controls/settings-panel';
import { LanguageSwitch } from '@presentation/ui/controls/language-switch';
import { OctaveShift } from '@presentation/ui/controls/octave-shift';
import { Toolbar } from '@presentation/ui/controls/toolbar';
import { pathFor } from '@presentation/routing/route-paths';
import { Router } from '@presentation/routing/router';
import { HomeView } from '@presentation/ui/navigation/home-view';
import { NavMenu } from '@presentation/ui/navigation/nav-menu';
import { byId } from '@presentation/ui/dom';
import { LessonHud } from '@presentation/ui/lessons/lesson-hud';
import { CustomSongForm } from '@presentation/ui/lessons/custom-song-form';
import { LessonIntro } from '@presentation/ui/lessons/lesson-intro';
import { LessonsDrawer } from '@presentation/ui/lessons/lessons-drawer';
import { ResultDialog } from '@presentation/ui/lessons/result-dialog';
import { PointerInput } from '@presentation/ui/pointer-input';
import { ClipDialog } from '@presentation/ui/recording/clip-dialog';
import { RecordButton } from '@presentation/ui/recording/record-button';
import { StartScreen } from '@presentation/ui/start-screen';
import { applyStaticCopy } from '@presentation/ui/static-copy';
import { Toast } from '@presentation/ui/toast';
import { TourBar } from '@presentation/ui/tour-bar';
import { showBuildTag } from '@presentation/ui/build-tag';

/**
 * **Composition root** — the only place that knows concrete infrastructure classes.
 *
 * @remarks
 * - Builds adapters, injects them into application services through their ports, and wires the UI.
 */
function bootstrap(): void {
  const canvas = byId<HTMLCanvasElement>('stage');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    byId('startStatus').textContent = 'Canvas 2D is not available in this browser.';
    return;
  }
  const video = byId<HTMLVideoElement>('cam');
  const store = new SettingsStore(new LocalStorageSettingsRepository());
  const sound = new WebAudioEngine();
  const tracker = new MediaPipeHandTracker(video);
  const player = new Player(sound);
  const drums = new DrumPlayer(sound);
  const piano = new PianoPlayer(sound);
  /** Pages that aren't a fretted instrument, each with its own player and drawing. */
  const stages = [new KeysStage(piano, sound), new HandDrumStage(new HandDrumPlayer(sound), sound)];
  const pedalInput = new BrowserPedalInput();

  let app: AirfretApp | null = null;
  const router = new Router((route) => app?.show(route));
  const drawer = new LessonsDrawer(store, (song) => router.navigate({ kind: 'lesson', songId: song.id }), () => app?.tourFromAnywhere(), () => app?.closeOverlay(), () => ui.customSong.open());
  const ui: AppUi = {
    start: new StartScreen(() => app?.start() ?? Promise.resolve()),
    toast: new Toast(),
    drawer,
    intro: new LessonIntro(store, (song) => { app?.closeOverlay(); app?.beginLesson(song); }, () => router.navigate({ kind: 'lessons' }), (song) => {
      // Watch it play: the song's own instrument, in the Watch it play mode with this song chosen.
      router.navigate({ kind: 'instrument', instrument: song.instrument });
      void app?.demo.enter(song);
    }),
    hud: new LessonHud(store, () => app?.stopLesson()),
    result: new ResultDialog(() => { const s = ui.intro.current; if (s) app?.beginLesson(s); }, () => router.navigate({ kind: 'lessons' })),
    pointer: new PointerInput(canvas, player, sound, drums, () => app?.isDrums ?? false, () => stages.find((x) => x.handles(store.value.instrument))),
    tourBar: new TourBar(() => app?.tours.skip(), () => app?.endTour()),
    pedals: new PedalPanel(store, pedalInput),
    explore: new ExploreGuide((id) => tryFeature(id), () => app?.closeOverlay()),
    openSettings: () => openPopover('settings'),
    home: new HomeView(() => app?.tourFromAnywhere()),
    customSong: new CustomSongForm(store, (song) => router.navigate({ kind: 'lesson', songId: song.id })),
    nav: new NavMenu(),
    navigate: (route) => router.navigate(route),
    replaceRoute: (route) => router.replace(route),
  };
  app = new AirfretApp(
    { store, sound, tracker, player, drums, stages, kit: new KitPerformance(drums, sound), renderer: new StageRenderer(canvas, ctx, video), backing: new BackingTrack(sound), guide: new GuidePlayer(sound), startLesson: new StartLessonUseCase() },
    ui,
  );
  const running = app;
  // Explore's "Try it": sets the app up for one feature and says what to do.
  function tryFeature(id: string): void {
    launchFeature(id, {
      store,
      ui,
      reset: () => {
        running.stopLesson();
        running.endTour();
      },
      startTour: () => running.tourFromAnywhere(),
      firstLesson: () => SONGS.find((song) => song.course === 1),
    });
  }
  const toolbar = new Toolbar(store, () => running.hasLesson, () => running.isOnStage, {
    isOffered: () => running.demo.hasDemo,
    isOn: () => running.demo.isOn,
    enter: () => void running.demo.enter(),
    leave: () => running.demo.leave(),
  });
  const settingsPanel = new SettingsPanel(store);
  const languageSwitch = new LanguageSwitch(store);
  const octaveShift = new OctaveShift(store);
  const compositor = new StageCompositor(canvas, video, () => ({ brightness: store.value.brightness, isCameraHidden: store.value.isCameraHidden }));
  const recorder = new BrowserClipRecorder(compositor, () => sound.recordingStream());
  const recordButton = new RecordButton({
    recorder,
    dialog: new ClipDialog((clip) => recorder.release(clip)),
    isOnStage: () => running.isOnStage,
    // Clips are named as the page is (`overdrive`, `classical`), not by the internal id (`drive`, `nylon`).
    instrumentId: () => pathFor({ kind: 'instrument', instrument: store.value.instrument }).slice(1),
    say: (message) => ui.toast.show(message),
  });
  const pedalRouter = new PedalRouter(store, drums, () => ({ audio: sound.now, wall: performance.now() / 1000 }));
  pedalInput.listen((e) => running.isDrums && pedalRouter.handle(e));
  byId('pedalsBtn').onclick = () => ui.pedals.open();
  // Escape closes whatever overlay is open (lessons, Explore, a lesson's intro) and returns the address to the
  // page under it — `closeOverlay` only rewrites the address, so the overlays are closed here first.
  const info = new InstrumentInfo(() => store.value.instrument);
  wirePopovers(canvas, () => {
    info.hide();
    drawer.close();
    ui.explore.close();
    ui.intro.hide();
    running.closeOverlay();
  });

  const render = () => {
    const s = store.value;
    setLanguage(resolveLanguage(s.language));
    applyStaticCopy();
    document.documentElement.style.setProperty('--cam', String(s.brightness));
    document.documentElement.classList.toggle('cam-hidden', s.isCameraHidden);
    toolbar.render();
    recordButton.render();
    octaveShift.render(running.isOnStage);
    running.demo.render();
    settingsPanel.render();
    drawer.render();
    ui.pedals.render();
    ui.home.render();
    info.render(running.isOnStage);
    ui.nav.render(running.baseRoute);
    languageSwitch.render();
    running.apply();
  };
  showBuildTag();
  store.subscribe(render);
  window.addEventListener('resize', () => running.apply());
  render();
  router.start();
  requestAnimationFrame(running.frame);
  if (import.meta.env.DEV) Object.assign(window, { airfret: { app: running, player, drums, sound, store, tracker } });
}

bootstrap();
