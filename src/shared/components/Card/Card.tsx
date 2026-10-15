import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

interface CardProps {
  children: ReactNode;
  testID?: string;
  title?: string;
}

/**
 * Card — Bordered section with an optional header.
 * Why: Groups related content (file details, report, counters) consistently.
 * Used in: ImportEmptyState, ConfirmFilePanel, ReportCard, ClearLocalDataSection, ChargeDetailsScreen, Diagnostics components.
 */
export const Card = ({ children, testID, title }: CardProps) => (
  <View style={styles.card} testID={testID}>
    {title ? (
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>
    ) : null}
    {children}
  </View>
);

const styles = StyleSheet.create(({ shared }) => ({
  card: {
    backgroundColor: shared.background.surface,
    borderColor: shared.border.default,
    borderRadius: shared.radius.md,
    borderWidth: 1,
    gap: shared.spacing.sm,
    padding: shared.spacing.md,
  },
  title: {
    color: shared.text.primary,
    fontSize: shared.fontSize.lg,
    fontWeight: '700',
  },
}));
