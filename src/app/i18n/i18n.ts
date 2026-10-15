import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import diagnosticsEn from '@features/diagnostics/i18n/en';
import diagnosticsRu from '@features/diagnostics/i18n/ru';
import statementImportEn from '@features/statementImport/i18n/en';
import statementImportRu from '@features/statementImport/i18n/ru';
import commonEn from '@shared/i18n/en';
import commonRu from '@shared/i18n/ru';
import {
  FALLBACK_LANGUAGE,
  Language,
  SUPPORTED_LANGUAGES,
} from '@shared/i18n/supportedLanguages';

export const resources = {
  [Language.English]: {
    common: commonEn,
    diagnostics: diagnosticsEn,
    statementImport: statementImportEn,
  },
  [Language.Russian]: {
    common: commonRu,
    diagnostics: diagnosticsRu,
    statementImport: statementImportRu,
  },
};

const detectLanguage = () => {
  const deviceLanguage = getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;
  const language = SUPPORTED_LANGUAGES.includes(deviceLanguage)
    ? deviceLanguage
    : FALLBACK_LANGUAGE;

  return language;
};

i18next.use(initReactI18next).init({
  fallbackLng: FALLBACK_LANGUAGE,
  initAsync: false,
  interpolation: { escapeValue: false },
  lng: detectLanguage(),
  resources,
});

export default i18next;
