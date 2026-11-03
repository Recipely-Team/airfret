import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { byId } from '@presentation/ui/dom';

const PERCENT = 100;

/** The pill under the timeline: title, progress, accuracy, streak and a stop button. */
export class LessonHud {
  constructor(onStop: () => void) {
    byId('lessonStop').onclick = onStop;
  }

  show(title: string): void {
    byId('lessonTitle').textContent = title;
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
