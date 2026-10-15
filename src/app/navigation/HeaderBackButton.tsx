import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { ChevronLeftIcon } from '@shared/icons/ChevronLeftIcon';

// Extends the touch area to the 48dp minimum without changing the header layout
const HIT_SLOP = 16;

/**
 * HeaderBackButton — Back chevron without text and without a background.
 * Why: on iOS 26 the system back button always gets a white glass capsule; this custom item can opt out of it.
 * Used in: RootNavigator, ChargeDetails and Diagnostics headers (iOS).
 */
export const HeaderBackButton = () => {
  const { t } = useTranslation('common');
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityLabel={t('back')}
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      onPress={() => navigation.goBack()}
      testID="header-back-button"
    >
      <ChevronLeftIcon />
    </Pressable>
  );
};
