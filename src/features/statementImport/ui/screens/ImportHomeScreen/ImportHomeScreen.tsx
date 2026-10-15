import { useImportHomeScreen } from '@features/statementImport/ui/hooks/useImportHomeScreen';
import { ClearLocalDataSection } from '@features/statementImport/ui/components/ClearLocalDataSection';
import { ConfirmFilePanel } from '@features/statementImport/ui/components/ConfirmFilePanel';
import { ImportEmptyState } from '@features/statementImport/ui/components/ImportEmptyState';
import { ImportStatusPanel } from '@features/statementImport/ui/components/ImportStatusPanel';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { ScreenLoader } from '@shared/components/ScreenLoader';

/**
 * ImportHomeScreen — Main screen; renders the step that matches the saved import: empty, confirm or status.
 * Why: Derived from persisted state, so a relaunch always lands on the right step; while an unconfirmed upload is looked up after a relaunch, a loader is shown instead.
 * Used in: RootNavigator, route ImportHome (initial).
 */
export const ImportHomeScreen = () => {
  const {
    currentImport,
    handleClearLocalData,
    handlePickFile,
    isCheckingUpload,
    isClearing,
    isPicking,
    mode,
    t,
  } = useImportHomeScreen();

  if (isCheckingUpload) {
    return (
      <ScreenLoader
        label={t('statusHints.checkingUpload')}
        testID="checking-upload-loader"
      />
    );
  }

  return (
    <ScreenContainer testID="import-home-screen">
      {mode === 'empty' ? (
        <ImportEmptyState onPickFile={handlePickFile} picking={isPicking} />
      ) : null}
      {mode === 'confirm' && currentImport ? (
        <ConfirmFilePanel statementImport={currentImport} />
      ) : null}
      {mode === 'status' && currentImport ? (
        <ImportStatusPanel statementImport={currentImport} />
      ) : null}
      <ClearLocalDataSection
        clearing={isClearing}
        onClear={handleClearLocalData}
      />
    </ScreenContainer>
  );
};
