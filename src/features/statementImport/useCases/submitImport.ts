import {
  applySnapshot,
  forgetLocalCopy,
  markFailed,
  markSubmitting,
  markSubmitUncertain,
} from '@features/statementImport/domain/statementImport';
import type {
  ImportFailureCode,
  IStatementImport,
} from '@features/statementImport/domain/statementImport';
import type {
  IImportDeps,
  ImportApiErrorCode,
  StatementImportError,
} from '@features/statementImport/ports';
import { LogEvent } from '@shared/logger/LogEvent';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

type SubmitResult = Result<IStatementImport, StatementImportError>;

/** Server answered and nothing was created: retrying with these bytes can't succeed. */
const TERMINAL_CREATE_ERRORS: ReadonlyArray<ImportApiErrorCode> = [
  'FILE_TOO_LARGE',
  'IMPORT_CONFLICT',
  'INVALID_REQUEST',
  'UNSUPPORTED_CONTENT',
];

const SUBMITTABLE_PHASES = ['draft', 'submitUncertain'];

const send = async (
  deps: IImportDeps,
  submitting: IStatementImport,
  localPath: string,
): Promise<IStatementImport> => {
  const { api, files, logger, now } = deps;
  const bytes = await files.readAll(localPath);
  const response = await api.createImport({
    bytes,
    fileName: submitting.file.displayName,
    idempotencyKey: submitting.idempotencyKey,
  });

  if (response.ok) {
    await files.remove(localPath);

    const submitted = forgetLocalCopy(
      applySnapshot(submitting, response.value, now()),
      now(),
    );

    logger.info(LogEvent.ImportSubmitted, {
      jobId: response.value.jobId,
      revision: response.value.revision,
    });

    return submitted;
  }

  const { code } = response.error;

  if (TERMINAL_CREATE_ERRORS.includes(code)) {
    await files.remove(localPath);
    logger.warn(LogEvent.ImportFailed, { code });

    const failed = forgetLocalCopy(
      markFailed(submitting, code as ImportFailureCode, now()),
      now(),
    );

    return failed;
  }

  logger.warn(LogEvent.SubmitUncertain, { code });

  const uncertain = markSubmitUncertain(submitting, now());

  return uncertain;
};

/**
 * First upload and explicit same-key retry. The `submitting` phase is persisted
 * before the request so a kill mid-request is recovered by key, never re-sent.
 */
export const submitImport = async (
  deps: IImportDeps,
): Promise<SubmitResult> => {
  const { files, now, store } = deps;
  const current = store.get();

  if (current === null) {
    return err({ code: 'NO_ACTIVE_IMPORT' });
  }

  if (!SUBMITTABLE_PHASES.includes(current.phase)) {
    return err({ code: 'INVALID_STATE' });
  }

  const { localPath } = current.file;
  const isCopyAvailable = localPath !== null && (await files.exists(localPath));

  if (!isCopyAvailable) {
    const failed = markFailed(current, 'LOCAL_COPY_MISSING', now());

    store.save(failed);

    return ok(failed);
  }

  const submitting = markSubmitting(current, now());

  store.save(submitting);

  const settled = await send(deps, submitting, localPath);

  store.save(settled);

  return ok(settled);
};
