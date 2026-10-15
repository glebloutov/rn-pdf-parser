import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';

export type ToastTone = 'danger' | 'success' | 'warning';

interface IToast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface IToastContext {
  showToast: (tone: ToastTone, message: string) => void;
}

// Errors and warnings stay longer: they usually need to be read, not just noticed
const DURATION_MS: Record<ToastTone, number> = {
  danger: 6000,
  success: 3000,
  warning: 5000,
};
const FADE_MS = 200;
const TOP_OFFSET = 8;

const ToastContext = createContext<IToastContext>({ showToast: () => {} });

/**
 * ToastProvider — Shows one short notification at a time at the top of the screen (success / warning / error).
 * Why: Results of actions (an upload accepted, a file rejected, a request failed) are events, not states;
 * a toast reports them without moving the layout. Persistent states stay in on-screen banners.
 * The toast never takes touches, so it can't block a button, and it is announced to screen readers.
 * Used in: App (around navigation), UI tests.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<IToast | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((tone: ToastTone, message: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const hideToast = useCallback(
    (id: number) => setToast(current => (current?.id === id ? null : current)),
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastView key={toast.id} onHide={hideToast} toast={toast} />
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

interface ToastViewProps {
  onHide: (id: number) => void;
  toast: IToast;
}

const ToastView = ({ onHide, toast }: ToastViewProps) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  styles.useVariants({ tone: toast.tone });

  useEffect(() => {
    Animated.timing(opacity, {
      duration: FADE_MS,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        duration: FADE_MS,
        toValue: 0,
        useNativeDriver: true,
      }).start(() => onHide(toast.id));
    }, DURATION_MS[toast.tone]);

    return () => clearTimeout(timer);
  }, [onHide, opacity, toast]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity, top: insets.top + TOP_OFFSET }]}
      testID={`toast-${toast.tone}`}
    >
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.message}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create(({ shared }) => ({
  container: {
    borderLeftWidth: 6,
    borderRadius: shared.radius.md,
    elevation: 6,
    left: shared.spacing.md,
    padding: shared.spacing.md,
    position: 'absolute',
    right: shared.spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    variants: {
      tone: {
        danger: {
          backgroundColor: shared.background.danger,
          borderLeftColor: shared.button.danger,
        },
        success: {
          backgroundColor: shared.background.success,
          borderLeftColor: shared.button.primary,
        },
        warning: {
          backgroundColor: shared.background.warning,
          borderLeftColor: shared.text.warning,
        },
      },
    },
  },
  message: {
    color: shared.text.primary,
    fontSize: shared.fontSize.md,
    fontWeight: '600',
  },
}));
