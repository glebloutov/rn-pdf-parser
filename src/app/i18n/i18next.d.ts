import 'i18next';

import type { resources } from '@app/i18n/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
  }
}
