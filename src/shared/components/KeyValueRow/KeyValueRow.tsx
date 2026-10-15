import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

interface KeyValueRowProps {
  label: string;
  testID?: string;
  value: string;
}

/**
 * KeyValueRow — Label + value row that wraps instead of truncating.
 * Why: Keeps values readable with large system fonts and on small screens.
 * Used in: ConfirmFilePanel, ReportCard (monthly total), ChargeDetailsScreen, ScenarioPicker, MockStatePanel.
 */
export const KeyValueRow = ({ label, testID, value }: KeyValueRowProps) => (
  <View accessible style={styles.row} testID={testID}>
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>
      {label}
    </Text>
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.value}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create(({ shared }) => ({
  label: {
    color: shared.text.secondary,
    flexShrink: 1,
    fontSize: shared.fontSize.sm,
  },
  row: {
    columnGap: shared.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  value: {
    color: shared.text.primary,
    flexShrink: 1,
    fontSize: shared.fontSize.md,
    fontWeight: '600',
  },
}));
