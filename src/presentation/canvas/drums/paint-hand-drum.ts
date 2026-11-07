import type { HandDrumPlayer } from '@application/drums/hand-drum-player';
import type { HandDrumHead } from '@domain/drums/hand/hand-drum-head';
import { SHELL } from '@domain/drums/hand/hand-drum-pads';
import { midiToName } from '@domain/music/pitch';
import { FONT, Palette, rgba } from '@presentation/canvas/palette';
import { t } from '@presentation/i18n/translator';
import { paintDavul, paintDavulMallets } from '@presentation/canvas/drums/paint-davul';

/** Copper, wood, skin, chrome and the handpan's dark nitrided steel. */
const C = { copper: '#8a5232', copperLight: '#c98a55', wood: '#7a4a28', woodLight: '#b07a48', skin: '#efe6d2', skinShade: '#d6c9ab', goat: '#e6d3ad', rim: '#d8d8da', rimDark: '#7c7c80', steel: '#3b3f44', steelLight: '#6c737b' } as const;
const RIPPLE_SECONDS = 0.6;
const JINGLES = 6;

interface Pad {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly head: HandDrumHead;
}

/**
 * Any hand drum from the player's seat: each head drawn by its look (a darbuka's copper goblet, a frame drum's
 * wooden ring and jingles, the cajón's front panel, a conga's staves, a handpan's steel dome), the strokes'
 * names where they are played, and a ripple for each stroke (accent for the centre, pale for the edge).
 */
