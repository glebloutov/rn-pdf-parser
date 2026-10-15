import { createDraft } from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import {
  HEAD_BYTES,
  MAX_STATEMENT_SIZE_BYTES,
  validateStatementFile,
} from '@features/statementImport/domain/validateFile';
import type {
  IImportDeps,
  IPickedFile,
  StatementImportError,
} from '@features/statementImport/ports';
import { LogEvent } from '@shared/logger/LogEvent';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

type SelectResult = Result<IStatementImport, StatementImportError>;

const isReportedOversize = (file: IPickedFile) =>
  file.reportedSizeBytes !== null &&
  file.reportedSizeBytes > MAX_STATEMENT_SIZE_BYTES;

const copyAndValidate = async (
  deps: IImportDeps,
  file: IPickedFile,
): Promise<SelectResult> => {
  const { files, generateKey, logger, now, picker, store } = deps;

  if (isReportedOversize(file)) {
    logger.warn(LogEvent.FileRejected, { code: 'FILE_TOO_LARGE' });

    return err({
      code: 'FILE_TOO_LARGE',
      limitBytes: MAX_STATEMENT_SIZE_BYTES,
      sizeBytes: file.reportedSizeBytes ?? MAX_STATEMENT_SIZE_BYTES,
    });
  }

  const copied = await picker.copyToPrivateStorage(file);

  if (!copied.ok) {
    return copied;
  }

  const localPath = copied.value;
  const sizeBytes = await files.size(localPath);
  const head = await files.readHead(localPath, HEAD_BYTES);
  const validation = validateStatementFile({ head, sizeBytes });

  if (!validation.ok) {
    await files.remove(localPath);
    logger.warn(LogEvent.FileRejected, { code: validation.error.code });

    return validation;
  }

  const draft = createDraft({
    file: {
      displayName: file.displayName,
      format: validation.value,
      localPath,
      sizeBytes,
    },
    idempotencyKey: generateKey(),
    now: now(),
  });

  store.save(draft);
  logger.info(LogEvent.FileSelected, { phase: draft.phase });

  return ok(draft);
};

/**
 * Pick → private copy → measure + sniff the copy → reject (copy deleted) or
 * persist a draft with a freshly generated idempotency key. Nothing is sent.
 */
export const selectFile = async (deps: IImportDeps): Promise<SelectResult> => {
  const { picker, store } = deps;

  if (store.get() !== null) {
    return err({ code: 'IMPORT_ALREADY_ACTIVE' });
  }

  const picked = await picker.pick();

  if (!picked.ok) {
    return picked;
  }

  try {
    const result = await copyAndValidate(deps, picked.value);

    return result;
  } finally {
    await picker.releaseAccess(picked.value);
  }
};
