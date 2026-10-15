import {
  CSV_BYTES,
  jobSnapshot,
  respondNetworkError,
  respondOk,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';

const uncertainAfterLostAck = async () => {
  const environment = createTestEnvironment();
  const module = launchModule(environment);
  environment.picker.willPick({
    bytes: CSV_BYTES,
    displayName: 'statement.csv',
  });
  await module.selectFile();
  environment.api.createResponses.push(respondNetworkError());
  await module.submitImport();

  return environment;
};

describe('recoverImport', () => {
  it('relaunch after lost ack — job found by key — tracking it, copy deleted', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(
      respondOk(jobSnapshot({ revision: 2, status: 'processing' })),
    );

    await launchModule(environment).recoverImport();

    expect([
      environment.store.get()?.job?.status,
      environment.files.files.size,
    ]).toEqual(['processing', 0]);
  });

  it('relaunch after lost ack — never re-POSTs automatically', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(respondOk(null));

    await launchModule(environment).recoverImport();

    expect(environment.api.callsOf('createImport')).toBe(1);
  });

  it('relaunch after lost ack — 404 by key — stays uncertain for an explicit retry', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(respondOk(null));

    const result = await launchModule(environment).recoverImport();

    expect([result, environment.store.get()?.phase]).toEqual([
      { ok: true, value: 'notFound' },
      'submitUncertain',
    ]);
  });

  it('relaunch while POST was in flight (submitting persisted) — recovers by key', async () => {
    const environment = createTestEnvironment();
    const module = launchModule(environment);
    environment.picker.willPick({
      bytes: CSV_BYTES,
      displayName: 'statement.csv',
    });
    await module.selectFile();
    const draft = environment.store.get();
    environment.store.save({ ...draft!, phase: 'submitting' });
    environment.api.byKeyResponses.push(respondOk(jobSnapshot()));

    await launchModule(environment).recoverImport();

    expect(environment.store.get()?.phase).toBe('submitted');
  });

  it('relaunch during delete (requested, server still ready) — deletion marked not confirmed', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(
      respondOk(jobSnapshot({ revision: 3, status: 'ready' })),
    );
    await launchModule(environment).recoverImport();
    const ready = environment.store.get();
    environment.store.save({
      ...ready!,
      deletion: {
        deleteKey: 'del-key-0001',
        lastErrorCode: null,
        state: 'requested',
      },
    });
    environment.api.getResponses.push(
      respondOk(jobSnapshot({ revision: 3, status: 'ready' })),
    );

    await launchModule(environment).recoverImport();

    expect(environment.store.get()?.deletion).toMatchObject({
      deleteKey: 'del-key-0001',
      state: 'notConfirmed',
    });
  });

  it('relaunch during delete (server already deleting) — deletion accepted', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(
      respondOk(jobSnapshot({ revision: 3, status: 'ready' })),
    );
    await launchModule(environment).recoverImport();
    const ready = environment.store.get();
    environment.store.save({
      ...ready!,
      deletion: {
        deleteKey: 'del-key-0001',
        lastErrorCode: null,
        state: 'requested',
      },
    });
    environment.api.getResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );

    await launchModule(environment).recoverImport();

    expect(environment.store.get()?.deletion?.state).toBe('accepted');
  });
});

describe('recoverImport — after confirmed deletion', () => {
  it('relaunch after server deleted — no request, nothing to recover', async () => {
    const environment = await uncertainAfterLostAck();
    environment.api.byKeyResponses.push(
      respondOk(jobSnapshot({ revision: 5, status: 'deleted' })),
    );
    await launchModule(environment).recoverImport();
    const callsBefore = environment.api.calls.length;

    const outcome = await launchModule(environment).recoverImport();

    expect([outcome, environment.api.calls.length]).toEqual([
      { ok: true, value: 'nothingToRecover' },
      callsBefore,
    ]);
  });
});
