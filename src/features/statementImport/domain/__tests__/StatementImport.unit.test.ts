import {
  applySnapshot,
  createDraft,
  isAwaitingServer,
  markDeletionNotConfirmed,
  markFailed,
  markSubmitUncertain,
  markSubmitting,
  requestDeletion,
} from '@features/statementImport/domain/statementImport';
import type { IJobSnapshot } from '@features/statementImport/domain/statementImport';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';

const NOW = '2026-10-14T10:00:00.000Z';
const JOB_ID = 'job-demo-001';

const READY_REPORT = {
  currency: 'AUD',
  items: [
    {
      amountMinor: 1999,
      cadence: 'monthly',
      id: 'rec-001',
      lastSeen: '2026-10-01',
      merchant: 'StreamBeam',
    },
    {
      amountMinor: 13200,
      cadence: 'monthly',
      id: 'rec-002',
      lastSeen: '2026-10-03',
      merchant: 'BrightGrid',
    },
  ],
};

const snapshot = (overrides: Partial<IJobSnapshot>): IJobSnapshot => ({
  jobId: JOB_ID,
  report: null,
  revision: 1,
  status: 'queued',
  ...overrides,
});

const draft = (): IStatementImport =>
  createDraft({
    file: {
      displayName: 'statement.csv',
      format: 'csv',
      localPath: '/cache/a.bin',
      sizeBytes: 112,
    },
    idempotencyKey: 'key-0000-0001',
    now: NOW,
  });

const readyImport = () => {
  const submitted = applySnapshot(
    markSubmitting(draft(), NOW),
    snapshot({}),
    NOW,
  );
  const ready = applySnapshot(
    submitted,
    snapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
    NOW,
  );

  return ready;
};

describe('StatementImport', () => {
  it('createDraft — new file — keeps the idempotency key and starts in draft', () => {
    const created = draft();

    expect(created).toMatchObject({
      idempotencyKey: 'key-0000-0001',
      job: null,
      phase: 'draft',
    });
  });

  it('applySnapshot — first POST response — moves to submitted with queued job', () => {
    const submitted = applySnapshot(
      markSubmitting(draft(), NOW),
      snapshot({}),
      NOW,
    );

    expect(submitted).toMatchObject({
      job: { revision: 1, status: 'queued' },
      phase: 'submitted',
    });
  });

  it('applySnapshot — ready rev 3 then stale processing rev 2 — stays ready', () => {
    const afterStale = applySnapshot(
      readyImport(),
      snapshot({ revision: 2, status: 'processing' }),
      NOW,
    );

    expect(afterStale.job).toMatchObject({ revision: 3, status: 'ready' });
  });

  it('applySnapshot — duplicate POST answer queued rev 1 after ready — ignored', () => {
    const afterDuplicate = applySnapshot(
      readyImport(),
      snapshot({ revision: 1, status: 'queued' }),
      NOW,
    );

    expect(afterDuplicate.job?.status).toBe('ready');
  });

  it('applySnapshot — same revision again — returns the same object (no-op)', () => {
    const ready = readyImport();
    const again = applySnapshot(
      ready,
      snapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      NOW,
    );

    expect(again).toBe(ready);
  });

  it('applySnapshot — snapshot for another job — ignored', () => {
    const ready = readyImport();
    const other = applySnapshot(
      ready,
      snapshot({ jobId: 'job-demo-999', revision: 9, status: 'deleted' }),
      NOW,
    );

    expect(other).toBe(ready);
  });

  it('applySnapshot — ready status without report — report stays null', () => {
    const submitted = applySnapshot(
      markSubmitting(draft(), NOW),
      snapshot({}),
      NOW,
    );
    const ready = applySnapshot(
      submitted,
      snapshot({ revision: 3, status: 'ready' }),
      NOW,
    );

    expect(ready.job?.report).toBeNull();
  });

  it('applySnapshot — deleting job and a late higher-revision ready — cannot resurrect', () => {
    const deleting = applySnapshot(
      requestDeletion(readyImport(), 'del-key-0001', NOW),
      snapshot({ revision: 4, status: 'deleting' }),
      NOW,
    );
    const late = applySnapshot(
      deleting,
      snapshot({ report: READY_REPORT, revision: 6, status: 'ready' }),
      NOW,
    );

    expect(late.job?.status).toBe('deleting');
  });

  it('applySnapshot — deleted job — any later snapshot ignored', () => {
    const deleted = applySnapshot(
      requestDeletion(readyImport(), 'del-key-0001', NOW),
      snapshot({ revision: 5, status: 'deleted' }),
      NOW,
    );
    const late = applySnapshot(
      deleted,
      snapshot({ revision: 9, status: 'deleting' }),
      NOW,
    );

    expect(late).toBe(deleted);
  });

  it('applySnapshot — deleting accepted — drops the report and marks deletion accepted', () => {
    const deleting = applySnapshot(
      requestDeletion(readyImport(), 'del-key-0001', NOW),
      snapshot({ revision: 4, status: 'deleting' }),
      NOW,
    );

    expect(deleting).toMatchObject({
      deletion: { state: 'accepted' },
      job: { report: null },
    });
  });

  it('requestDeletion — retry after failure — reuses the stored delete key', () => {
    const failed = markDeletionNotConfirmed(
      requestDeletion(readyImport(), 'del-key-0001', NOW),
      'SERVICE_UNAVAILABLE',
      NOW,
    );
    const retried = requestDeletion(failed, 'del-key-NEW', NOW);

    expect(retried.deletion).toMatchObject({
      deleteKey: 'del-key-0001',
      state: 'requested',
    });
  });

  it('markDeletionNotConfirmed — 503 — job still ready, deletion not confirmed', () => {
    const failed = markDeletionNotConfirmed(
      requestDeletion(readyImport(), 'del-key-0001', NOW),
      'SERVICE_UNAVAILABLE',
      NOW,
    );

    expect(failed).toMatchObject({
      deletion: { lastErrorCode: 'SERVICE_UNAVAILABLE', state: 'notConfirmed' },
      job: { status: 'ready' },
    });
  });

  it('markSubmitUncertain — lost ack — keeps key and local copy for a same-key retry', () => {
    const uncertain = markSubmitUncertain(markSubmitting(draft(), NOW), NOW);

    expect(uncertain).toMatchObject({
      file: { localPath: '/cache/a.bin' },
      idempotencyKey: 'key-0000-0001',
      phase: 'submitUncertain',
    });
  });

  it('markFailed — terminal server rejection — stores the failure code', () => {
    const failed = markFailed(
      markSubmitting(draft(), NOW),
      'UNSUPPORTED_CONTENT',
      NOW,
    );

    expect(failed).toMatchObject({
      failureCode: 'UNSUPPORTED_CONTENT',
      phase: 'failed',
    });
  });

  it('isAwaitingServer — queued job — true; ready job — false', () => {
    const submitted = applySnapshot(
      markSubmitting(draft(), NOW),
      snapshot({}),
      NOW,
    );

    expect([
      isAwaitingServer(submitted),
      isAwaitingServer(readyImport()),
    ]).toEqual([true, false]);
  });
});
