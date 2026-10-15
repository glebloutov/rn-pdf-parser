import { monthlyTotalMinor } from '@features/statementImport/domain/statementImport';

describe('monthlyTotalMinor', () => {
  it('monthlyTotalMinor — mock ready report — 15199 minor units (151.99 AUD)', () => {
    const total = monthlyTotalMinor([
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
    ]);

    expect(total).toBe(15199);
  });

  it('monthlyTotalMinor — non-monthly cadence — excluded from the monthly total', () => {
    const total = monthlyTotalMinor([
      {
        amountMinor: 1000,
        cadence: 'monthly',
        id: 'a',
        lastSeen: '2026-10-01',
        merchant: 'A',
      },
      {
        amountMinor: 9999,
        cadence: 'yearly',
        id: 'b',
        lastSeen: '2026-10-01',
        merchant: 'B',
      },
    ]);

    expect(total).toBe(1000);
  });
});
