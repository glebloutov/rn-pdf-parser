import {
  MAX_HEADER_FILE_NAME_LENGTH,
  toHeaderFileName,
} from '@features/statementImport/adapters/importApi';

describe('toHeaderFileName', () => {
  it('toHeaderFileName — ASCII name — unchanged', () => {
    expect(toHeaderFileName('statement.csv')).toBe('statement.csv');
  });

  it('toHeaderFileName — Cyrillic name — ASCII-only and reversible', () => {
    const headerValue = toHeaderFileName('выписка.pdf');

    expect([
      /^[\x20-\x7E]+$/.test(headerValue),
      decodeURIComponent(headerValue),
    ]).toEqual([true, 'выписка.pdf']);
  });

  it('toHeaderFileName — very long name — fits the 255 character limit', () => {
    const headerValue = toHeaderFileName(`${'я'.repeat(300)}.csv`);

    expect(headerValue.length).toBeLessThanOrEqual(MAX_HEADER_FILE_NAME_LENGTH);
  });

  it('toHeaderFileName — blank name — fallback', () => {
    expect(toHeaderFileName('   ')).toBe('statement');
  });
});
