import { Dirs, FileSystem } from 'react-native-file-access';

import type { IFileStore } from '@features/statementImport/ports';
import { base64ToBytes } from '@shared/encoding/base64';

// ---- Paths ----
export const PRIVATE_COPIES_FOLDER = 'statement-import';
export const PRIVATE_COPY_EXTENSION = '.bin';
export const FILE_URI_PREFIX = 'file://';

const IOS_CACHES_SUFFIX = '/Library/Caches';
const IOS_TMP_SUFFIX = '/tmp';

export const privateCopiesDirectory = () =>
  `${Dirs.CacheDir}/${PRIVATE_COPIES_FOLDER}`;

/** iOS app container `tmp/` (where the OS puts `*-Inbox` import copies); null on Android. */
export const iosTemporaryDirectory = () => {
  if (!Dirs.CacheDir.endsWith(IOS_CACHES_SUFFIX)) {
    return null;
  }

  const containerPath = Dirs.CacheDir.slice(0, -IOS_CACHES_SUFFIX.length);

  return `${containerPath}${IOS_TMP_SUFFIX}`;
};

export const fileUriToPath = (uri: string) => {
  const encodedPath = uri.startsWith(FILE_URI_PREFIX)
    ? uri.slice(FILE_URI_PREFIX.length)
    : uri;
  const path = decodeURIComponent(encodedPath);

  return path;
};

export const parentDirectory = (path: string) =>
  path.slice(0, path.lastIndexOf('/'));

// ---- File system adapter ----
const BASE64 = 'base64';

export class FileAccessStorage implements IFileStore {
  exists(path: string) {
    return FileSystem.exists(path);
  }

  /**
   * Files in our own copies folder only. The picker's staging folder and the
   * iOS temp (Inbox) copy are removed by DocumentPickerAdapter right away.
   */
  async listPrivateCopies() {
    const directory = privateCopiesDirectory();

    if (!(await FileSystem.exists(directory))) {
      return [];
    }

    const names = await FileSystem.ls(directory);
    const copies = names.map(name => `${directory}/${name}`);

    return copies;
  }

  async readAll(path: string) {
    const base64 = await FileSystem.readFile(path, BASE64);

    return base64ToBytes(base64);
  }

  async readHead(path: string, length: number) {
    const base64 = await FileSystem.readFileChunk(path, 0, length, BASE64);

    return base64ToBytes(base64);
  }

  async remove(path: string) {
    if (await FileSystem.exists(path)) {
      await FileSystem.unlink(path);
    }
  }

  async size(path: string) {
    const stat = await FileSystem.stat(path);

    return stat.size;
  }
}
