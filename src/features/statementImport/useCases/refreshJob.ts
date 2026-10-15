import {
  applySnapshot,
  markFailed,
} from '@features/statementImport/domain/statementImport';
import type {
  IJobSnapshot,
  IStatementImport,
} from '@features/statementImport/domain/statementImport';
import type {
  IImportDeps,
  ImportApiError,
  StatementImportError,
} from '@features/statementImport/ports';
import { LogEvent } from '@shared/logger/LogEvent';
import { ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

export interface IRefreshOutcome {
  /** A server answer older than what the app already has (e.g. stale_status) — ignored. */
  outdatedSnapshot: IJobSnapshot | null;
  statementImport: IStatementImport | null;
}

type RefreshResult = Result<IRefreshOutcome, StatementImportError>;

const NOTHING_IGNORED = null;

/**
 * Applies a GET response. Retriable errors keep the current state;
 * a 404 means the server no longer knows the job, which is shown, not hidden.
 */
export const applyJobResponse = (
  current: IStatementImport,
  response: Result<IJobSnapshot, ImportApiError>,
  now: string,
): IStatementImport => {
  if (response.ok) {
    const updated = applySnapshot(current, response.value, now);

    return updated;
  }

  if (response.error.code === 'IMPORT_NOT_FOUND') {
    const failed = markFailed(current, 'IMPORT_NOT_FOUND', now);

    return failed;
  }

  return current;
};

/** GET the job and pass the answer through the revision guard. Used by polling and "Refresh". */
export const refreshJob = async (deps: IImportDeps): Promise<RefreshResult> => {
  const { api, logger, now, store } = deps;
  const current = store.get();

  if (
    current?.job === null ||
    current === null ||
    current.job.status === 'deleted'
  ) {
    return ok({ outdatedSnapshot: NOTHING_IGNORED, statementImport: current });
  }

  const response = await api.getImport(current.job.jobId);
  const refreshed = applyJobResponse(current, response, now());

  if (refreshed === current) {
    // Same revision = the same state again; only a strictly older one is an outdated answer
    const outdatedSnapshot =
      response.ok && response.value.revision < current.job.revision
        ? response.value
        : NOTHING_IGNORED;

    if (outdatedSnapshot !== null) {
      logger.info(LogEvent.SnapshotIgnored, {
        revision: outdatedSnapshot.revision,
        status: outdatedSnapshot.status,
      });
    }

    return ok({ outdatedSnapshot, statementImport: current });
  }

  store.save(refreshed);
  logger.info(LogEvent.JobUpdated, {
    revision: refreshed.job?.revision,
    status: refreshed.job?.status,
  });

  return ok({ outdatedSnapshot: NOTHING_IGNORED, statementImport: refreshed });
};
