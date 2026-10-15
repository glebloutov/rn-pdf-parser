import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { StatementImportModule } from '@features/statementImport/module';

const StatementImportContext = createContext<StatementImportModule | null>(
  null,
);

interface StatementImportProviderProps {
  children: ReactNode;
  module: StatementImportModule;
}

/** Exposes the composition root to the React tree; tests pass a module built on fakes. */
export const StatementImportProvider = ({
  children,
  module,
}: StatementImportProviderProps) => (
  <StatementImportContext.Provider value={module}>
    {children}
  </StatementImportContext.Provider>
);

export const useStatementImportModule = () => {
  const statementImportModule = useContext(StatementImportContext);

  if (statementImportModule === null) {
    throw new Error(
      'useStatementImportModule must be used inside StatementImportProvider',
    );
  }

  return statementImportModule;
};
