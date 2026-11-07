import { ChainKind } from '@domain/instruments/chain-kind';
import type { GuitarLook } from '@presentation/canvas/guitar/guitar-look';

const ACOUSTIC: GuitarLook = {
  style: 'acoustic', top: '#d9b882', topGrain: '#b48a52', burst: '#4a2c17', board: '#2f1d14', boardGrain: '#1d110b',
  headstock: '#21140e', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: '#3a2015',
  wound: '#c9a46c', plain: '#dedbd5', woundCount: 4,
};

/**
 * Natural materials only — spruce, cedar, rosewood, maple, black lacquer, nickel, bone. The piano has its own
 * drawing (`paintKeyboard`); its entry here only completes the table.
 */
const LOOKS: Readonly<Record<ChainKind, GuitarLook>> = {
  acoustic: ACOUSTIC,
  piano: ACOUSTIC,
  harpsichord: ACOUSTIC,
  ukulele: {
    // Koa top and sides, rosewood board, nylon strings.
    style: 'ukulele', top: '#b9793f', topGrain: '#93592a', burst: '#4a2612', board: '#2a1a12', boardGrain: '#180e09',
    headstock: '#2a1a12', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: 'transparent',
    wound: '#e7e2d6', plain: '#ece7dc', woundCount: 0,
  },
  mandolin: {
    // Sunburst spruce top, ebony board, steel strings, the lowest two wound.
    style: 'mandolin', top: '#c89a5a', topGrain: '#a87a40', burst: '#2b140a', board: '#1c1410', boardGrain: '#0f0a07',
    headstock: '#1c1410', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: '#2a1a12',
    wound: '#c9a46c', plain: '#dedbd5', woundCount: 2,
  },
  balalaika: {
    // Pale spruce triangle with a darker edge, plain steel and gut-coloured strings.
    style: 'balalaika', top: '#e2c995', topGrain: '#c6a96d', burst: '#6b3a1c', board: '#2a1a12', boardGrain: '#180e09',
    headstock: '#2a1a12', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: '#5a2a14',
    wound: '#d4d2cd', plain: '#dedbd5', woundCount: 0,
  },
  bouzouki: {
    // Spruce top over a round staved back, rosewood board, steel courses.
    style: 'bouzouki', top: '#d4b27a', topGrain: '#b38c50', burst: '#3d1f10', board: '#2f1d14', boardGrain: '#1d110b',
    headstock: '#2f1d14', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: '#3a2015',
    wound: '#c9a46c', plain: '#dedbd5', woundCount: 2,
  },
  saz: {
    // Spruce top over a deep mulberry bowl (burst), a walnut neck, plain steel strings.
    style: 'saz', top: '#d6bd8b', topGrain: '#b79a63', burst: '#5b2a14', board: '#3a2617', boardGrain: '#24170d',
    headstock: '#3a2617', binding: '#e9dcc0', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: 'transparent',
    wound: '#d4d2cd', plain: '#dedbd5', woundCount: 0,
  },
  kopuz: {
    // A pale goatskin top over a carved walnut bowl, a short dark neck, gut-coloured strings.
    style: 'saz', top: '#e3cfa6', topGrain: '#cdb486', burst: '#4a2412', board: '#2e1c11', boardGrain: '#1c110a',
    headstock: '#2e1c11', binding: '#d9c7a2', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: 'transparent',
    wound: '#e2d6bd', plain: '#e8dcc4', woundCount: 0,
  },
  nylon: {
    style: 'classical', top: '#b9804d', topGrain: '#8f5a31', burst: '#3b2112', board: '#2a1a12', boardGrain: '#180e09',
    headstock: '#2a1a12', binding: '#e9dcc0', inlay: '#2a1a12', hardware: '#c9b98f', pickguard: 'transparent',
    wound: '#d4d2cc', plain: '#ece4d2', woundCount: 3,
  },
  clean: {
    style: 'electric', top: '#17171a', topGrain: '#232327', burst: '#050506', board: '#2f1d14', boardGrain: '#1d110b',
    headstock: '#141416', binding: '#d9d5cc', inlay: '#e8e2d2', hardware: '#c7c7c9', pickguard: '#0d0d0f',
    wound: '#c9c9cb', plain: '#dcdcde', woundCount: 3,
  },
  drive: {
    style: 'electric', top: '#3a1714', topGrain: '#2a0f0d', burst: '#0b0303', board: '#241610', boardGrain: '#140b07',
    headstock: '#141416', binding: '#d9d5cc', inlay: '#e8e2d2', hardware: '#c7c7c9', pickguard: '#0d0d0f',
    wound: '#c9c9cb', plain: '#dcdcde', woundCount: 3,
  },
  bass: {
    style: 'bass', top: '#1a1a1d', topGrain: '#26262a', burst: '#050506', board: '#d8b98c', boardGrain: '#b8925e',
    headstock: '#1a1a1d', binding: '#d9d5cc', inlay: '#1c1c1c', hardware: '#c7c7c9', pickguard: '#232326',
    wound: '#bdbdc0', plain: '#bdbdc0', woundCount: 4,
  },
  banjo: {
    // Calfskin-toned head (top), mahogany resonator (burst), nickel rim and brackets (hardware).
    style: 'banjo', top: '#e6dcc3', topGrain: '#d3c6a7', burst: '#3a1f12', board: '#2a1a12', boardGrain: '#180e09',
    headstock: '#2a1a12', binding: '#efe4cc', inlay: '#e8e2d2', hardware: '#cfcfd1', pickguard: 'transparent',
    wound: '#c9c9cb', plain: '#dcdcde', woundCount: 3,
  },
};

export function lookFor(chain: ChainKind): GuitarLook {
  return LOOKS[chain];
}
