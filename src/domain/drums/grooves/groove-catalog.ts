import type { Groove } from '@domain/drums/grooves/groove';

const BARS = 8;

/** The grooves the drum kit plays by itself, from a straight rock beat to a jazz swing and a bossa nova. */
export const GROOVES: readonly Groove[] = [
  { id: 'rock', title: 'groove.rock', about: 'groove.rock.about', bpm: 112, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'XxXxXxXx', snare: '..X...X.', kick: 'X...XX..' } },
  { id: 'pop', title: 'groove.pop', about: 'groove.pop.about', bpm: 100, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xxxxxxxx', snare: '..X...X.', kick: 'X..X.X..' } },
  { id: 'funk', title: 'groove.funk', about: 'groove.funk.about', bpm: 96, beatsPerBar: 4, subdiv: 4, bars: BARS,
    lanes: { hihat: 'XxxxXxxxXxxxXxxx', snare: '....X..g.g..X..g', kick: 'X.X....X..X.....' } },
  { id: 'shuffle', title: 'groove.shuffle', about: 'groove.shuffle.about', bpm: 108, beatsPerBar: 4, subdiv: 3, bars: BARS,
    lanes: { hihat: 'x.xx.xx.xx.x', snare: '...X.....X..', kick: 'X.....X..X..' } },
  { id: 'disco', title: 'groove.disco', about: 'groove.disco.about', bpm: 120, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xoxoxoxo', snare: '..X...X.', kick: 'X.X.X.X.' } },
  { id: 'half-time', title: 'groove.halfTime', about: 'groove.halfTime.about', bpm: 140, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xxxxxxxx', snare: '....X...', kick: 'X.....X.' } },
  { id: 'reggae', title: 'groove.reggae', about: 'groove.reggae.about', bpm: 76, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xxxxxxxx', snare: '....r...', kick: '....X...' } },
  { id: 'bossa', title: 'groove.bossa', about: 'groove.bossa.about', bpm: 128, beatsPerBar: 4, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xxxxxxxxxxxxxxxx', snare: 'r..r..r...r..r..', kick: 'X..XX..XX..XX..X' } },
  { id: 'swing', title: 'groove.swing', about: 'groove.swing.about', bpm: 132, beatsPerBar: 4, subdiv: 3, bars: BARS,
    lanes: { ride: 'x..x.xx..x.x', hihat: '...p.....p..', kick: 'g..g..g..g..' } },
  { id: 'waltz', title: 'groove.waltz', about: 'groove.waltz.about', bpm: 150, beatsPerBar: 3, subdiv: 2, bars: BARS,
    lanes: { hihat: 'xxxxxx', snare: '..X.X.', kick: 'X.....' } },
  { id: 'tom-groove', title: 'groove.toms', about: 'groove.toms.about', bpm: 104, beatsPerBar: 4, subdiv: 4, bars: BARS,
    lanes: { floor: 'X..x..X...x.X...', tom1: '..........x.....', snare: '....X.......X...', kick: 'X.....X.X.......' } },
];
