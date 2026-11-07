import { DRUMS_ID } from '@domain/drums/drums-id';
import { INSTRUMENTS } from '@domain/instruments/instrument-catalog';
import { keyboardFor } from '@domain/keys/keyboard-instruments';
import { playableRange } from '@domain/music/fretted-range';
import { midiToName } from '@domain/music/pitch';
import { t } from '@presentation/i18n/translator';
import { byId } from '@presentation/ui/dom';
import { INSTRUMENT_ICONS } from '@presentation/ui/navigation/instrument-icons';
import { instrumentName } from '@presentation/ui/navigation/instrument-name';
import { SOUND_SOURCES } from '@presentation/ui/navigation/sound-sources';

/** A timeline line in the locale files: "when — what". */
const WHEN_WHAT = ' — ';
const LINE = '\n';

/**
 * **InstrumentInfo** — the card about the instrument on screen: where it comes from, its history and the steps of
 * its development on a timeline, its range, and whether it sounds from real recordings (credited) or the synth.
 */
export class InstrumentInfo {
  private readonly el = byId('info');

  constructor(private readonly current: () => string) {
    byId('infoBtn').onclick = () => this.show(this.current());
    byId('infoClose').onclick = () => this.hide();
    this.el.onclick = (e) => {
      if (e.target === this.el) this.hide();
    };
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  /** The ⓘ button only shows on an instrument's page. */
  render(isOnStage: boolean): void {
    byId('infoBtn').hidden = !isOnStage;
    if (this.isOpen) this.fill(this.current());
  }

  show(id: string): void {
    this.fill(id);
    this.el.hidden = false;
    byId('infoClose').focus();
  }

  hide(): void {
    this.el.hidden = true;
  }

  private fill(id: string): void {
    const key = (part: string) => `info.${id}.${part}`;
    byId('infoIcon').innerHTML = INSTRUMENT_ICONS[id] ?? '';
    byId('infoFamily').textContent = t(key('family'));
    byId('infoTitle').textContent = instrumentName(id);
    byId('infoOrigin').textContent = t(key('origin'));
    byId('infoHistory').textContent = t(key('history'));
    byId('infoTimeline').replaceChildren(...t(key('timeline')).split(LINE).map((line) => {
      const [when = '', what = ''] = line.split(WHEN_WHAT);
      const li = document.createElement('li');
      const w = document.createElement('span');
      w.className = 'when';
      w.textContent = when;
      const d = document.createElement('span');
      d.className = 'what';
      d.textContent = what;
      li.append(w, d);
      return li;
    }));
    const facts: [string, string, boolean?][] = [];
    const range = rangeOf(id);
    if (range) facts.push([t('info.range'), range]);
    const source = SOUND_SOURCES[id];
    facts.push([t('info.sound'), source ? t('info.recorded', { source }) : t('info.synth'), source !== undefined]);
    byId('infoFacts').replaceChildren(...facts.flatMap(([label, value, isReal]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      if (isReal !== undefined) dd.className = isReal ? 'sound real' : 'sound synth';
      return [dt, dd];
    }));
  }
}

/** Lowest to highest note it plays, when it has pitches: "E2 – E6". */
function rangeOf(id: string): string | null {
  const kb = keyboardFor(id);
  if (kb) return `${midiToName(kb.low)} – ${midiToName(kb.high)}`;
  const inst = id === DRUMS_ID ? undefined : INSTRUMENTS.find((i) => i.id === id);
  if (!inst) return null;
  const r = playableRange(inst);
  return `${midiToName(r.low)} – ${midiToName(r.high)}`;
}
