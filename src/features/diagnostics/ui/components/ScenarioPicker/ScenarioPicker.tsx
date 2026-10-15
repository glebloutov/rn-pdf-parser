import { useTranslation } from 'react-i18next';

import { MOCK_SCENARIOS } from '@features/diagnostics/ports';
import type { MockScenario } from '@features/diagnostics/ports';
import { DiagnosticsTestIds } from '@features/diagnostics/constants/testIds';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { KeyValueRow } from '@shared/components/KeyValueRow';

interface ScenarioPickerProps {
  currentMode: string | null;
  disabled: boolean;
  onSelect: (scenario: MockScenario) => void;
}

/**
 * ScenarioPicker — Current scenario and one button per scenario (happy, lost_ack, stale_status, delete_failure).
 * Why: Switches the mock behaviour from the device.
 * Used in: DiagnosticsScreen.
 */
export const ScenarioPicker = ({
  currentMode,
  disabled,
  onSelect,
}: ScenarioPickerProps) => {
  const { t } = useTranslation('diagnostics');

  return (
    <Card title={t('scenario.title')}>
      <KeyValueRow
        label={t('scenario.current')}
        testID={DiagnosticsTestIds.mockMode}
        value={currentMode ?? '—'}
      />
      {MOCK_SCENARIOS.map(scenario => (
        <Button
          disabled={disabled}
          key={scenario}
          label={scenario}
          onPress={() => onSelect(scenario)}
          testID={`${DiagnosticsTestIds.scenarioButton}-${scenario}`}
          variant={scenario === currentMode ? 'primary' : 'secondary'}
        />
      ))}
    </Card>
  );
};
