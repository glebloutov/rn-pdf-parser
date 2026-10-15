import { useSyncExternalStore } from 'react';

import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';

/** Subscribes the UI to the persisted import — the single source of truth. */
export const useCurrentImport = () => {
  const { currentImport } = useStatementImportModule();
  const statementImport = useSyncExternalStore(
    currentImport.subscribe,
    currentImport.get,
  );

  return statementImport;
};
