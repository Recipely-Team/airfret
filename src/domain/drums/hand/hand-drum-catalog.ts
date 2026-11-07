import type { HandDrum } from '@domain/drums/hand/hand-drum';
import type { HandDrumHead } from '@domain/drums/hand/hand-drum-head';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';
import { midiToFreq } from '@domain/music/pitch';

/**
 * Every hand drum, as data the one voice (`HandDrumVoice`) and the one stage play. The darbuka, def, bendir, davul
 * and congas play real recordings (see CREDITS.md); the others are synthesised, pitches and decays set by ear from each drum's character: the membrane drums' bass strokes sag in pitch as
 * the skin settles, their edge strokes ring in the body's partials over a click; frame drums add their jingles or
 * snare strings as noise; the handpan's fields are tuned notes with their octave and compound-fifth partials.
 */

const s = (label: string, modes: HandStroke['modes'], noise?: HandStroke['noise']): HandStroke => (noise ? { label, modes, noise } : { label, modes });

const DARBUKA: HandDrumHead = {
  cxOfWidth: 0.5, cyOfHeight: 0.62, size: 0.26, flatten: 0.55, look: 'goblet', edgeAt: 0.62,
  // Recorded: a real darbuka's düm and tek (Wikimedia Commons, CC BY-SA 4.0); ka is the tek, a little lower and softer.
  center: { ...s('stroke.doum', [{ hz: 128, toHz: 92, decay: 0.5, level: 0.9 }, { hz: 203, toHz: 146, decay: 0.18, level: 0.32 }], { type: 'lowpass', hz: 260, length: 0.03, level: 0.45 }), recording: { layers: [['darbuka-doum']] } },
  edge: { ...s('stroke.tek', [{ hz: 740, decay: 0.16, level: 0.42 }, { hz: 1180, decay: 0.12, level: 0.26 }, { hz: 1690, decay: 0.1, level: 0.18 }, { hz: 2480, decay: 0.08, level: 0.12 }], { type: 'bandpass', hz: 3200, length: 0.012, level: 0.42 }), recording: { layers: [['darbuka-tek']] } },
  edgeLeft: { ...s('stroke.ka', [{ hz: 620, decay: 0.1, level: 0.32 }, { hz: 990, decay: 0.075, level: 0.2 }, { hz: 1420, decay: 0.06, level: 0.13 }], { type: 'bandpass', hz: 2400, length: 0.012, level: 0.32 }), recording: { layers: [['darbuka-tek']], rate: 0.94, gain: 0.7 } },
};

const frame = (bassHz: number, ring: HandStroke['noise'], name: { center: string; edge: string; left: string }): HandDrumHead => ({
  cxOfWidth: 0.5, cyOfHeight: 0.55, size: 0.3, flatten: 0.92, look: 'frame', edgeAt: 0.7,
  center: s(name.center, [{ hz: bassHz, toHz: bassHz * 0.84, decay: 0.45, level: 0.85 }], ring),
  edge: s(name.edge, [{ hz: 420, decay: 0.08, level: 0.3 }], ring && { ...ring, level: ring.level * 1.6 }),
  edgeLeft: s(name.left, [{ hz: 380, decay: 0.06, level: 0.22 }], ring && { ...ring, level: ring.level * 1.2 }),
});

const barrel = (cx: number, size: number, bassHz: number, toneHz: number, names: { center: string; edge: string; left: string }): HandDrumHead => ({
  cxOfWidth: cx, cyOfHeight: 0.62, size, flatten: 0.6, look: 'barrel', edgeAt: 0.6,
  center: s(names.center, [{ hz: bassHz, toHz: bassHz * 0.85, decay: 0.22, level: 0.85 }], { type: 'lowpass', hz: 400, length: 0.03, level: 0.4 }),
  edge: s(names.edge, [{ hz: toneHz, decay: 0.35, level: 0.55 }, { hz: toneHz * 1.55, decay: 0.2, level: 0.2 }], { type: 'bandpass', hz: 2500, length: 0.01, level: 0.25 }),
  edgeLeft: s(names.left, [{ hz: toneHz * 1.8, decay: 0.05, level: 0.3 }], { type: 'highpass', hz: 3500, length: 0.05, level: 0.45 }),
});

