import 'react-native-get-random-values';
import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import {
  ACCESSIBLE,
  getGenericPassword,
  setGenericPassword,
} from 'react-native-keychain';
import { v4 as uuidV4 } from 'uuid';
import { z } from 'zod';

import {
  importReportSchema,
  jobResponseSchema,
} from '@features/statementImport/adapters/importApi';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';
import type {
  IImportStore,
  StoreListener,
} from '@features/statementImport/ports';

// ---- Stored state schema (Zod) ----
const statementFileSchema = z.object({
  displayName: z.string(),
  format: z.enum(['csv', 'pdf']),
  localPath: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
});

const deletionSchema = z.object({
  deleteKey: z.string().min(1),
  lastErrorCode: z.string().nullable(),
  state: z.enum(['accepted', 'notConfirmed', 'requested']),
});

const failureCodeSchema = z.enum([
  'FILE_TOO_LARGE',
  'IMPORT_CONFLICT',
  'IMPORT_NOT_FOUND',
  'INVALID_REQUEST',
  'LOCAL_COPY_MISSING',
  'UNEXPECTED_RESPONSE',
  'UNSUPPORTED_CONTENT',
]);

const storedJobSchema = jobResponseSchema.extend({
  report: importReportSchema.nullable(),
});

/** Full shape of the persisted aggregate; anything else is treated as "no import". */
export const statementImportSchema = z.object({
  createdAt: z.string(),
  deletion: deletionSchema.nullable(),
  failureCode: failureCodeSchema.nullable(),
  file: statementFileSchema,
  idempotencyKey: z.string().min(1),
  job: storedJobSchema.nullable(),
  phase: z.enum([
    'draft',
    'failed',
    'submitUncertain',
    'submitted',
    'submitting',
  ]),
  updatedAt: z.string(),
}) satisfies z.ZodType<IStatementImport>;

// ---- (De)serialisation ----
export const STORED_IMPORT_SCHEMA_VERSION = 1;

const storedEnvelopeSchema = z.object({
  schemaVersion: z.literal(STORED_IMPORT_SCHEMA_VERSION),
  statementImport: statementImportSchema,
});

export const serializeImport = (statementImport: IStatementImport) => {
  const envelope = {
    schemaVersion: STORED_IMPORT_SCHEMA_VERSION,
    statementImport,
  };

  return JSON.stringify(envelope);
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Unknown schema version, corrupted or undecryptable data → null (treated as "no import"). */
export const parseStoredImport = (
  raw: string | undefined,
): IStatementImport | null => {
  if (raw === undefined) {
    return null;
  }

  const envelope = storedEnvelopeSchema.safeParse(parseJson(raw));

  return envelope.success ? envelope.data.statementImport : null;
};

// ---- Encryption key (Keychain / Keystore) ----
const KEYCHAIN_SERVICE = 'com.rnpdfparser.statement-import.storage-key';
const KEYCHAIN_ACCOUNT = 'mmkv';
const UUID_SEPARATOR = /-/g;

/** uuid v4 without dashes: 32 hex chars, 122 random bits from the secure RNG polyfill. */
const randomHexKey = () => uuidV4().replace(UUID_SEPARATOR, '');

/** Encryption key kept in Keychain / Android Keystore, this device only. */
export const getOrCreateStorageEncryptionKey = async () => {
  const stored = await getGenericPassword({ service: KEYCHAIN_SERVICE });

  if (stored !== false) {
    return stored.password;
  }

  const encryptionKey = randomHexKey();

  await setGenericPassword(KEYCHAIN_ACCOUNT, encryptionKey, {
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: KEYCHAIN_SERVICE,
  });

  return encryptionKey;
};

// ---- Encrypted MMKV store ----
const STORE_ID = 'statement-import';
const CURRENT_IMPORT_KEY = 'currentImport';

/** AES-256 encrypted MMKV; the key comes from Keychain/Keystore. */
export class MmkvImportStore implements IImportStore {
  private readonly storage: MMKV;

  private readonly listeners = new Set<StoreListener>();

  private cached: IStatementImport | null;

  constructor(encryptionKey: string) {
    this.storage = createMMKV({
      encryptionKey,
      encryptionType: 'AES-256',
      id: STORE_ID,
    });
    this.cached = parseStoredImport(this.storage.getString(CURRENT_IMPORT_KEY));
  }

  clear() {
    this.storage.remove(CURRENT_IMPORT_KEY);
    this.cached = null;
    this.notify();
  }

  get() {
    return this.cached;
  }

  save(statementImport: IStatementImport) {
    this.storage.set(CURRENT_IMPORT_KEY, serializeImport(statementImport));
    this.cached = statementImport;
    this.notify();
  }

  subscribe(listener: StoreListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}
