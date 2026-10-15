import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { InMemoryImportStore } from '@features/statementImport/useCases/__tests__/support/InMemoryImportStore';
import { createStatementImportModule } from '@features/statementImport/module';
import { HttpImportApi } from '@features/statementImport/adapters/importApi';
import { NoopLogger } from '@shared/logger/NoopLogger';

import { NodeFilePicker } from './NodeFilePicker';
import { NodeFileStore } from './NodeFileStore';

let keyCounter = 0;

export interface IIntegrationDevice {
  copiesDirectory: string;
  picker: NodeFilePicker;
  store: InMemoryImportStore;
  files: NodeFileStore;
}

/** One simulated device: storage + persisted state survive "relaunches". */
export const createDevice = (): IIntegrationDevice => {
  const copiesDirectory = mkdtempSync(join(tmpdir(), 'rn-pdf-parser-copies-'));

  return {
    copiesDirectory,
    picker: new NodeFilePicker(copiesDirectory),
    store: new InMemoryImportStore(),
    files: new NodeFileStore(copiesDirectory),
  };
};

/** Fresh module (= app process) on the same device, talking HTTP to the real mock. */
export const launchApp = (device: IIntegrationDevice, baseUrl: string) => {
  const module = createStatementImportModule({
    api: new HttpImportApi(baseUrl),
    generateKey: () => {
      keyCounter += 1;

      return `integration-key-${Date.now()}-${keyCounter}`;
    },
    logger: new NoopLogger(),
    now: () => new Date().toISOString(),
    picker: device.picker,
    store: device.store,
    files: device.files,
  });

  return module;
};
