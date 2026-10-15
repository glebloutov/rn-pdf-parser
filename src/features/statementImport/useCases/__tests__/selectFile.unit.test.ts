import {
  CSV_BYTES,
  SPOOFED_BYTES,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';
import { MAX_STATEMENT_SIZE_BYTES } from '@features/statementImport/domain/validateFile';

describe('selectFile', () => {
  it('select — valid csv — persists a draft with an idempotency key before any POST', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });

    await launchModule(environment).selectFile();

    expect(environment.store.get()).toMatchObject({
      file: {
        displayName: 'statement.csv',
        format: 'csv',
        sizeBytes: CSV_BYTES.length,
      },
      idempotencyKey: expect.stringMatching(/^test-key-/),
      phase: 'draft',
    });
  });

  it('select — valid csv — sends nothing to the server', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });

    await launchModule(environment).selectFile();

    expect(environment.api.calls).toHaveLength(0);
  });

  it('select — spoofed pdf — rejected, copy deleted, nothing persisted', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: SPOOFED_BYTES,
      displayName: 'spoofed.pdf',
    });

    const result = await launchModule(environment).selectFile();

    expect([
      result,
      environment.files.files.size,
      environment.store.get(),
    ]).toEqual([
      { error: { code: 'UNSUPPORTED_CONTENT' }, ok: false },
      0,
      null,
    ]);
  });

  it('select — reported size over 10 MiB — rejected without making a local copy', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'oversize.csv',
      reportedSizeBytes: MAX_STATEMENT_SIZE_BYTES + 1,
    });

    const result = await launchModule(environment).selectFile();

    expect([result.ok, environment.picker.copies]).toEqual([false, 0]);
  });

  it('select — OS under-reports size but the copy is over 10 MiB — rejected and copy deleted', async () => {
    const environment = createTestEnvironment();
    const oversizeBytes = new Uint8Array(MAX_STATEMENT_SIZE_BYTES + 1);
    oversizeBytes.set(CSV_BYTES);
    environment.picker.willPick({
      bytes: oversizeBytes,
      displayName: 'oversize.csv',
      reportedSizeBytes: null,
    });

    const result = await launchModule(environment).selectFile();

    expect([
      result.ok ? null : result.error.code,
      environment.files.files.size,
    ]).toEqual(['FILE_TOO_LARGE', 0]);
  });

  it('select — picker cancelled — no state change', async () => {
    const environment = createTestEnvironment();
    environment.picker.willCancel();

    const result = await launchModule(environment).selectFile();

    expect([result, environment.store.get()]).toEqual([
      { error: { code: 'PICK_CANCELLED' }, ok: false },
      null,
    ]);
  });

  it('select — source access is always released', async () => {
    const environment = createTestEnvironment();
    environment.picker.willPick({
      bytes: SPOOFED_BYTES,
      displayName: 'spoofed.pdf',
    });

    await launchModule(environment).selectFile();

    expect(environment.picker.released).toEqual(['content://fake/spoofed.pdf']);
  });

  it('select — import already active — refused', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();

    const second = await module.selectFile();

    expect(second).toEqual({
      error: { code: 'IMPORT_ALREADY_ACTIVE' },
      ok: false,
    });
  });
});
