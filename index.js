/**
 * @format
 */

// Must be the first imports: themes and translations are configured before any screen module loads
import '@app/theme/init';
import '@app/i18n/i18n';

import { AppRegistry } from 'react-native';

import App from '@app/App';

import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
