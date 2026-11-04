import type { SettingsStore } from '@application/settings/settings-store';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { LessonMode } from '@domain/lessons/session/lesson-mode';
import type { AppUi } from '@presentation/app/app-ui';
import { t } from '@presentation/i18n/translator';

const TOAST_MS = 6000;

interface LaunchDeps {
  readonly store: SettingsStore;
  readonly ui: AppUi;
  /** Leaves any lesson or tour in progress. */
  readonly reset: () => void;
  readonly startTour: () => void;
  readonly firstLesson: () => Song | undefined;
}

/**
 * Explore's "Try it": opens the right page in the right mode for a feature, then says in one
 * line what to do there.
 */
export function launchFeature(id: string, d: LaunchDeps): void {
  const say = () => d.ui.toast.show(t(`explore.${id}.toast`), TOAST_MS);
  const page = (instrument: string, mode?: PlayMode) => {
    d.reset();
    if (mode) d.store.update({ mode });
    d.ui.navigate({ kind: 'instrument', instrument });
  };
  const current = d.store.value.instrument;
  switch (id) {
    case 'tour': return d.startTour();
    case 'free': page('acoustic', PlayMode.free); return say();
    case 'bends': page('clean', PlayMode.free); return say();
    case 'bass': page('bass', PlayMode.note); return say();
    case 'instruments': page(current === DRUMS_ID ? 'acoustic' : current, PlayMode.chord); return say();
    case 'drums': page(DRUMS_ID); return say();
    case 'pedals': page(DRUMS_ID); d.ui.pedals.open(); return;
    case 'course': return d.ui.navigate({ kind: 'lessons' });
    case 'shadow': {
      d.store.update({ lessonMode: LessonMode.shadow });
      const first = d.firstLesson();
      if (first) d.ui.navigate({ kind: 'lesson', songId: first.id });
      return;
    }
    case 'handsonly':
      page(current, current === DRUMS_ID ? undefined : PlayMode.chord);
      d.store.update({ isCameraHidden: true });
      return say();
    case 'capo':
    case 'settings': d.ui.openSettings(); return say();
    default: page('acoustic', PlayMode.chord); return say();
  }
}
