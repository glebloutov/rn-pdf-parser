import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { Platform } from 'react-native';
import { FileSystem } from 'react-native-file-access';

import {
  fileUriToPath,
  iosTemporaryDirectory,
  parentDirectory,
  PRIVATE_COPY_EXTENSION,
  privateCopiesDirectory,
} from '@features/statementImport/adapters/fileStore';
import type {
  CopyError,
  IFilePicker,
  IPickedFile,
  PickError,
} from '@features/statementImport/ports';
import { generateKey } from '@shared/ids/generateKey';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

/** Neutral on-disk name: the user's file name never ends up in our caches. */
const NEUTRAL_COPY_NAME = `upload${PRIVATE_COPY_EXTENSION}`;
const FALLBACK_DISPLAY_NAME = 'statement';
const PICKABLE_TYPES = [types.pdf, types.csv, types.plainText];

const IS_IOS = Platform.OS === 'ios';

const PRIVATE_PREFIX = '/private';

// iOS reports the same location as `/private/var/...` or `/var/...`
const withoutPrivatePrefix = (path: string) =>
  path.startsWith(`${PRIVATE_PREFIX}/`)
    ? path.slice(PRIVATE_PREFIX.length)
    : path;

const isInsideAppTemporaryDirectory = (uri: string) => {
  const temporaryDirectory = iosTemporaryDirectory();

  if (temporaryDirectory === null) {
    return false;
  }

  const path = withoutPrivatePrefix(fileUriToPath(uri));
  const isInside = path.startsWith(
    `${withoutPrivatePrefix(temporaryDirectory)}/`,
  );

  return isInside;
};

/**
 * iOS: `import` mode — the OS hands us a temporary copy in `tmp/`; the user's
 * original in Files is never touched. This matters because the library's
 * iOS `keepLocalCopy` MOVES the source file (it would remove the original in
 * `open` mode).
 * Android: `open` mode — one-time `content://` access; `keepLocalCopy`
 * streams a copy and never modifies the source.
 */
export class DocumentPickerAdapter implements IFilePicker {
  async pick(): Promise<Result<IPickedFile, PickError>> {
    try {
      const [file] = IS_IOS
        ? await pick({ mode: 'import', type: PICKABLE_TYPES })
        : await pick({ mode: 'open', type: PICKABLE_TYPES });
      const pickedFile = {
        displayName: file.name ?? FALLBACK_DISPLAY_NAME,
        reportedSizeBytes: file.size,
        sourceUri: file.uri,
      };

      return ok(pickedFile);
    } catch (error) {
      const isCancelled =
        isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;

      return err({ code: isCancelled ? 'PICK_CANCELLED' : 'PICK_FAILED' });
    }
  }

  async copyToPrivateStorage(
    file: IPickedFile,
  ): Promise<Result<string, CopyError>> {
    // Never let the iOS move-based copy touch anything but our own temp copy
    if (IS_IOS && !isInsideAppTemporaryDirectory(file.sourceUri)) {
      return err({ code: 'COPY_FAILED' });
    }

    try {
      const [copy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{ fileName: NEUTRAL_COPY_NAME, uri: file.sourceUri }],
      });

      if (copy.status !== 'success') {
        return err({ code: 'COPY_FAILED' });
      }

      const localPath = await this.moveIntoCopiesFolder(
        fileUriToPath(copy.localUri),
      );

      return ok(localPath);
    } catch {
      return err({ code: 'COPY_FAILED' });
    }
  }

  /**
   * iOS import mode leaves an OS temp copy when the file was rejected before
   * copying (e.g. reported size > 10 MiB); remove it. Only our own `tmp/` is touched.
   */
  async releaseAccess(file: IPickedFile) {
    if (!IS_IOS || !isInsideAppTemporaryDirectory(file.sourceUri)) {
      return;
    }

    const temporaryCopyPath = fileUriToPath(file.sourceUri);

    if (await FileSystem.exists(temporaryCopyPath)) {
      await FileSystem.unlink(temporaryCopyPath).catch(() => null);
    }
  }

  /** One owned folder makes cleanup and the launch sweep deterministic. */
  private async moveIntoCopiesFolder(pickerCopyPath: string) {
    const copiesDirectory = privateCopiesDirectory();

    if (!(await FileSystem.exists(copiesDirectory))) {
      await FileSystem.mkdir(copiesDirectory);
    }

    const targetPath = `${copiesDirectory}/${generateKey()}${PRIVATE_COPY_EXTENSION}`;

    await FileSystem.mv(pickerCopyPath, targetPath);
    await FileSystem.unlink(parentDirectory(pickerCopyPath)).catch(() => null);

    return targetPath;
  }
}
