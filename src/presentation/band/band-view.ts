import { memberSound } from '@application/band/member-sound';
import type { BandSeat } from '@domain/band/band-seat';
import { BandRole } from '@domain/band/band-role';
import { profileOf } from '@domain/band/profile-of';
import { seatBand } from '@domain/band/seat-band';
import { writePart } from '@domain/band/write-part';
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
/** A tune with no notes read (a chord song) is arranged as if it lay around middle C. */
const MIDDLE = { low: 60, high: 72 } as const;

interface BandHost {
  readonly sound: SoundOutputInterface;
  /** Each member's recordings, in the engine's mix and on its clock. */
  readonly ensemble: EnsembleOutputInterface;
  songs(): readonly Song[];
  members(): readonly string[];
  setMembers(ids: readonly string[]): void;
  /** Unlocks audio if it isn't yet; false when it can't be. */
  startAudio(): Promise<boolean>;
  /** The page is closed (its Close button). */
  onClose(): void;
}

/**
 * **The band** — a page of its own where several instruments play one song together by themselves, no one needed in
 * front of the camera. The song is arranged for whoever is in the band (`seatBand`, `writePart`): one carries the
 * tune, the chord instruments comp, the low ones play the bass, the drums keep the beat. Each member is a card,
 * drawn playing its own part as it does on its page, sounding from its own recordings.
 */
export class BandView {
  private readonly root = byId('band');
  private readonly grid = byId('bandGrid');
  private readonly songSelect = byId<HTMLSelectElement>('bandSong');
  private readonly playButton = byId<HTMLButtonElement>('bandPlay');
  private readonly picker = new BandPicker((id) => this.toggle(id));
  private cards: BandCard[] = [];
  private seats: BandSeat[] = [];
  private songId = FIRST_SONG;
  private isPlaying = false;
  private frameId = 0;

  constructor(private readonly host: BandHost) {
    this.playButton.onclick = () => void (this.isPlaying ? this.stop() : this.play());
    this.songSelect.onchange = () => {
      this.songId = this.songSelect.value;
      this.assemble();
      if (this.isPlaying) void this.play();
    };
    byId('bandClose').onclick = () => host.onClose();
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    if (this.isOpen) return;
    this.root.hidden = false;
    this.renderSongs();
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
    for (const { member } of this.cards) if (member.perform(audioNow, now)) isAnyPlaying = true;
    if (!isAnyPlaying) {
      this.isPlaying = false;
      this.renderButton();
    }
  }

  private async play(): Promise<void> {
    const song = this.song();
    const chart = song ? parseSong(song, false) : null;
    if (!song || !chart?.isOk || !(await this.host.startAudio())) return;
    this.stop();
    const audioNow = this.host.sound.now;
    const hasBass = this.seats.some((s) => s.role === BandRole.bass);
    const first = firstBeat(chart.value);
    // Every part plays its first note just after it starts: one that starts later in the song starts later by as much.
    this.isPlaying = this.cards.map(({ member }, i) => {
      const seat = this.seats[i];
      const part = seat ? writePart(song, chart.value, seat, hasBass) : song;
      const own = parseSong(part, false);
      const late = own.isOk ? ((firstBeat(own.value) - first) * SECONDS_PER_MINUTE) / song.bpm : 0;
      return member.play(part, audioNow + late);
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

  /**
   * Builds the band chosen for the song: seats it (who carries the tune, who comps, who plays the bass), then a card
   * for each member with its own sound at its place in the mix, and loads their recordings.
   */
  private assemble(): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stop();
    const ids = this.host.members().slice(0, MAX_MEMBERS);
    this.host.ensemble.prepare(ids);
    this.seats = seatBand(ids.map(profileOf), this.tuneRange());
    this.cards = ids.map((id, i) => {
      const seat = this.seats[i];
      const card = new BandCard(createBandMember(id, memberSound(id, this.host.ensemble, this.host.sound, seat?.gain ?? 1)), () => this.toggle(id));
      card.showRole(t(`band.role.${seat?.role ?? BandRole.melody}`));
      return card;
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'band-add';
    add.innerHTML = '<span aria-hidden="true">+</span>';
    add.append(t('band.add'));
    add.disabled = ids.length >= MAX_MEMBERS;
    add.onclick = () => this.picker.open(this.candidates(), this.host.members(), MAX_MEMBERS);
    this.grid.replaceChildren(...this.cards.map((c) => c.element), add);
    this.picker.render(this.candidates(), this.host.members(), MAX_MEMBERS);
    if (wasPlaying) void this.play();
  }

  /** The tune's lowest and highest notes (a chord song's taken as lying around middle C). */
  private tuneRange(): { low: number; high: number } {
    const song = this.song();
    const chart = song ? parseSong(song, false) : null;
    const pitches = chart?.isOk ? chart.value.targets.flatMap((x) => (x.midi === undefined ? [] : [x.midi])) : [];
    return pitches.length ? { low: Math.min(...pitches), high: Math.max(...pitches) } : MIDDLE;
  }

  private readonly frame = (): void => {
    this.frameId = requestAnimationFrame(this.frame);
    this.tick();
    const audioNow = this.host.sound.now;
    const now = performance.now() / MS;
    for (const card of this.cards) card.draw(audioNow, now);
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

  private renderSongs(): void {
    const songs = this.melodies();
    if (!songs.some((s) => s.id === this.songId)) this.songId = songs[0]?.id ?? '';
    this.songSelect.replaceChildren(...songs.map((s) => new Option(s.title, s.id, false, s.id === this.songId)));
    this.renderButton();
  }

  private toggle(id: string): void {
    const chosen = this.host.members();
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(0, MAX_MEMBERS);
    this.host.setMembers(next);
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
