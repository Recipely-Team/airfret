import { stringY } from '@domain/fretboard/neck-geometry';
import type { PaintContext } from '@presentation/canvas/paint-context';

/** Gauges in inches, low → high: light acoustic set, nylon, electric 10s (a 7-string's low B first), bass 45s, light banjo set. */
const GAUGES = {
  acoustic: [0.053, 0.042, 0.032, 0.024, 0.016, 0.012],
  classical: [0.044, 0.035, 0.03, 0.04, 0.032, 0.028],
  electric: [0.059, 0.046, 0.036, 0.026, 0.017, 0.013, 0.01],
  /** A 6-string set, B to C: a 5-string uses B to G, a 4-string E to G. */
  bass: [0.13, 0.105, 0.085, 0.065, 0.045, 0.03],
  banjo: [0.042, 0.032, 0.024, 0.018, 0.013, 0.01],
  /** Top · middle · bottom course, plain steel. */
  saz: [0.012, 0.014, 0.01],
} as const;
/** A 12-string's paired string: this far from its partner (share of the string gap), an octave string this much thinner. */
const COURSE = { offsetOfGap: 0.28, octaveWidth: 0.5 } as const;
/** px per inch of gauge at a 900 px tall screen. */
const PX_PER_INCH = 62;
const REFERENCE_HEIGHT = 900;
const STEPS = 40;
const VIBRATION_PX = 4.5;
const VIBRATION_HZ = 55;
const SHADOW_OFFSET = 3;

/**
 * Strings as metal: cast shadow, body, highlight and winding texture.
 *
 * @remarks
 * - A fretted string vibrates only between its fret and the bridge — the part behind the finger is still.
 * - Vibration is drawn as a motion-blurred envelope (the way a fast-moving string looks), sin(π·u) along the length.
 * - A string under the strumming fingertip bends to it as a tent and snaps back when released.
 * - A 12-string draws each course's second string beside the first (`Instrument.courses`).
 */
export function paintStrings({ ctx, player, look, phase }: PaintContext): void {
  const l = player.layout;
  const gauges = look.style === 'bass' ? GAUGES.bass.slice(l.strings > 4 ? 0 : 1, (l.strings > 4 ? 0 : 1) + l.strings) : GAUGES[look.style].slice(-l.strings);
  const courses = player.instrument.courses;
  const scale = (l.h / REFERENCE_HEIGHT) * PX_PER_INCH;
  const pick = player.strumPoint;
  for (let i = 0; i < l.strings; i++) {
    const width = Math.max(0.8, (gauges[i] ?? 0.012) * scale);
    const isWound = i < look.woundCount;
    const fret = player.stringFret(i);
    const stopX = fret > 0 ? (l.fretX[Math.min(fret, l.maxFret)] ?? l.nutX) : l.nutX;
    const energy = player.energy[i] ?? 0;
    const isTouched = pick !== null && player.touching.includes(i);
    const yAt = (x: number) => stringY(l, i, x);
    const path = (dy: (x: number, u: number) => number) => {
      ctx.beginPath();
      ctx.moveTo(l.nutX, yAt(l.nutX));
      ctx.lineTo(stopX, yAt(stopX));
      for (let k = 1; k <= STEPS; k++) {
        const u = k / STEPS;
        const x = stopX + (l.strumX1 - stopX) * u;
        ctx.lineTo(x, yAt(x) + dy(x, u));
      }
    };
    const tent = (x: number) => {
      if (!isTouched) return 0;
      const press = pick.y - yAt(pick.x);
      const u = (x - stopX) / (pick.x - stopX);
      const v = (l.strumX1 - x) / (l.strumX1 - pick.x);
      return press * Math.max(0, Math.min(u, v, 1));
    };
    const amp = energy * (VIBRATION_PX + width);
    const wobble = Math.sin(phase * VIBRATION_HZ + i * 1.9);

    // Shadow on the wood.
    ctx.strokeStyle = 'rgba(0,0,0,0.38)';
    ctx.lineWidth = width + 1;
    ctx.save();
    ctx.translate(0, SHADOW_OFFSET + width * 0.6);
    path((x, u) => tent(x) + Math.sin(Math.PI * u) * amp * wobble * 0.5);
    ctx.stroke();
    ctx.restore();

    // Motion blur: the string's swept envelope.
    if (amp > 0.4) {
      ctx.globalAlpha = Math.min(0.35, energy * 0.5);
      ctx.strokeStyle = isWound ? look.wound : look.plain;
      ctx.lineWidth = width;
      for (const side of [-1, 1]) {
        path((x, u) => tent(x) + side * Math.sin(Math.PI * u) * amp);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const core = (x: number, u: number) => tent(x) + Math.sin(Math.PI * u) * amp * wobble * 0.35;
    // A 12-string's pair: a second string just above this one, rung with it — thinner when an octave higher.
    const pair = courses?.[i];
    if (pair !== undefined) {
      ctx.save();
      ctx.translate(0, -((2 * l.spreadBody) / Math.max(1, l.strings - 1)) * COURSE.offsetOfGap);
      ctx.strokeStyle = shade(look.plain, -0.15);
      ctx.lineWidth = Math.max(0.6, pair > 0 ? width * COURSE.octaveWidth : width);
      path(core);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = shade(isWound ? look.wound : look.plain, -0.35);
    ctx.lineWidth = width;
    path(core);
    ctx.stroke();
    ctx.strokeStyle = isWound ? look.wound : look.plain;
    ctx.lineWidth = Math.max(0.6, width * 0.55);
    ctx.save();
    ctx.translate(0, -width * 0.18);
    path(core);
    ctx.stroke();
    ctx.restore();
    if (isWound) {
      ctx.setLineDash([1, 1.6]);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = width * 0.9;
      path(core);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (isTouched) {
      ctx.beginPath();
      ctx.arc(pick.x, yAt(pick.x) + tent(pick.x), width + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,210,0.35)';
      ctx.fill();
    }
  }
}

/** Darkens (k < 0) or lightens a #rrggbb colour. */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}
