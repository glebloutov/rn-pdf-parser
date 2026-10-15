import { ActivityIndicator, Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

export type ButtonVariant = 'danger' | 'primary' | 'secondary';

interface ButtonProps {
  accessibilityHint?: string;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
  variant?: ButtonVariant;
}

/**
 * Button — Primary/secondary/danger button with loading and disabled states.
 * Why: Gives every action the same accessible role/state and a ≥48dp touch target; disabled while busy so taps can't send duplicate requests.
 * Used in: All screens: ImportEmptyState, ConfirmFilePanel, StatusActions, ChargeRow, ClearLocalDataSection, Diagnostics (ScenarioPicker, BaseUrlForm, DiagnosticsScreen).
 */
export const Button = ({
  accessibilityHint,
  disabled = false,
  label,
  loading = false,
  onPress,
  testID,
  variant = 'primary',
}: ButtonProps) => {
  const isInactive = disabled || loading;

  styles.useVariants({ inactive: isInactive, variant });

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isInactive }}
      disabled={isInactive}
      onPress={onPress}
      style={styles.button}
      testID={testID}
    >
      {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create(({ shared }) => ({
  button: {
    alignItems: 'center',
    borderRadius: shared.radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: shared.touchTarget.min,
    paddingHorizontal: shared.spacing.md,
    paddingVertical: shared.spacing.sm,
    variants: {
      inactive: {
        true: { opacity: 0.5 },
      },
      variant: {
        danger: {
          backgroundColor: shared.button.danger,
          borderColor: shared.button.danger,
        },
        primary: {
          backgroundColor: shared.button.primary,
          borderColor: shared.button.primary,
        },
        secondary: {
          backgroundColor: shared.background.surface,
          borderColor: shared.button.secondaryBorder,
        },
      },
    },
  },
  label: {
    flexShrink: 1,
    fontSize: shared.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    variants: {
      variant: {
        danger: { color: shared.text.inverse },
        primary: { color: shared.text.inverse },
        secondary: { color: shared.text.accent },
      },
    },
  },
  spinner: {
    marginRight: shared.spacing.sm,
  },
}));
