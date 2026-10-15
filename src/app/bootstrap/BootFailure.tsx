import { useTranslation } from 'react-i18next';

import { Banner } from '@shared/components/Banner';
import { ScreenContainer } from '@shared/components/ScreenContainer';

/**
 * BootFailure — Error screen when secure storage (Keychain/Keystore) can't be initialised.
 * Why: The app never runs without encrypted storage; nothing is read or sent.
 * Used in: App, boot state "failed".
 */
export const BootFailure = () => {
  const { t } = useTranslation('common');

  return (
    <ScreenContainer>
      <Banner
        message={t('bootFailedHint')}
        title={t('bootFailed')}
        tone="danger"
      />
    </ScreenContainer>
  );
};
