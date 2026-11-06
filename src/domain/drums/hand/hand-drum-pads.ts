import type { HandDrum } from '@domain/drums/hand/hand-drum';
import type { HandDrumHead } from '@domain/drums/hand/hand-drum-head';
import type { HandStroke } from '@domain/drums/hand/hand-stroke';

/** A head's radius is `size` of the width, but never more than this times `size` of the height. */
const HEIGHT_PER_WIDTH = 1.385;
/** A handpan's shell: centred here, its radius a share of the width or (if smaller) the height; seen at this flattening. */
export const SHELL = { cxOfWidth: 0.5, cyOfHeight: 0.6, ofWidth: 0.3, ofHeight: 0.42, flatten: 0.62 } as const;

/** A head on screen, named for the hit detector ("h0", "h1"…). */
interface HeadPad {
  readonly piece: string;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly head: HandDrumHead;
}

/** Every head of the drum as an ellipse on a w×h screen. */
export function headPads(drum: HandDrum, w: number, h: number): HeadPad[] {
  const shell = Math.min(w * SHELL.ofWidth, h * SHELL.ofHeight);
  return drum.heads.map((head, i) => {
    if (head.ring) {
      const a = (head.ring.angle * Math.PI) / 180;
      const rx = shell * head.size;
      const cx = w * SHELL.cxOfWidth + Math.cos(a) * head.ring.radius * shell;
      const cy = h * SHELL.cyOfHeight + Math.sin(a) * head.ring.radius * shell * SHELL.flatten;
      return { piece: `h${i}`, cx, cy, rx, ry: rx * head.flatten, head };
    }
    const rx = Math.min(w * head.size, h * head.size * HEIGHT_PER_WIDTH);
    return { piece: `h${i}`, cx: w * head.cxOfWidth, cy: h * head.cyOfHeight, rx, ry: rx * head.flatten, head };
  });
}

/** The stroke a strike makes: the head's centre stroke inside `edgeAt`, its edge stroke for that hand outside. */
export function strokeAt(head: HandDrumHead, radius: number, isRightHand: boolean): HandStroke {
  if (radius < head.edgeAt) return head.center;
  return isRightHand ? head.edge : (head.edgeLeft ?? head.edge);
}
