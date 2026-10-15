import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render } from '@testing-library/react-native';

import type { IDiagnosticsModule } from '@features/diagnostics/ui/DiagnosticsContext';
import { DiagnosticsProvider } from '@features/diagnostics/ui/DiagnosticsContext';
import type { StatementImportModule } from '@features/statementImport/module';
import { StatementImportProvider } from '@features/statementImport/ui/StatementImportContext';
import { ChargeDetailsScreen } from '@features/statementImport/ui/screens/ChargeDetailsScreen';
import { ImportHomeScreen } from '@features/statementImport/ui/screens/ImportHomeScreen';
import { ToastProvider } from '@shared/components/Toast';
import { Routes } from '@shared/navigation/routes';
import type { RootStackParamList } from '@shared/navigation/routes';
import { ok } from '@shared/result/Result';

const Stack = createNativeStackNavigator<RootStackParamList>();

const fakeDiagnostics: IDiagnosticsModule = {
  baseUrl: 'http://127.0.0.1:8787',
  mockControl: {
    getState: async () => ok({ jobs: [], mode: 'happy', stats: {} }),
    reset: async () => ok(null),
    setScenario: async () => ok(null),
  },
};

/** Renders the real screens/hooks/presenters over a module built on fakes. */
export const renderApp = async (module: StatementImportModule) => {
  const rendered = await render(
    <StatementImportProvider module={module}>
      <DiagnosticsProvider module={fakeDiagnostics}>
        <ToastProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                component={ImportHomeScreen}
                name={Routes.ImportHome}
              />
              <Stack.Screen
                component={ChargeDetailsScreen}
                name={Routes.ChargeDetails}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </DiagnosticsProvider>
    </StatementImportProvider>,
  );

  return rendered;
};
