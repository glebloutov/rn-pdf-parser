import {
  CSV_BYTES,
  jobSnapshot,
  respondOk,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';

describe('cleanup use cases', () => {
  it('discard draft — copy deleted and state cleared', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();

    await module.discardImport('currentImport');

    expect([environment.files.files.size, environment.store.get()]).toEqual([
      0,
      null,
    ]);
  });

  it('discard — job still on server and not deleted — refused', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();
    environment.api.createResponses.push(respondOk(jobSnapshot()));
    await module.submitImport();

    const result = await module.discardImport('currentImport');

    expect(result).toEqual({
      error: { code: 'IMPORT_NOT_DISCARDABLE' },
      ok: false,
    });
  });

  it('recover on launch — removes copies not referenced by the persisted import', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();
    environment.files.files.set(
      '/private/statement-import/orphan.bin',
      CSV_BYTES,
    );
    environment.files.files.set('/tmp/Inbox/leftover.csv', CSV_BYTES);

    await launchModule(environment).recoverImport();

    expect([...environment.files.files.keys()]).toEqual([
      environment.store.get()?.file.localPath,
    ]);
  });

  it('clear local data — removes every copy and the persisted import', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();
    environment.files.files.set('/tmp/Inbox/leftover.csv', CSV_BYTES);

    await module.discardImport('allLocalData');

    expect([environment.files.files.size, environment.store.get()]).toEqual([
      0,
      null,
    ]);
  });
});
