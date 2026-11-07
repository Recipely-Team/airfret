/** Where the app is: one page per instrument, plus home, lessons, the Explore guide and the band. */
export type Route =
  | { readonly kind: 'home' }
  | { readonly kind: 'instrument'; readonly instrument: string }
  | { readonly kind: 'lessons' }
  | { readonly kind: 'lesson'; readonly songId: string }
  | { readonly kind: 'explore' }
  | { readonly kind: 'band' };
