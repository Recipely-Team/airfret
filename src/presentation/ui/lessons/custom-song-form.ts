import { createCustomSong } from '@application/lessons/create-custom-song';
import { songLibrary } from '@application/lessons/song-library';
import type { SettingsStore } from '@application/settings/settings-store';
import type { Song } from '@domain/lessons/catalog/song';
import { t } from '@presentation/i18n/translator';
import { renderSegmented } from '@presentation/ui/controls/segmented-control';
import { byId } from '@presentation/ui/dom';
import { readScoreFile, SCORE_FILE_TYPES } from '@presentation/ui/lessons/read-score-file';
import { scoreToNotes } from '@domain/lessons/import/score-to-notes';

const METERS = [3, 4, 6];
/** The title field's length, and the tempo range it accepts. */
const TITLE_MAX = 60;
const BPM = { min: 40, max: 220 } as const;
/** Strum patterns offered per meter, simplest first. */
const RHYTHMS: Readonly<Record<number, readonly string[]>> = {
  3: ['D.D.D.', 'D.D.DU', 'D.DUDU'],
  4: ['D.D.D.D.', 'D.D.DUDU', 'D.DU.UDU'],
  6: ['D..D..', 'D.UD.U'],
};
const ARROWS = (p: string) => p.replace(/D/g, '↓').replace(/U/g, '↑').replace(/\./g, '·');

/**
 * **CustomSongForm** — "add your own song": a title, the chords as typed text, tempo, meter and a strum
 * pattern. Saved songs appear in Lessons under "Your songs" and play in every mode.
 */
export class CustomSongForm {
  private readonly el = byId('custom');
  private meter = 4;
  private rhythm = RHYTHMS[4]?.[0] ?? 'D.D.D.D.';

  constructor(
    private readonly store: SettingsStore,
    private readonly onSaved: (song: Song) => void,
  ) {
    byId('customCancel').onclick = () => this.close();
    const file = byId<HTMLInputElement>('customFile');
    file.accept = SCORE_FILE_TYPES;
    file.onchange = () => {
      const chosen = file.files?.[0];
      file.value = '';
      if (chosen) void this.openFile(chosen);
    };
    byId<HTMLFormElement>('customForm').onsubmit = (e) => {
      e.preventDefault();
      this.save();
    };
  }

  open(): void {
    byId('customError').textContent = '';
    this.render();
    this.el.hidden = false;
    byId('customTitle').focus();
  }

  close(): void {
    this.el.hidden = true;
  }

  private render(): void {
    renderSegmented(byId('customMeter'), METERS.map((m) => ({ value: m, label: `${m}/${m === 6 ? 8 : 4}` })), this.meter, (m) => {
      this.meter = m;
      this.rhythm = RHYTHMS[m]?.[0] ?? this.rhythm;
      this.render();
    });
    renderSegmented(byId('customRhythm'), (RHYTHMS[this.meter] ?? []).map((p) => ({ value: p, label: ARROWS(p) })), this.rhythm, (p) => (this.rhythm = p));
  }

  /** A melody file (MIDI, MusicXML, ABC) fills in the form: its notes, title, tempo and meter, ready to check and save. */
  private async openFile(file: File): Promise<void> {
    const r = await readScoreFile(file);
    if (!r.isOk) {
      const isKey = r.failure.detail.startsWith('custom.');
      byId('customError').textContent = t(isKey ? r.failure.detail : 'custom.error.file', { name: file.name });
      return;
    }
    byId('customError').textContent = '';
    const title = byId<HTMLInputElement>('customTitle');
    if (!title.value.trim()) title.value = (r.value.title ?? file.name.replace(/\.[^.]+$/, '')).slice(0, TITLE_MAX);
    byId<HTMLInputElement>('customBpm').value = String(Math.max(BPM.min, Math.min(BPM.max, r.value.bpm)));
    this.meter = METERS.includes(r.value.beatsPerBar) ? r.value.beatsPerBar : METERS[1] ?? 4;
    byId<HTMLTextAreaElement>('customChords').value = scoreToNotes(r.value);
    this.render();
  }

  private save(): void {
    const taken = songLibrary(this.store.value).map((s) => s.id);
    const r = createCustomSong({
      title: byId<HTMLInputElement>('customTitle').value,
      bpm: Number(byId<HTMLInputElement>('customBpm').value),
      beatsPerBar: this.meter,
      chords: byId<HTMLTextAreaElement>('customChords').value,
      pattern: this.rhythm,
    }, taken);
    if (!r.isOk) {
      const [key, detail] = r.failure.detail.split(':');
      byId('customError').textContent = t(key ?? 'custom.error.empty', { chord: detail ?? '' });
      return;
    }
    this.store.update({ customSongs: [...this.store.value.customSongs, r.value] });
    this.close();
    this.onSaved(r.value);
  }
}
