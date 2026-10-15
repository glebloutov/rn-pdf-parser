import { useTranslation } from 'react-i18next';

import { TestIds } from '@features/statementImport/constants/testIds';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { HintText } from '@shared/components/HintText';

interface ClearLocalDataSectionProps {
  clearing: boolean;
  onClear: () => void;
}

/**
 * ClearLocalDataSection — "Clear local data" button with a note that server data is not deleted.
 * Why: Lets the user remove every local copy and saved state (release note: how to clear data).
 * Used in: ImportHomeScreen, always at the bottom.
 */
export const ClearLocalDataSection = ({
  clearing,
  onClear,
}: ClearLocalDataSectionProps) => {
  const { t } = useTranslation('statementImport');

  return (
    <Card>
      <HintText text={t('clearLocalData.hint')} />
      <Button
        label={t('actions.clearLocalData')}
        loading={clearing}
        onPress={onClear}
        testID={TestIds.clearLocalDataButton}
        variant="secondary"
      />
    </Card>
  );
};
