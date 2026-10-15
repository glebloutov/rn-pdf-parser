import {
  toImportStatusView,
  toStatusToast,
} from '@features/statementImport/ui/statusPresenter';
import type { IJobSnapshot } from '@features/statementImport/domain/statementImport';
import {
  applySnapshot,
  createDraft,
  markDeletionNotConfirmed,
  markFailed,
  markSubmitUncertain,
  markSubmitting,
  requestDeletion,
} from '@features/statementImport/domain/statementImport';

const NOW = '2026-10-14T10:00:00.000Z';
const REPORT = { currency: 'AUD', items: [] };

const draft = createDraft({
  file: {
    displayName: 'statement.csv',
    format: 'csv',
    localPath: '/c/a.bin',
    sizeBytes: 112,
  },
  idempotencyKey: 'key-0000-0001',
  now: NOW,
});

const withJob = (job: Partial<IJobSnapshot>) =>
  applySnapshot(
    markSubmitting(draft, NOW),
    {
      jobId: 'job-demo-001',
      report: null,
      revision: 1,
      status: 'queued',
      ...job,
    },
    NOW,
  );

const ready = withJob({ report: REPORT, revision: 3, status: 'ready' });

describe('toImportStatusView', () => {
  it('toImportStatusView — queued — pending, not a report, refreshable', () => {
    const view = toImportStatusView(withJob({}));

    expect(view).toMatchObject({
      isPending: true,
      report: null,
      statusKey: 'queued',
      actions: { canDelete: false, canRefresh: true },
    });
  });

  it('toImportStatusView — submit uncertain — offers check again and retry upload', () => {
    const view = toImportStatusView(
      markSubmitUncertain(markSubmitting(draft, NOW), NOW),
    );

    expect(view).toMatchObject({
      statusKey: 'submitUncertain',
      tone: 'warning',
      actions: { canCheckAgain: true, canRetryUpload: true },
    });
  });

  it('toImportStatusView — ready — report visible, delete offered, not pending', () => {
    const view = toImportStatusView(ready);

    expect(view).toMatchObject({
      isPending: false,
      report: REPORT,
      statusKey: 'ready',
      actions: { canDelete: true },
    });
  });

  it('toImportStatusView — deletion in flight — no deletion claim, no actions', () => {
    const view = toImportStatusView(requestDeletion(ready, 'del-key', NOW));

    expect(view).toMatchObject({
      deletionMessageKey: 'inProgress',
      actions: { canDelete: false, canRetryDeletion: false },
    });
  });

  it('toImportStatusView — deletion 503 — warns data may remain and offers retry', () => {
    const view = toImportStatusView(
      markDeletionNotConfirmed(
        requestDeletion(ready, 'del-key', NOW),
        'SERVICE_UNAVAILABLE',
        NOW,
      ),
    );

    expect(view).toMatchObject({
      deletionErrorCode: 'SERVICE_UNAVAILABLE',
      deletionMessageKey: 'notConfirmed',
      statusKey: 'ready',
      actions: { canDelete: false, canRetryDeletion: true },
    });
  });

  it('toImportStatusView — server deleting — "accepted", never "deleted"', () => {
    const deleting = applySnapshot(
      requestDeletion(ready, 'del-key', NOW),
      { jobId: 'job-demo-001', report: null, revision: 4, status: 'deleting' },
      NOW,
    );

    expect(toImportStatusView(deleting)).toMatchObject({
      deletionMessageKey: 'accepted',
      isPending: true,
      statusKey: 'deleting',
    });
  });

  it('toImportStatusView — server deleted — confirmed deletion, start new offered, no refresh', () => {
    const deleted = applySnapshot(
      requestDeletion(ready, 'del-key', NOW),
      { jobId: 'job-demo-001', report: null, revision: 5, status: 'deleted' },
      NOW,
    );

    expect(toImportStatusView(deleted)).toMatchObject({
      deletionMessageKey: 'deleted',
      statusKey: 'deleted',
      actions: { canRefresh: false, canStartNew: true },
    });
  });

  it('toImportStatusView — failed — failure code shown, start new offered', () => {
    const view = toImportStatusView(
      markFailed(markSubmitting(draft, NOW), 'UNSUPPORTED_CONTENT', NOW),
    );

    expect(view).toMatchObject({
      failureCode: 'UNSUPPORTED_CONTENT',
      statusKey: 'failed',
      tone: 'danger',
      actions: { canStartNew: true },
    });
  });
});

describe('toStatusToast', () => {
  const submitting = markSubmitting(draft, NOW);
  const deletionRequested = requestDeletion(ready, 'del-key', NOW);

  it.each([
    ['upload accepted', submitting, withJob({}), 'uploadAccepted', 'success'],
    [
      'lost ack',
      submitting,
      markSubmitUncertain(submitting, NOW),
      'uploadUncertain',
      'warning',
    ],
    ['report ready', withJob({}), ready, 'reportReady', 'success'],
    [
      'import failed',
      submitting,
      markFailed(submitting, 'FILE_TOO_LARGE', NOW),
      'importFailed',
      'danger',
    ],
    [
      'deletion not confirmed',
      deletionRequested,
      markDeletionNotConfirmed(deletionRequested, 'SERVICE_UNAVAILABLE', NOW),
      'deletionNotConfirmed',
      'warning',
    ],
    [
      'deleted on the server',
      deletionRequested,
      applySnapshot(
        deletionRequested,
        { jobId: 'job-demo-001', report: null, revision: 5, status: 'deleted' },
        NOW,
      ),
      'deleted',
      'success',
    ],
  ])('toStatusToast — %s', (_name, previous, next, key, tone) => {
    expect(toStatusToast(previous, next)).toEqual({ key, tone });
  });

  it('toStatusToast — no change, first render, another import or a draft — no toast', () => {
    const otherImport = { ...ready, idempotencyKey: 'key-0000-0002' };

    expect([
      toStatusToast(ready, ready),
      toStatusToast(null, ready),
      toStatusToast(withJob({}), otherImport),
      toStatusToast(null, draft),
      toStatusToast(ready, null),
    ]).toEqual([null, null, null, null, null]);
  });

  it('toStatusToast — a stale answer kept the status — no toast', () => {
    expect(
      toStatusToast(ready, { ...ready, updatedAt: '2026-10-14T10:00:05.000Z' }),
    ).toBeNull();
  });
});
