import { useEffect, useState } from 'react';

import { createAppModules } from '@app/bootstrap/createAppModules';
import type { IAppModules } from '@app/bootstrap/createAppModules';

type BootState =
  | { modules: IAppModules; status: 'ready' }
  | { status: 'failed' }
  | { status: 'loading' };

/**
 * Builds the app modules once on start (async: the storage key comes from the Keychain)
 * and exposes loading / failed / ready to `App`.
 */
export const useAppModules = () => {
  const [bootState, setBootState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    const boot = async () => {
      try {
        const modules = await createAppModules();

        setBootState({ modules, status: 'ready' });
      } catch {
        setBootState({ status: 'failed' });
      }
    };

    boot();
  }, []);

  return bootState;
};
