import type { SettingsStore } from '@application/settings/settings-store';
import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { byId } from '@presentation/ui/dom';

const PERCENT = 100;

/** The pill under the coach: title, progress, accuracy, streak, guide/me volume, stop. */
export class LessonHud {
  constructor(store: SettingsStore, onStop: () => void) {
    byId('lessonStop').onclick = onStop;
    const guide = byId<HTMLInputElement>('guideVolume');
    const me = byId<HTMLInputElement>('playerVolume');
    guide.value = String(store.value.guideVolume);
    me.value = String(store.value.playerVolume);
    guide.oninput = () => store.update({ guideVolume: Number(guide.value) });
    me.oninput = () => store.update({ playerVolume: Number(me.value) });
  }

  show(title: string, hasGuide: boolean): void {
    byId('lessonTitle').textContent = title;
    byId('mixGuide').hidden = !hasGuide;
    byId('lessonBar').hidden = false;
  }

  hide(): void {
    byId('lessonBar').hidden = true;
  }

  update(session: LessonSession, audioNow: number): void {
    byId('lessonProgress').style.width = `${session.progress(audioNow) * PERCENT}%`;
    byId('lessonAcc').textContent = `${Math.round(session.accuracy() * PERCENT)}%`;
    byId('lessonStreak').textContent = String(session.streak);
  }
}
