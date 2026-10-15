import {
  CSV_BYTES,
  READY_REPORT,
  jobSnapshot,
  respondOk,
} from '@features/statementImport/useCases/__tests__/support/fixtures';
import {
  createTestEnvironment,
  launchModule,
} from '@features/statementImport/useCases/__tests__/support/createTestModule';
import { err } from '@shared/result/Result';

const submitted = async () => {
  const environment = createTestEnvironment();
  const module = launchModule(environment);
  environment.picker.willPick({
    bytes: CSV_BYTES,
    displayName: 'statement.csv',
  });
  await module.selectFile();
  environment.api.createResponses.push(respondOk(jobSnapshot()));
  await module.submitImport();

  return { environment, module };
};

describe('refreshJob', () => {
  it('refresh — ready response — report stored', async () => {
    const { environment, module } = await submitted();
    environment.api.getResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
    );

    await module.refreshJob();

    expect(environment.store.get()?.job?.report?.items).toHaveLength(2);
  });

  it('refresh — stale_status (ready rev 3, then processing rev 2) — UI state does not roll back', async () => {
    const { environment, module } = await submitted();
    environment.api.getResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
      respondOk(jobSnapshot({ revision: 2, status: 'processing' })),
    );

    await module.refreshJob();
    await module.refreshJob();

    expect(environment.store.get()?.job).toMatchObject({
      revision: 3,
      status: 'ready',
    });
  });

  it('refresh — job unknown on server (404) — marked failed, not silently dropped', async () => {
    const { environment, module } = await submitted();
    environment.api.getResponses.push(() =>
      err({ code: 'IMPORT_NOT_FOUND' as const }),
    );

    await module.refreshJob();

    expect(environment.store.get()?.failureCode).toBe('IMPORT_NOT_FOUND');
  });

  it('refresh — network error — state kept as is', async () => {
    const { environment, module } = await submitted();
    const before = environment.store.get();
    environment.api.getResponses.push(() =>
      err({ code: 'NETWORK_UNAVAILABLE' as const }),
    );

    await module.refreshJob();

    expect(environment.store.get()).toBe(before);
  });
});

describe('refreshJob — outdated answers', () => {
  it('refreshJob — older revision after ready — reported as outdated', async () => {
    const { environment, module } = await submitted();
    environment.api.getResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
      respondOk(jobSnapshot({ revision: 2, status: 'processing' })),
    );
    await module.refreshJob();

    await module.refreshJob();

    expect(module.outdatedResponses.get()).toMatchObject({
      count: 1,
      last: { revision: 2, status: 'processing' },
    });
  });

  it('refreshJob — the same revision again (happy) — not reported as outdated', async () => {
    const { environment, module } = await submitted();
    environment.api.getResponses.push(
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
      respondOk(
        jobSnapshot({ report: READY_REPORT, revision: 3, status: 'ready' }),
      ),
    );
    await module.refreshJob();

    await module.refreshJob();

    expect(module.outdatedResponses.get()).toBeNull();
  });
});
