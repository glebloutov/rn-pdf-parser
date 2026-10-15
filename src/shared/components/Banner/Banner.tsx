import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

export type BannerTone = 'danger' | 'neutral' | 'success' | 'warning';

interface BannerProps {
  message?: string;
  testID?: string;
  title: string;
  tone: BannerTone;
}

/**
 * Banner — Coloured message box (neutral / success / warning / danger) with a title and optional text.
 * Why: One readable way to show status, errors and warnings; announced by screen readers (live region).
 * Used in: ImportEmptyState, ConfirmFilePanel, StatusSummary, ImportStatusPanel, ChargeDetailsScreen, DiagnosticsScreen, BootFailure.
 */
export const Banner = ({ message, testID, title, tone }: BannerProps) => {
  styles.useVariants({ tone });

  return (
    <View
      accessibilityLiveRegion="polite"
      accessible
      style={styles.container}
      testID={testID}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>
      {message ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create(({ shared }) => ({
  container: {
    borderRadius: shared.radius.md,
    gap: shared.spacing.xs,
    padding: shared.spacing.md,
    variants: {
      tone: {
        danger: { backgroundColor: shared.background.danger },
        neutral: { backgroundColor: shared.background.surface },
        success: { backgroundColor: shared.background.success },
        warning: { backgroundColor: shared.background.warning },
      },
    },
  },
  message: {
    color: shared.text.strong,
    fontSize: shared.fontSize.sm,
  },
  title: {
    fontSize: shared.fontSize.md,
    fontWeight: '700',
    variants: {
      tone: {
        danger: { color: shared.text.danger },
        neutral: { color: shared.text.primary },
        success: { color: shared.text.accent },
        warning: { color: shared.text.warning },
      },
    },
  },
}));
