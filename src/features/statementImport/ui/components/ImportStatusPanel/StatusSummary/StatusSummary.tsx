import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import type { IImportStatusView } from '@features/statementImport/ui/statusPresenter';
import { TestIds } from '@features/statementImport/constants/testIds';
import { useOutdatedResponses } from '@features/statementImport/ui/hooks/useOutdatedResponses';
import { Banner } from '@shared/components/Banner';
import { HintText } from '@shared/components/HintText';

interface StatusSummaryProps {
  view: IImportStatusView;
}

/**
 * StatusSummary — Status banner with hint, spinner while pending, and job id + revision.
 * Why: Makes the server state and revision visible; in dev builds also shows ignored outdated answers (stale_status).
 * Used in: ImportStatusPanel.
 */
export const StatusSummary = ({ view }: StatusSummaryProps) => {
  const { t } = useTranslation('statementImport');
  const outdated = useOutdatedResponses();
  // Dev builds only: makes the ignored stale answer visible for manual checks
  const isOutdatedVisible =
    __DEV__ && outdated !== null && outdated.jobId === view.job?.jobId;
  const hintMessage = view.hintKey
    ? t(`statusHints.${view.hintKey}`)
    : undefined;
  const failureMessage = view.failureCode
    ? t(`errors.${view.failureCode}`)
    : undefined;

  return (
    <>
      <Banner
        message={failureMessage ?? hintMessage}
        testID={TestIds.statusBanner}
        title={t(`status.${view.statusKey}`)}
        tone={view.tone}
      />
      {view.isPending ? (
        <ActivityIndicator accessibilityLabel={t(`status.${view.statusKey}`)} />
      ) : null}
      {view.job ? (
        <HintText
          testID={TestIds.statusMeta}
          text={t('statusMeta.job', view.job)}
        />
      ) : null}
      {isOutdatedVisible && outdated ? (
        <HintText
          testID={TestIds.outdatedResponses}
          text={t('statusMeta.outdated', {
            count: outdated.count,
            revision: outdated.last.revision,
            status: outdated.last.status,
          })}
        />
      ) : null}
    </>
  );
};
