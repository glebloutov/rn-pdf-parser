import {
  CSV_BYTES,
  jobSnapshot,
  respondNetworkError,
  respondOk,
  respondServiceUnavailable,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';
import { err } from '@shared/result/Result';

const prepareDraft = async () => {
  const environment = createTestEnvironment();
  const module = launchModule(environment);
  environment.picker.willPick({ bytes: CSV_BYTES, displayName: 'выписка.csv' });
  await module.selectFile();

  return { environment, module };
};

describe('submitImport', () => {
  it('submit — key and submitting phase are persisted before the POST is sent', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(respondOk(jobSnapshot()));

    await module.submitImport();

    expect(environment.api.calls[0]).toEqual({
      method: 'createImport',
      observedPersistedPhase: 'submitting',
    });
  });

  it('submit — sends the persisted key, real bytes and file name', async () => {
    const { environment, module } = await prepareDraft();
    const persistedKey = environment.store.get()?.idempotencyKey;
    environment.api.createResponses.push(respondOk(jobSnapshot()));

    await module.submitImport();

    expect(environment.api.lastCreateRequest).toEqual({
      bytes: CSV_BYTES,
      fileName: 'выписка.csv',
      idempotencyKey: persistedKey,
    });
  });

  it('submit — 202 — job queued (not ready) and private copy deleted', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(respondOk(jobSnapshot()));

    await module.submitImport();

    expect([
      environment.store.get()?.job?.status,
      environment.store.get()?.file.localPath,
      environment.files.files.size,
    ]).toEqual(['queued', null, 0]);
  });

  it('submit — lost ack — becomes uncertain and keeps the copy for a same-key retry', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(respondNetworkError());

    await module.submitImport();

    expect([
      environment.store.get()?.phase,
      environment.files.files.size,
    ]).toEqual(['submitUncertain', 1]);
  });

  it('submit — 503 — uncertain (server may have created the job)', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(respondServiceUnavailable());

    await module.submitImport();

    expect(environment.store.get()?.phase).toBe('submitUncertain');
  });

  it('submit — retry after lost ack — reuses the same key', async () => {
    const { environment, module } = await prepareDraft();
    const persistedKey = environment.store.get()?.idempotencyKey;
    environment.api.createResponses.push(
      respondNetworkError(),
      respondOk(jobSnapshot()),
    );

    await module.submitImport();
    await module.submitImport();

    expect(environment.api.lastCreateRequest?.idempotencyKey).toBe(
      persistedKey,
    );
  });

  it('submit — 415 from server — terminal failure, copy deleted', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(() =>
      err({ code: 'UNSUPPORTED_CONTENT' as const }),
    );

    await module.submitImport();

    expect([
      environment.store.get()?.phase,
      environment.store.get()?.failureCode,
      environment.files.files.size,
    ]).toEqual(['failed', 'UNSUPPORTED_CONTENT', 0]);
  });

  it('submit — while a submit is in flight — second call refused (no double POST)', async () => {
    const { environment, module } = await prepareDraft();
    environment.api.createResponses.push(respondOk(jobSnapshot()));

    const [, second] = await Promise.all([
      module.submitImport(),
      module.submitImport(),
    ]);

    expect([second, environment.api.callsOf('createImport')]).toEqual([
      { error: { code: 'OPERATION_IN_PROGRESS' }, ok: false },
      1,
    ]);
  });

  it('submit — local copy vanished — terminal failure without POST', async () => {
    const { environment, module } = await prepareDraft();
    environment.files.files.clear();

    await module.submitImport();

    expect([
      environment.store.get()?.failureCode,
      environment.api.callsOf('createImport'),
    ]).toEqual(['LOCAL_COPY_MISSING', 0]);
  });
});
