/** Supported UI languages. */
export const Language = {
  en: 'en',
  tr: 'tr',
} as const;

export type Language = (typeof Language)[keyof typeof Language];
