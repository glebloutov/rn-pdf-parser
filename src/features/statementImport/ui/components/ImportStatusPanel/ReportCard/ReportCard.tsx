import { useTranslation } from 'react-i18next';

import { ChargeRow } from '@features/statementImport/ui/components/ImportStatusPanel/ReportCard/ChargeRow';
import { TestIds } from '@features/statementImport/constants/testIds';
import type { IImportReport } from '@features/statementImport/domain/statementImport';
import { Card } from '@shared/components/Card';
import { KeyValueRow } from '@shared/components/KeyValueRow';

interface ReportCardProps {
  monthlyTotalLabel: string;
  onOpenCharge: (chargeId: string) => void;
  report: IImportReport;
}

/**
 * ReportCard — List of recurring charges from the server and the monthly total.
 * Why: Result of a ready import (two charges, 151.99 AUD/month); server data, not client parsing.
 * Used in: ImportStatusPanel when the job is ready.
 */
export const ReportCard = ({
  monthlyTotalLabel,
  onOpenCharge,
  report,
}: ReportCardProps) => {
  const { t } = useTranslation('statementImport');

  return (
    <Card title={t('report.title')}>
      {report.items.map(charge => (
        <ChargeRow
          charge={charge}
          currency={report.currency}
          key={charge.id}
          onOpen={onOpenCharge}
        />
      ))}
      <KeyValueRow
        label={t('report.monthlyTotal')}
        testID={TestIds.monthlyTotal}
        value={monthlyTotalLabel}
      />
    </Card>
  );
};
