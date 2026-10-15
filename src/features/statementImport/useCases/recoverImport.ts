import {
  applySnapshot,
  DELETION_STATUSES,
  forgetLocalCopy,
  isDeletedOnServer,
  markDeletionNotConfirmed,
  markSubmitUncertain,
  needsRecovery,
} from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import type {
  IImportDeps,
  StatementImportError,
} from '@features/statementImport/ports';
import { applyJobResponse } from '@features/statementImport/useCases/refreshJob';
import { LogEvent } from '@shared/logger/LogEvent';
import { ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

export type RecoveryOutcome =
  'nothingToRecover' | 'notFound' | 'recovered' | 'refreshed' | 'unavailable';

type RecoverResult = Result<RecoveryOutcome, StatementImportError>;

const INTERRUPTED_DELETION_CODE = 'INTERRUPTED';

/** Copies not referenced by the persisted import are leftovers — delete them. */
const removeOrphanCopies = async ({ files, logger, store }: IImportDeps) => {
  const referencedPath = store.get()?.file.localPath ?? null;
  const copies = await files.listPrivateCopies();
  const orphanCopies = copies.filter(path => path !== referencedPath);

  await Promise.all(orphanCopies.map(path => files.remove(path)));

  if (orphanCopies.length > 0) {
    logger.info(LogEvent.OrphanCopiesRemoved, {
      code: String(orphanCopies.length),
    });
  }
};

const recoverSubmission = async (
  deps: IImportDeps,
  current: IStatementImport,
): Promise<RecoveryOutcome> => {
  const { api, files, logger, now, store } = deps;
  const response = await api.findImportByKey(current.idempotencyKey);

  if (!response.ok || response.value === null) {
    store.save(markSubmitUncertain(current, now()));

    return response.ok ? 'notFound' : 'unavailable';
  }

  if (current.file.localPath !== null) {
    await files.remove(current.file.localPath);
  }

  const recovered = forgetLocalCopy(
    applySnapshot(current, response.value, now()),
    now(),
  );

  store.save(recovered);
  logger.info(LogEvent.ImportRecovered, {
    jobId: response.value.jobId,
    revision: response.value.revision,
  });

  return 'recovered';
};

const refreshKnownJob = async (
  { api, now, store }: IImportDeps,
  current: IStatementImport,
) => {
  if (current.job === null) {
    return;
  }

  const response = await api.getImport(current.job.jobId);
  const refreshed = applyJobResponse(current, response, now());
  // A delete interrupted by a kill: if the server isn't deleting, it must be retried
  const isDeleteInterrupted =
    refreshed.deletion?.state === 'requested' &&
    refreshed.job !== null &&
    !DELETION_STATUSES.includes(refreshed.job.status);
  const settled = isDeleteInterrupted
    ? markDeletionNotConfirmed(refreshed, INTERRUPTED_DELETION_CODE, now())
    : refreshed;

  if (settled !== current) {
    store.save(settled);
  }
};

/**
 * Runs on launch, when the app returns to foreground and on "Check again".
 * First removes orphan private copies (left by a crash/kill), then reads the
 * server state. It never re-sends the file; a not-found POST is left for an
 * explicit retry.
 */
export const recoverImport = async (
  deps: IImportDeps,
): Promise<RecoverResult> => {
  await removeOrphanCopies(deps);

  const current = deps.store.get();

  // A confirmed server deletion is final: nothing to read back
  if (
    current === null ||
    current.phase === 'draft' ||
    current.phase === 'failed' ||
    isDeletedOnServer(current)
  ) {
    return ok('nothingToRecover');
  }

  if (needsRecovery(current)) {
    const outcome = await recoverSubmission(deps, current);

    return ok(outcome);
  }

  await refreshKnownJob(deps, current);

  return ok('refreshed');
};
