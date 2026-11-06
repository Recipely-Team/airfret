import type { AudioChain } from '@infrastructure/audio/chains/audio-chain';
import { compressor, filter, gain, peaking, series, shaper, shelf } from '@infrastructure/audio/chains/audio-nodes';
import { makeChorus } from '@infrastructure/audio/chains/chorus';
import { ChainKind } from '@domain/instruments/chain-kind';

/** Builds the effect chain for an instrument family. */
export function buildChain(ctx: BaseAudioContext, kind: ChainKind): AudioChain {
  switch (kind) {
    case ChainKind.acoustic:
      // Dreadnought body resonances plus a little air on top.
      return chain([filter(ctx, 'highpass', 70), peaking(ctx, 105, 5, 1.4), peaking(ctx, 220, 2.5, 1.2), peaking(ctx, 650, -2.5), shelf(ctx, 3500, 3), gain(ctx, 1.1)], 0.2);
    case ChainKind.nylon:
      return chain([filter(ctx, 'highpass', 70), peaking(ctx, 120, 4, 1.2), peaking(ctx, 400, 1.5), filter(ctx, 'lowpass', 5200), gain(ctx, 1.1)], 0.24);
    case ChainKind.clean: {
      const chorus = makeChorus(ctx);
      const nodes = [filter(ctx, 'highpass', 90), shaper(ctx, 1.2), peaking(ctx, 180, 2), peaking(ctx, 2600, 2.5, 0.9), filter(ctx, 'lowpass', 6500), chorus.input];
      series(nodes);
      return { input: nodes[0] as AudioNode, output: chorus.output, reverbSend: 0.22 };
    }
    case ChainKind.drive:
      // Preamp into a hard clipper, then a 4x12 cabinet: thump, mid scoop, steep top roll-off.
      return chain([
        filter(ctx, 'highpass', 140), peaking(ctx, 900, 6, 0.8), gain(ctx, 6), shaper(ctx, 4.5), filter(ctx, 'highpass', 90),
        peaking(ctx, 110, 4), peaking(ctx, 450, -4, 1.2), peaking(ctx, 2200, 3), filter(ctx, 'lowpass', 4600, 0.9), filter(ctx, 'lowpass', 6500, 0.6), gain(ctx, 0.32),
      ], 0.16);
    case ChainKind.bass:
      return chain([filter(ctx, 'highpass', 32), peaking(ctx, 80, 4), peaking(ctx, 700, 2), gain(ctx, 1.6), shaper(ctx, 1.5), filter(ctx, 'lowpass', 2600, 0.8), compressor(ctx), gain(ctx, 1.3)], 0.04);
    case ChainKind.ukulele:
      // A small nylon-strung box: no deep body, a warm mid, a soft top.
      return chain([filter(ctx, 'highpass', 150), peaking(ctx, 450, 2.5, 1.1), peaking(ctx, 2400, 1.5), filter(ctx, 'lowpass', 6500), gain(ctx, 1.2)], 0.18);
    case ChainKind.mandolin:
      // Paired steel strings on a small arched top: bright and cutting.
      return chain([filter(ctx, 'highpass', 180), peaking(ctx, 1200, 3, 1.1), shelf(ctx, 4000, 4), gain(ctx, 1.1)], 0.2);
    case ChainKind.balalaika:
      // A triangular spruce box: a quick, woody tone.
      return chain([filter(ctx, 'highpass', 160), peaking(ctx, 900, 3, 1.2), shelf(ctx, 3500, 3), gain(ctx, 1.1)], 0.16);
    case ChainKind.bouzouki:
      // Long-scale steel courses on a round back: a full low end and a bright ring.
      return chain([filter(ctx, 'highpass', 70), peaking(ctx, 200, 2), peaking(ctx, 1600, 3, 1.1), shelf(ctx, 4000, 3), gain(ctx, 1.05)], 0.22);
    case ChainKind.saz:
      // A thin top on a deep mulberry bowl: little low end, a nasal mid and the wire strings' bright edge.
      return chain([filter(ctx, 'highpass', 120), peaking(ctx, 300, -2), peaking(ctx, 1400, 4, 1.2), shelf(ctx, 4200, 3), gain(ctx, 1.1)], 0.2);
    case ChainKind.piano:
      // A grand in a room: no body to colour it, a touch of presence, more of the shared reverb than a guitar.
      return chain([filter(ctx, 'highpass', 28), peaking(ctx, 2600, 1.5, 0.8), gain(ctx, 1.05)], 0.3);
    case ChainKind.banjo:
      // A drum head, not a wooden top: no low body thump, a nasal head resonance and a bright, dry snap.
      return chain([filter(ctx, 'highpass', 110), peaking(ctx, 1100, 4, 1.4), peaking(ctx, 300, -3), shelf(ctx, 3800, 4), gain(ctx, 1.05)], 0.12);
  }
}

function chain(nodes: AudioNode[], reverbSend: number): AudioChain {
  series(nodes);
  return { input: nodes[0] as AudioNode, output: nodes[nodes.length - 1] as AudioNode, reverbSend };
}
