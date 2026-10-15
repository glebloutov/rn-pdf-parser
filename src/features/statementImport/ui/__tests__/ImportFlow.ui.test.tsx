import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import {
  CSV_BYTES,
  READY_REPORT,
  SPOOFED_BYTES,
  jobSnapshot,
  respondNetworkError,
  respondOk,
  respondServiceUnavailable,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';
import type { ITestEnvironment } from '@features/statementImport/useCases/__tests__/support/createTestModule';
import { TestIds } from '@features/statementImport/constants/testIds';
import { MAX_FONT_SCALE } from '@shared/theme/fontScale';
import { renderApp } from '@test-support/ui/renderApp';

// First poll can be skipped while the submit still holds the operation gate; the next runs 1 s later
const POLL_WAIT_MS = 3000;

const pickAndConfirm = async (environment: ITestEnvironment) => {
  environment.picker.willPick({
    bytes: CSV_BYTES,
    displayName: 'statement.csv',
  });
  await fireEvent.press(await screen.findByTestId(TestIds.pickFileButton));
  await fireEvent.press(await screen.findByTestId(TestIds.confirmUploadButton));
};

/** Every launch/focus triggers a read; give each one an answer. */
const allowBackgroundReads = (
  environment: ITestEnvironment,
  snapshot = jobSnapshot(),
) => {
  for (let index = 0; index < 10; index += 1) {
    environment.api.getResponses.push(respondOk(snapshot));
  }
};

const renderReady = async () => {
  const environment = createTestEnvironment();
  environment.api.createResponses.push(respondOk(jobSnapshot()));
  allowBackgroundReads(
    environment,
    jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
  );
  await renderApp(launchModule(environment));
  await pickAndConfirm(environment);
  await screen.findByText('Ready', {}, { timeout: POLL_WAIT_MS });

  return environment;
};

describe('Import flow (UI)', () => {
  it('empty state — offers the picker', async () => {
    await renderApp(launchModule(createTestEnvironment()));

    expect(
      await screen.findByText('Choose statement (PDF or CSV)'),
    ).toBeOnTheScreen();
  });

  it('spoofed pdf — rejected on device with a readable error, nothing sent', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: SPOOFED_BYTES,
      displayName: 'spoofed.pdf',
    });
    await renderApp(launchModule(environment));

    await fireEvent.press(await screen.findByTestId(TestIds.pickFileButton));

    expect([
      within(await screen.findByTestId('toast-danger')).getByText(
        'This file is not a PDF or CSV statement and was not sent.',
      ),
      environment.api.calls.length,
    ]).toEqual([expect.anything(), 0]);
  });

  it('confirm step — shows name, size and detected format before upload', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await renderApp(launchModule(environment));

    await fireEvent.press(await screen.findByTestId(TestIds.pickFileButton));

    expect([
      await screen.findByText('statement.csv'),
      screen.getByText(`${CSV_BYTES.length} B`),
      screen.getByText('CSV'),
    ]).toHaveLength(3);
  });

  it('after 202 — shows "queued", never a report', async () => {
    const environment = createTestEnvironment();
    environment.api.createResponses.push(respondOk(jobSnapshot()));
    allowBackgroundReads(environment);
    await renderApp(launchModule(environment));

    await pickAndConfirm(environment);

    expect([
      await screen.findByText('Queued — waiting for processing'),
      within(screen.getByTestId('toast-success')).getByText(
        'Upload accepted by the server.',
      ),
      screen.queryByTestId(TestIds.monthlyTotal),
    ]).toEqual([expect.anything(), expect.anything(), null]);
  });

  it('ready — two charges and the monthly total 151.99 AUD', async () => {
    await renderReady();

    expect([
      screen.getByText('StreamBeam'),
      screen.getByText('BrightGrid'),
      screen.getByText(/151\.99/),
    ]).toHaveLength(3);
  });

  it('details — read-only card, no cancel-subscription action', async () => {
    await renderReady();

    await fireEvent.press(
      screen.getByTestId(`${TestIds.chargeRow}-rec-002-details`),
    );

    const details = await screen.findByTestId(TestIds.chargeDetails);

    expect([
      within(details).getAllByText('BrightGrid').length > 0,
      within(details).queryByText(/cancel/i),
    ]).toEqual([true, null]);
  });

  it('stale_status — processing rev 2 after ready rev 3 — UI stays "Ready", revision 3', async () => {
    const environment = await renderReady();
    environment.api.getResponses.unshift(
      respondOk(jobSnapshot({ revision: 2, status: 'processing' })),
    );

    await fireEvent.press(screen.getByTestId(TestIds.refreshButton));

    await waitFor(() =>
      expect(screen.getByTestId(TestIds.refreshButton)).toBeEnabled(),
    );
    expect([
      screen.getByText('Ready'),
      screen.getByText('Job job-demo-001 · revision 3'),
    ]).toHaveLength(2);
  });

  it('stale_status — the ignored outdated answer is shown (dev builds)', async () => {
    const environment = await renderReady();
    environment.api.getResponses.unshift(
      respondOk(jobSnapshot({ revision: 2, status: 'processing' })),
    );

    await fireEvent.press(screen.getByTestId(TestIds.refreshButton));

    expect(
      await screen.findByText(
        'Ignored outdated server answers: 1 (last: processing · revision 2)',
      ),
    ).toBeOnTheScreen();
  });

  it('happy — repeated ready answers — no "ignored" line', async () => {
    await renderReady();

    await fireEvent.press(screen.getByTestId(TestIds.refreshButton));

    await waitFor(() =>
      expect(screen.getByTestId(TestIds.refreshButton)).toBeEnabled(),
    );
    expect(screen.queryByTestId(TestIds.outdatedResponses)).toBeNull();
  });

  it('delete_failure — 503 — warns data may remain, never says deleted', async () => {
    const environment = await renderReady();
    environment.api.deleteResponses.push(respondServiceUnavailable());

    await fireEvent.press(screen.getByTestId(TestIds.deleteButton));

    expect([
      await screen.findByText(/Deletion was not confirmed/),
      screen.queryByText(/Deleted on the server/),
      screen.getByTestId(TestIds.retryDeletionButton),
      within(screen.getByTestId('toast-warning')).getByText(
        'Deletion not confirmed. You can retry it.',
      ),
    ]).toEqual([expect.anything(), null, expect.anything(), expect.anything()]);
  });

  it('delete — 202 deleting — "waiting for confirmation", then GET deleted — "Deleted on the server"', async () => {
    const environment = await renderReady();
    environment.api.deleteResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );
    environment.api.getResponses.unshift(
      respondOk(jobSnapshot({ revision: 5, status: 'deleted' })),
    );

    await fireEvent.press(screen.getByTestId(TestIds.deleteButton));
    await screen.findByText(/Waiting for the server to confirm/);
    await act(async () => {
      await launchModule(environment).refreshJob();
    });

    expect([
      await screen.findByText(/Deleted on the server/),
      within(screen.getByTestId('toast-success')).getByText(
        'The server confirmed the deletion.',
      ),
    ]).toHaveLength(2);
  });

  it('lost ack — "Upload result unknown" with Check again and Retry upload', async () => {
    const environment = createTestEnvironment();
    environment.api.createResponses.push(respondNetworkError());
    await renderApp(launchModule(environment));

    await pickAndConfirm(environment);

    expect([
      await screen.findByText('Upload result unknown'),
      screen.getByTestId(TestIds.checkAgainButton),
      screen.getByTestId(TestIds.retryUploadButton),
    ]).toHaveLength(3);
  });

  it('lost ack — "Check again" with 404 — explains it was not found yet, no re-upload', async () => {
    const environment = createTestEnvironment();
    environment.api.createResponses.push(respondNetworkError());
    environment.api.byKeyResponses.push(respondOk(null), respondOk(null));
    await renderApp(launchModule(environment));
    await pickAndConfirm(environment);
    await screen.findByText('Upload result unknown');

    await fireEvent.press(screen.getByTestId(TestIds.checkAgainButton));

    expect([
      within(await screen.findByTestId('toast-warning')).getByText(
        'The server has not found this upload yet.',
      ),
      environment.api.callsOf('createImport'),
    ]).toEqual([expect.anything(), 1]);
  });

  it('relaunch after lost ack — recovers the job by key on launch without any tap', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    const firstLaunch = launchModule(environment);
    await firstLaunch.selectFile();
    environment.api.createResponses.push(respondNetworkError());
    await firstLaunch.submitImport();
    environment.api.byKeyResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
    );
    allowBackgroundReads(
      environment,
      jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
    );

    await renderApp(launchModule(environment));

    expect([
      await screen.findByText('Ready', {}, { timeout: POLL_WAIT_MS }),
      environment.api.callsOf('createImport'),
    ]).toEqual([expect.anything(), 1]);
  });

  it('relaunch after lost ack — a loader while the upload is looked up, never "Upload result unknown" first', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    const firstLaunch = launchModule(environment);
    await firstLaunch.selectFile();
    environment.api.createResponses.push(respondNetworkError());
    await firstLaunch.submitImport();
    environment.api.byKeyResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
    );
    allowBackgroundReads(
      environment,
      jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
    );
    const relaunch = launchModule(environment);
    let answerLookup = () => {};
    const lookupAnswered = new Promise<void>(resolve => {
      answerLookup = resolve;
    });
    const slowRecover: typeof relaunch.recoverImport = async () => {
      await lookupAnswered;

      return relaunch.recoverImport();
    };

    await renderApp({ ...relaunch, recoverImport: slowRecover });
    const whileLookingUp = [
      screen.queryByTestId('checking-upload-loader'),
      screen.queryByText('Upload result unknown'),
    ];
    await act(async () => {
      answerLookup();
    });

    expect([
      whileLookingUp,
      await screen.findByText('Ready', {}, { timeout: POLL_WAIT_MS }),
      screen.queryByTestId('checking-upload-loader'),
    ]).toEqual([[expect.anything(), null], expect.anything(), null]);
  });

  it('large system font — every text scales, capped at 2× so words are not broken', async () => {
    await renderReady();

    const texts = screen.getAllByText(/.+/);

    expect(
      texts.filter(
        text =>
          text.props.allowFontScaling === false ||
          text.props.maxFontSizeMultiplier !== MAX_FONT_SCALE,
      ),
    ).toHaveLength(0);
  });
});
