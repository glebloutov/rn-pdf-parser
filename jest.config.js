const TRANSFORMED_NODE_MODULES = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  '@react-navigation',
  '@react-native-documents',
  'react-native-unistyles',
  'react-native-nitro-modules',
  'react-native-mmkv',
  'react-native-file-access',
  'react-native-keychain',
  'react-native-localize',
  'react-native-get-random-values',
  'uuid',
].join('|');

const transformIgnorePatterns = [
  `node_modules/(?!(${TRANSFORMED_NODE_MODULES})/)`,
];

module.exports = {
  testTimeout: 20000,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.unit.test.ts'],
      transformIgnorePatterns,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
      transformIgnorePatterns,
    },
    {
      displayName: 'ui',
      preset: '@react-native/jest-preset',
      testMatch: ['<rootDir>/src/**/*.ui.test.tsx'],
      setupFiles: ['<rootDir>/jest/ui/setup.js'],
      transformIgnorePatterns,
    },
  ],
};
