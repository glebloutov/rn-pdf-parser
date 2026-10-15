import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createDevice,
  launchApp,
} from '@test-support/integration/createIntegrationModule';
import { ensureOversizeFixture } from '@test-support/integration/generateOversizeFixture';
import {
  FIXTURES_DIR,
  readMockState,
  resetMock,
  setScenario,
  startMockServer,
} from '@test-support/integration/mockServer';
import type { IRunningMockServer } from '@test-support/integration/mockServer';
import { waitFor } from '@test-support/integration/waitFor';
import type { IIntegrationDevice } from '@test-support/integration/createIntegrationModule';
import { monthlyTotalMinor } from '@features/statementImport/domain/statementImport';

const STATEMENT_CSV = join(FIXTURES_DIR, 'statement.csv');
const STATEMENT_PDF = join(FIXTURES_DIR, 'statement.pdf');
const SPOOFED_PDF = join(FIXTURES_DIR, 'spoofed.pdf');
const EXPECTED_MONTHLY_TOTAL_MINOR = 15199;

let mock: IRunningMockServer;

beforeAll(async () => {
  mock = await startMockServer();
});

afterAll(async () => {
  await mock.stop();
});

beforeEach(async () => {
  await resetMock(mock.baseUrl);
});

const submitFixture = async (
  device: IIntegrationDevice,
  fixturePath: string,
) => {
  const app = launchApp(device, mock.baseUrl);

  device.picker.willPick(fixturePath);
  await app.selectFile();
  await app.submitImport();

  return app;
};

const waitForJobStatus = (device: IIntegrationDevice, status: string) => {
  const app = launchApp(device, mock.baseUrl);

  return waitFor(
    async () => {
      await app.refreshJob();

      return device.store.get();
    },
    current => current?.job?.status === status,
  );
};

const sha256Of = (path: string) =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

