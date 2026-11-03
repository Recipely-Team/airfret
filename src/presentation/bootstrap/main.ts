import '@presentation/styles/style.css';
import { BackingTrack } from '@application/lessons/backing-track';
import { GuidePlayer } from '@application/lessons/guide-player';
import { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import { Player } from '@application/play/player';
import { SettingsStore } from '@application/settings/settings-store';
import { WebAudioEngine } from '@infrastructure/audio/web-audio-engine';
import { LocalStorageSettingsRepository } from '@infrastructure/storage/local-storage-settings-repository';
import { MediaPipeHandTracker } from '@infrastructure/tracking/mediapipe-hand-tracker';
import { AirfretApp } from '@presentation/app/airfret-app';
import type { AppUi } from '@presentation/app/app-ui';
import { StageRenderer } from '@presentation/canvas/stage-renderer';
import { resolveLanguage, setLanguage } from '@presentation/i18n/translator';
import { wirePopovers } from '@presentation/ui/controls/popovers';
import { SettingsPanel } from '@presentation/ui/controls/settings-panel';
import { Toolbar } from '@presentation/ui/controls/toolbar';
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

  let app: AirfretApp | null = null;
  const drawer = new LessonsDrawer(store, (song) => app?.openIntro(song), () => app?.startTour());
  const ui: AppUi = {
    start: new StartScreen(() => app?.start() ?? Promise.resolve()),
    toast: new Toast(),
    drawer,
    intro: new LessonIntro(store, (song) => app?.beginLesson(song), () => drawer.open()),
    hud: new LessonHud(store, () => app?.stopLesson()),
    result: new ResultDialog(() => { const s = ui.intro.current; if (s) app?.beginLesson(s); }, () => drawer.open()),
    pointer: new PointerInput(canvas, player, sound),
    tourBar: new TourBar(() => app?.skipTourStep(), () => app?.endTour()),
  };
  app = new AirfretApp(
    { store, sound, tracker, player, renderer: new StageRenderer(canvas, ctx, video), backing: new BackingTrack(sound), guide: new GuidePlayer(sound), startLesson: new StartLessonUseCase() },
    ui,
  );
  const running = app;
  const toolbar = new Toolbar(store, (id) => running.pickInstrument(id), () => running.hasLesson);
  const settingsPanel = new SettingsPanel(store);
  wirePopovers(canvas, () => drawer.close());

  const render = () => {
    const s = store.value;
    setLanguage(resolveLanguage(s.language));
    applyStaticCopy();
    document.documentElement.style.setProperty('--cam', String(s.brightness));
    toolbar.render();
    settingsPanel.render();
    drawer.render();
    running.apply();
  };
  store.subscribe(render);
  window.addEventListener('resize', () => running.apply());
  render();
  requestAnimationFrame(running.frame);
  if (import.meta.env.DEV) Object.assign(window, { airfret: { app: running, player, sound, store, tracker } });
}

bootstrap();
