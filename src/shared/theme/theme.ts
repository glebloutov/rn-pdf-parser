import colors from '@shared/theme/colors';
import { compactOr } from '@shared/theme/breakpoints';

const theme = {
  background: {
    danger: colors.red_50,
    primary: colors.slate_50,
    success: colors.green_50,
    surface: colors.white,
    warning: colors.amber_50,
  },
  border: {
    default: colors.slate_200,
  },
  button: {
    danger: colors.red_600,
    disabled: colors.slate_200,
    primary: colors.green_600,
    secondaryBorder: colors.green_600,
  },
  // Smaller on narrow screens (see breakpoints.ts); the system font scale still applies on top
  fontSize: {
    lg: compactOr(16, 18),
    md: compactOr(15, 16),
    sm: compactOr(13, 14),
    xl: compactOr(20, 24),
  },
  radius: {
    md: 12,
    sm: 8,
  },
  spacing: {
    lg: compactOr(16, 24),
    md: compactOr(12, 16),
    sm: compactOr(6, 8),
    xs: 4,
  },
  text: {
    accent: colors.green_700,
    danger: colors.red_700,
    inverse: colors.white,
    primary: colors.slate_900,
    secondary: colors.slate_500,
    strong: colors.slate_700,
    warning: colors.amber_700,
  },
  // 48dp (Android) covers the 44pt iOS minimum as well; not reduced on small screens
  touchTarget: {
    min: 48,
  },
};

export default theme;
