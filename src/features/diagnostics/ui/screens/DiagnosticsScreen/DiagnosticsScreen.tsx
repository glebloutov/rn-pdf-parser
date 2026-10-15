import { useDiagnosticsScreen } from '@features/diagnostics/ui/hooks/useDiagnosticsScreen';
import { MockStatePanel } from '@features/diagnostics/ui/components/MockStatePanel';
import { ScenarioPicker } from '@features/diagnostics/ui/components/ScenarioPicker';
import { DiagnosticsTestIds } from '@features/diagnostics/constants/testIds';
import { Banner } from '@shared/components/Banner';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { HintText } from '@shared/components/HintText';
import { KeyValueRow } from '@shared/components/KeyValueRow';
import { ScreenLoader } from '@shared/components/ScreenLoader';
import { ScreenContainer } from '@shared/components/ScreenContainer';

/**
 * DiagnosticsScreen — Mock control: scenario switch, counters, jobs, reset; shows the mock address in use.
 * Why: Task allows a diagnostics screen to switch /__test/scenario and compare mock counters without code changes.
 * Used in: RootNavigator, route Diagnostics (dev builds only, header button).
 */
export const DiagnosticsScreen = () => {
  const {
    baseUrl,
    handleRefresh,
    handleReset,
    handleSelectScenario,
    isBusy,
    isUnreachable,
    mockState,
    t,
  } = useDiagnosticsScreen();

  // First load: nothing to show yet → one loader in the middle of the screen
  if (mockState === null && isBusy && !isUnreachable) {
    return <ScreenLoader label={t('loading')} testID="diagnostics-loading" />;
  }

  return (
    <ScreenContainer testID="diagnostics-screen">
      {isUnreachable ? (
        <Banner title={t('errors.unreachable')} tone="danger" />
      ) : null}
      <ScenarioPicker
        currentMode={mockState?.mode ?? null}
        disabled={isBusy}
        onSelect={handleSelectScenario}
      />
      <Button
        label={t('actions.refresh')}
        loading={isBusy}
        onPress={handleRefresh}
        testID={DiagnosticsTestIds.refreshButton}
        variant="secondary"
      />
      {mockState ? <MockStatePanel state={mockState} /> : null}
      <Button
        disabled={isBusy}
        label={t('actions.reset')}
        onPress={handleReset}
        testID={DiagnosticsTestIds.resetButton}
        variant="danger"
      />
      <Card>
        <KeyValueRow label={t('baseUrl.label')} value={baseUrl} />
        <HintText text={t('baseUrl.hint')} />
      </Card>
    </ScreenContainer>
  );
};
