import { ActivityIndicator, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

interface ScreenLoaderProps {
  label: string;
  testID?: string;
}

/**
 * ScreenLoader — Spinner with a text label in the middle of the screen.
 * Why: A readable, announced loading state for a whole screen (not a bare spinner); button actions use the Button's own loader.
 * Used in: App (boot), DiagnosticsScreen (first load).
 */
export const ScreenLoader = ({ label, testID }: ScreenLoaderProps) => (
  <View
    accessibilityLabel={label}
    accessibilityRole="progressbar"
    accessible
    style={styles.container}
    testID={testID}
  >
    <ActivityIndicator size="large" />
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.text}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create(({ shared }) => ({
  container: {
    alignItems: 'center',
    backgroundColor: shared.background.primary,
    flex: 1,
    gap: shared.spacing.sm,
    justifyContent: 'center',
    padding: shared.spacing.md,
  },
  text: {
    color: shared.text.secondary,
    fontSize: shared.fontSize.md,
    textAlign: 'center',
  },
}));
