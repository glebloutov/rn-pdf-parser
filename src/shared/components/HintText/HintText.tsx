import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

interface HintTextProps {
  testID?: string;
  text: string;
}

/**
 * HintText — Secondary, smaller explanatory text.
 * Why: Hints and meta information (job id + revision) without visual weight.
 * Used in: StatusSummary, ClearLocalDataSection, BaseUrlForm, MockStatePanel.
 */
export const HintText = ({ testID, text }: HintTextProps) => (
  <Text
    maxFontSizeMultiplier={MAX_FONT_SCALE}
    style={styles.text}
    testID={testID}
  >
    {text}
  </Text>
);

const styles = StyleSheet.create(({ shared }) => ({
  text: {
    color: shared.text.secondary,
    fontSize: shared.fontSize.sm,
  },
}));
