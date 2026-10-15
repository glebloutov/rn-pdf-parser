import { z } from 'zod';

import type {
  IImportReport,
  IJobSnapshot,
  JobStatus,
} from '@features/statementImport/domain/statementImport';
import type {
  ICreateImportRequest,
  IImportApi,
  ImportApiError,
} from '@features/statementImport/ports';
import { REQUEST_TIMEOUT_MS } from '@shared/config/apiConfig';
import { fetchWithTimeout } from '@shared/net/fetchWithTimeout';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

// ---- Response schemas (Zod) ----
export const jobStatusSchema = z.enum([
  'queued',
  'processing',
  'ready',
  'deleting',
  'deleted',
]) satisfies z.ZodType<JobStatus>;

const recurringChargeSchema = z.object({
  amountMinor: z.number().int(),
  cadence: z.string(),
  id: z.string(),
  lastSeen: z.string(),
  merchant: z.string(),
});

/** Report part of a `ready` response. */
export const importReportSchema = z.object({
  currency: z.string(),
  items: z.array(recurringChargeSchema),
}) satisfies z.ZodType<IImportReport>;

/** Fields every job response must have; anything else is ignored. */
export const jobResponseSchema = z.object({
  jobId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  status: jobStatusSchema,
});

// ---- Anti-corruption parsing ----
const READY_STATUS = 'ready';

/**
 * Anti-corruption layer: untrusted JSON → domain snapshot, or null when malformed.
 * The report is read only for `ready`; a malformed report is dropped, not trusted.
 */
export const parseJobSnapshot = (body: unknown): IJobSnapshot | null => {
  const job = jobResponseSchema.safeParse(body);

  if (!job.success) {
    return null;
  }

  const report =
    job.data.status === READY_STATUS
      ? importReportSchema.safeParse(body)
      : null;

  const snapshot: IJobSnapshot = {
    ...job.data,
    report: report?.success ? report.data : null,
  };

  return snapshot;
};

// ---- X-File-Name header ----
/** Server contract: X-File-Name must be 1–255 characters. */
export const MAX_HEADER_FILE_NAME_LENGTH = 255;
export const FALLBACK_FILE_NAME = 'statement';

/**
 * HTTP header values must be Latin-1; `fetch` throws on e.g. Cyrillic names.
 * Percent-encoding keeps the name ASCII and reversible; it's shortened by
 * dropping trailing characters until the encoded form fits the limit.
 */
export const toHeaderFileName = (fileName: string) => {
  const characters = Array.from(fileName.trim());

  while (characters.length > 0) {
    const encoded = encodeURIComponent(characters.join(''));

    if (encoded.length <= MAX_HEADER_FILE_NAME_LENGTH) {
      return encoded;
    }

    characters.pop();
  }

  return FALLBACK_FILE_NAME;
};

// ---- HTTP client ----
const HttpStatus = {
  Accepted: 202,
  BadRequest: 400,
  Conflict: 409,
  NotFound: 404,
  Ok: 200,
  PayloadTooLarge: 413,
  ServerErrorMin: 500,
  UnsupportedMediaType: 415,
} as const;

const OCTET_STREAM = 'application/octet-stream';

const IMPORTS_PATH = '/imports';

const STATUS_TO_ERROR: Record<number, ImportApiError> = {
  [HttpStatus.BadRequest]: { code: 'INVALID_REQUEST' },
  [HttpStatus.Conflict]: { code: 'IMPORT_CONFLICT' },
  [HttpStatus.NotFound]: { code: 'IMPORT_NOT_FOUND' },
  [HttpStatus.PayloadTooLarge]: { code: 'FILE_TOO_LARGE' },
  [HttpStatus.UnsupportedMediaType]: { code: 'UNSUPPORTED_CONTENT' },
};

type ApiResult = Result<IJobSnapshot, ImportApiError>;

const toErrorForStatus = (status: number): ImportApiError => {
  if (status >= HttpStatus.ServerErrorMin) {
    return { code: 'SERVICE_UNAVAILABLE', httpStatus: status };
  }

  const knownError = STATUS_TO_ERROR[status] ?? { code: 'UNEXPECTED_RESPONSE' };

  return knownError;
};

const readSnapshot = async (response: Response): Promise<ApiResult> => {
  if (
    response.status !== HttpStatus.Ok &&
    response.status !== HttpStatus.Accepted
  ) {
    return err(toErrorForStatus(response.status));
  }

  const body: unknown = await response.json().catch(() => null);
  const snapshot = parseJobSnapshot(body);

  return snapshot === null
    ? err({ code: 'UNEXPECTED_RESPONSE' })
    : ok(snapshot);
};

/** Driven adapter for the import mock API. No body, file name or key is ever logged here. */
export class HttpImportApi implements IImportApi {
  constructor(private readonly baseUrl: string) {}

  createImport({ bytes, fileName, idempotencyKey }: ICreateImportRequest) {
    const init: RequestInit = {
      body: bytes,
      headers: {
        'Content-Type': OCTET_STREAM,
        'Idempotency-Key': idempotencyKey,
        'X-File-Name': toHeaderFileName(fileName),
      },
      method: 'POST',
    };

    return this.request(IMPORTS_PATH, init);
  }

  async findImportByKey(
    idempotencyKey: string,
  ): Promise<Result<IJobSnapshot | null, ImportApiError>> {
    const path = `${IMPORTS_PATH}/by-key/${encodeURIComponent(idempotencyKey)}`;
    const result = await this.request(path, { method: 'GET' });

    if (!result.ok && result.error.code === 'IMPORT_NOT_FOUND') {
      return ok(null);
    }

    return result;
  }

  getImport(jobId: string) {
    return this.request(`${IMPORTS_PATH}/${encodeURIComponent(jobId)}`, {
      method: 'GET',
    });
  }

  deleteImport(jobId: string, deleteKey: string) {
    const init: RequestInit = {
      headers: { 'Idempotency-Key': deleteKey },
      method: 'DELETE',
    };

    return this.request(`${IMPORTS_PATH}/${encodeURIComponent(jobId)}`, init);
  }

  private async request(path: string, init: RequestInit): Promise<ApiResult> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetchWithTimeout(url, init, REQUEST_TIMEOUT_MS);
      const result = await readSnapshot(response);

      return result;
    } catch {
      // No HTTP response at all (socket closed, timeout, offline): outcome unknown
      return err({ code: 'NETWORK_UNAVAILABLE' });
    }
  }
}
