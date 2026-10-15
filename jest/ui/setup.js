require('react-native-unistyles/mocks');
require('@app/theme/init');

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-localize', () => require('react-native-localize/mock'));

// Native modules that UI tests never reach (the feature runs on fakes), mocked defensively
jest.mock('react-native-file-access', () => ({
  Dirs: { CacheDir: '/cache' },
  FileSystem: {},
}));
jest.mock('@react-native-documents/picker', () => ({}));
jest.mock('react-native-keychain', () => ({}));
jest.mock('react-native-mmkv', () => ({ createMMKV: () => new Map() }));

require('@app/i18n/i18n').default.changeLanguage('en');
