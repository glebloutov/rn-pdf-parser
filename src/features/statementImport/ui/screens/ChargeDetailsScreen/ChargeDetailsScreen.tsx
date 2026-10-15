import { useChargeDetailsScreen } from '@features/statementImport/ui/hooks/useChargeDetailsScreen';
import { TestIds } from '@features/statementImport/constants/testIds';
import { Banner } from '@shared/components/Banner';
import { Card } from '@shared/components/Card';
import { KeyValueRow } from '@shared/components/KeyValueRow';
import { ScreenContainer } from '@shared/components/ScreenContainer';

/**
 * ChargeDetailsScreen — Read-only card of one charge: merchant, amount, cadence, last seen.
 * Why: Task: "Подробнее" opens a card; deliberately no "cancel subscription" action.
 * Used in: RootNavigator, route ChargeDetails (opened from ChargeRow).
 */
export const ChargeDetailsScreen = () => {
  const { charge, t } = useChargeDetailsScreen();

  return (
    <ScreenContainer testID={TestIds.chargeDetails}>
      {charge ? (
        <Card title={charge.merchant}>
          <KeyValueRow label={t('charge.merchant')} value={charge.merchant} />
          <KeyValueRow label={t('charge.amount')} value={charge.amountLabel} />
          <KeyValueRow
            label={t('charge.cadence')}
            value={charge.cadenceLabel}
          />
          <KeyValueRow
            label={t('charge.lastSeen')}
            value={charge.lastSeenLabel}
          />
        </Card>
      ) : (
        <Banner title={t('charge.notAvailable')} tone="neutral" />
      )}
    </ScreenContainer>
  );
};
