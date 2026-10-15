import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Pressable, Text } from 'react-native';

import { ScreenLoader } from '@shared/components/ScreenLoader';
import { ToastProvider, useToast } from '@shared/components/Toast';

const ShowToastButton = () => {
  const { showToast } = useToast();

  return (
    <Pressable onPress={() => showToast('success', 'The report is ready.')}>
      <Text>show</Text>
    </Pressable>
  );
};

describe('ScreenLoader', () => {
  it('ScreenLoader — readable text and an announced progress state, not a bare spinner', async () => {
    await render(<ScreenLoader label="Loading…" />);

    expect([
      screen.getByText('Loading…'),
      screen.getByRole('progressbar', { name: 'Loading…' }),
    ]).toHaveLength(2);
  });
});

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('Toast — shown, announced, never takes touches, hidden after a few seconds', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(
      <ToastProvider>
        <ShowToastButton />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('show'));
    const toast = screen.getByTestId('toast-success');
    const shownState = [toast.props.pointerEvents, announce.mock.calls[0]?.[0]];
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect([shownState, screen.queryByTestId('toast-success')]).toEqual([
      ['none', 'The report is ready.'],
      null,
    ]);
  });
});
