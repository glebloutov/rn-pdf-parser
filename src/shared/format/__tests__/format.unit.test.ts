import { toFileSizeParts } from '@shared/format/fileSize';
import { formatDate } from '@shared/format/formatDate';
import { formatMoney } from '@shared/format/formatMoney';

describe('formatting', () => {
  it('formatMoney — 15199 AUD minor units in en — A$151.99', () => {
    expect(formatMoney(15199, 'AUD', 'en-AU')).toBe('$151.99');
  });

  it('toFileSizeParts — 112 bytes — bytes unit', () => {
    expect(toFileSizeParts(112, 'en')).toEqual({ unit: 'bytes', value: '112' });
  });

  it('toFileSizeParts — 33882 bytes — kibibytes', () => {
    expect(toFileSizeParts(33882, 'en')).toEqual({
      unit: 'kibibytes',
      value: '33.1',
    });
  });

  it('formatDate — calendar date — same day regardless of device timezone', () => {
    expect(formatDate('2026-10-01', 'en-US')).toBe('Oct 1, 2026');
  });
});
