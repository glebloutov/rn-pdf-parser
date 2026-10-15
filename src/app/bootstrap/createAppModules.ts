import type { IDiagnosticsModule } from '@features/diagnostics/ui/DiagnosticsContext';
import { HttpMockControlClient } from '@features/diagnostics/adapters/HttpMockControlClient';
import { DocumentPickerAdapter } from '@features/statementImport/adapters/filePicker';
import { FileAccessStorage } from '@features/statementImport/adapters/fileStore';
import { HttpImportApi } from '@features/statementImport/adapters/importApi';
import {
  getOrCreateStorageEncryptionKey,
  MmkvImportStore,
} from '@features/statementImport/adapters/importStore';
import { createStatementImportModule } from '@features/statementImport/module';
import type { StatementImportModule } from '@features/statementImport/module';
import { API_BASE_URL } from '@shared/config/apiConfig';
import { generateKey } from '@shared/ids/generateKey';
import { ConsoleLogger } from '@shared/logger/ConsoleLogger';

export interface IAppModules {
  diagnostics: IDiagnosticsModule;
  statementImport: StatementImportModule;
}

/**
 * App-level composition root: wires the real device adapters into the
 * feature modules. Async because the storage key comes from the Keychain.
 * Logs are emitted in dev builds only.
 */
export const createAppModules = async (): Promise<IAppModules> => {
  const encryptionKey = await getOrCreateStorageEncryptionKey();

  const statementImport = createStatementImportModule({
    api: new HttpImportApi(API_BASE_URL),
    files: new FileAccessStorage(),
    generateKey,
    logger: new ConsoleLogger(__DEV__),
    now: () => new Date().toISOString(),
    picker: new DocumentPickerAdapter(),
    store: new MmkvImportStore(encryptionKey),
  });
  const diagnostics = {
    baseUrl: API_BASE_URL,
    mockControl: new HttpMockControlClient(API_BASE_URL),
  };

  return { diagnostics, statementImport };
};
