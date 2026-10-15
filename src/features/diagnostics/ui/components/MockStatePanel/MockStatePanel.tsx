import { useTranslation } from 'react-i18next';

import type { IMockState } from '@features/diagnostics/ports';
import { DiagnosticsTestIds } from '@features/diagnostics/constants/testIds';
import { Card } from '@shared/components/Card';
import { HintText } from '@shared/components/HintText';
import { KeyValueRow } from '@shared/components/KeyValueRow';

interface MockStatePanelProps {
  state: IMockState;
}

/**
 * MockStatePanel — Mock counters (createRequests, newJobs, duplicateHits, deleteRequests…) and jobs with status.
 * Why: Evidence for the acceptance matrix (e.g. newJobs = 1 after lost_ack).
 * Used in: DiagnosticsScreen.
 */
export const MockStatePanel = ({ state }: MockStatePanelProps) => {
  const { t } = useTranslation('diagnostics');

  return (
    <>
      <Card title={t('state.title')}>
        {Object.entries(state.stats).map(([name, value]) => (
          <KeyValueRow
            key={name}
            label={name}
            testID={`${DiagnosticsTestIds.stat}-${name}`}
            value={String(value)}
          />
        ))}
      </Card>
      <Card title={t('state.jobs')}>
        {state.jobs.length === 0 ? <HintText text={t('state.noJobs')} /> : null}
        {state.jobs.map(job => (
          <KeyValueRow
            key={job.jobId}
            label={job.jobId}
            value={`${job.status} · ${job.bytes} B`}
          />
        ))}
      </Card>
    </>
  );
};
