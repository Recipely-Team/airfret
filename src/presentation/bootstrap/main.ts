import '@presentation/styles/style.css';
import { DrumPlayer } from '@application/drums/drum-player';
import { PedalRouter } from '@application/drums/pedal-router';
import { BackingTrack } from '@application/lessons/backing-track';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { Player } from '@application/play/player';
import { SettingsStore } from '@application/settings/settings-store';
import { WebAudioEngine } from '@infrastructure/audio/web-audio-engine';
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
import { Toolbar } from '@presentation/ui/controls/toolbar';
import { Router } from '@presentation/routing/router';
import { HomeView } from '@presentation/ui/navigation/home-view';
import { NavMenu } from '@presentation/ui/navigation/nav-menu';
import { byId } from '@presentation/ui/dom';
import { LessonHud } from '@presentation/ui/lessons/lesson-hud';
import { LessonIntro } from '@presentation/ui/lessons/lesson-intro';
import { LessonsDrawer } from '@presentation/ui/lessons/lessons-drawer';
import { ResultDialog } from '@presentation/ui/lessons/result-dialog';
import { PointerInput } from '@presentation/ui/pointer-input';
import { StartScreen } from '@presentation/ui/start-screen';
import { applyStaticCopy } from '@presentation/ui/static-copy';
import { Toast } from '@presentation/ui/toast';
import { TourBar } from '@presentation/ui/tour-bar';

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
  const pedalInput = new BrowserPedalInput();

  let app: AirfretApp | null = null;
  const router = new Router((route) => app?.show(route));
  const drawer = new LessonsDrawer(store, (song) => app?.openIntro(song), () => app?.tourFromAnywhere(), () => app?.closeOverlay());
  const ui: AppUi = {
    start: new StartScreen(() => app?.start() ?? Promise.resolve()),
    toast: new Toast(),
    drawer,
    intro: new LessonIntro(store, (song) => { app?.closeOverlay(); app?.beginLesson(song); }, () => router.navigate({ kind: 'lessons' })),
    hud: new LessonHud(store, () => app?.stopLesson()),
    result: new ResultDialog(() => { const s = ui.intro.current; if (s) app?.beginLesson(s); }, () => router.navigate({ kind: 'lessons' })),
    pointer: new PointerInput(canvas, player, sound, drums, () => app?.isDrums ?? false),
    tourBar: new TourBar(() => app?.skipTourStep(), () => app?.endTour()),
    pedals: new PedalPanel(store, pedalInput),
    explore: new ExploreGuide((id) => app?.tryFeature(id), () => app?.closeOverlay()),
    openSettings: () => openPopover('settings'),
    home: new HomeView(() => app?.tourFromAnywhere()),
    nav: new NavMenu({ onTour: () => app?.tourFromAnywhere(), onSettings: () => openPopover('settings') }),
    navigate: (route) => router.navigate(route),
    replaceRoute: (route) => router.replace(route),
  };
  app = new AirfretApp(
    { store, sound, tracker, player, drums, renderer: new StageRenderer(canvas, ctx, video), backing: new BackingTrack(sound), guide: new GuidePlayer(sound), startLesson: new StartLessonUseCase() },
    ui,
  );
  const running = app;
  const toolbar = new Toolbar(store, () => running.hasLesson, () => running.isOnStage, () => running.title());
  const settingsPanel = new SettingsPanel(store);
  const pedalRouter = new PedalRouter(store, drums, () => ({ audio: sound.now, wall: performance.now() / 1000 }));
  pedalInput.listen((e) => running.isDrums && pedalRouter.handle(e));
  byId('pedalsBtn').onclick = () => ui.pedals.open();
  wirePopovers(canvas, () => drawer.close());

  const render = () => {
    const s = store.value;
    setLanguage(resolveLanguage(s.language));
    applyStaticCopy();
    document.documentElement.style.setProperty('--cam', String(s.brightness));
    toolbar.render();
    settingsPanel.render();
    drawer.render();
    ui.pedals.render();
    ui.home.render();
    ui.nav.render(router.route);
    running.apply();
  };
  store.subscribe(render);
  window.addEventListener('resize', () => running.apply());
  render();
  router.start();
  requestAnimationFrame(running.frame);
  if (import.meta.env.DEV) Object.assign(window, { airfret: { app: running, player, drums, sound, store, tracker } });
}

bootstrap();
