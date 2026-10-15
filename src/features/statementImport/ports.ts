import type {
  IJobSnapshot,
  IStatementImport,
} from '@features/statementImport/domain/statementImport';
import type { StatementFileError } from '@features/statementImport/domain/validateFile';
import type { ILogger } from '@shared/logger/ILogger';
import type { Result } from '@shared/result/Result';

/*
 * Ports: everything a use case needs from the outside world. Use cases depend
 * only on these interfaces; `adapters/` implements them for the device, tests
 * use fakes or Node implementations against the real mock.
 */

// ---- Import API (server) ----

/**
 * - NETWORK_UNAVAILABLE: no HTTP response (lost ack, timeout, offline) → outcome unknown
 * - SERVICE_UNAVAILABLE: 5xx → retriable, outcome unknown for writes
 * - others: terminal answers from the server
 */
export type ImportApiError =
  | { code: 'FILE_TOO_LARGE' }
  | { code: 'IMPORT_CONFLICT' }
  | { code: 'IMPORT_NOT_FOUND' }
  | { code: 'INVALID_REQUEST' }
  | { code: 'NETWORK_UNAVAILABLE' }
  | { code: 'SERVICE_UNAVAILABLE'; httpStatus: number }
  | { code: 'UNEXPECTED_RESPONSE' }
  | { code: 'UNSUPPORTED_CONTENT' };

export type ImportApiErrorCode = ImportApiError['code'];

export interface ICreateImportRequest {
  bytes: Uint8Array;
  fileName: string;
  idempotencyKey: string;
}

export interface IImportApi {
  createImport(
    request: ICreateImportRequest,
  ): Promise<Result<IJobSnapshot, ImportApiError>>;
  deleteImport(
    jobId: string,
    deleteKey: string,
  ): Promise<Result<IJobSnapshot, ImportApiError>>;
  /** `null` = not found *at that instant* (404). */
  findImportByKey(
    idempotencyKey: string,
  ): Promise<Result<IJobSnapshot | null, ImportApiError>>;
  getImport(jobId: string): Promise<Result<IJobSnapshot, ImportApiError>>;
}

// ---- File picker (OS document picker) ----

export interface IPickedFile {
  displayName: string;
  /** Size claimed by the OS; may be missing and is never trusted for acceptance. */
  reportedSizeBytes: number | null;
  sourceUri: string;
}

export type PickError = { code: 'PICK_CANCELLED' } | { code: 'PICK_FAILED' };

export type CopyError = { code: 'COPY_FAILED' };

export interface IFilePicker {
  /** Copies the picked document into the app-private copies folder; returns the local path. */
  copyToPrivateStorage(file: IPickedFile): Promise<Result<string, CopyError>>;
  pick(): Promise<Result<IPickedFile, PickError>>;
  /** Releases temporary OS access / removes the OS temp copy of the source. */
  releaseAccess(file: IPickedFile): Promise<void>;
}

// ---- Private file copies ----

export interface IFileStore {
  exists(path: string): Promise<boolean>;
  /** Paths of every file in our private copies folder. */
  listPrivateCopies(): Promise<string[]>;
  readAll(path: string): Promise<Uint8Array>;
  readHead(path: string, length: number): Promise<Uint8Array>;
  /** Missing files are ignored — removal must be safe to repeat. */
  remove(path: string): Promise<void>;
  size(path: string): Promise<number>;
}

// ---- Persisted import state ----

export type StoreListener = () => void;

/** Synchronous by design: MMKV is synchronous and the UI reads it via useSyncExternalStore. */
export interface IImportStore {
  clear(): void;
  /** Returns the same object until the next save/clear (stable snapshot for React). */
  get(): IStatementImport | null;
  save(statementImport: IStatementImport): void;
  /** Returns an unsubscribe function — required by the useSyncExternalStore contract. */
  subscribe(listener: StoreListener): () => void;
}

// ---- Everything a use case receives ----

export interface IImportDeps {
  api: IImportApi;
  files: IFileStore;
  /** New idempotency / delete key (uuid v4 on device). */
  generateKey: () => string;
  logger: ILogger;
  /** Current time as an ISO string. */
  now: () => string;
  picker: IFilePicker;
  store: IImportStore;
}

// ---- Errors a use case can return ----

export type StatementImportError =
  | CopyError
  | ImportApiError
  | PickError
  | StatementFileError
  | { code: 'IMPORT_ALREADY_ACTIVE' }
  | { code: 'IMPORT_NOT_DISCARDABLE' }
  | { code: 'INVALID_STATE' }
  | { code: 'NO_ACTIVE_IMPORT' }
  | { code: 'OPERATION_IN_PROGRESS' };

export type StatementImportErrorCode = StatementImportError['code'];
