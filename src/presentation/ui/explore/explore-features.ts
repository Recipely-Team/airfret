/**
 * Every feature the Explore guide presents, in learning order. Each has copy under
 * `explore.<id>.{title,text,s1,s2,s3}` and a "try it" action the app knows how to set up.
 */
export const EXPLORE_FEATURES: readonly { readonly id: string; readonly tag: string; readonly steps: number }[] = [
  { id: 'tour', tag: 'start', steps: 2 },
  { id: 'chords', tag: 'guitar', steps: 3 },
  { id: 'tone', tag: 'guitar', steps: 3 },
  { id: 'nail', tag: 'guitar', steps: 3 },
  { id: 'mute', tag: 'guitar', steps: 2 },
  { id: 'free', tag: 'pro', steps: 3 },
  { id: 'bends', tag: 'pro', steps: 3 },
  { id: 'capo', tag: 'pro', steps: 2 },
  { id: 'instruments', tag: 'sound', steps: 2 },
  { id: 'bass', tag: 'sound', steps: 2 },
  { id: 'drums', tag: 'drums', steps: 3 },
  { id: 'pedals', tag: 'drums', steps: 3 },
  { id: 'course', tag: 'learn', steps: 3 },
  { id: 'shadow', tag: 'learn', steps: 3 },
  { id: 'nocamera', tag: 'tips', steps: 2 },
  { id: 'settings', tag: 'tips', steps: 3 },
];
