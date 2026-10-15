import { useSyncExternalStore } from 'react';

import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';

/** Outdated server answers ignored for the current job (stale_status evidence). */
export const useOutdatedResponses = () => {
  const { outdatedResponses } = useStatementImportModule();
  const outdated = useSyncExternalStore(
    outdatedResponses.subscribe,
    outdatedResponses.get,
  );

  return outdated;
};
