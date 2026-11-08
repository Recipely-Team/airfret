import { memberSound } from '@application/band/member-sound';
import { arrangeBand } from '@domain/band/arrange-band';
import type { BandArrangement } from '@domain/band/band-arrangement';
import { BandStyle } from '@domain/band/band-style';
import type { MemberChoice } from '@domain/band/member-choice';
import { sectionAt } from '@domain/band/parts/entries';
import { BandRole } from '@domain/band/seating/band-role';
import { profileOf } from '@domain/band/seating/profile-of';
import type { EnsembleOutputInterface } from '@domain/audio/ensemble-output-interface';
import type { SoundOutputInterface } from '@domain/audio/sound-output-interface';
import { DRUMS_ID } from '@domain/drums/drums-id';
import { handDrumFor } from '@domain/drums/hand/hand-drum-catalog';
import { PlayMode } from '@domain/instruments/play-mode';
import type { Song } from '@domain/lessons/catalog/song';
import { parseSong } from '@domain/lessons/chart/parse-song';
import type { SongChart } from '@domain/lessons/chart/song-chart';
import { BandCard } from '@presentation/band/band-card';
import { createBandMember } from '@presentation/band/band-members';
import { BandPicker } from '@presentation/band/band-picker';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { HOME_GROUPS } from '@presentation/ui/navigation/home-groups';

/** The most instruments in the band at once: each still has room to be seen playing. */
const MAX_MEMBERS = 8;
/** The song the band offers first. */
const FIRST_SONG = 'izmir-marsi';
const MS = 1000;
const SECONDS_PER_MINUTE = 60;
/** Every part plays its first note this soon after it starts (the performers' `FIRST_NOTE_AFTER`), seconds. */
const FIRST_NOTE_AFTER = 0.3;
const ENERGY_LEVELS = [1, 2, 3, 4, 5] as const;
const AUTO = '';

/** The band's settings, as the page reads and changes them. */
interface BandSettings {
  readonly band: readonly string[];
  readonly bandStyle: BandStyle;
  readonly bandEnergy: number | null;
  readonly bandChoices: Readonly<Record<string, MemberChoice>>;
}

interface BandHost {
  readonly sound: SoundOutputInterface;
  /** Each member's recordings, in the engine's mix and on its clock. */
  readonly ensemble: EnsembleOutputInterface;
  songs(): readonly Song[];
  settings(): BandSettings;
  update(patch: Partial<BandSettings>): void;
  /** Unlocks audio if it isn't yet; false when it can't be. */
  startAudio(): Promise<boolean>;
  /** The page is closed (its Close button). */
  onClose(): void;
}

/**
 * **The band** — a page of its own where several instruments play one song together by themselves. The song is
 * arranged for whoever is in it (`arrangeBand`, after the research report): one carries the tune, the chord
 * instruments comp in patterns of their own, the low ones play the bass, the drums keep the beat — building up over
 * the song's form. The player sets the band's texture and level, and any member's role, pattern, level and entry;
 * each member is a card, drawn playing its own part, sounding from its own recordings.
 */
export class BandView {
  private readonly root = byId('band');
  private readonly grid = byId('bandGrid');
  private readonly songSelect = byId<HTMLSelectElement>('bandSong');
  private readonly styleSelect = byId<HTMLSelectElement>('bandStyle');
  private readonly energySelect = byId<HTMLSelectElement>('bandEnergy');
  private readonly sectionLabel = byId('bandSection');
  private readonly playButton = byId<HTMLButtonElement>('bandPlay');
  private readonly picker = new BandPicker((id) => this.toggle(id));
  private cards: BandCard[] = [];
  private arrangement: BandArrangement | null = null;
  /** Each member's level in the mix, read at every note (a level slider is heard at once). */
  private readonly gains = new Map<string, number>();
  private songId = FIRST_SONG;
  private isPlaying = false;
  private startedAt = 0;
  private frameId = 0;

