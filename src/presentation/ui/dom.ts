/**
 * Element by id, typed. The ids come from `index.html`, which ships with the bundle,
 * so the caller states the element type it wrote there.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T is the caller's statement of the element type in index.html.
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