const CONGA_STROKES = { center: 'stroke.bass', edge: 'stroke.open', left: 'stroke.slap' };

/**
 * A conga or tumba with VSCO 2 CE's recordings (CC0): open hits at three strengths (two takes of the middle one)
 * for the open tone, taps for the slap, and the open hit played slower for the bass in the middle.
 */
const recordedConga = (head: HandDrumHead, name: 'conga' | 'tumba'): HandDrumHead => {
  const open = [[`${name}-open-v1-a`], [`${name}-open-v2-a`, `${name}-open-v2-b`], [`${name}-open-v3-a`]];
  return {
    ...head,
    center: { ...head.center, recording: { layers: open, rate: 0.72, gain: 0.95 } },
    edge: { ...head.edge, recording: { layers: open } },
    // The taps were recorded soft; brought up to sit with the open tones.
    edgeLeft: { ...(head.edgeLeft ?? head.edge), recording: { layers: [[`${name}-tap-a`, `${name}-tap-b`]], gain: 4 } },
  };
};

/** A handpan's tone field: a tuned note with its octave and compound fifth, ringing long. */
const field = (midi: number, size: number, ring?: HandDrumHead['ring']): HandDrumHead => {
  const f = midiToFreq(midi);
  const note = s(`note.${midi}`, [{ hz: f, decay: 2.4, level: 0.5 }, { hz: f * 2, decay: 1.6, level: 0.24 }, { hz: f * 3, decay: 1, level: 0.12 }]);
  const head: HandDrumHead = { cxOfWidth: 0.5, cyOfHeight: 0.6, size, flatten: 0.62, look: 'steel', edgeAt: 2, center: note, edge: note };
  return ring ? { ...head, ring } : head;
};
/** D Kurd: the ding (D3) in the middle, A3 B♭3 C4 D4 E4 F4 G4 A4 zig-zagging round it from the bottom, low to high. */
const KURD = [57, 58, 60, 62, 64, 65, 67, 69];
const RING_ANGLES = [112.5, 67.5, 157.5, 22.5, 202.5, -22.5, 247.5, -67.5];
/** The ding sits in the middle of the shell; the fields round it, this far out and this big (shares of its radius). */
const HANDPAN = { ding: 0.22, ring: 0.7, field: 0.15 } as const;

/** A frame drum's real strokes: düm in the middle, tek at the rim, ka the tek a little lower and softer. */
const recordedFrame = (head: HandDrumHead, doum: string[], tek: string[], ka?: string[]): HandDrumHead => ({
  ...head,
  center: { ...head.center, recording: { layers: [doum] } },
  edge: { ...head.edge, recording: { layers: [tek] } },
  edgeLeft: { ...(head.edgeLeft ?? head.edge), recording: ka ? { layers: [ka] } : { layers: [tek], rate: 0.94, gain: 0.7 } },
});

/**
 * The davul: the big double-headed drum of Anatolian weddings and the mehter, struck with a heavy tokmak (düm) on
 * one head and a thin çubuk (tek) on the other. Real strokes (Despoina_kalantzi, Freesound, CC0): one clean hit
 * of each — the çubuk's other hand a touch higher and softer. (Strokes cut from her quiet tremolo carried its room
 * noise as loud as the hit, and were let go.)
 */
const DAVUL: HandDrumHead = {
  cxOfWidth: 0.47, cyOfHeight: 0.58, size: 0.24, flatten: 0.96, look: 'davul', edgeAt: 0.62,
  center: { ...s('stroke.doum', [{ hz: 62, toHz: 52, decay: 0.7, level: 0.95 }], { type: 'lowpass', hz: 300, length: 0.05, level: 0.5 }), recording: { layers: [['davul-doum']] } },
  edge: { ...s('stroke.tek', [{ hz: 380, decay: 0.06, level: 0.3 }], { type: 'highpass', hz: 3000, length: 0.06, level: 0.5 }), recording: { layers: [['davul-tek']] } },
  edgeLeft: { ...s('stroke.tek', [{ hz: 380, decay: 0.06, level: 0.3 }], { type: 'highpass', hz: 3000, length: 0.06, level: 0.5 }), recording: { layers: [['davul-tek']], rate: 1.06, gain: 0.8 } },
};