  constructor(private readonly host: BandHost) {
    this.playButton.onclick = () => void (this.isPlaying ? this.stop() : this.play());
    this.songSelect.onchange = () => this.rearrange(() => (this.songId = this.songSelect.value));
    this.styleSelect.onchange = () => this.rearrange(() => host.update({ bandStyle: this.styleSelect.value as BandStyle }));
    this.energySelect.onchange = () => this.rearrange(() => host.update({ bandEnergy: this.energySelect.value === AUTO ? null : Number(this.energySelect.value) }));
    byId('bandClose').onclick = () => host.onClose();
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    if (this.isOpen) return;
    this.root.hidden = false;
    this.renderControls();
    this.assemble();
    this.frameId = requestAnimationFrame(this.frame);
  }

  close(): void {
    if (!this.isOpen) return;
    this.stop();
    this.picker.close();
    this.root.hidden = true;
    cancelAnimationFrame(this.frameId);
  }

  /** Moves the band on: every member plays what is due (also called on a timer while the tab is hidden). */
  tick(): void {
    if (!this.isPlaying) return;
    const audioNow = this.host.sound.now;
    const now = performance.now() / MS;
    let isAnyPlaying = false;
    // A card not yet in its place (just added) waits a frame; it never holds up the others.
    for (const card of this.cards) if (card.isFitted && card.member.perform(audioNow, now)) isAnyPlaying = true;
    if (!isAnyPlaying) {
      this.isPlaying = false;
      this.renderButton();
    }
  }

  private async play(): Promise<void> {
    const song = this.song();
    const chart = song ? parseSong(song, false) : null;
    if (!song || !chart?.isOk || !this.arrangement || !(await this.host.startAudio())) return;
    this.stop();
    const audioNow = this.host.sound.now;
    this.startedAt = audioNow;
    const first = firstBeat(chart.value);
    // Every part plays its first note just after it starts: one that starts later in the song starts later by as much.
    this.isPlaying = this.arrangement.parts.map((part, i) => {
      const card = this.cards[i];
      if (!card || part.seat.role === BandRole.off) return false;
      const own = parseSong(part.song, false);
      const late = own.isOk && !part.drumPlan ? ((firstBeat(own.value) - first) * SECONDS_PER_MINUTE) / song.bpm : 0;
      return card.member.play(part.song, audioNow + late, part.drumPlan);
    }).some(Boolean);
    this.renderButton();
  }

  private stop(): void {
    const audioNow = this.host.sound.now;
    for (const { member } of this.cards) member.stop(audioNow);
    this.host.ensemble.silence();
    this.isPlaying = false;
    this.renderButton();
  }

