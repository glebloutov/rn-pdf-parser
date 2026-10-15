import { NavigationContainer } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootFailure } from '@app/bootstrap/BootFailure';
import { useAppModules } from '@app/bootstrap/useAppModules';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { DiagnosticsProvider } from '@features/diagnostics/ui/DiagnosticsContext';
import { StatementImportProvider } from '@features/statementImport/ui/StatementImportContext';
import { ScreenLoader } from '@shared/components/ScreenLoader';
import { ToastProvider } from '@shared/components/Toast';
import { STATUS_BAR_STYLE } from '@shared/constants/statusBar';

/**
 * App — Root component: boot (modules), providers (feature contexts), navigation.
 * Why: Composes the app; shows loading / boot failure / the app.
 * Used in: index.js (AppRegistry).
 */
const App = () => {
  const { t } = useTranslation('common');
  const bootState = useAppModules();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={STATUS_BAR_STYLE} />
      {bootState.status === 'loading' ? (
        <ScreenLoader label={t('loading')} testID="boot-loading" />
      ) : null}
      {bootState.status === 'failed' ? <BootFailure /> : null}
      {bootState.status === 'ready' ? (
        <StatementImportProvider module={bootState.modules.statementImport}>
          <DiagnosticsProvider module={bootState.modules.diagnostics}>
            <ToastProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ToastProvider>
          </DiagnosticsProvider>
        </StatementImportProvider>
      ) : null}
    </SafeAreaProvider>
  );
};

export default App;
