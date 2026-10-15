module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['mock-server/', 'docs/', 'coverage/'],
  rules: {
    curly: ['error', 'all'],
  },
  overrides: [
    {
      env: { jest: true },
      files: [
        'jest/**/*.js',
        'jest/**/*.ts',
        'jest/**/*.tsx',
        '**/__tests__/**',
      ],
    },
  ],
};
