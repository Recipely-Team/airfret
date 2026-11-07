import type { HandDrumPlayer } from '@application/drums/hand-drum-player';

type Pad = HandDrumPlayer['pads'][number];
type Ripple = ReturnType<HandDrumPlayer['visibleRipples']>[number];

/** Walnut shell and hoops, hemp rope, goatskin, a leather-wrapped tokmak and a cane çubuk. */
const C = { shell: '#5e3920', shellLight: '#94603a', hoop: '#3e2414', hoopLight: '#7a4a28', rope: '#d9c7a0', skin: '#ecdcb8', skinShade: '#cdb88f', strap: '#5a2a1a', knob: '#3a2a20', knobLight: '#6a5040', handle: '#a7764a', cane: '#dcc08f' } as const;
/** The back hoop sits this far behind the front one, up and to the right (shares of the radius): a three-quarter view. */
const DEPTH = { x: 0.26, y: -0.2 } as const;
/** Rope crossings round the shell. */
const ROPES = 14;
/** A stroke's mallet reaches the head this fast and lifts back over this long, seconds. */
const SWING = { strike: 0.04, lift: 0.22 } as const;

/**
 * The davul as it hangs from a player's shoulder: its shell and back hoop seen past the front head, the rope
 * tension zig-zagging between the hoops, the goatskin head in its thick hoop — the tokmak (right hand) swinging into
 * the middle for each düm, the thin çubuk (left) tapping the rim for each tek.
 */
export function paintDavul(ctx: CanvasRenderingContext2D, p: Pad): void {
  const r = p.rx;
  const back = { x: p.cx + r * DEPTH.x, y: p.cy + r * DEPTH.y };
  const len = Math.hypot(DEPTH.x, DEPTH.y);
  const n = { x: -DEPTH.y / len, y: DEPTH.x / len };
  // The strap over the shoulder, from the top of the hoop.
  ctx.strokeStyle = C.strap;
  ctx.lineWidth = Math.max(6, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(p.cx - r * 0.55, p.cy - p.ry * 0.8);
  ctx.quadraticCurveTo(p.cx - r * 0.1, p.cy - p.ry * 1.9, back.x + r * 0.6, back.y - p.ry * 0.75);
  ctx.stroke();
  // The shell between the hoops.
  const g = ctx.createLinearGradient(p.cx - n.x * r, p.cy - n.y * r, p.cx + n.x * r, p.cy + n.y * r);
  g.addColorStop(0, C.shell);
  g.addColorStop(0.5, C.shellLight);
  g.addColorStop(1, C.shell);
  ctx.beginPath();
  ctx.ellipse(back.x, back.y, r, p.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.shell;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p.cx + n.x * r, p.cy + n.y * p.ry);
  ctx.lineTo(back.x + n.x * r, back.y + n.y * p.ry);
  ctx.lineTo(back.x - n.x * r, back.y - n.y * p.ry);
  ctx.lineTo(p.cx - n.x * r, p.cy - n.y * p.ry);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ring(ctx, back.x, back.y, r, p.ry, C.hoop, Math.max(5, r * 0.06));
  // The rope, front hoop to back hoop and back, on the side of the shell that shows.
  ctx.strokeStyle = C.rope;
  ctx.lineWidth = Math.max(1.5, r * 0.012);
  ctx.beginPath();
  for (let i = 0; i < ROPES; i++) {
    const a = (i / ROPES) * Math.PI * 2;
    const b = a + Math.PI / ROPES;
    if (Math.cos(a) * DEPTH.x + Math.sin(a) * DEPTH.y <= 0) continue;
    ctx.moveTo(p.cx + Math.cos(a) * r, p.cy + Math.sin(a) * p.ry);
    ctx.lineTo(back.x + Math.cos(b) * r, back.y + Math.sin(b) * p.ry);
    ctx.lineTo(p.cx + Math.cos(b + Math.PI / ROPES) * r, p.cy + Math.sin(b + Math.PI / ROPES) * p.ry);
  }
  ctx.stroke();
  // The front head in its hoop.
  const skin = ctx.createRadialGradient(p.cx - r * 0.25, p.cy - p.ry * 0.3, r * 0.1, p.cx, p.cy, r);
  skin.addColorStop(0, C.skin);
  skin.addColorStop(1, C.skinShade);
  ctx.beginPath();
  ctx.ellipse(p.cx, p.cy, r, p.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ring(ctx, p.cx, p.cy, r, p.ry, C.hoop, Math.max(8, r * 0.09));
  ring(ctx, p.cx, p.cy, r * 1.02, p.ry * 1.02, C.hoopLight, Math.max(1.5, r * 0.015));
  ctx.setLineDash([4, 6]);
  ring(ctx, p.cx, p.cy, r * p.head.edgeAt, p.ry * p.head.edgeAt, 'rgba(80, 60, 40, 0.25)', 1);
  ctx.setLineDash([]);
}

/** The tokmak and çubuk, drawn over the head: each at rest beside it, or striking where its last stroke landed. */
export function paintDavulMallets(ctx: CanvasRenderingContext2D, p: Pad, ripples: readonly Ripple[], now: number): void {
  const r = p.rx;
  const last = (isCentre: boolean) => [...ripples].reverse().find((x) => (x.stroke === p.head.center) === isCentre);
  const reach = (hit: Ripple | undefined) => {
    if (!hit) return 0;
    const age = now - hit.at;
    return age < SWING.strike ? age / SWING.strike : Math.max(0, 1 - (age - SWING.strike) / SWING.lift);
  };
  const doum = last(true);
  const tek = last(false);
  // The tokmak: a heavy, curved wooden handle with a leather-wrapped head.
  const tokmak = mix({ x: p.cx + r * 1.08, y: p.cy - p.ry * 0.25 }, { x: doum?.x ?? p.cx, y: doum?.y ?? p.cy }, reach(doum));
  const grip = { x: p.cx + r * 1.5, y: p.cy + p.ry * 0.95 };
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = Math.max(4, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(grip.x, grip.y);
  ctx.quadraticCurveTo(grip.x - r * 0.05, tokmak.y + p.ry * 0.2, tokmak.x, tokmak.y);
  ctx.stroke();
  const knob = ctx.createRadialGradient(tokmak.x - r * 0.04, tokmak.y - r * 0.04, 1, tokmak.x, tokmak.y, r * 0.14);
  knob.addColorStop(0, C.knobLight);
  knob.addColorStop(1, C.knob);
  ctx.beginPath();
  ctx.ellipse(tokmak.x, tokmak.y, r * 0.14, r * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = knob;
  ctx.fill();
  // The çubuk: a thin cane switch.
  const tip = mix({ x: p.cx - r * 1.05, y: p.cy - p.ry * 0.45 }, { x: tek?.x ?? p.cx - r * 0.8, y: tek?.y ?? p.cy }, reach(tek));
  ctx.strokeStyle = C.cane;
  ctx.lineWidth = Math.max(2, r * 0.018);
  ctx.beginPath();
  ctx.moveTo(p.cx - r * 1.55, p.cy + p.ry * 0.9);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, colour: string, width: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.stroke();
}

function mix(a: { x: number; y: number }, b: { x: number; y: number }, k: number): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}
