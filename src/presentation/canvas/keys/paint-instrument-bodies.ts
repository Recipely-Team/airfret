/** Where an instrument is drawn: its note row's left and right, top and bottom on screen. */
export interface BodyBox {
  readonly x0: number;
  readonly x1: number;
  readonly top: number;
  readonly bottom: number;
}

/** Natural materials, as the guitars are: walnut, spruce, reed, bone, nickel silver, lacquered brass. */
const WOOD = { frame: '#4a2f1b', frameLight: '#6b4527', board: '#d8bd8a', boardShade: '#bf9c63', skin: '#efe3c8', bridge: '#3a2414', mandal: '#c9a24a' } as const;
const REED = { light: '#e4c890', mid: '#c19a5c', dark: '#8a6a3c', node: 'rgba(90, 62, 30, 0.55)', bone: '#efe7d6', ring: '#b8963e' } as const;
const TUBES = {
  reed: { light: '#3a332e', mid: '#1f1a17', dark: '#0e0b0a', key: '#cfd2d6' },
  flute: { light: '#f2f3f5', mid: '#c9ccd1', dark: '#8d9198', key: '#e8e9ec' },
  brass: { light: '#f0cf7a', mid: '#cf9f45', dark: '#8e6524', key: '#f3d995' },
} as const;
const KEMENCE = { body: '#5a2e17', bodyLight: '#8a4a26', neck: '#2a170d', top: '#c79b62', string: '#e9e0cc' } as const;

