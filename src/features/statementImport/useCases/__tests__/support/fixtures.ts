import type { IJobSnapshot } from '@features/statementImport/domain/statementImport';
import { err, ok } from '@shared/result/Result';

export const CSV_BYTES = new Uint8Array(
  Buffer.from(
    'date,description,amount\n2026-10-01,StreamBeam,-19.99\n',
    'utf8',
  ),
);

export const SPOOFED_BYTES = new Uint8Array(
  Buffer.from('This is plain text, not a PDF.\n', 'utf8'),
);

export const JOB_ID = 'job-demo-001';

export const READY_REPORT = {
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

export const jobSnapshot = (
  overrides: Partial<IJobSnapshot> = {},
): IJobSnapshot => ({
  jobId: JOB_ID,
  report: null,
  revision: 1,
  status: 'queued',
  ...overrides,
});

export const respondOk =
  <TValue>(value: TValue) =>
  () =>
    ok(value);

export const respondNetworkError = () => () =>
  err({ code: 'NETWORK_UNAVAILABLE' as const });

export const respondServiceUnavailable = () => () =>
  err({ code: 'SERVICE_UNAVAILABLE' as const, httpStatus: 503 });
