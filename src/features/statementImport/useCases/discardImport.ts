import { isDiscardable } from '@features/statementImport/domain/statementImport';
import type {
  IImportDeps,
  StatementImportError,
} from '@features/statementImport/ports';
import { LogEvent } from '@shared/logger/LogEvent';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

/**
 * - currentImport: cancel a draft or close a finished (failed / deleted-on-server) import;
 *   refused while the server may still hold the job.
 * - allLocalData: "Clear local data" — every private copy + persisted state, always allowed.
 * Neither deletes anything on the server.
 */
export type DiscardScope = 'allLocalData' | 'currentImport';

type DiscardResult = Result<null, StatementImportError>;

export const discardImport = async (
  deps: IImportDeps,
  scope: DiscardScope,
): Promise<DiscardResult> => {
  const { files, logger, store } = deps;
  const current = store.get();

  if (
    scope === 'currentImport' &&
    current !== null &&
    !isDiscardable(current)
  ) {
    return err({ code: 'IMPORT_NOT_DISCARDABLE' });
  }

  const currentCopy = current?.file.localPath ?? null;
  const copiesToRemove =
    scope === 'allLocalData' ? await files.listPrivateCopies() : [currentCopy];

  await Promise.all(
    copiesToRemove.map(path => (path === null ? null : files.remove(path))),
  );
  store.clear();
  logger.info(LogEvent.ImportCleared, { phase: scope });

  return ok(null);
};
