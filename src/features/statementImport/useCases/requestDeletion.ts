import {
  applySnapshot,
  DELETION_STATUSES,
  markDeletionNotConfirmed,
  requestDeletion as withDeletionRequested,
} from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import type {
  IImportDeps,
  StatementImportError,
} from '@features/statementImport/ports';
import { LogEvent } from '@shared/logger/LogEvent';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

type DeletionResult = Result<IStatementImport, StatementImportError>;

/**
 * Persists a stable delete key, then DELETE. 202 only means "deleting":
 * deletion is confirmed exclusively by a later GET returning `deleted`.
 */
export const requestDeletion = async (
  deps: IImportDeps,
): Promise<DeletionResult> => {
  const { api, generateKey, logger, now, store } = deps;
  const current = store.get();

  if (current?.job === null || current === null) {
    return err({ code: 'NO_ACTIVE_IMPORT' });
  }

  if (DELETION_STATUSES.includes(current.job.status)) {
    return err({ code: 'INVALID_STATE' });
  }

  const requested = withDeletionRequested(current, generateKey(), now());

  store.save(requested);
  logger.info(LogEvent.DeletionRequested, { jobId: current.job.jobId });

  const deleteKey = requested.deletion?.deleteKey ?? '';
  const response = await api.deleteImport(current.job.jobId, deleteKey);

  if (!response.ok) {
    const notConfirmed = markDeletionNotConfirmed(
      requested,
      response.error.code,
      now(),
    );

    store.save(notConfirmed);
    logger.warn(LogEvent.DeletionNotConfirmed, { code: response.error.code });

    return ok(notConfirmed);
  }

  const accepted = applySnapshot(requested, response.value, now());

  store.save(accepted);
  logger.info(LogEvent.DeletionAccepted, {
    revision: response.value.revision,
    status: response.value.status,
  });

  return ok(accepted);
};
