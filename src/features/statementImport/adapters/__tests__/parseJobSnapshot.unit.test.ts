import { parseJobSnapshot } from '@features/statementImport/adapters/importApi';

describe('parseJobSnapshot', () => {
  it('parseJobSnapshot — queued body — snapshot without report', () => {
    expect(
      parseJobSnapshot({
        jobId: 'job-demo-001',
        revision: 1,
        status: 'queued',
      }),
    ).toEqual({
      jobId: 'job-demo-001',
      report: null,
      revision: 1,
      status: 'queued',
    });
  });

  it('parseJobSnapshot — unknown status — rejected', () => {
    expect(
      parseJobSnapshot({ jobId: 'job-demo-001', revision: 1, status: 'done' }),
    ).toBeNull();
  });

  it('parseJobSnapshot — report fields on a non-ready status — report ignored', () => {
    const snapshot = parseJobSnapshot({
      currency: 'AUD',
      items: [],
      jobId: 'j',
      revision: 2,
      status: 'processing',
    });

    expect(snapshot?.report).toBeNull();
  });

  it('parseJobSnapshot — malformed charge in ready report — report dropped', () => {
    const snapshot = parseJobSnapshot({
      currency: 'AUD',
      items: [{ id: 1 }],
      jobId: 'j',
      revision: 3,
      status: 'ready',
    });

    expect(snapshot?.report).toBeNull();
  });
});
