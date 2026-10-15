import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  toErrorMessageCode,
  toHomeMode,
  toStatusToast,
} from '@features/statementImport/ui/statusPresenter';
import type { ImportPhase } from '@features/statementImport/domain/statementImport';
import { useCurrentImport } from '@features/statementImport/ui/hooks/useCurrentImport';
import { useImportSession } from '@features/statementImport/ui/hooks/useImportSession';
import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';
import { useToast } from '@shared/components/Toast';

const SILENT_ERROR_CODES: ReadonlyArray<string> = ['PICK_CANCELLED'];
const UNCONFIRMED_UPLOAD_PHASES: ReadonlyArray<ImportPhase> = [
  'submitting',
  'submitUncertain',
];

export const useImportHomeScreen = () => {
  // 1. Translations
  const { t } = useTranslation('statementImport');

  // 2. Data hooks
  const { discardImport, selectFile } = useStatementImportModule();
  const currentImport = useCurrentImport();
  const { isLaunchRecovering } = useImportSession(currentImport);
  const { showToast } = useToast();

  // 3. Refs — the previous saved import, to notify about status changes
  const previousImport = useRef(currentImport);

  // 4. useState
  const [isPicking, setIsPicking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // 5. useMemo
  const mode = useMemo(() => toHomeMode(currentImport), [currentImport]);
  // After a relaunch with an unconfirmed upload the answer is being looked up: show a loader,
  // not "Upload result unknown" that turns into the real state a moment later
  const isCheckingUpload =
    isLaunchRecovering &&
    currentImport !== null &&
    UNCONFIRMED_UPLOAD_PHASES.includes(currentImport.phase);

  // 6. useCallback
  const handlePickFile = useCallback(async () => {
    setIsPicking(true);

    const result = await selectFile();

    setIsPicking(false);

    if (!result.ok && !SILENT_ERROR_CODES.includes(result.error.code)) {
      showToast('danger', t(`errors.${toErrorMessageCode(result.error.code)}`));
    }
  }, [selectFile, showToast, t]);

  const handleClearLocalData = useCallback(async () => {
    setIsClearing(true);
    await discardImport('allLocalData');
    setIsClearing(false);
    showToast('success', t('toasts.localDataCleared'));
  }, [discardImport, showToast, t]);

  // 7. useEffect — one toast per meaningful change of the saved import (polling, recovery, actions)
  useEffect(() => {
    const toast = toStatusToast(previousImport.current, currentImport);

    previousImport.current = currentImport;

    if (toast) {
      showToast(toast.tone, t(`toasts.${toast.key}`));
    }
  }, [currentImport, showToast, t]);

  return {
    currentImport,
    handleClearLocalData,
    handlePickFile,
    isCheckingUpload,
    isClearing,
    isPicking,
    mode,
    t,
  };
};
