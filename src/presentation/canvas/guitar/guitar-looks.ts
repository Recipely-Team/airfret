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
  saz: {
    // Spruce top over a deep mulberry bowl (burst), a walnut neck, plain steel strings.
    style: 'saz', top: '#d6bd8b', topGrain: '#b79a63', burst: '#5b2a14', board: '#3a2617', boardGrain: '#24170d',
    headstock: '#3a2617', binding: '#e9dcc0', inlay: '#e8e2d2', hardware: '#cfcabf', pickguard: 'transparent',
    wound: '#d4d2cd', plain: '#dedbd5', woundCount: 0,
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
