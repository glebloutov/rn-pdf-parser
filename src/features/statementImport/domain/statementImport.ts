import type { StatementFormat } from '@features/statementImport/domain/validateFile';

// ---- Server job ----
export type JobStatus =
  'deleted' | 'deleting' | 'processing' | 'queued' | 'ready';

export interface IRecurringCharge {
  amountMinor: number;
  cadence: string;
  id: string;
  lastSeen: string;
  merchant: string;
}

export interface IImportReport {
  currency: string;
  items: IRecurringCharge[];
}

/** One authoritative server view of a job, as returned by POST/GET/DELETE. */
export interface IJobSnapshot {
  jobId: string;
  /** Present only when status is `ready`. */
  report: IImportReport | null;
  revision: number;
  status: JobStatus;
}

export const DELETION_STATUSES: ReadonlyArray<JobStatus> = [
  'deleting',
  'deleted',
];
export const PENDING_STATUSES: ReadonlyArray<JobStatus> = [
  'queued',
  'processing',
  'deleting',
];

// ---- Failure codes ----
/** Terminal reasons an import can't continue. Mapped to user messages in the i18n catalog. */
export type ImportFailureCode =
  | 'FILE_TOO_LARGE'
  | 'IMPORT_CONFLICT'
  | 'IMPORT_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'LOCAL_COPY_MISSING'
  | 'UNEXPECTED_RESPONSE'
  | 'UNSUPPORTED_CONTENT';

// ---- Import aggregate ----
/**
 * - draft: file validated, idempotency key generated and persisted, not sent yet
 * - submitting: POST in flight (persisted before sending)
 * - submitUncertain: POST outcome unknown (lost ack / network / 5xx) — recover by key
 * - submitted: server job known; its state lives in `job`
 * - failed: terminal client-visible failure, nothing more to send
 */
export type ImportPhase =
  'draft' | 'failed' | 'submitUncertain' | 'submitted' | 'submitting';

export type DeletionState = 'accepted' | 'notConfirmed' | 'requested';

export interface IStatementFile {
  displayName: string;
  format: StatementFormat;
  /** Private copy used for (re)upload; null once the server has the bytes. */
  localPath: string | null;
  sizeBytes: number;
}

export interface IDeletion {
  deleteKey: string;
  lastErrorCode: string | null;
  state: DeletionState;
}

export interface IStatementImport {
  createdAt: string;
  deletion: IDeletion | null;
  failureCode: ImportFailureCode | null;
  file: IStatementFile;
  idempotencyKey: string;
  job: IJobSnapshot | null;
  phase: ImportPhase;
  updatedAt: string;
}

interface ICreateDraftParams {
  file: IStatementFile;
  idempotencyKey: string;
  now: string;
}

export const createDraft = ({
  file,
  idempotencyKey,
  now,
}: ICreateDraftParams): IStatementImport => ({
  createdAt: now,
  deletion: null,
  failureCode: null,
  file,
  idempotencyKey,
  job: null,
  phase: 'draft',
  updatedAt: now,
});

export const markSubmitting = (
  current: IStatementImport,
  now: string,
): IStatementImport => ({
  ...current,
  failureCode: null,
  phase: 'submitting',
  updatedAt: now,
});

export const markSubmitUncertain = (
  current: IStatementImport,
  now: string,
): IStatementImport => ({
  ...current,
  phase: 'submitUncertain',
  updatedAt: now,
});

export const markFailed = (
  current: IStatementImport,
  failureCode: ImportFailureCode,
  now: string,
): IStatementImport => ({
  ...current,
  failureCode,
  phase: 'failed',
  updatedAt: now,
});

export const forgetLocalCopy = (
  current: IStatementImport,
  now: string,
): IStatementImport => ({
  ...current,
  file: { ...current.file, localPath: null },
  updatedAt: now,
});

const isDeletionStatus = (snapshot: IJobSnapshot) =>
  DELETION_STATUSES.includes(snapshot.status);

const isStaleSnapshot = (job: IJobSnapshot, snapshot: IJobSnapshot) => {
  const isOtherJob = snapshot.jobId !== job.jobId;
  const isOlderOrSame = snapshot.revision <= job.revision;
  const isDeletedAlready = job.status === 'deleted';
  // A late non-deletion response must never resurrect a job being deleted
  const isResurrection = isDeletionStatus(job) && !isDeletionStatus(snapshot);

  return isOtherJob || isOlderOrSame || isDeletedAlready || isResurrection;
};

const toAcceptedJob = (snapshot: IJobSnapshot): IJobSnapshot => {
  const report = snapshot.status === 'ready' ? snapshot.report : null;

  return { ...snapshot, report };
};

const nextDeletion = (
  deletion: IDeletion | null,
  snapshot: IJobSnapshot,
): IDeletion | null => {
  if (deletion === null || !isDeletionStatus(snapshot)) {
    return deletion;
  }

  return { ...deletion, lastErrorCode: null, state: 'accepted' };
};

/**
 * The only entry point for server state. Every POST/GET/DELETE response goes
 * through the revision guard, so stale, duplicate or late responses are no-ops
 * (the same object is returned).
 */
export const applySnapshot = (
  current: IStatementImport,
  snapshot: IJobSnapshot,
  now: string,
): IStatementImport => {
  if (current.job !== null && isStaleSnapshot(current.job, snapshot)) {
    return current;
  }

  const updated: IStatementImport = {
    ...current,
    deletion: nextDeletion(current.deletion, snapshot),
    failureCode: null,
    job: toAcceptedJob(snapshot),
    phase: 'submitted',
    updatedAt: now,
  };

  return updated;
};

/** Persist the delete key before DELETE; a retry reuses the stored key. */
export const requestDeletion = (
  current: IStatementImport,
  deleteKey: string,
  now: string,
): IStatementImport => {
  const stableDeleteKey = current.deletion?.deleteKey ?? deleteKey;

  return {
    ...current,
    deletion: {
      deleteKey: stableDeleteKey,
      lastErrorCode: null,
      state: 'requested',
    },
    updatedAt: now,
  };
};

export const markDeletionNotConfirmed = (
  current: IStatementImport,
  errorCode: string,
  now: string,
): IStatementImport => {
  if (current.deletion === null) {
    return current;
  }

  return {
    ...current,
    deletion: {
      ...current.deletion,
      lastErrorCode: errorCode,
      state: 'notConfirmed',
    },
    updatedAt: now,
  };
};

export const isAwaitingServer = (current: IStatementImport) => {
  const isJobPending =
    current.job !== null && PENDING_STATUSES.includes(current.job.status);

  return isJobPending;
};

export const isDeletedOnServer = (current: IStatementImport) =>
  current.job?.status === 'deleted';

export const needsRecovery = (current: IStatementImport) =>
  current.phase === 'submitting' || current.phase === 'submitUncertain';

/** Import is finished from the user's point of view and can be discarded locally. */
export const isDiscardable = (current: IStatementImport) =>
  current.phase === 'draft' ||
  current.phase === 'failed' ||
  isDeletedOnServer(current);

// ---- Money ----
export const MONTHLY_CADENCE = 'monthly';
export const MINOR_UNITS_IN_MAJOR = 100;

export const monthlyTotalMinor = (charges: IRecurringCharge[]) => {
  const totalMinor = charges.reduce(
    (sum, charge) =>
      charge.cadence === MONTHLY_CADENCE ? sum + charge.amountMinor : sum,
    0,
  );

  return totalMinor;
};

export const toMajorUnits = (amountMinor: number) => {
  const amountMajor = amountMinor / MINOR_UNITS_IN_MAJOR;

  return amountMajor;
};
