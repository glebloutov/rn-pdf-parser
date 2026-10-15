import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IMockState, MockScenario } from '@features/diagnostics/ports';
import { useDiagnosticsModule } from '@features/diagnostics/ui/DiagnosticsContext';

/** Simple tier: no domain logic, the hook talks to the mock-control port directly. */
export const useDiagnosticsScreen = () => {
  // 1. Translations
  const { t } = useTranslation('diagnostics');

  // 2. Data hooks
  const { baseUrl, mockControl } = useDiagnosticsModule();

  // 4. useState
  const [mockState, setMockState] = useState<IMockState | null>(null);
  const [isUnreachable, setIsUnreachable] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  // 6. useCallback
  const handleRefresh = useCallback(async () => {
    setIsBusy(true);

    const result = await mockControl.getState();

    setIsBusy(false);
    setIsUnreachable(!result.ok);
    setMockState(result.ok ? result.value : null);
  }, [mockControl]);

  const handleSelectScenario = useCallback(
    async (scenario: MockScenario) => {
      await mockControl.setScenario(scenario);
      await handleRefresh();
    },
    [handleRefresh, mockControl],
  );

  const handleReset = useCallback(async () => {
    await mockControl.reset();
    await handleRefresh();
  }, [handleRefresh, mockControl]);

  // 7. Effects — always show fresh counters when the screen opens
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh]),
  );

  return {
    baseUrl,
    handleRefresh,
    handleReset,
    handleSelectScenario,
    isBusy,
    isUnreachable,
    mockState,
    t,
  };
};
