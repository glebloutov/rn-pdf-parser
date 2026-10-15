import type {
  CopyError,
  IFilePicker,
  IPickedFile,
  PickError,
} from '@features/statementImport/ports';
import type { FakeFileStore } from '@features/statementImport/useCases/__tests__/support/FakeFileStore';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

interface IPickScenario {
  bytes: Uint8Array;
  displayName: string;
  reportedSizeBytes?: number | null;
}

export class FakeFilePicker implements IFilePicker {
  copies = 0;

  released: string[] = [];

  private next: IPickScenario | 'cancel' = 'cancel';

  private copyIndex = 0;

  constructor(private readonly files: FakeFileStore) {}

  willPick(scenario: IPickScenario) {
    this.next = scenario;
  }

  willCancel() {
    this.next = 'cancel';
  }

  async pick(): Promise<Result<IPickedFile, PickError>> {
    if (this.next === 'cancel') {
      return err({ code: 'PICK_CANCELLED' });
    }

    const pickedFile = {
      displayName: this.next.displayName,
      reportedSizeBytes: this.next.reportedSizeBytes ?? this.next.bytes.length,
      sourceUri: `content://fake/${this.next.displayName}`,
    };

    return ok(pickedFile);
  }

  async copyToPrivateStorage(): Promise<Result<string, CopyError>> {
    if (this.next === 'cancel') {
      return err({ code: 'COPY_FAILED' });
    }

    this.copyIndex += 1;
    this.copies += 1;

    const localPath = `/private/statement-import/copy-${this.copyIndex}.bin`;

    this.files.files.set(localPath, this.next.bytes);

    return ok(localPath);
  }

  async releaseAccess(file: IPickedFile) {
    this.released.push(file.sourceUri);
  }
}
