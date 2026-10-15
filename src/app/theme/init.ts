import { StyleSheet } from 'react-native-unistyles';

import { breakpoints } from '@shared/theme/breakpoints';
import sharedTheme from '@shared/theme/theme';

const themes = {
  primary: {
    shared: sharedTheme,
  },
};

type AppThemes = typeof themes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  breakpoints,
  settings: {
    adaptiveThemes: false,
  },
  themes,
});