  /** Applies a change and arranges again — picking up where the band was: from the top, if it was playing. */
  private rearrange(change: () => void): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stop();
    change();
    this.arrange();
    if (wasPlaying) void this.play();
  }

  /** Arranges the song for the band as set, and shows each member's seat on its card. */
  private arrange(): void {
    const song = this.song();
    const chart = song ? parseSong(song, false) : null;
    const st = this.host.settings();
    this.arrangement = song && chart?.isOk ? arrangeBand(song, chart.value, this.cards.map((c) => c.member.id), st.bandStyle, st.bandEnergy, st.bandChoices) : null;
    const sections = this.arrangement?.sections.length ?? 0;
    this.arrangement?.seats.forEach((seat, i) => {
      this.gains.set(seat.id, seat.gain);
      this.cards[i]?.show(seat, st.bandChoices[seat.id], sections);
    });
    this.renderSection();
  }

  /** Builds the members chosen, each a card with its own sound and drawing, loads their recordings, and arranges. */
  private assemble(): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stop();
    const ids = this.host.settings().band.slice(0, MAX_MEMBERS);
    this.host.ensemble.prepare(ids);
    this.cards = ids.map((id) => new BandCard(createBandMember(id, memberSound(id, this.host.ensemble, this.host.sound, () => this.gains.get(id) ?? 1)), profileOf(id), {
      remove: () => this.toggle(id),
      choose: (choice) => this.rearrange(() => this.choose(id, choice)),
      level: (level, isFinal) => this.setLevel(id, level, isFinal),
    }));
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'band-add';
    add.innerHTML = '<span aria-hidden="true">+</span>';
    add.append(t('band.add'));
    add.disabled = ids.length >= MAX_MEMBERS;
    add.onclick = () => this.picker.open(this.candidates(), this.host.settings().band, MAX_MEMBERS);
    this.grid.replaceChildren(...this.cards.map((c) => c.element), add);
    // In the page now: each is sized before it plays a note (an instrument with no size can't place one).
    for (const card of this.cards) card.fit();
    this.arrange();
    this.picker.render(this.candidates(), this.host.settings().band, MAX_MEMBERS);
    if (wasPlaying) void this.play();
  }

  private choose(id: string, choice: MemberChoice | null): void {
    const others = Object.fromEntries(Object.entries(this.host.settings().bandChoices).filter(([key]) => key !== id));
    this.host.update({ bandChoices: choice ? { ...others, [id]: choice } : others });
  }

  /** A member's level: heard at once, kept when the slider is let go. */
  private setLevel(id: string, level: number, isFinal: boolean): void {
    const seat = this.arrangement?.seats.find((s) => s.id === id);
    const saved = this.host.settings().bandChoices[id]?.level ?? 1;
    if (seat) this.gains.set(id, (seat.gain / Math.max(saved, 1e-3)) * level);
    if (!isFinal) return;
    const choices = { ...this.host.settings().bandChoices, [id]: { ...this.host.settings().bandChoices[id], level } };
    this.host.update({ bandChoices: choices });
    this.arrange();
  }

  private readonly frame = (): void => {
    this.frameId = requestAnimationFrame(this.frame);
    this.tick();
    const audioNow = this.host.sound.now;
    const now = performance.now() / MS;
    for (const card of this.cards) card.draw(audioNow, now);
    if (this.isPlaying) this.renderSection();
  };

  private song(): Song | undefined {
    return this.melodies().find((s) => s.id === this.songId);
  }

  /** Every song with a tune or chords; drum-only rhythms have nothing for the others to play. */
  private melodies(): Song[] {
    return this.host.songs().filter((s) => s.instrument !== DRUMS_ID && !handDrumFor(s.instrument) && (s.mode === PlayMode.note || s.mode === PlayMode.chord));
  }

  /** Who can play in the band: the instruments with real recordings, and every drum. */
  private candidates(): string[] {
    return HOME_GROUPS.flatMap((g) => g.ids).filter((id) => this.host.ensemble.canPlay(id) || id === DRUMS_ID || handDrumFor(id) !== undefined);
  }

  private renderControls(): void {
    const songs = this.melodies();
    if (!songs.some((s) => s.id === this.songId)) this.songId = songs[0]?.id ?? '';
    this.songSelect.replaceChildren(...songs.map((s) => new Option(s.title, s.id, false, s.id === this.songId)));
    const st = this.host.settings();
    this.styleSelect.replaceChildren(...Object.values(BandStyle).map((s) => new Option(t(`band.style.${s}`), s, false, s === st.bandStyle)));
    this.energySelect.replaceChildren(new Option(t('band.energy.auto'), AUTO), ...ENERGY_LEVELS.map((n) => new Option(t(`band.energy.${n}`), String(n), false, n === st.bandEnergy)));
    this.renderButton();
  }

  /** Where the band is in the song — section and how full it plays — or, stopped, how the song is laid out. */
  private renderSection(): void {
    const a = this.arrangement;
    const song = this.song();
    if (!a || !song || !a.sections.length) {
      this.sectionLabel.textContent = '';
      return;
    }
    const first = a.sections[0]?.start ?? 0;
    const beat = first + ((this.host.sound.now - this.startedAt - FIRST_NOTE_AFTER) * song.bpm) / SECONDS_PER_MINUTE;
    const section = this.isPlaying ? sectionAt(a.sections, Math.max(0, beat)) : undefined;
    this.sectionLabel.textContent = section
      ? `${t('band.section', { k: section.index + 1, n: a.sections.length })} · ${'●'.repeat(section.energy)}${'○'.repeat(5 - section.energy)}`
      : t('band.sections', { n: a.sections.length });
  }

  private toggle(id: string): void {
    const chosen = this.host.settings().band;
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(0, MAX_MEMBERS);
    this.host.update({ band: next });
    this.assemble();
  }

  private renderButton(): void {
    this.playButton.textContent = t(this.isPlaying ? 'demo.stop' : 'demo.start');
    this.playButton.setAttribute('aria-pressed', String(this.isPlaying));
  }
}

/** Where a song's first note (or chord) falls, in beats. */
function firstBeat(chart: SongChart): number {
  return Math.min(...chart.targets.map((x) => x.beat), ...chart.segments.map((s) => s.beat), chart.length);
}
