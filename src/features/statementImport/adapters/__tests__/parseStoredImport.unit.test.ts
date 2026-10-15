// importStore.ts also holds the native MMKV / Keychain adapter; only its pure parsing is tested here
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-mmkv', () => ({ createMMKV: jest.fn() }));
jest.mock('react-native-keychain', () => ({ ACCESSIBLE: {} }));

import { createDraft } from '@features/statementImport/domain/statementImport';
import {
  parseStoredImport,
  serializeImport,
} from '@features/statementImport/adapters/importStore';

const draft = createDraft({
  file: {
    displayName: 'statement.csv',
    format: 'csv',
    localPath: '/c/a.bin',
    sizeBytes: 112,
  },
  idempotencyKey: 'key-0000-0001',
  now: '2026-10-14T10:00:00.000Z',
});

describe('parseStoredImport', () => {
  it('parseStoredImport — serialized import — round-trips', () => {
    expect(parseStoredImport(serializeImport(draft))).toEqual(draft);
  });

  it('parseStoredImport — corrupted or undecryptable data — null', () => {
    expect(parseStoredImport('\u0000garbage')).toBeNull();
  });

  it('parseStoredImport — unknown schema version — null', () => {
    expect(
      parseStoredImport(
        JSON.stringify({ schemaVersion: 99, statementImport: draft }),
      ),
    ).toBeNull();
  });
});

describe('parseStoredImport — schema validation', () => {
  it('parseStoredImport — valid JSON with a wrong field type — null', () => {
    const broken = { ...draft, phase: 'unknown-phase' };

    expect(
      parseStoredImport(
        JSON.stringify({ schemaVersion: 1, statementImport: broken }),
      ),
    ).toBeNull();
  });
});
