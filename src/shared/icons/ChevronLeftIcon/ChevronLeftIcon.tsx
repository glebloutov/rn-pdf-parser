import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * ChevronLeftIcon — "back" chevron drawn with two borders of a rotated square (no icon library).
 * Why: header back button without text on iOS.
 * Used in: HeaderBackButton.
 */
export const ChevronLeftIcon = () => <View style={styles.chevron} />;

const styles = StyleSheet.create(({ shared }) => ({
  chevron: {
    borderBottomWidth: 2.5,
    borderColor: shared.text.primary,
    borderLeftWidth: 2.5,
    height: 13,
    marginLeft: 4,
    transform: [{ rotate: '45deg' }],
    width: 13,
  },
}));