export function paintHandDrum(ctx: CanvasRenderingContext2D, d: HandDrumPlayer, w: number, h: number, now: number): void {
  if (d.pads.some((p) => p.head.look === 'steel')) paintShell(ctx, w, h);
  for (const pad of d.pads) {
    if (pad.head.look === 'goblet' || pad.head.look === 'barrel') paintBody(ctx, pad);
    if (pad.head.look === 'box') paintBox(ctx, pad);
    else if (pad.head.look === 'davul') paintDavul(ctx, pad);
    else paintHead(ctx, pad, d.drum.id === 'def');
    paintLabels(ctx, pad);
  }
  const ripples = d.visibleRipples(now);
  for (const r of ripples) {
    const pad = d.pads[r.head];
    if (!pad) continue;
    const age = (now - r.at) / RIPPLE_SECONDS;
    const isCentre = r.stroke === pad.head.center;
    const size = pad.rx * (isCentre ? 0.5 : 0.25) * (0.3 + age);
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, size, size * pad.head.flatten, 0, 0, Math.PI * 2);
    ctx.strokeStyle = isCentre ? rgba(Palette.accent, (1 - age) * r.velocity) : `rgba(255,255,255,${(1 - age) * r.velocity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  for (const pad of d.pads) if (pad.head.look === 'davul') paintDavulMallets(ctx, pad, ripples, now);
}

/** A goblet (darbuka, djembe) narrows below its head; a barrel (conga, bongo, tabla) drops straight down. */
function paintBody(ctx: CanvasRenderingContext2D, p: Pad): void {
  const isGoblet = p.head.look === 'goblet';
  const depth = p.rx * (isGoblet ? 1.15 : 0.9);
  const g = ctx.createLinearGradient(p.cx - p.rx, 0, p.cx + p.rx, 0);
  g.addColorStop(0, isGoblet ? C.copper : C.wood);
  g.addColorStop(0.45, isGoblet ? C.copperLight : C.woodLight);
  g.addColorStop(1, isGoblet ? C.copper : C.wood);
  ctx.beginPath();
  ctx.moveTo(p.cx - p.rx, p.cy);
  if (isGoblet) {
    ctx.bezierCurveTo(p.cx - p.rx, p.cy + depth * 0.55, p.cx - p.rx * 0.32, p.cy + depth * 0.6, p.cx - p.rx * 0.28, p.cy + depth);
    ctx.lineTo(p.cx + p.rx * 0.28, p.cy + depth);
    ctx.bezierCurveTo(p.cx + p.rx * 0.32, p.cy + depth * 0.6, p.cx + p.rx, p.cy + depth * 0.55, p.cx + p.rx, p.cy);
  } else {
    ctx.lineTo(p.cx - p.rx * 0.9, p.cy + depth);
    ctx.lineTo(p.cx + p.rx * 0.9, p.cy + depth);
    ctx.lineTo(p.cx + p.rx, p.cy);
  }
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
}

function paintHead(ctx: CanvasRenderingContext2D, p: Pad, hasJingles: boolean): void {
  const isSteel = p.head.look === 'steel';
  const g = ctx.createRadialGradient(p.cx - p.rx * 0.2, p.cy - p.ry * 0.3, p.rx * 0.1, p.cx, p.cy, p.rx);
  g.addColorStop(0, isSteel ? C.steelLight : p.head.look === 'frame' ? C.goat : C.skin);
  g.addColorStop(1, isSteel ? C.steel : C.skinShade);
  ctx.beginPath();
  ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = p.head.look === 'frame' ? Math.max(8, p.rx * 0.08) : isSteel ? 1.5 : Math.max(4, p.rx * 0.045);
  ctx.strokeStyle = p.head.look === 'frame' ? C.wood : isSteel ? 'rgba(0,0,0,0.5)' : C.rim;
  ctx.stroke();
  if (hasJingles) {
    for (let i = 0; i < JINGLES; i++) {
      const a = (i / JINGLES) * Math.PI * 2 + Math.PI / JINGLES;
      ctx.beginPath();
      ctx.ellipse(p.cx + Math.cos(a) * p.rx, p.cy + Math.sin(a) * p.ry, p.rx * 0.07, p.rx * 0.045, a, 0, Math.PI * 2);
      ctx.fillStyle = C.rim;
      ctx.fill();
    }
  }
  if (p.head.edgeAt < 1) {
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(p.cx, p.cy, p.rx * p.head.edgeAt, p.ry * p.head.edgeAt, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80, 60, 40, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** The cajón's front panel: a plank of wood, the slap area along its top edge. */
function paintBox(ctx: CanvasRenderingContext2D, p: Pad): void {
  const g = ctx.createLinearGradient(p.cx - p.rx, 0, p.cx + p.rx, 0);
  g.addColorStop(0, C.wood);
  g.addColorStop(0.5, C.woodLight);
  g.addColorStop(1, C.wood);
  ctx.beginPath();
  ctx.roundRect(p.cx - p.rx, p.cy - p.ry, p.rx * 2, p.ry * 2, 6);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** A handpan's shell: one dark steel dome under all its tone fields. */
function paintShell(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w * SHELL.ofWidth, h * SHELL.ofHeight);
  const cx = w * SHELL.cxOfWidth;
  const cy = h * SHELL.cyOfHeight;
  const g = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, C.steelLight);
  g.addColorStop(1, C.steel);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * SHELL.flatten, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function paintLabels(ctx: CanvasRenderingContext2D, p: Pad): void {
  const name = (key: string) => (key.startsWith('note.') ? midiToName(Number(key.slice(5))) : t(key));
  ctx.font = `500 ${Math.max(11, Math.min(18, p.rx * 0.08 + 6))}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = p.head.look === 'steel' ? 'rgba(236, 232, 225, 0.75)' : 'rgba(70, 50, 30, 0.6)';
  ctx.fillText(name(p.head.center.label), p.cx, p.cy + 5);
  if (p.head.edgeAt >= 1) return;
  if (p.head.look === 'box') {
    ctx.fillText(name(p.head.edge.label), p.cx, p.cy - p.ry * 0.8);
    return;
  }
  ctx.fillText(name((p.head.edgeLeft ?? p.head.edge).label), p.cx - p.rx * 0.8, p.cy + 5);
  ctx.fillText(name(p.head.edge.label), p.cx + p.rx * 0.8, p.cy + 5);
}
