import {
  CSV_BYTES,
  READY_REPORT,
  jobSnapshot,
  respondOk,
  respondServiceUnavailable,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';

const readyImport = async () => {
  const environment = createTestEnvironment();
  const module = launchModule(environment);
  environment.picker.willPick({
    bytes: CSV_BYTES,
    displayName: 'statement.csv',
  });
  await module.selectFile();
  environment.api.createResponses.push(respondOk(jobSnapshot()));
  await module.submitImport();
  environment.api.getResponses.push(
    respondOk(
      jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
    ),
  );
  await module.refreshJob();

  return { environment, module };
};

describe('requestDeletion', () => {
  it('delete — delete key persisted before DELETE is sent', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );
    const observedDeletions: Array<string | undefined> = [];
    const unsubscribe = environment.store.subscribe(() => {
      observedDeletions.push(environment.store.get()?.deletion?.state);
    });

    await module.requestDeletion();
    unsubscribe();

    expect(observedDeletions[0]).toBe('requested');
  });

  it('delete — 202 deleting — not reported as deleted yet', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );

    await module.requestDeletion();

    expect(environment.store.get()?.job?.status).toBe('deleting');
  });

  it('delete_failure — 503 — not deleted, deletion not confirmed', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(respondServiceUnavailable());

    await module.requestDeletion();

    expect([
      environment.store.get()?.job?.status,
      environment.store.get()?.deletion?.state,
    ]).toEqual(['ready', 'notConfirmed']);
  });

  it('delete_failure then retry — same delete key is reused', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(
      respondServiceUnavailable(),
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );

    await module.requestDeletion();
    const firstKey = environment.api.lastDeleteKey;
    await module.requestDeletion();

    expect(environment.api.lastDeleteKey).toBe(firstKey);
  });

  it('delete — deleting then GET deleted — confirmed deleted', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );
    environment.api.getResponses.push(
      respondOk(jobSnapshot({ revision: 5, status: 'deleted' })),
    );

    await module.requestDeletion();
    await module.refreshJob();

    expect(environment.store.get()?.job?.status).toBe('deleted');
  });

  it('delete — late ready after deleting — job is not resurrected', async () => {
    const { environment, module } = await readyImport();
    environment.api.deleteResponses.push(
      respondOk(jobSnapshot({ revision: 4, status: 'deleting' })),
    );
    environment.api.getResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 6, status: 'ready' }),
      ),
    );

    await module.requestDeletion();
    await module.refreshJob();

    expect(environment.store.get()?.job?.status).toBe('deleting');
  });
});