export const HAND_DRUMS: readonly HandDrum[] = [
  { id: 'darbuka', name: 'inst.darbuka', heads: [DARBUKA] },
  { id: 'def', name: 'inst.def', heads: [recordedFrame(frame(95, { type: 'highpass', hz: 6200, length: 0.35, level: 0.22 }, { center: 'stroke.doum', edge: 'stroke.tek', left: 'stroke.ka' }), ['def-doum'], ['def-tek', 'def-tek-b', 'def-tek-c'])] },
  { id: 'bendir', name: 'inst.bendir', heads: [recordedFrame(frame(68, { type: 'bandpass', hz: 1700, length: 0.45, level: 0.3 }, { center: 'stroke.doum', edge: 'stroke.tek', left: 'stroke.ka' }), ['bendir-doum'], ['bendir-tek'])] },
  { id: 'davul', name: 'inst.davul', heads: [DAVUL] },
  {
    id: 'cajon', name: 'inst.cajon', heads: [{
      cxOfWidth: 0.5, cyOfHeight: 0.58, size: 0.22, flatten: 1.25, look: 'box', edgeAt: 0.62,
      center: s('stroke.bass', [{ hz: 85, toHz: 70, decay: 0.25, level: 0.95 }], { type: 'lowpass', hz: 420, length: 0.04, level: 0.4 }),
      edge: s('stroke.slap', [{ hz: 350, decay: 0.05, level: 0.25 }], { type: 'bandpass', hz: 4000, length: 0.18, level: 0.55 }),
    }],
  },
  { id: 'congas', name: 'inst.congas', heads: [recordedConga(barrel(0.3, 0.17, 110, 330, CONGA_STROKES), 'conga'), recordedConga(barrel(0.7, 0.19, 90, 245, CONGA_STROKES), 'tumba')] },
  { id: 'bongos', name: 'inst.bongos', heads: [barrel(0.38, 0.11, 300, 520, { center: 'stroke.open', edge: 'stroke.open', left: 'stroke.slap' }), barrel(0.63, 0.14, 230, 400, { center: 'stroke.open', edge: 'stroke.open', left: 'stroke.slap' })] },
  { id: 'djembe', name: 'inst.djembe', heads: [{ ...barrel(0.5, 0.25, 75, 330, { center: 'stroke.bass', edge: 'stroke.tone', left: 'stroke.slap' }), look: 'goblet', flatten: 0.55 }] },
  {
    id: 'tabla', name: 'inst.tabla', heads: [
      {
        cxOfWidth: 0.33, cyOfHeight: 0.62, size: 0.17, flatten: 0.6, look: 'barrel', edgeAt: 0.6,
        center: s('stroke.ge', [{ hz: 80, toHz: 98, decay: 0.7, level: 0.9 }], { type: 'lowpass', hz: 300, length: 0.03, level: 0.3 }),
        edge: s('stroke.ka', [{ hz: 300, decay: 0.04, level: 0.3 }], { type: 'lowpass', hz: 900, length: 0.05, level: 0.4 }),
      },
      {
        // The dayan's black syahi tunes its modes into harmonics: a pitched, ringing drum.
        cxOfWidth: 0.66, cyOfHeight: 0.62, size: 0.13, flatten: 0.6, look: 'barrel', edgeAt: 0.55,
        center: s('stroke.tin', [{ hz: 290, decay: 0.6, level: 0.5 }, { hz: 580, decay: 0.4, level: 0.3 }, { hz: 870, decay: 0.3, level: 0.2 }, { hz: 1160, decay: 0.2, level: 0.12 }]),
        edge: s('stroke.na', [{ hz: 290, decay: 0.9, level: 0.45 }, { hz: 870, decay: 0.5, level: 0.25 }, { hz: 1450, decay: 0.3, level: 0.15 }], { type: 'bandpass', hz: 3000, length: 0.01, level: 0.3 }),
      },
    ],
  },
  {
    id: 'handpan', name: 'inst.handpan', heads: [
      field(50, HANDPAN.ding, { angle: 0, radius: 0 }),
      ...KURD.map((midi, i) => field(midi, HANDPAN.field, { angle: RING_ANGLES[i] ?? 0, radius: HANDPAN.ring })),
    ],
  },
];

/** The hand drum with this id, if it is one. */
export function handDrumFor(id: string): HandDrum | undefined {
  return HAND_DRUMS.find((d) => d.id === id);
}
