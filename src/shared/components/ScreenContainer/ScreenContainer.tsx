import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

interface ScreenContainerProps {
  children: ReactNode;
  testID?: string;
}

const SAFE_AREA_EDGES = ['bottom', 'left', 'right'] as const;

/**
 * ScreenContainer — Safe-area, scrollable wrapper for a screen.
 * Why: Large fonts and small screens never hide actions — everything can be scrolled to.
 * Used in: ImportHomeScreen, ChargeDetailsScreen, DiagnosticsScreen, BootFailure.
 */
export const ScreenContainer = ({ children, testID }: ScreenContainerProps) => (
  <SafeAreaView edges={SAFE_AREA_EDGES} style={styles.safeArea}>
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create(({ shared }) => ({
  content: {
    gap: shared.spacing.md,
    padding: shared.spacing.md,
  },
  safeArea: {
    backgroundColor: shared.background.primary,
    flex: 1,
  },
}));
