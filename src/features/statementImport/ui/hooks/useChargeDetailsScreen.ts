import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentImport } from '@features/statementImport/ui/hooks/useCurrentImport';
import { formatDate } from '@shared/format/formatDate';
import { formatMoney } from '@shared/format/formatMoney';
import type { Routes, RootStackParamList } from '@shared/navigation/routes';

export const useChargeDetailsScreen = () => {
  // 1. Translations and routes
  const { i18n, t } = useTranslation('statementImport');
  const route = useRoute<RouteProp<RootStackParamList, Routes.ChargeDetails>>();

  // 2. Data hooks
  const currentImport = useCurrentImport();

  // 5. useMemo — read-only view of one server-provided charge (no actions on it)
  const charge = useMemo(() => {
    const report = currentImport?.job?.report ?? null;
    const found =
      report?.items.find(item => item.id === route.params.chargeId) ?? null;

    if (report === null || found === null) {
      return null;
    }

    const chargeView = {
      amountLabel: formatMoney(
        found.amountMinor,
        report.currency,
        i18n.language,
      ),
      cadenceLabel: t(
        `charge.cadenceValue.${found.cadence}` as 'charge.cadenceValue.monthly',
        { defaultValue: found.cadence },
      ),
      lastSeenLabel: formatDate(found.lastSeen, i18n.language),
      merchant: found.merchant,
    };

    return chargeView;
  }, [currentImport, i18n.language, route.params.chargeId, t]);

  return { charge, t };
};
