import type { Groove } from '@domain/drums/grooves/groove';
import type { HandRhythm } from '@domain/drums/hand/rhythms/hand-rhythm';
import { rhythmsFor } from '@domain/drums/hand/rhythms/hand-rhythm-catalog';
import type { Song } from '@domain/lessons/catalog/song';
import type { SongChart } from '@domain/lessons/chart/song-chart';

/** A march's title says so: its drums play a march beat. */
const MARCH = /mar(s|\u015f|ch)/i;

/** Kit lanes by beats in a bar: a march or rock beat in 4, a march in 2, a waltz in 3, compound 6 and the Turkish 9. */
const KIT: Readonly<Record<number, { subdiv: number; lanes: Groove['lanes'] }>> = {
  2: { subdiv: 2, lanes: { hihat: 'xxxx', snare: '..X.', kick: 'X...' } },
  3: { subdiv: 2, lanes: { hihat: 'xxxxxx', snare: '..X.X.', kick: 'X.....' } },
  4: { subdiv: 2, lanes: { hihat: 'xxxxxxxx', snare: '..X...X.', kick: 'X...XX..' } },
  6: { subdiv: 1, lanes: { hihat: 'xxxxxx', snare: '...X..', kick: 'X.....' } },
  9: { subdiv: 1, lanes: { hihat: 'xxxxxxxxx', snare: '..X...X.X', kick: 'X...X....' } },
};
/** A march in 4: the snare on every beat, the kick marking one and three. */
const MARCH_4 = { subdiv: 2, lanes: { snare: 'X.x.X.x.', kick: 'X...X...', hihat: 'x.x.x.x.' } } as const;
/** Hand-drum phrases by beats in a bar, when the drum has no rhythm of its own in that meter: düm on the bar, tek between. */
const HAND: Readonly<Record<number, { subdiv: number; phrase: string }>> = {
  2: { subdiv: 2, phrase: 'D T . T' },
  3: { subdiv: 2, phrase: 'D . T . T .' },
  4: { subdiv: 2, phrase: 'D T . T D . T .' },
  6: { subdiv: 1, phrase: 'D . T D T .' },
  9: { subdiv: 1, phrase: 'D . T . D . T T T' },
};

/**
 * Where a song's drums play, in beats: from the first bar line at or after its first note (a pickup is left to the
 * tune) to its end — and how many bars that is.
 */
export function songDrumSpan(song: Song, chart: SongChart): { first: number; start: number; bars: number } {
  const first = Math.min(...chart.targets.map((t) => t.beat), chart.length);
  const start = Math.ceil(first / song.beatsPerBar - 1e-6) * song.beatsPerBar;
  return { first, start, bars: Math.max(1, Math.ceil((chart.length - start) / song.beatsPerBar - 1e-6)) };
}

/** A bar's plan for a drum (see `drumBars`): 0 silent, 1 light, 2 its pattern, 3 that with a crash. */
const BAR = { rest: 0, light: 1, full: 2, crash: 3 } as const;

/**
 * The drum kit's part for a song: a beat in its meter (a march beat for a march), `bars` long at its tempo — bar by
 * bar as `plan` says when there is one (a band's build-up: light bars keep the kick and hi-hat, a crash opens a loud
 * section, silent bars rest).
 */
export function grooveForSong(song: Song, bars: number, plan?: readonly number[], isMarch = false): Groove {
  const n = song.beatsPerBar;
  const pattern = n === 4 && (isMarch || MARCH.test(song.title)) ? MARCH_4 : KIT[n] ?? { subdiv: 1, lanes: { hihat: 'x'.repeat(n), kick: `X${'.'.repeat(n - 1)}`, snare: `${'.'.repeat(n - 1)}X` } };
  const lanes = plan ? plannedLanes(pattern.lanes, pattern.subdiv * n, plan) : pattern.lanes;
  return { id: `song-${song.id}`, title: song.title, about: song.about, bpm: song.bpm, beatsPerBar: n, subdiv: pattern.subdiv, bars, lanes };
}

/** A one-bar kit pattern written out bar by bar to the plan. */
function plannedLanes(lanes: Groove['lanes'], steps: number, plan: readonly number[]): Groove['lanes'] {
  const rest = '.'.repeat(steps);
  const out: Record<string, string> = {};
  for (const [piece, lane] of Object.entries(lanes)) {
    const bar = lane.replace(/\s+/g, '').slice(0, steps).padEnd(steps, '.');
    out[piece] = plan.map((b) => (b === BAR.rest || (b === BAR.light && piece !== 'kick' && piece !== 'hihat') ? rest : bar)).join('');
  }
  out['crash'] = plan.map((b) => (b === BAR.crash ? `X${'.'.repeat(steps - 1)}` : rest)).join('');
  return out;
}

/**
 * A hand drum's part for a song: its own traditional rhythm in the song's meter when it has one (a maqsum in 4, a
 * malfuf in 2, a karsilama in 9), else düm on the bar and tek between — `bars` long at the song's tempo; bar by bar
 * as `plan` says when there is one (light bars keep only the düms).
 */
export function rhythmForSong(song: Song, drumId: string, bars: number, plan?: readonly number[]): HandRhythm {
  const n = song.beatsPerBar;
  const own = rhythmsFor(drumId).find((r) => r.beatsPerBar === n);
  const generic = HAND[n] ?? { subdiv: 1, phrase: ['D', ...Array.from({ length: n - 1 }, () => 'T')].join(' ') };
  const subdiv = own?.subdiv ?? generic.subdiv;
  const phrase = own?.phrase ?? generic.phrase;
  return { id: `song-${song.id}`, title: song.title, about: song.about, bpm: song.bpm, beatsPerBar: n, subdiv, phrase: plan ? plannedPhrase(phrase, subdiv * n, plan) : phrase, bars, drums: [drumId] };
}

/** A hand-drum phrase (one or more bars) written out bar by bar to the plan: light bars keep the düms, silent bars rest. */
function plannedPhrase(phrase: string, steps: number, plan: readonly number[]): string {
  const tokens = phrase.trim().split(/\s+/);
  const phraseBars = Math.max(1, Math.round(tokens.length / steps));
  return plan.flatMap((b, i) => {
    const bar = Array.from({ length: steps }, (_, k) => tokens[(i % phraseBars) * steps + k] ?? '.');
    if (b === BAR.rest) return bar.map(() => '.');
    return b === BAR.light ? bar.map((t) => (/^\d?D/.test(t) ? t : '.')) : bar;
  }).join(' ');
}
