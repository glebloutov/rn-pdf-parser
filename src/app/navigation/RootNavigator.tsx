import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { DiagnosticsHeaderButton } from '@app/navigation/DiagnosticsHeaderButton';
import { HeaderBackButton } from '@app/navigation/HeaderBackButton';
import { DiagnosticsScreen } from '@features/diagnostics/ui/screens/DiagnosticsScreen';
import { ChargeDetailsScreen } from '@features/statementImport/ui/screens/ChargeDetailsScreen';
import { ImportHomeScreen } from '@features/statementImport/ui/screens/ImportHomeScreen';
import { Routes } from '@shared/navigation/routes';
import type { RootStackParamList } from '@shared/navigation/routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const IS_IOS = Platform.OS === 'ios';
// Native headers default to 17 pt (iOS) / 20 sp (Android). One smaller size keeps the title centred
// next to the Diagnostics button on narrow phones (iOS shifts a title that doesn't fit to the left)
const HEADER_TITLE_STYLE = { fontSize: 16, fontWeight: '600' } as const;

const renderDiagnosticsButton = () => <DiagnosticsHeaderButton />;
const renderBackButton = () => <HeaderBackButton />;

/**
 * RootNavigator — Native stack with ImportHome, ChargeDetails and Diagnostics (dev only).
 * Why: Single place for routes and screen titles.
 * Used in: App, inside NavigationContainer.
 */
export const RootNavigator = () => {
  const { t } = useTranslation('statementImport');
  const { t: tDiagnostics } = useTranslation('diagnostics');

  return (
    <Stack.Navigator
      initialRouteName={Routes.ImportHome}
      // Android aligns the title left by default; centred on both platforms for one look
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: HEADER_TITLE_STYLE,
      }}
    >
      <Stack.Screen
        component={ImportHomeScreen}
        name={Routes.ImportHome}
        options={{
          headerRight: __DEV__ ? renderDiagnosticsButton : undefined,
          // iOS 26 draws a white liquid-glass capsule behind header items; the button has its own pill
          headerRightBackgroundVisible: false,
          title: t('title'),
        }}
      />
      <Stack.Screen
        component={ChargeDetailsScreen}
        name={Routes.ChargeDetails}
        options={{
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: IS_IOS ? renderBackButton : undefined,
          headerLeftBackgroundVisible: false,
          title: t('charge.title'),
        }}
      />
      {__DEV__ ? (
        <Stack.Screen
          component={DiagnosticsScreen}
          name={Routes.Diagnostics}
          options={{
            // Back arrow only, without the previous screen's title
            headerBackButtonDisplayMode: 'minimal',
            // iOS 26: the system back button always has a glass capsule → custom chevron without it
            headerLeft: IS_IOS ? renderBackButton : undefined,
            headerLeftBackgroundVisible: false,
            title: tDiagnostics('title'),
          }}
        />
      ) : null}
    </Stack.Navigator>
  );
};
