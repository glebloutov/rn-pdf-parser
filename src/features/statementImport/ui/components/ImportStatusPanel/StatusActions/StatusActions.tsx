import { useTranslation } from 'react-i18next';

import type { StatusAction } from '@features/statementImport/ui/hooks/useImportStatusPanel';
import type { IImportStatusActions } from '@features/statementImport/ui/statusPresenter';
import { TestIds } from '@features/statementImport/constants/testIds';
import { Button } from '@shared/components/Button';

interface StatusActionsProps {
  actions: IImportStatusActions;
  busyAction: StatusAction | null;
  handlers: {
    onCheckAgain: () => void;
    onDelete: () => void;
    onRefresh: () => void;
    onRetryUpload: () => void;
    onStartNew: () => void;
  };
}

/**
 * StatusActions — Buttons allowed by the presenter: Check again, Retry upload, Refresh, Delete, Retry deletion, Start new.
 * Why: Only valid actions are offered; all are disabled while one runs (no double POST/DELETE).
 * Used in: ImportStatusPanel.
 */
export const StatusActions = ({
  actions,
  busyAction,
  handlers,
}: StatusActionsProps) => {
  const { t } = useTranslation('statementImport');
  const isBusy = busyAction !== null;

  return (
    <>
      {actions.canCheckAgain ? (
        <Button
          disabled={isBusy}
          label={t('actions.checkAgain')}
          loading={busyAction === 'checkAgain'}
          onPress={handlers.onCheckAgain}
          testID={TestIds.checkAgainButton}
        />
      ) : null}
      {actions.canRetryUpload ? (
        <Button
          disabled={isBusy}
          label={t('actions.retryUpload')}
          loading={busyAction === 'retryUpload'}
          onPress={handlers.onRetryUpload}
          testID={TestIds.retryUploadButton}
          variant="secondary"
        />
      ) : null}
      {actions.canRefresh ? (
        <Button
          disabled={isBusy}
          label={t('actions.refresh')}
          loading={busyAction === 'refresh'}
          onPress={handlers.onRefresh}
          testID={TestIds.refreshButton}
          variant="secondary"
        />
      ) : null}
      {actions.canDelete ? (
        <Button
          disabled={isBusy}
          label={t('actions.delete')}
          loading={busyAction === 'delete'}
          onPress={handlers.onDelete}
          testID={TestIds.deleteButton}
          variant="danger"
        />
      ) : null}
      {actions.canRetryDeletion ? (
        <Button
          disabled={isBusy}
          label={t('actions.retryDeletion')}
          loading={busyAction === 'delete'}
          onPress={handlers.onDelete}
          testID={TestIds.retryDeletionButton}
          variant="danger"
        />
      ) : null}
      {actions.canStartNew ? (
        <Button
          disabled={isBusy}
          label={t('actions.startNew')}
          loading={busyAction === 'startNew'}
          onPress={handlers.onStartNew}
          testID={TestIds.startNewButton}
        />
      ) : null}
    </>
  );
};
