import { useImportStatusPanel } from '@features/statementImport/ui/hooks/useImportStatusPanel';
import { toErrorMessageCode } from '@features/statementImport/ui/statusPresenter';
import { ReportCard } from '@features/statementImport/ui/components/ImportStatusPanel/ReportCard';
import { StatusActions } from '@features/statementImport/ui/components/ImportStatusPanel/StatusActions';
import { StatusSummary } from '@features/statementImport/ui/components/ImportStatusPanel/StatusSummary';
import { TestIds } from '@features/statementImport/constants/testIds';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import { Banner } from '@shared/components/Banner';

interface ImportStatusPanelProps {
  statementImport: IStatementImport;
}

/**
 * ImportStatusPanel — Everything after upload: status, deletion notice, report and allowed actions (action errors are toasts).
 * Why: Shows only truthful states (queued is never a report, "deleted" only after the server confirms it).
 * Used in: ImportHomeScreen once the import is past the draft step.
 */
export const ImportStatusPanel = ({
  statementImport,
}: ImportStatusPanelProps) => {
  const {
    busyAction,
    handleCheckAgain,
    handleDelete,
    handleOpenCharge,
    handleRefresh,
    handleRetryUpload,
    handleStartNew,
    monthlyTotalLabel,
    t,
    view,
  } = useImportStatusPanel(statementImport);

  const deletionMessage = view.deletionErrorCode
    ? t(`errors.${toErrorMessageCode(view.deletionErrorCode)}`)
    : undefined;

  return (
    <>
      <StatusSummary view={view} />
      {view.deletionMessageKey ? (
        <Banner
          message={deletionMessage}
          testID={TestIds.deletionNotice}
          title={t(`deletion.${view.deletionMessageKey}`)}
          tone={view.deletionMessageKey === 'deleted' ? 'success' : 'warning'}
        />
      ) : null}
      {view.report && monthlyTotalLabel ? (
        <ReportCard
          monthlyTotalLabel={monthlyTotalLabel}
          onOpenCharge={handleOpenCharge}
          report={view.report}
        />
      ) : null}
      <StatusActions
        actions={view.actions}
        busyAction={busyAction}
        handlers={{
          onCheckAgain: handleCheckAgain,
          onDelete: handleDelete,
          onRefresh: handleRefresh,
          onRetryUpload: handleRetryUpload,
          onStartNew: handleStartNew,
        }}
      />
    </>
  );
};
