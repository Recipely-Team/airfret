import type { SettingsStore } from '@application/settings/settings-store';
import { DRUMS_ID } from '@domain/drums/drums-id';
import type { Song } from '@domain/lessons/catalog/song';
import { LessonMode } from '@domain/lessons/session/lesson-mode';
import { knownChord } from '@domain/music/chords/chord-voicing';
import { drawChordDiagram } from '@presentation/canvas/chord-diagram/draw-chord-diagram';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';

const TEMPOS = [0.6, 0.8, 1];
const PERCENT = 100;
const DIAGRAM = { w: 92, h: 150, chart: 70 } as const;

/**
 * **LessonIntro** — before a lesson: what it teaches, the chords as real charts with finger numbers,
 * practical tips, and a choice of how to play it, each mode explained in one line. *Watch it play* lets the
 * song's instrument play it by itself first.
 */
export class LessonIntro {
  private song: Song | null = null;
  private readonly el = byId('intro');

  constructor(
    private readonly store: SettingsStore,
    onStart: (song: Song) => void,
    onBack: () => void,
    onWatch: (song: Song) => void,
  ) {
    byId('introWatch').onclick = () => {
      if (!this.song) return;
      this.hide();
      onWatch(this.song);
    };
    byId('introStart').onclick = () => {
      if (!this.song) return;
      this.hide();
      onStart(this.song);
    };
    byId('introBack').onclick = () => {
      this.hide();
      onBack();
    };
    const drums = byId<HTMLInputElement>('introDrums');
    drums.onchange = () => store.update({ hasLessonDrums: drums.checked });
  }

  get current(): Song | null {
    return this.song;
  }

  show(song: Song): void {
    this.song = song;
    byId('introEyebrow').textContent = song.course === undefined ? t(song.credit) : t('lesson.courseStep', { n: song.course });
    byId('introTitle').textContent = song.title;
    byId('introAbout').textContent = t(song.about);
    byId('introWatch').hidden = song.instrument === DRUMS_ID;
    this.renderChords(song);
    byId('introTips').replaceChildren(...(song.tips ?? ['tip.general']).map((k) => {
      const li = document.createElement('li');
      li.textContent = t(k);
      return li;
    }));
    this.renderOptions();
    this.el.hidden = false;
  }

  hide(): void {
    this.el.hidden = true;
  }

  private renderChords(song: Song): void {
    const chords = [...new Set((song.chords ?? '').trim().split(/\s+/).map((tok) => tok.split(':')[0] ?? ''))].filter(knownChord);
    byId('introChords').replaceChildren(...chords.map((chord) => {
      const fig = document.createElement('figure');
      const cap = document.createElement('figcaption');
      cap.textContent = chord;
      const canvas = document.createElement('canvas');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = DIAGRAM.w * dpr;
      canvas.height = DIAGRAM.h * dpr;
      canvas.style.width = `${DIAGRAM.w}px`;
      canvas.style.height = `${DIAGRAM.h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        drawChordDiagram(ctx, chord, (DIAGRAM.w - DIAGRAM.chart) / 2, 22, DIAGRAM.chart);
      }
      fig.append(cap, canvas);
      return fig;
    }));
  }

  private renderOptions(): void {
    const s = this.store.value;
    const modes = byId('introModes');
    modes.replaceChildren(...Object.values(LessonMode).map((mode) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mode-card';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(mode === s.lessonMode));
      const title = document.createElement('strong');
      title.textContent = t(`mode.lesson.${mode}`);
      const text = document.createElement('span');
      text.textContent = t(`mode.lesson.${mode}.about`);
      b.append(title, text);
      b.onclick = () => {
        this.store.update({ lessonMode: mode });
        this.renderOptions();
      };
      return b;
    }));
    renderSegmented(byId('introTempo'), TEMPOS.map((v) => ({ value: v, label: `${Math.round(v * PERCENT)}%` })), s.lessonTempo, (lessonTempo) => this.store.update({ lessonTempo }));
    byId<HTMLInputElement>('introDrums').checked = s.hasLessonDrums;
  }
}
