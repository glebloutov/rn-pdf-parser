import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  HEAD_BYTES,
  MAX_STATEMENT_SIZE_BYTES,
} from '@features/statementImport/domain/validateFile';
import { validateStatementFile } from '@features/statementImport/domain/validateFile';

const FIXTURES_DIR = join(__dirname, '../../../../../mock-server/fixtures');

const readFixtureHead = (name: string) => {
  const bytes = readFileSync(join(FIXTURES_DIR, name));
  const head = new Uint8Array(bytes.subarray(0, HEAD_BYTES));

  return { head, sizeBytes: bytes.length };
};

const toBytes = (text: string) => new Uint8Array(Buffer.from(text, 'utf8'));

describe('validateStatementFile', () => {
  it('validateStatementFile — statement.pdf fixture — accepted as pdf', () => {
    const result = validateStatementFile(readFixtureHead('statement.pdf'));

    expect(result).toEqual({ ok: true, value: 'pdf' });
  });

  it('validateStatementFile — statement.csv fixture — accepted as csv', () => {
    const result = validateStatementFile(readFixtureHead('statement.csv'));

    expect(result).toEqual({ ok: true, value: 'csv' });
  });

  it('validateStatementFile — spoofed.pdf (text named .pdf) — rejected as unsupported content', () => {
    const result = validateStatementFile(readFixtureHead('spoofed.pdf'));

    expect(result).toEqual({
      ok: false,
      error: { code: 'UNSUPPORTED_CONTENT' },
    });
  });

  it('validateStatementFile — size one byte over 10 MiB — rejected as too large before content check', () => {
    const sizeBytes = MAX_STATEMENT_SIZE_BYTES + 1;
    const result = validateStatementFile({
      head: toBytes('date,description,amount\n'),
      sizeBytes,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        limitBytes: MAX_STATEMENT_SIZE_BYTES,
        sizeBytes,
      },
    });
  });

  it('validateStatementFile — exactly 10 MiB — accepted', () => {
    const result = validateStatementFile({
      head: toBytes('%PDF-1.7\n'),
      sizeBytes: MAX_STATEMENT_SIZE_BYTES,
    });

    expect(result.ok).toBe(true);
  });

  it('validateStatementFile — empty file — rejected as empty', () => {
    const result = validateStatementFile({
      head: new Uint8Array(),
      sizeBytes: 0,
    });

    expect(result).toEqual({ ok: false, error: { code: 'EMPTY_FILE' } });
  });

  it('validateStatementFile — CRLF csv header (server rejects it too) — rejected', () => {
    const result = validateStatementFile({
      head: toBytes('date,description,amount\r\n2026'),
      sizeBytes: 100,
    });

    expect(result.ok).toBe(false);
  });

  it('validateStatementFile — csv with UTF-8 BOM (server rejects it too) — rejected', () => {
    const result = validateStatementFile({
      head: toBytes('﻿date,description,amount\n'),
      sizeBytes: 100,
    });

    expect(result.ok).toBe(false);
  });

  it('validateStatementFile — CR inside the 24-byte window pushes the newline out (server rejects too) — rejected', () => {
    const result = validateStatementFile({
      head: toBytes('date,desc\rription,amount\n'),
      sizeBytes: 100,
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'UNSUPPORTED_CONTENT' },
    });
  });
});
