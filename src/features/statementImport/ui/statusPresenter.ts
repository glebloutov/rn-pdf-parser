import type statementImport from '@features/statementImport/i18n/en';
import type { ImportFailureCode } from '@features/statementImport/domain/statementImport';
import type {
  IImportReport,
  JobStatus,
} from '@features/statementImport/domain/statementImport';
import {
  isAwaitingServer,
  isDeletedOnServer,
} from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';

export type StatusKey = JobStatus | 'failed' | 'submitUncertain' | 'submitting';
export type StatusHintKey = 'processing' | 'queued' | 'submitUncertain';
export type DeletionMessageKey =
  'accepted' | 'deleted' | 'inProgress' | 'notConfirmed';
export type StatusTone = 'danger' | 'neutral' | 'success' | 'warning';

export interface IImportStatusActions {
  canCheckAgain: boolean;
  canDelete: boolean;
  canRefresh: boolean;
  canRetryDeletion: boolean;
  canRetryUpload: boolean;
  canStartNew: boolean;
}

export interface IImportStatusView {
  actions: IImportStatusActions;
  deletionErrorCode: string | null;
  deletionMessageKey: DeletionMessageKey | null;
  failureCode: ImportFailureCode | null;
  hintKey: StatusHintKey | null;
  isPending: boolean;
  job: { jobId: string; revision: number } | null;
  report: IImportReport | null;
  statusKey: StatusKey;
  tone: StatusTone;
}

const NO_ACTIONS: IImportStatusActions = {
  canCheckAgain: false,
  canDelete: false,
  canRefresh: false,
  canRetryDeletion: false,
  canRetryUpload: false,
  canStartNew: false,
};

const HINT_BY_STATUS: Partial<Record<StatusKey, StatusHintKey>> = {
  processing: 'processing',
  queued: 'queued',
  submitUncertain: 'submitUncertain',
};

const TONE_BY_STATUS: Partial<Record<StatusKey, StatusTone>> = {
  deleted: 'success',
  failed: 'danger',
  ready: 'success',
  submitUncertain: 'warning',
};

const toStatusKey = (current: IStatementImport): StatusKey => {
  if (
    current.phase === 'failed' ||
    current.phase === 'submitUncertain' ||
    current.phase === 'submitting'
  ) {
    return current.phase;
  }

  return current.job?.status ?? 'submitting';
};

const toDeletionMessageKey = (
  current: IStatementImport,
): DeletionMessageKey | null => {
  if (isDeletedOnServer(current)) {
    return 'deleted';
  }

  if (current.job?.status === 'deleting') {
    return 'accepted';
  }

  if (current.deletion?.state === 'requested') {
    return 'inProgress';
  }

  return current.deletion?.state === 'notConfirmed' ? 'notConfirmed' : null;
};

const toActions = (
  current: IStatementImport,
  statusKey: StatusKey,
): IImportStatusActions => {
  const deletionState = current.deletion?.state ?? null;
  const isReady = statusKey === 'ready' && current.phase === 'submitted';
  const isJobKnown = current.job !== null && current.phase === 'submitted';

  return {
    ...NO_ACTIONS,
    canCheckAgain: statusKey === 'submitUncertain',
    canDelete: isReady && deletionState === null,
    canRefresh: isJobKnown && !isDeletedOnServer(current),
    canRetryDeletion: isReady && deletionState === 'notConfirmed',
    canRetryUpload: statusKey === 'submitUncertain',
    canStartNew: statusKey === 'failed' || isDeletedOnServer(current),
  };
};

/** Pure mapping persisted import → what the status panel shows and allows. */
export const toImportStatusView = (
  current: IStatementImport,
): IImportStatusView => {
  const statusKey = toStatusKey(current);
  const deletionMessageKey = toDeletionMessageKey(current);
  const isDeletionNotConfirmed = deletionMessageKey === 'notConfirmed';

  const view: IImportStatusView = {
    actions: toActions(current, statusKey),
    deletionErrorCode: isDeletionNotConfirmed
      ? (current.deletion?.lastErrorCode ?? null)
      : null,
    deletionMessageKey,
    failureCode: current.failureCode,
    hintKey: HINT_BY_STATUS[statusKey] ?? null,
    isPending: statusKey === 'submitting' || isAwaitingServer(current),
    job:
      current.job === null
        ? null
        : { jobId: current.job.jobId, revision: current.job.revision },
    report: statusKey === 'ready' ? (current.job?.report ?? null) : null,
    statusKey,
    tone: isDeletionNotConfirmed
      ? 'warning'
      : (TONE_BY_STATUS[statusKey] ?? 'neutral'),
  };

  return view;
};

