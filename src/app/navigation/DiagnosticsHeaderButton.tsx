import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Routes } from '@shared/navigation/routes';
import type { RootStackParamList } from '@shared/navigation/routes';

// Extends the touch area to the 48dp minimum without changing the header layout
const HIT_SLOP = 16;
// Header space is fixed: the label grows with the system font only up to 1.5×, so the title stays visible
const HEADER_MAX_FONT_SCALE = 1.5;

/**
 * DiagnosticsHeaderButton — Header link to the Diagnostics screen.
 * Why: Quick access to mock control while testing.
 * Used in: RootNavigator, ImportHome header (dev builds only).
 */
export const DiagnosticsHeaderButton = () => {
  const { t } = useTranslation('diagnostics');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      accessibilityLabel={t('title')}
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      onPress={() => navigation.navigate(Routes.Diagnostics)}
      testID="diagnostics-header-button"
    >
      <Text maxFontSizeMultiplier={HEADER_MAX_FONT_SCALE} style={styles.label}>
        {t('title')}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create(({ shared }) => ({
  label: {
    color: shared.text.accent,
    fontSize: shared.fontSize.md,
    fontWeight: '600',
  },
}));
