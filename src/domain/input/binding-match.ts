import type { InputBinding } from '@domain/input/input-binding';
import type { PedalAction } from '@domain/input/pedal-action';
import type { PedalBindings } from '@domain/input/pedal-bindings';

/** Same physical input. */
export function sameBinding(a: InputBinding, b: InputBinding): boolean {
  return a.source === b.source && a.code === b.code;
}

/** Actions an input is bound to (one input may drive several). */
export function actionsFor(bindings: PedalBindings, input: InputBinding): PedalAction[] {
  return (Object.keys(bindings) as PedalAction[]).filter((a) => bindings[a].some((b) => sameBinding(b, input)));
}

/** Adds an input to an action, removing it from any other action so one key does one thing. */
export function assignBinding(bindings: PedalBindings, action: PedalAction, input: InputBinding): PedalBindings {
  const out = Object.fromEntries(
    (Object.keys(bindings) as PedalAction[]).map((a) => [a, bindings[a].filter((b) => !sameBinding(b, input))]),
  ) as Record<PedalAction, InputBinding[]>;
  out[action] = [...out[action], input];
  return out;
}

/** Removes one input from an action. */
export function removeBinding(bindings: PedalBindings, action: PedalAction, input: InputBinding): PedalBindings {
  return { ...bindings, [action]: bindings[action].filter((b) => !sameBinding(b, input)) };
}