describe('acceptance matrix against the real mock', () => {
  it('happy — 202 is queued (not a ready report), one job, real bytes sent', async () => {
    const device = createDevice();

    await submitFixture(device, STATEMENT_CSV);
    const state = await readMockState(mock.baseUrl);

    expect({
      job: device.store.get()?.job,
      newJobs: state.stats.newJobs,
      sentSha256: state.jobs[0]?.sha256,
    }).toEqual({
      job: {
        jobId: 'job-demo-001',
        report: null,
        revision: 1,
        status: 'queued',
      },
      newJobs: 1,
      sentSha256: sha256Of(STATEMENT_CSV),
    });
  });

  it('happy — after ready — two charges totalling 151.99 AUD/month', async () => {
    const device = createDevice();
    await submitFixture(device, STATEMENT_CSV);

    const ready = await waitForJobStatus(device, 'ready');

    expect([
      ready?.job?.report?.items.length,
      monthlyTotalMinor(ready?.job?.report?.items ?? []),
      ready?.job?.report?.currency,
    ]).toEqual([2, EXPECTED_MONTHLY_TOTAL_MINOR, 'AUD']);
  });

  it('happy — statement.pdf accepted and reaches ready', async () => {
    const device = createDevice();
    await submitFixture(device, STATEMENT_PDF);

    const ready = await waitForJobStatus(device, 'ready');

    expect(ready?.job?.report?.items).toHaveLength(2);
  });

  it('happy — Cyrillic file name — accepted by the server', async () => {
    const device = createDevice();
    const renamed = join(
      mkdtempSync(join(tmpdir(), 'rn-pdf-parser-name-')),
      'выписка.csv',
    );
    copyFileSync(STATEMENT_CSV, renamed);

    await submitFixture(device, renamed);

    expect(device.store.get()?.job?.status).toBe('queued');
  });

  it('happy — local private copy removed once the server has the job', async () => {
    const device = createDevice();

    await submitFixture(device, STATEMENT_CSV);

    expect(await device.files.listPrivateCopies()).toEqual([]);
  });

  it('lost_ack — POST commits but response is lost — uncertain, exactly one job on the server', async () => {
    const device = createDevice();
    await setScenario(mock.baseUrl, 'lost_ack');

    await submitFixture(device, STATEMENT_CSV);
    const state = await readMockState(mock.baseUrl);

    expect([device.store.get()?.phase, state.stats.newJobs]).toEqual([
      'submitUncertain',
      1,
    ]);
  });

  it('lost_ack + relaunch — recovered by key, no re-POST, newJobs=1', async () => {
    const device = createDevice();
    await setScenario(mock.baseUrl, 'lost_ack');
    await submitFixture(device, STATEMENT_CSV);

    const outcome = await launchApp(device, mock.baseUrl).recoverImport();
    const state = await readMockState(mock.baseUrl);

    expect({
      createRequests: state.stats.createRequests,
      jobId: device.store.get()?.job?.jobId,
      newJobs: state.stats.newJobs,
      outcome,
    }).toEqual({
      createRequests: 1,
      jobId: 'job-demo-001',
      newJobs: 1,
      outcome: { ok: true, value: 'recovered' },
    });
  });

  it('lost_ack + explicit same-key retry — server deduplicates, newJobs=1', async () => {
    const device = createDevice();
    await setScenario(mock.baseUrl, 'lost_ack');
    const app = await submitFixture(device, STATEMENT_CSV);

    await app.submitImport();
    const state = await readMockState(mock.baseUrl);

    expect([
      state.stats.newJobs,
      state.stats.duplicateHits,
      device.store.get()?.job?.jobId,
    ]).toEqual([1, 1, 'job-demo-001']);
  });

  it('relaunch after ready — shows the current job and does not resend the file', async () => {
    const device = createDevice();
    await submitFixture(device, STATEMENT_CSV);
    await waitForJobStatus(device, 'ready');

    await launchApp(device, mock.baseUrl).recoverImport();
    const state = await readMockState(mock.baseUrl);

    expect([
      device.store.get()?.job?.status,
      state.stats.createRequests,
    ]).toEqual(['ready', 1]);
  });

  it('stale_status — ready rev 3 then processing rev 2 — stays ready rev 3', async () => {
    const device = createDevice();
    const app = await submitFixture(device, STATEMENT_CSV);
    await setScenario(mock.baseUrl, 'stale_status');

    await app.refreshJob();
    const afterFirstGet = device.store.get()?.job?.status;
    await app.refreshJob();

    expect([
      afterFirstGet,
      device.store.get()?.job?.status,
      device.store.get()?.job?.revision,
    ]).toEqual(['ready', 'ready', 3]);
  });

  it('delete_failure — 503 — not deleted locally or on the server', async () => {
    const device = createDevice();
    const app = await submitFixture(device, STATEMENT_CSV);
    await waitForJobStatus(device, 'ready');
    await setScenario(mock.baseUrl, 'delete_failure');

    await app.requestDeletion();
    const state = await readMockState(mock.baseUrl);

    expect({
      deletion: device.store.get()?.deletion?.state,
      localStatus: device.store.get()?.job?.status,
      serverStatus: state.jobs[0]?.status,
    }).toEqual({
      deletion: 'notConfirmed',
      localStatus: 'ready',
      serverStatus: 'ready',
    });
  });

  it('delete_failure → happy — retry with the same key reaches deleted', async () => {
    const device = createDevice();
    const app = await submitFixture(device, STATEMENT_CSV);
    await waitForJobStatus(device, 'ready');
    await setScenario(mock.baseUrl, 'delete_failure');
    await app.requestDeletion();
    await setScenario(mock.baseUrl, 'happy');

    await app.requestDeletion();
    const deleted = await waitForJobStatus(device, 'deleted');
    const state = await readMockState(mock.baseUrl);

    expect([
      deleted?.job?.status,
      state.stats.deleteRequests,
      state.jobs[0]?.status,
    ]).toEqual(['deleted', 2, 'deleted']);
  });

  it('spoofed + oversize — both rejected before POST, createRequests unchanged', async () => {
    const device = createDevice();
    const oversizePath = ensureOversizeFixture();
    const app = launchApp(device, mock.baseUrl);
    const before = await readMockState(mock.baseUrl);

    device.picker.willPick(SPOOFED_PDF);
    const spoofed = await app.selectFile();
    device.picker.willPick(oversizePath);
    const oversize = await app.selectFile();
    const after = await readMockState(mock.baseUrl);

    expect({
      after: after.stats.createRequests,
      before: before.stats.createRequests,
      copiesLeft: (await device.files.listPrivateCopies()).length,
      oversize: oversize.ok ? null : oversize.error.code,
      spoofed: spoofed.ok ? null : spoofed.error.code,
    }).toEqual({
      after: 0,
      before: 0,
      copiesLeft: 0,
      oversize: 'FILE_TOO_LARGE',
      spoofed: 'UNSUPPORTED_CONTENT',
    });
  });
});
