import { useTranslation } from 'react-i18next';

import { TestIds } from '@features/statementImport/constants/testIds';
import { Banner } from '@shared/components/Banner';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';

interface ImportEmptyStateProps {
  onPickFile: () => void;
  picking: boolean;
}

/**
 * ImportEmptyState — Intro text and the "Choose statement" button.
 * Why: Entry point of the import; a rejected file (spoofed / too large / empty) is reported by a toast before anything is sent.
 * Used in: ImportHomeScreen when there is no import.
 */
export const ImportEmptyState = ({
  onPickFile,
  picking,
}: ImportEmptyStateProps) => {
  const { t } = useTranslation('statementImport');

  return (
    <>
      <Banner
        message={t('empty.description')}
        title={t('empty.title')}
        tone="neutral"
      />
      <Card>
        <Button
          label={t('actions.pickFile')}
          loading={picking}
          onPress={onPickFile}
          testID={TestIds.pickFileButton}
        />
      </Card>
    </>
  );
};
