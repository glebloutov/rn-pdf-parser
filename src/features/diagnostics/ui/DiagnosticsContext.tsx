import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { IMockControlPort } from '@features/diagnostics/ports';

export interface IDiagnosticsModule {
  /** Mock address in use (from .env or the default), shown read-only. */
  baseUrl: string;
  mockControl: IMockControlPort;
}

const DiagnosticsContext = createContext<IDiagnosticsModule | null>(null);

interface DiagnosticsProviderProps {
  children: ReactNode;
  module: IDiagnosticsModule;
}

export const DiagnosticsProvider = ({
  children,
  module,
}: DiagnosticsProviderProps) => (
  <DiagnosticsContext.Provider value={module}>
    {children}
  </DiagnosticsContext.Provider>
);

export const useDiagnosticsModule = () => {
  const diagnosticsModule = useContext(DiagnosticsContext);

  if (diagnosticsModule === null) {
    throw new Error(
      'useDiagnosticsModule must be used inside DiagnosticsProvider',
    );
  }

  return diagnosticsModule;
};
