import type {
  IImportDeps,
  StatementImportError,
  StoreListener,
} from '@features/statementImport/ports';
import { discardImport } from '@features/statementImport/useCases/discardImport';
import type { DiscardScope } from '@features/statementImport/useCases/discardImport';
import { recoverImport } from '@features/statementImport/useCases/recoverImport';
import type { IJobSnapshot } from '@features/statementImport/domain/statementImport';
import { refreshJob } from '@features/statementImport/useCases/refreshJob';
import { requestDeletion } from '@features/statementImport/useCases/requestDeletion';
import { selectFile } from '@features/statementImport/useCases/selectFile';
import { submitImport } from '@features/statementImport/useCases/submitImport';
import { err } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

type GateError = { code: 'OPERATION_IN_PROGRESS' };

/** Outdated server answers ignored for one job (in memory; shown in dev builds for stale_status). */
export interface IOutdatedResponses {
  count: number;
  jobId: string;
  last: IJobSnapshot;
}

/**
 * Composition root of the feature: binds the use cases to their ports.
 *
 * Gate: one state-changing operation at a time. A double tap, a poll racing a
 * DELETE, or recovery racing a submit is refused (OPERATION_IN_PROGRESS)
 * instead of sending a second request. Use cases themselves don't know about it.
 */
export const createStatementImportModule = (deps: IImportDeps) => {
  let isBusy = false;
  let outdatedResponses: IOutdatedResponses | null = null;
  const outdatedListeners = new Set<StoreListener>();

  const recordOutdated = (snapshot: IJobSnapshot) => {
    const isSameJob = outdatedResponses?.jobId === snapshot.jobId;
    const count =
      isSameJob && outdatedResponses ? outdatedResponses.count + 1 : 1;

    outdatedResponses = { count, jobId: snapshot.jobId, last: snapshot };
    outdatedListeners.forEach(listener => listener());
  };

  const refreshAndRecord = async () => {
    const result = await refreshJob(deps);

    if (result.ok && result.value.outdatedSnapshot !== null) {
      recordOutdated(result.value.outdatedSnapshot);
    }

    return result;
  };

  const runExclusive = async <TValue>(
    operation: () => Promise<Result<TValue, StatementImportError>>,
  ): Promise<Result<TValue, StatementImportError | GateError>> => {
    if (isBusy) {
      return err({ code: 'OPERATION_IN_PROGRESS' });
    }

    isBusy = true;

    try {
      const result = await operation();

      return result;
    } finally {
      isBusy = false;
    }
  };

  const statementImportModule = {
    /** Read side for the UI (useSyncExternalStore): persisted import + change notifications. */
    currentImport: {
      get: () => deps.store.get(),
      subscribe: (listener: StoreListener) => deps.store.subscribe(listener),
    },
    discardImport: (scope: DiscardScope) =>
      runExclusive(() => discardImport(deps, scope)),
    recoverImport: () => runExclusive(() => recoverImport(deps)),
    /** Read side for the UI: outdated answers ignored by the revision guard (stale_status evidence). */
    outdatedResponses: {
      get: () => outdatedResponses,
      subscribe: (listener: StoreListener) => {
        outdatedListeners.add(listener);

        return () => {
          outdatedListeners.delete(listener);
        };
      },
    },
    refreshJob: () => runExclusive(refreshAndRecord),
    requestDeletion: () => runExclusive(() => requestDeletion(deps)),
    selectFile: () => runExclusive(() => selectFile(deps)),
    submitImport: () => runExclusive(() => submitImport(deps)),
  };

  return statementImportModule;
};

export type StatementImportModule = ReturnType<
  typeof createStatementImportModule
>;
