import { FakeFilePicker } from '@features/statementImport/useCases/__tests__/support/FakeFilePicker';
import { FakeFileStore } from '@features/statementImport/useCases/__tests__/support/FakeFileStore';
import { FakeImportApi } from '@features/statementImport/useCases/__tests__/support/FakeImportApi';
import { InMemoryImportStore } from '@features/statementImport/useCases/__tests__/support/InMemoryImportStore';
import type { IImportApi } from '@features/statementImport/ports';
import { createStatementImportModule } from '@features/statementImport/module';
import { NoopLogger } from '@shared/logger/NoopLogger';

const FIXED_NOW = '2026-10-14T10:00:00.000Z';

export interface ITestEnvironment {
  api: FakeImportApi;
  picker: FakeFilePicker;
  store: InMemoryImportStore;
  files: FakeFileStore;
}

export const createTestEnvironment = (): ITestEnvironment => {
  const store = new InMemoryImportStore();
  const files = new FakeFileStore();
  const picker = new FakeFilePicker(files);
  const api = new FakeImportApi(() => store.get()?.phase ?? null);

  return { api, files, picker, store };
};

let idCounter = 0;

/**
 * Builds a fresh module over the same "device" (repository + storage).
 * Calling it twice simulates an app relaunch.
 */
export const launchModule = (
  environment: ITestEnvironment,
  api: IImportApi = environment.api,
) => {
  const module = createStatementImportModule({
    api,
    generateKey: () => {
      idCounter += 1;

      return `test-key-${String(idCounter).padStart(4, '0')}`;
    },
    logger: new NoopLogger(),
    now: () => FIXED_NOW,
    picker: environment.picker,
    store: environment.store,
    files: environment.files,
  });

  return module;
};
