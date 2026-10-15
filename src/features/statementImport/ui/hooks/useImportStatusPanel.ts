import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  toErrorMessageCode,
  toImportStatusView,
} from '@features/statementImport/ui/statusPresenter';
import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';
import { monthlyTotalMinor } from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import { useToast } from '@shared/components/Toast';
import { formatMoney } from '@shared/format/formatMoney';
import { Routes } from '@shared/navigation/routes';
import type { RootStackParamList } from '@shared/navigation/routes';
import type { Result } from '@shared/result/Result';

export type StatusAction =
  'checkAgain' | 'delete' | 'refresh' | 'retryUpload' | 'startNew';

type AnyResult = Result<unknown, { code: string }>;

const NOT_FOUND_OUTCOME = 'notFound';
const OPERATION_IN_PROGRESS_CODE = 'OPERATION_IN_PROGRESS';

export const useImportStatusPanel = (statementImport: IStatementImport) => {
  // 1. Translations and navigation
  const { i18n, t } = useTranslation('statementImport');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 2. Data hooks
  const {
    discardImport,
    recoverImport,
    refreshJob,
    requestDeletion,
    submitImport,
  } = useStatementImportModule();
  const { showToast } = useToast();

  // 4. useState
  const [busyAction, setBusyAction] = useState<StatusAction | null>(null);

  // 5. useMemo
  const view = useMemo(
    () => toImportStatusView(statementImport),
    [statementImport],
  );

  const monthlyTotalLabel = useMemo(() => {
    if (view.report === null) {
      return null;
    }

    const totalLabel = formatMoney(
      monthlyTotalMinor(view.report.items),
      view.report.currency,
      i18n.language,
    );

    return totalLabel;
  }, [i18n.language, view.report]);

  // 6. useCallback
  const runAction = useCallback(
    async (action: StatusAction, operation: () => Promise<AnyResult>) => {
      setBusyAction(action);

      const result = await operation();

      setBusyAction(null);

      // A manual refresh colliding with a background poll is harmless: the poll does the same read
      const isRefreshCollision =
        action === 'refresh' &&
        !result.ok &&
        result.error.code === OPERATION_IN_PROGRESS_CODE;

      if (!result.ok && !isRefreshCollision) {
        showToast(
          'danger',
          t(`errors.${toErrorMessageCode(result.error.code)}`),
        );
      }

      return result;
    },
    [showToast, t],
  );

  const handleRefresh = useCallback(
    () => runAction('refresh', () => refreshJob()),
    [refreshJob, runAction],
  );

  const handleCheckAgain = useCallback(async () => {
    const result = await runAction('checkAgain', () => recoverImport());

    if (result.ok && result.value === NOT_FOUND_OUTCOME) {
      showToast('warning', t('statusHints.submitUncertainNotFound'));
    }
  }, [recoverImport, runAction, showToast, t]);

  const handleRetryUpload = useCallback(
    () => runAction('retryUpload', () => submitImport()),
    [runAction, submitImport],
  );

  const handleDelete = useCallback(
    () => runAction('delete', () => requestDeletion()),
    [requestDeletion, runAction],
  );

  const handleStartNew = useCallback(
    () => runAction('startNew', () => discardImport('currentImport')),
    [discardImport, runAction],
  );

  const handleOpenCharge = useCallback(
    (chargeId: string) =>
      navigation.navigate(Routes.ChargeDetails, { chargeId }),
    [navigation],
  );

  // 7. Effects — refresh whenever the screen gains focus, also when "ready"
  //    (otherwise a stale_status answer would never be fetched)
  useFocusEffect(
    useCallback(() => {
      refreshJob();
    }, [refreshJob]),
  );

  return {
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
  };
};