/** The kanun: a trapezoid walnut frame, a spruce top, a row of brass mandals, the skin and bridge at its foot. */
export function paintKanun(ctx: CanvasRenderingContext2D, b: BodyBox): void {
  const h = b.bottom - b.top;
  const pad = h * 0.12;
  ctx.beginPath();
  // The slanted side on the left, as a kanun's short strings end there.
  ctx.moveTo(b.x0 + h * 0.3, b.top - pad * 1.6);
  ctx.lineTo(b.x1 + pad * 0.5, b.top - pad * 1.6);
  ctx.lineTo(b.x1 + pad * 0.5, b.bottom + pad * 1.4);
  ctx.lineTo(b.x0 - pad, b.bottom + pad * 1.4);
  ctx.closePath();
  const frame = ctx.createLinearGradient(0, b.top - pad, 0, b.bottom + pad);
  frame.addColorStop(0, WOOD.frameLight);
  frame.addColorStop(1, WOOD.frame);
  ctx.fillStyle = frame;
  ctx.fill();
  const top = ctx.createLinearGradient(0, b.top, 0, b.bottom);
  top.addColorStop(0, WOOD.board);
  top.addColorStop(1, WOOD.boardShade);
  ctx.fillStyle = top;
  ctx.fillRect(b.x0 - pad * 0.2, b.top - pad * 0.9, b.x1 - b.x0 + pad * 0.4, h + pad * 1.6);
  // The skin under the bridge, at the strings' foot.
  ctx.fillStyle = WOOD.skin;
  ctx.fillRect(b.x0 - pad * 0.2, b.bottom - h * 0.2, b.x1 - b.x0 + pad * 0.4, h * 0.2 + pad * 0.7);
  ctx.fillStyle = WOOD.bridge;
  ctx.fillRect(b.x0 - pad * 0.2, b.bottom - h * 0.12, b.x1 - b.x0 + pad * 0.4, 3);
  // Two rosettes in the top, as on a real kanun.
  for (const fx of [0.18, 0.62]) {
    ctx.beginPath();
    ctx.arc(b.x0 + (b.x1 - b.x0) * fx, b.top + h * 0.42, h * 0.1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(74, 47, 27, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** The kanun's courses: three strings for each note, a mandal above; a sounding course glows. */
export function paintKanunStrings(ctx: CanvasRenderingContext2D, x: number, b: BodyBox, colW: number, isLit: boolean, accent: string): void {
  const h = b.bottom - b.top;
  ctx.fillStyle = WOOD.mandal;
  ctx.fillRect(x - colW * 0.18, b.top - h * 0.09, colW * 0.36, h * 0.05);
  const gap = Math.min(2.4, colW * 0.12);
  ctx.strokeStyle = isLit ? accent : 'rgba(250, 244, 230, 0.9)';
  ctx.lineWidth = isLit ? 1.8 : 1;
  ctx.shadowColor = accent;
  ctx.shadowBlur = isLit ? 10 : 0;
  for (const dx of [-gap, 0, gap]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, b.top - h * 0.03);
    ctx.lineTo(x + dx, b.bottom - h * 0.12);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

/** A ney: a length of reed with its nodes, a bone mouthpiece (baspare) and brass rings, six holes in front. */
export function paintNey(ctx: CanvasRenderingContext2D, b: BodyBox): number {
  const cy = (b.top + b.bottom) / 2;
  const th = Math.min((b.bottom - b.top) * 0.3, 44);
  tube(ctx, b.x0, b.x1, cy, th, REED);
  const len = b.x1 - b.x0;
  for (let i = 1; i < 9; i++) {
    ctx.fillStyle = REED.node;
    ctx.fillRect(b.x0 + (len * i) / 9 - 2, cy - th / 2, 4, th);
  }
  ctx.fillStyle = REED.bone;
  roundRect(ctx, b.x0 - th * 0.9, cy - th * 0.42, th * 0.9, th * 0.84, th * 0.2);
  ctx.fill();
  ctx.fillStyle = REED.ring;
  for (const x of [b.x0, b.x1 - 6]) ctx.fillRect(x, cy - th / 2 - 1, 6, th + 2);
  holes(ctx, b, cy, th, [0.56, 0.62, 0.68, 0.76, 0.82, 0.88], 'rgba(40, 24, 10, 0.85)');
  return cy;
}

/** A clarinet, oboe or bassoon (black wood), a flute (silver) or a brass tube with valves and a bell. */
export function paintWindBody(ctx: CanvasRenderingContext2D, b: BodyBox, kind: 'reed' | 'flute' | 'brass'): number {
  const cy = (b.top + b.bottom) / 2;
  const th = Math.min((b.bottom - b.top) * (kind === 'flute' ? 0.2 : 0.26), 40);
  const c = TUBES[kind];
  if (kind === 'brass') {
    // The bell flares at the far end; three valve casings stand on the tube.
    ctx.beginPath();
    ctx.moveTo(b.x1 - th * 3, cy - th / 2);
    ctx.quadraticCurveTo(b.x1 - th * 0.4, cy - th * 0.6, b.x1 + th * 0.6, cy - th * 2);
    ctx.lineTo(b.x1 + th * 0.6, cy + th * 2);
    ctx.quadraticCurveTo(b.x1 - th * 0.4, cy + th * 0.6, b.x1 - th * 3, cy + th / 2);
    ctx.closePath();
    ctx.fillStyle = gradient(ctx, cy - th * 2, cy + th * 2, c);
    ctx.fill();
  }
  tube(ctx, b.x0, b.x1 - (kind === 'brass' ? th * 2 : 0), cy, th, c);
  if (kind === 'brass') {
    for (const f of [0.38, 0.45, 0.52]) {
      const x = b.x0 + (b.x1 - b.x0) * f;
      ctx.fillStyle = gradient(ctx, cy - th * 1.6, cy, c);
      ctx.fillRect(x - th * 0.22, cy - th * 1.5, th * 0.44, th);
      ctx.fillStyle = c.key;
      ctx.fillRect(x - th * 0.3, cy - th * 1.65, th * 0.6, th * 0.18);
    }
    return cy;
  }
  ctx.fillStyle = kind === 'flute' ? '#b9bdc3' : '#111';
  roundRect(ctx, b.x0 - th * 1.4, cy - th * 0.4, th * 1.4, th * 0.8, th * 0.3);
  ctx.fill();
  holes(ctx, b, cy, th, [0.3, 0.37, 0.44, 0.56, 0.63, 0.7, 0.8], kind === 'flute' ? 'rgba(60, 64, 70, 0.9)' : 'rgba(0, 0, 0, 0.9)', c.key);
  return cy;
}

/** A kemençe on its side: a dark neck under three strings, the pear-shaped body and bridge, a bow across. */
export function paintKemence(ctx: CanvasRenderingContext2D, b: BodyBox): number[] {
  const h = b.bottom - b.top;
  const cy = (b.top + b.bottom) / 2;
  const bodyX = b.x0 + (b.x1 - b.x0) * 0.78;
  ctx.fillStyle = KEMENCE.neck;
  roundRect(ctx, b.x0 - 14, cy - h * 0.13, bodyX - b.x0 + 14, h * 0.26, 6);
  ctx.fill();
  const bw = (b.x1 - b.x0) * 0.26;
  const body = ctx.createRadialGradient(bodyX + bw * 0.45, cy - h * 0.1, 4, bodyX + bw * 0.5, cy, bw * 0.7);
  body.addColorStop(0, KEMENCE.bodyLight);
  body.addColorStop(1, KEMENCE.body);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(bodyX + bw * 0.5, cy, bw * 0.55, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KEMENCE.top;
  ctx.beginPath();
  ctx.ellipse(bodyX + bw * 0.55, cy, bw * 0.4, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KEMENCE.neck;
  ctx.fillRect(bodyX + bw * 0.62, cy - h * 0.16, 4, h * 0.32);
  const ys = [cy - h * 0.07, cy, cy + h * 0.07];
  ctx.strokeStyle = KEMENCE.string;
  ctx.lineWidth = 1.2;
  for (const y of ys) {
    ctx.beginPath();
    ctx.moveTo(b.x0 - 10, y);
    ctx.lineTo(bodyX + bw * 0.62, y);
    ctx.stroke();
  }
  // The bow, resting across the strings near the bridge.
  ctx.strokeStyle = 'rgba(236, 228, 210, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX + bw * 0.3, b.top - h * 0.05);
  ctx.lineTo(bodyX + bw * 0.42, b.bottom + h * 0.05);
  ctx.stroke();
  return ys;
}

function tube(ctx: CanvasRenderingContext2D, x0: number, x1: number, cy: number, th: number, c: { light: string; mid: string; dark: string }): void {
  ctx.fillStyle = gradient(ctx, cy - th / 2, cy + th / 2, c);
  roundRect(ctx, x0, cy - th / 2, x1 - x0, th, th * 0.45);
  ctx.fill();
}

function holes(ctx: CanvasRenderingContext2D, b: BodyBox, cy: number, th: number, at: readonly number[], fill: string, rim?: string): void {
  for (const f of at) {
    const x = b.x0 + (b.x1 - b.x0) * f;
    if (rim) {
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(x, cy, th * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, cy, th * 0.16, th * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gradient(ctx: CanvasRenderingContext2D, y0: number, y1: number, c: { light: string; mid: string; dark: string }): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c.light);
  g.addColorStop(0.45, c.mid);
  g.addColorStop(1, c.dark);
  return g;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
