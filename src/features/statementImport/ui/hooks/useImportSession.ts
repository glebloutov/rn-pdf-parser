import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { isAwaitingServer } from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import { useStatementImportModule } from '@features/statementImport/ui/StatementImportContext';

export const POLL_INTERVAL_MS = 1000;

const ACTIVE_STATE: AppStateStatus = 'active';
const BACKGROUND_STATE: AppStateStatus = 'background';
const OPERATION_IN_PROGRESS_CODE = 'OPERATION_IN_PROGRESS';
const RETRY_DELAY_MS = 300;
const MAX_RECOVERY_ATTEMPTS = 10;

const wait = (delayMs: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, delayMs);
  });

/**
 * Keeps the import in sync with the server while the app runs. Called once,
 * from the home screen (always mounted as the root of the stack).
 *
 * Recovery — on launch and on every return to foreground:
 * removes orphan copies, then reads by key / refreshes. Read-only, never
 * re-sends the file. On launch another operation (e.g. the screen's focus
 * refresh) can hold the gate for a moment, so a refused recovery is retried
 * shortly instead of being lost.
 *
 * Polling — while the job is pending (queued / processing / deleting):
 * one refresh right away, then every POLL_INTERVAL_MS; stopped in background,
 * restarted with an immediate refresh on return; cleared once the job settles.
 * Every answer passes the revision guard and is persisted; the UI re-renders
 * from the persisted import, never from here.
 *
 * Returns `isLaunchRecovering`: true until the first (launch) recovery has
 * answered, so the screen can show a loader instead of a stale state.
 */
export const useImportSession = (statementImport: IStatementImport | null) => {
  const { recoverImport, refreshJob } = useStatementImportModule();
  const [isLaunchRecovering, setIsLaunchRecovering] = useState(true);
  const pollingJobId =
    statementImport !== null &&
    statementImport.phase === 'submitted' &&
    isAwaitingServer(statementImport)
      ? (statementImport.job?.jobId ?? null)
      : null;

  // Recovery on launch + foreground
  useEffect(() => {
    let isMounted = true;

    const recover = async () => {
      for (
        let attempt = 0;
        attempt < MAX_RECOVERY_ATTEMPTS && isMounted;
        attempt += 1
      ) {
        const result = await recoverImport();
        const isRefused =
          !result.ok && result.error.code === OPERATION_IN_PROGRESS_CODE;

        if (!isRefused) {
          return;
        }

        await wait(RETRY_DELAY_MS);
      }
    };

    const recoverOnLaunch = async () => {
      await recover();

      if (isMounted) {
        setIsLaunchRecovering(false);
      }
    };

    recoverOnLaunch();

    const subscription = AppState.addEventListener('change', state => {
      if (state === ACTIVE_STATE) {
        recover();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [recoverImport]);

  // Polling while the job is pending
  useEffect(() => {
    if (pollingJobId === null) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      refreshJob();
      intervalId = setInterval(() => {
        refreshJob();
      }, POLL_INTERVAL_MS);
    };

    // currentState can be 'unknown' right after launch (Android): only a known background state skips the start
    if (AppState.currentState !== BACKGROUND_STATE) {
      startPolling();
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === ACTIVE_STATE) {
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [pollingJobId, refreshJob]);

  return { isLaunchRecovering };
};
