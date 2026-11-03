import { describe, expect, it } from 'vitest';
import { actionsFor, assignBinding, removeBinding } from '@domain/input/binding-match';
import { DEFAULT_PEDAL_BINDINGS } from '@domain/input/default-pedal-bindings';
import { InputSource } from '@domain/input/input-source';

const space = { source: InputSource.key, code: 'Space' };
const pedal = { source: InputSource.midi, code: '40' };

describe('pedal bindings', () => {
  it('map Space to the kick by default', () => {
    expect(actionsFor(DEFAULT_PEDAL_BINDINGS, space)).toEqual(['kick']);
  });

  it('move an input to the new action when reassigned, so one input does one thing', () => {
    const b = assignBinding(DEFAULT_PEDAL_BINDINGS, 'hihatPedal', space);
    expect(actionsFor(b, space)).toEqual(['hihatPedal']);
    expect(b.kick.some((x) => x.code === 'Space')).toBe(false);
  });

  it('accept any new input, and remove it again', () => {
    const b = assignBinding(DEFAULT_PEDAL_BINDINGS, 'kick2', pedal);
    expect(actionsFor(b, pedal)).toEqual(['kick2']);
    expect(actionsFor(removeBinding(b, 'kick2', pedal), pedal)).toEqual([]);
  });
});
