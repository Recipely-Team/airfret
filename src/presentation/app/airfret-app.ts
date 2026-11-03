import type { DrumPlayer } from '@application/drums/drum-player';
import type { BackingTrack } from '@application/lessons/backing-track';
import type { GuidePlayer } from '@application/lessons/guide-player';
import type { StartLessonUseCase } from '@application/lessons/start-lesson-use-case';
import type { Player } from '@application/play/player';
import type { SettingsStore } from '@application/settings/settings-store';
import { TOUR_CHORDS } from '@application/tour/tour-chords';
import { TourSession } from '@application/tour/tour-session';
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
import { effectiveTuning } from '@domain/music/tuning-catalog';
import type { HandTrackerInterface } from '@domain/tracking/hand-tracker-interface';
import type { AppUi } from '@presentation/app/app-ui';
import { videoToScreen } from '@presentation/canvas/screen-mapping';
import type { StageRenderer } from '@presentation/canvas/stage-renderer';
import { t } from '@presentation/i18n/translator';

const MS_PER_SECOND = 1000;
const NO_HANDS_HINT_AFTER = 2.5;
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
  private tour: TourSession | null = null;
  private isStarted = false;
  private hasCamera = false;
  private lastHandsAt = 0;

  constructor(
    private readonly s: Services,
    private readonly ui: AppUi,
  ) {
    s.player.onEvent = (e) => {
      this.tour?.onEvent(e);
      const played = e.recognized ? { chord: e.recognized.name, recognized: e.recognized } : e.chord !== undefined ? { chord: e.chord } : e.midi === undefined ? {} : { midi: e.midi };
      this.lesson?.input(e.when, played);
    };
  }

  get isDrums(): boolean {
    return this.s.store.value.instrument === DRUMS_ID;
  }

  get hasLesson(): boolean {
    return this.lesson !== null || this.tour !== null;
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
    if (!this.s.store.value.hasSeenExplore) {
      this.s.store.update({ hasSeenExplore: true });
      this.ui.explore.open();
    }
  }

  /** The selected instrument with the chosen tuning and capo applied to its open strings. */
  private instrument(): Instrument {
    const st = this.s.store.value;
    const base = instrumentById(st.instrument);
    return { ...base, tuning: effectiveTuning(base.tuning, st.tuning, st.capo) };
  }

  /** Re-applies instrument, layout, chords and mix after any settings, lesson or tour change. */
  apply(): void {
    const st = this.s.store.value;
    const inst = this.instrument();
    this.s.sound.setInstrument(inst);
    this.s.sound.setVolume(st.volume);
    this.s.sound.setVoiceVolume(Voice.player, st.playerVolume);
    this.s.sound.setVoiceVolume(Voice.guide, this.lesson?.opts.hasGuide ? st.guideVolume : 0);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.s.renderer.resize(w, h);
    const chords = this.tour ? TOUR_CHORDS : this.lesson?.song.mode === PlayMode.chord ? this.lesson.chordSet : chordSetById(st.chordSet).chords.filter(knownChord);
    this.s.drums.configure(computeKitLayout(w, h, st.isLefty), h, st.hihatMode);
    const layout = computeLayout(w, h, inst.tuning.length, st.isLefty, inst.maxFret);
    this.s.player.configure({ layout, instrument: inst, mode: st.mode, chords, strumFilter: st.strumFilter, capo: st.capo });
  }

  pickInstrument(id: string): void {
    const st = this.s.store.value;
    const patch = this.hasLesson ? { instrument: id } : { instrument: id, mode: st.mode === PlayMode.free ? PlayMode.free : instrumentById(id).defaultMode, tuning: 'standard' };
    this.s.store.update(id === 'drive' && st.chordSet === 'pop' && !this.hasLesson ? { ...patch, chordSet: 'rock' } : patch);
  }

  openIntro(song: Song): void {
    this.ui.drawer.close();
    this.ui.intro.show(song);
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
    this.s.store.update({ instrument: song.instrument, mode });
    this.ui.hud.show(song.title, opts.hasGuide);
  }

  stopLesson(): void {
    this.lesson = null;
    this.ui.hud.hide();
    this.apply();
  }

  startTour(): void {
    this.stopLesson();
    this.tour = new TourSession(this.hasCamera);
    this.ui.tourBar.show(true);
    this.s.store.update({ mode: PlayMode.chord, instrument: 'acoustic' });
  }

  /** Skips the current tour step; on the last card, moves on to the first lesson. */
  skipTourStep(): void {
    if (this.tour?.isDone) this.finishTour();
    else this.tour?.skip();
  }

  endTour(): void {
    if (!this.tour) return;
    this.tour = null;
    this.ui.tourBar.show(false);
    this.apply();
  }

  /** One animation frame. */
  frame = (): void => {
    const nowMs = performance.now();
    const now = nowMs / MS_PER_SECOND;
    const audioNow = this.s.sound.now;
    this.track(nowMs, now, audioNow);
    if (this.lesson) this.tickLesson(this.lesson, audioNow);
    if (this.tour) this.tickTour(now);
    const st = this.s.store.value;
    if (this.isDrums) this.s.renderer.drums(this.s.drums, st.pedalBindings, now, this.hint(now), st.brightness);
    else this.s.renderer.draw(this.s.player, this.lesson, this.tour, audioNow, now, this.hint(now), st.brightness);
    requestAnimationFrame(this.frame);
  };

  private track(nowMs: number, now: number, audioNow: number): void {
    if (!this.hasCamera) return;
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

  private tickTour(now: number): void {
    const tour = this.tour;
    if (!tour) return;
    tour.update(this.s.player, now);
    if (tour.isDone) this.ui.tourBar.show(true);
  }

  /** After the tour: straight into the first course lesson. */
  finishTour(): void {
    this.endTour();
    const first = SONGS.find((song) => song.course === 1);
    if (first) this.openIntro(first);
  }

  /** Explore's "Try it": sets the app up for one feature and says what to do. */
  tryFeature(id: string): void {
    const st = this.s.store.value;
    const say = () => this.ui.toast.show(t(`explore.${id}.toast`), ERROR_TOAST_MS);
    const guitar = (instrument: string, mode: PlayMode) => {
      this.stopLesson();
      this.endTour();
      this.s.store.update({ instrument, mode });
    };
    switch (id) {
      case 'tour': return this.startTour();
      case 'free': guitar('acoustic', PlayMode.free); return say();
      case 'bends': guitar('clean', PlayMode.free); return say();
      case 'bass': guitar('bass', PlayMode.note); return say();
      case 'instruments': guitar(st.instrument === DRUMS_ID ? 'acoustic' : st.instrument, PlayMode.chord); return say();
      case 'drums': guitar(DRUMS_ID, st.mode); return say();
      case 'pedals': guitar(DRUMS_ID, st.mode); this.ui.pedals.open(); return;
      case 'course': return this.ui.drawer.open();
      case 'shadow': {
        this.s.store.update({ lessonMode: LessonMode.shadow });
        const first = SONGS.find((song) => song.course === 1);
        if (first) this.openIntro(first);
        return;
      }
      case 'capo':
      case 'settings': this.ui.openSettings(); return say();
      default: guitar('acoustic', PlayMode.chord); return say();
    }
  }

  private hint(now: number): string | null {
    if (!this.isStarted) return null;
    if (!this.hasCamera) return t(this.isDrums ? 'app.mouseHintDrums' : 'app.mouseHint');
    return now - this.lastHandsAt > NO_HANDS_HINT_AFTER ? t('app.noHands') : null;
  }
}
