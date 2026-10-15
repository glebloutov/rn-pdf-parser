import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

// ---- Limits and signatures (mirror the server) ----
const BYTES_IN_MEBIBYTE = 1024 * 1024;
const MAX_STATEMENT_SIZE_MEBIBYTES = 10;

export const MAX_STATEMENT_SIZE_BYTES =
  MAX_STATEMENT_SIZE_MEBIBYTES * BYTES_IN_MEBIBYTE;

/** Same sniffing window as the server: it reads exactly 24 bytes for CSV and 5 for PDF. */
export const HEAD_BYTES = 24;
export const PDF_SIGNATURE = '%PDF-';
export const CSV_HEADER = 'date,description,amount\n';
export const CARRIAGE_RETURN = '\r';

// ---- Format detection ----
export type StatementFormat = 'csv' | 'pdf';

/**
 * Header bytes are compared as single-byte characters. The signatures are
 * ASCII, so this matches the server's UTF-8 comparison: any non-ASCII byte
 * (e.g. a BOM) can't match either way.
 */
const toByteString = (bytes: Uint8Array) => {
  const characters = Array.from(bytes, byte => String.fromCharCode(byte));
  const byteString = characters.join('');

  return byteString;
};

export const detectStatementFormat = (
  head: Uint8Array,
): StatementFormat | null => {
  const headText = toByteString(head.subarray(0, HEAD_BYTES));

  if (headText.startsWith(PDF_SIGNATURE)) {
    return 'pdf';
  }

  const csvCandidate = headText.split(CARRIAGE_RETURN).join('');

  if (csvCandidate.startsWith(CSV_HEADER)) {
    return 'csv';
  }

  return null;
};

// ---- Validation ----
export type StatementFileError =
  | { code: 'EMPTY_FILE' }
  | { code: 'FILE_TOO_LARGE'; limitBytes: number; sizeBytes: number }
  | { code: 'UNSUPPORTED_CONTENT' };

export interface IStatementFileProbe {
  /** First bytes of the file (at least HEAD_BYTES when the file is long enough). */
  head: Uint8Array;
  /** Size measured on the private copy — never the picker's or server's claim. */
  sizeBytes: number;
}

/** Content-based check. Extension and declared MIME type are never trusted. */
export const validateStatementFile = ({
  head,
  sizeBytes,
}: IStatementFileProbe): Result<StatementFormat, StatementFileError> => {
  if (sizeBytes === 0) {
    return err({ code: 'EMPTY_FILE' });
  }

  if (sizeBytes > MAX_STATEMENT_SIZE_BYTES) {
    return err({
      code: 'FILE_TOO_LARGE',
      limitBytes: MAX_STATEMENT_SIZE_BYTES,
      sizeBytes,
    });
  }

  const format = detectStatementFormat(head);

  if (format === null) {
    return err({ code: 'UNSUPPORTED_CONTENT' });
  }

  return ok(format);
};
