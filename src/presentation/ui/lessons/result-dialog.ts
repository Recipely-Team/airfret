import type { LessonSession } from '@domain/lessons/session/lesson-session';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';

const PERCENT = 100;

/** End-of-lesson score card with "play again" and "back to lessons". */
export class ResultDialog {
  private readonly el = byId('result');

  constructor(onAgain: () => void, onBack: () => void) {
    byId('resultAgain').onclick = () => {
      this.hide();
      onAgain();
    };
    byId('resultBack').onclick = () => {
      this.hide();
      onBack();
    };
  }

  show(session: LessonSession): void {
    const c = session.counts;
    byId('resultTitle').textContent = session.song.title;
    byId('resultAcc').textContent = `${Math.round(session.accuracy() * PERCENT)}%`;
    byId('resultCounts').textContent = t('lesson.counts', { p: c.perfect, g: c.good, m: c.miss });
    byId('resultStreak').textContent = `${t('lesson.streak')}: ${session.bestStreak}`;
    this.el.hidden = false;
  }

  hide(): void {
    this.el.hidden = true;
  }
}
