export const LANGUAGES = {
  EN: 'EN',
  RU: 'RU'
} as const;

export type LanguageValue = (typeof LANGUAGES)[keyof typeof LANGUAGES];
