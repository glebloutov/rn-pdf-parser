export enum Language {
  English = 'en',
  Russian = 'ru',
}

export const FALLBACK_LANGUAGE = Language.English;

export const SUPPORTED_LANGUAGES: ReadonlyArray<string> = [
  Language.English,
  Language.Russian,
];
