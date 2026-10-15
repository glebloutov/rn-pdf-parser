module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Must run before module-resolver: replaces `@env` imports with values from .env
    [
      'module:react-native-dotenv',
      {
        allowUndefined: true,
        moduleName: '@env',
        path: '.env',
        safe: false,
      },
    ],
    // zod 4 ships `export * as ns from` syntax, which the RN preset doesn't transform
    '@babel/plugin-transform-export-namespace-from',
    ['react-native-unistyles/plugin', { root: 'src' }],
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@app': './src/app',
          '@shared': './src/shared',
          '@features': './src/features',
          '@test-support': './jest',
        },
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.js',
          '.json',
        ],
      },
    ],
  ],
};
