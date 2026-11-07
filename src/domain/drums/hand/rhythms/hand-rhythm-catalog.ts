import type { HandRhythm } from '@domain/drums/hand/rhythms/hand-rhythm';

/** The goblet and frame drums of the Middle East and the Balkans share their rhythms. */
const GOBLET_AND_FRAME = ['darbuka', 'def', 'bendir'];
const BARS = 8;

/**
 * Traditional rhythms for every hand drum, each in its common form with a ghost-note variation: the Arabic and
 * Turkish usul on the darbuka, def and bendir; the Afro-Cuban tumbao and martillo on congas and bongos; West African
 * accompaniments on the djembe; flamenco and pop on the cajón; the thekas of the tabla; grooves on the handpan.
 */
export const HAND_RHYTHMS: readonly HandRhythm[] = [
  { id: 'maqsum', title: 'rhythm.maqsum', about: 'rhythm.maqsum.about', bpm: 100, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D T . T D . T . D T k T D k T k' },
  { id: 'baladi', title: 'rhythm.baladi', about: 'rhythm.baladi.about', bpm: 96, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D D . T D . T . D D k T D k T k' },
  { id: 'saidi', title: 'rhythm.saidi', about: 'rhythm.saidi.about', bpm: 104, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D T . D D . T . D T k D D k T k' },
  { id: 'malfuf', title: 'rhythm.malfuf', about: 'rhythm.malfuf.about', bpm: 120, beatsPerBar: 2, subdiv: 4, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D . . T . . T . D k k T k k T k' },
  { id: 'ayyub', title: 'rhythm.ayyub', about: 'rhythm.ayyub.about', bpm: 110, beatsPerBar: 2, subdiv: 2, bars: BARS * 2, drums: GOBLET_AND_FRAME,
    phrase: 'D k D T D k D T' },
  { id: 'karsilama', title: 'rhythm.karsilama', about: 'rhythm.karsilama.about', bpm: 220, beatsPerBar: 9, subdiv: 1, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D . T . D . T . T D k T k D k T k T' },
  { id: 'ciftetelli', title: 'rhythm.ciftetelli', about: 'rhythm.ciftetelli.about', bpm: 90, beatsPerBar: 8, subdiv: 2, bars: 4, drums: GOBLET_AND_FRAME,
    phrase: 'D . . T . T D . D . T . T . . . D k k T k T D k D k T k T k T k' },
  { id: 'wahda', title: 'rhythm.wahda', about: 'rhythm.wahda.about', bpm: 76, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: GOBLET_AND_FRAME,
    phrase: 'D . . . T . . . D . k k T . k k' },
  { id: 'tumbao', title: 'rhythm.tumbao', about: 'rhythm.tumbao.about', bpm: 100, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['congas'],
    phrase: '0d 0k 0K 0k 0d 0k 0T 1T 0d 0k 0K 0k 0d 0k 0T 0T' },
  { id: 'bolero', title: 'rhythm.bolero', about: 'rhythm.bolero.about', bpm: 76, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['congas', 'bongos'],
    phrase: '0K . 0T 0T 0K . 1T 1T' },
  { id: 'songo', title: 'rhythm.songo', about: 'rhythm.songo.about', bpm: 112, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['congas'],
    phrase: '0K 0d 1T 0d 0K 0T 0d 1T' },
  { id: 'martillo', title: 'rhythm.martillo', about: 'rhythm.martillo.about', bpm: 100, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['bongos'],
    phrase: '0T 0k 0K 0k 0T 0k 1T 0k' },
  { id: 'kuku', title: 'rhythm.kuku', about: 'rhythm.kuku.about', bpm: 112, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['djembe'],
    phrase: 'D . T T K . T T D . T T K K T T' },
  { id: 'djansa', title: 'rhythm.djansa', about: 'rhythm.djansa.about', bpm: 120, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['djembe'],
    phrase: 'K . T T K T . T' },
  { id: 'rumba', title: 'rhythm.rumba', about: 'rhythm.rumba.about', bpm: 104, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['cajon'],
    phrase: 'D . T . D D T . D t T t D D T t' },
  { id: 'backbeat', title: 'rhythm.backbeat', about: 'rhythm.backbeat.about', bpm: 92, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['cajon'],
    phrase: 'D . T . D D T .' },
  { id: 'teentaal', title: 'rhythm.teentaal', about: 'rhythm.teentaal.about', bpm: 140, beatsPerBar: 16, subdiv: 1, bars: 4, drums: ['tabla'],
    phrase: '0D+1T 0D+1D 0D+1D 0D+1T 0D+1T 0D+1D 0D+1D 0D+1T 0D+1T 1D 1D 1T 1T 0D+1D 0D+1D 0D+1T' },
  { id: 'keherwa', title: 'rhythm.keherwa', about: 'rhythm.keherwa.about', bpm: 110, beatsPerBar: 8, subdiv: 1, bars: BARS, drums: ['tabla'],
    phrase: '0D+1T 0D 1T 1D 1T 0T 0D+1D 1T' },
  { id: 'dadra', title: 'rhythm.dadra', about: 'rhythm.dadra.about', bpm: 120, beatsPerBar: 6, subdiv: 1, bars: BARS, drums: ['tabla'],
    phrase: '0D+1T 0D+1D 1T 0D+1T 1D 1T' },
  { id: 'kurd-groove', title: 'rhythm.kurdGroove', about: 'rhythm.kurdGroove.about', bpm: 92, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['handpan'],
    phrase: '0D 1D 3D 0D 4D 3D 0D 5D 0D 1D 3D 0D 6D 5D 4D 3D' },
  { id: 'waves', title: 'rhythm.waves', about: 'rhythm.waves.about', bpm: 150, beatsPerBar: 6, subdiv: 1, bars: BARS, drums: ['handpan'],
    phrase: '0D 3D 5D 8D 5D 3D 0D 2D 4D 7D 4D 2D' },
  { id: 'heartbeat', title: 'rhythm.heartbeat', about: 'rhythm.heartbeat.about', bpm: 84, beatsPerBar: 4, subdiv: 2, bars: BARS, drums: ['handpan'],
    phrase: '0D . 0d 4D . 3D 1D . 0D . 0d 5D . 4D 3D 2D' },
];

/** The rhythms a hand drum plays, its first the one it opens on. */
export function rhythmsFor(drumId: string): HandRhythm[] {
  return HAND_RHYTHMS.filter((r) => r.drums.includes(drumId));
}
