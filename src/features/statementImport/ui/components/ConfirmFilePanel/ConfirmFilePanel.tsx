import { useConfirmFilePanel } from '@features/statementImport/ui/hooks/useConfirmFilePanel';
import { TestIds } from '@features/statementImport/constants/testIds';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import { Banner } from '@shared/components/Banner';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { KeyValueRow } from '@shared/components/KeyValueRow';

interface ConfirmFilePanelProps {
  statementImport: IStatementImport;
}

/**
 * ConfirmFilePanel — Confirm step: name, size and detected format of the validated file; Upload / Cancel.
 * Why: Task requirement: a confirmation screen before the bytes are sent; Cancel (and Android back) deletes the private copy.
 * Used in: ImportHomeScreen when the import is a draft.
 */
export const ConfirmFilePanel = ({
  statementImport,
}: ConfirmFilePanelProps) => {
  const { fileSizeLabel, handleCancel, handleConfirm, isSubmitting, t } =
    useConfirmFilePanel(statementImport);

  return (
    <>
      <Card title={t('confirm.title')}>
        <KeyValueRow
          label={t('confirm.fileName')}
          value={statementImport.file.displayName}
        />
        <KeyValueRow label={t('confirm.size')} value={fileSizeLabel} />
        <KeyValueRow
          label={t('confirm.format')}
          value={t(`format.${statementImport.file.format}`)}
        />
      </Card>
      <Banner title={t('confirm.hint')} tone="neutral" />
      <Button
        label={t('actions.confirmUpload')}
        loading={isSubmitting}
        onPress={handleConfirm}
        testID={TestIds.confirmUploadButton}
      />
      <Button
        disabled={isSubmitting}
        label={t('actions.cancel')}
        onPress={handleCancel}
        testID={TestIds.confirmCancelButton}
        variant="secondary"
      />
    </>
  );
};
