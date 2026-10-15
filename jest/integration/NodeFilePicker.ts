import { copyFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import type {
  CopyError,
  IFilePicker,
  IPickedFile,
  PickError,
} from '@features/statementImport/ports';
import { ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

/** "Picks" a real fixture file and copies it into the private copies directory. */
export class NodeFilePicker implements IFilePicker {
  private nextPath = '';

  private copyIndex = 0;

  constructor(private readonly copiesDirectory: string) {}

  willPick(absolutePath: string) {
    this.nextPath = absolutePath;
  }

  async pick(): Promise<Result<IPickedFile, PickError>> {
    const pickedFile = {
      displayName: basename(this.nextPath),
      reportedSizeBytes: statSync(this.nextPath).size,
      sourceUri: `file://${this.nextPath}`,
    };

    return ok(pickedFile);
  }

  async copyToPrivateStorage(): Promise<Result<string, CopyError>> {
    this.copyIndex += 1;

    const localPath = join(this.copiesDirectory, `copy-${this.copyIndex}.bin`);

    copyFileSync(this.nextPath, localPath);

    return ok(localPath);
  }

  async releaseAccess() {}
}
