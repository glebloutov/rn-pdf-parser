import {
  toErrorMessageCode,
  toHomeMode,
} from '@features/statementImport/ui/statusPresenter';
import statementImportEn from '@features/statementImport/i18n/en';
import statementImportRu from '@features/statementImport/i18n/ru';
import { createDraft } from '@features/statementImport/domain/statementImport';

describe('presenters', () => {
  it('toErrorMessageCode — known code — itself; unknown — generic fallback', () => {
    expect([
      toErrorMessageCode('SERVICE_UNAVAILABLE'),
      toErrorMessageCode('HTTP_418'),
    ]).toEqual(['SERVICE_UNAVAILABLE', 'UNEXPECTED_RESPONSE']);
  });

  it('toHomeMode — none / draft — empty / confirm', () => {
    const draft = createDraft({
      file: {
        displayName: 'a.csv',
        format: 'csv',
        localPath: '/a',
        sizeBytes: 1,
      },
      idempotencyKey: 'key-0000-0001',
      now: '2026-10-14T10:00:00.000Z',
    });

    expect([toHomeMode(null), toHomeMode(draft)]).toEqual(['empty', 'confirm']);
  });

  it('i18n — RU catalog has exactly the EN error codes', () => {
    expect(Object.keys(statementImportRu.errors).sort()).toEqual(
      Object.keys(statementImportEn.errors).sort(),
    );
  });
});
