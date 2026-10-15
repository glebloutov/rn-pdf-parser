import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { TestIds } from '@features/statementImport/constants/testIds';
import type { IRecurringCharge } from '@features/statementImport/domain/statementImport';
import { Button } from '@shared/components/Button';
import { formatDate } from '@shared/format/formatDate';
import { formatMoney } from '@shared/format/formatMoney';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

interface ChargeRowProps {
  charge: IRecurringCharge;
  currency: string;
  onOpen: (chargeId: string) => void;
}

/**
 * ChargeRow — One charge: merchant, amount, last seen date and a "Details" button.
 * Why: Entry to the read-only detail card required by the task.
 * Used in: ReportCard.
 */
export const ChargeRow = ({ charge, currency, onOpen }: ChargeRowProps) => {
  const { i18n, t } = useTranslation('statementImport');
  const amountLabel = formatMoney(charge.amountMinor, currency, i18n.language);
  const lastSeenLabel = formatDate(charge.lastSeen, i18n.language);

  return (
    <View style={styles.row} testID={`${TestIds.chargeRow}-${charge.id}`}>
      <View accessible style={styles.texts}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.merchant}>
          {charge.merchant}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.amount}>
          {amountLabel}
        </Text>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={styles.meta}
        >{`${t('charge.lastSeen')}: ${lastSeenLabel}`}</Text>
      </View>
      <Button
        accessibilityHint={charge.merchant}
        label={t('actions.details')}
        onPress={() => onOpen(charge.id)}
        testID={`${TestIds.chargeRow}-${charge.id}-details`}
        variant="secondary"
      />
    </View>
  );
};

const styles = StyleSheet.create(({ shared }) => ({
  amount: {
    color: shared.text.primary,
    fontSize: shared.fontSize.md,
  },
  merchant: {
    color: shared.text.primary,
    fontSize: shared.fontSize.lg,
    fontWeight: '700',
  },
  meta: {
    color: shared.text.secondary,
    fontSize: shared.fontSize.sm,
  },
  row: {
    borderTopColor: shared.border.default,
    borderTopWidth: 1,
    gap: shared.spacing.sm,
    paddingTop: shared.spacing.sm,
  },
  texts: {
    gap: shared.spacing.xs,
  },
}));
