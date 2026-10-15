import {
  fileUriToPath,
  parentDirectory,
} from '@features/statementImport/adapters/fileStore';

jest.mock('react-native-file-access', () => ({
  Dirs: { CacheDir: '/data/cache' },
}));

describe('privateCopyPaths', () => {
  it('fileUriToPath — url-encoded file uri — decoded absolute path', () => {
    expect(fileUriToPath('file:///data/cache/abc/my%20file.bin')).toBe(
      '/data/cache/abc/my file.bin',
    );
  });

  it('parentDirectory — file path — its folder', () => {
    expect(parentDirectory('/data/cache/abc/upload.bin')).toBe(
      '/data/cache/abc',
    );
  });
});