// ---- Event toasts ----
export type StatusToastKey =
  | 'deleted'
  | 'deletionNotConfirmed'
  | 'importFailed'
  | 'reportReady'
  | 'uploadAccepted'
  | 'uploadUncertain';

export interface IStatusToast {
  key: StatusToastKey;
  tone: 'danger' | 'success' | 'warning';
}

const UPLOAD_PENDING_KEYS: ReadonlyArray<StatusKey> = [
  'submitting',
  'submitUncertain',
];

/**
 * Which notification a change of the saved import deserves (null = none).
 * Only changes of the same import count, so a relaunch or a new import never replays old events.
 */
export const toStatusToast = (
  previous: IStatementImport | null,
  next: IStatementImport | null,
): IStatusToast | null => {
  if (
    previous === null ||
    next === null ||
    previous.idempotencyKey !== next.idempotencyKey ||
    next.phase === 'draft'
  ) {
    return null;
  }

  const before = toImportStatusView(previous);
  const after = toImportStatusView(next);

  if (after.deletionMessageKey !== before.deletionMessageKey) {
    if (after.deletionMessageKey === 'deleted') {
      return { key: 'deleted', tone: 'success' };
    }

    if (after.deletionMessageKey === 'notConfirmed') {
      return { key: 'deletionNotConfirmed', tone: 'warning' };
    }
  }

  if (after.statusKey === before.statusKey) {
    return null;
  }

  if (after.statusKey === 'ready') {
    return { key: 'reportReady', tone: 'success' };
  }

  if (after.statusKey === 'submitUncertain') {
    return { key: 'uploadUncertain', tone: 'warning' };
  }

  if (after.statusKey === 'failed') {
    return { key: 'importFailed', tone: 'danger' };
  }

  const isUploadAccepted =
    UPLOAD_PENDING_KEYS.includes(before.statusKey) &&
    (after.statusKey === 'queued' || after.statusKey === 'processing');

  return isUploadAccepted ? { key: 'uploadAccepted', tone: 'success' } : null;
};

// ---- Home step ----
export type HomeMode = 'confirm' | 'empty' | 'status';

export const toHomeMode = (
  statementImport: IStatementImport | null,
): HomeMode => {
  if (statementImport === null) {
    return 'empty';
  }

  return statementImport.phase === 'draft' ? 'confirm' : 'status';
};

// ---- Error message keys ----
export type ErrorMessageCode = keyof (typeof statementImport)['errors'];

const FALLBACK_ERROR_CODE: ErrorMessageCode = 'UNEXPECTED_RESPONSE';

const KNOWN_ERROR_CODES: ReadonlyArray<ErrorMessageCode> = [
  'COPY_FAILED',
  'EMPTY_FILE',
  'FILE_TOO_LARGE',
  'IMPORT_ALREADY_ACTIVE',
  'IMPORT_CONFLICT',
  'IMPORT_NOT_DISCARDABLE',
  'IMPORT_NOT_FOUND',
  'INTERRUPTED',
  'INVALID_REQUEST',
  'INVALID_STATE',
  'LOCAL_COPY_MISSING',
  'NETWORK_UNAVAILABLE',
  'NO_ACTIVE_IMPORT',
  'OPERATION_IN_PROGRESS',
  'PICK_CANCELLED',
  'PICK_FAILED',
  'SERVICE_UNAVAILABLE',
  'UNEXPECTED_RESPONSE',
  'UNSUPPORTED_CONTENT',
];

/** Any error code → a key of the message catalog; raw server text is never shown. */
export const toErrorMessageCode = (code: string): ErrorMessageCode => {
  const knownCode = KNOWN_ERROR_CODES.find(candidate => candidate === code);

  return knownCode ?? FALLBACK_ERROR_CODE;
};
