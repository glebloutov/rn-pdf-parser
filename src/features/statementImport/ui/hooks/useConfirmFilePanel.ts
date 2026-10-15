import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler } from 'react-native';

import { toErrorMessageCode } from '@features/statementImport/ui/statusPresenter';
import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import { useToast } from '@shared/components/Toast';
import { toFileSizeParts } from '@shared/format/fileSize';

export const useConfirmFilePanel = (statementImport: IStatementImport) => {
  // 1. Translations
  const { i18n, t } = useTranslation('statementImport');
  const { t: tCommon } = useTranslation('common');

  // 2. Data hooks
  const { discardImport, submitImport } = useStatementImportModule();
  const { showToast } = useToast();

  // 4. useState
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5. useMemo
  const fileSizeLabel = useMemo(() => {
    const { unit, value } = toFileSizeParts(
      statementImport.file.sizeBytes,
      i18n.language,
    );
    const label = tCommon(unit, {
      count: statementImport.file.sizeBytes,
      value,
    });

    return label;
  }, [i18n.language, statementImport.file.sizeBytes, tCommon]);

  // 6. useCallback
  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);

    const result = await submitImport();

    setIsSubmitting(false);

    if (!result.ok) {
      showToast('danger', t(`errors.${toErrorMessageCode(result.error.code)}`));
    }
  }, [showToast, submitImport, t]);

  const handleCancel = useCallback(async () => {
    await discardImport('currentImport');
  }, [discardImport]);

  // 7. useEffect — Android back on the confirm step = Cancel (the private copy is deleted)
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleCancel();

        return true;
      },
    );

    return () => subscription.remove();
  }, [handleCancel]);

  return {
    fileSizeLabel,
    handleCancel,
    handleConfirm,
    isSubmitting,
    t,
  };
};
