import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const MOCK_SERVER_DIR = resolve(__dirname, '../../mock-server');
export const FIXTURES_DIR = join(MOCK_SERVER_DIR, 'fixtures');

const MOCK_MODULE_URL = `file://${join(MOCK_SERVER_DIR, 'mock-server.mjs')}`;
const STARTUP_TIMEOUT_MS = 10000;
const LISTENING_PREFIX = 'LISTENING ';

/**
 * Starts the unchanged candidate-kit server in a child process (Jest can't
 * import the .mjs module directly). Isolated state file + random port per suite.
 */
const BOOTSTRAP_SCRIPT = `
  const { createMockServer } = await import(process.env.MOCK_MODULE_URL);
  const server = createMockServer({ statePath: process.env.MOCK_STATE_PATH });
  server.listen(0, '127.0.0.1', () => console.log('${LISTENING_PREFIX}' + server.address().port));
`;

export interface IRunningMockServer {
  baseUrl: string;
  stop(): Promise<void>;
}

export interface IMockStats {
  acceptedBytes: number;
  createRequests: number;
  deleteRequests: number;
  duplicateHits: number;
  newJobs: number;
}

export interface IMockState {
  jobs: Array<{ bytes: number; jobId: string; sha256: string; status: string }>;
  mode: string;
  stats: IMockStats;
}

export type MockScenario =
  'delete_failure' | 'happy' | 'lost_ack' | 'stale_status';

const waitForPort = (child: ChildProcessWithoutNullStreams) =>
  new Promise<number>((resolvePort, rejectPort) => {
    const timer = setTimeout(
      () => rejectPort(new Error('mock server did not start')),
      STARTUP_TIMEOUT_MS,
    );

    child.stdout.on('data', (chunk: Buffer) => {
      const line = chunk.toString('utf8');

      if (line.startsWith(LISTENING_PREFIX)) {
        clearTimeout(timer);
        resolvePort(Number(line.slice(LISTENING_PREFIX.length).trim()));
      }
    });
    child.on('exit', () => rejectPort(new Error('mock server exited')));
  });

export const startMockServer = async (): Promise<IRunningMockServer> => {
  const stateDirectory = mkdtempSync(join(tmpdir(), 'rn-pdf-parser-mock-'));
  const child = spawn(
    process.execPath,
    ['--input-type=module', '-e', BOOTSTRAP_SCRIPT],
    {
      env: {
        ...process.env,
        MOCK_MODULE_URL,
        MOCK_STATE_PATH: join(stateDirectory, 'state.json'),
      },
    },
  );
  const port = await waitForPort(child);

  const stop = () =>
    new Promise<void>(resolveStop => {
      child.once('exit', () => {
        rmSync(stateDirectory, { force: true, recursive: true });
        resolveStop();
      });
      child.kill();
    });

  return { baseUrl: `http://127.0.0.1:${port}`, stop };
};

export const resetMock = async (baseUrl: string) => {
  await fetch(`${baseUrl}/__test/reset`, { method: 'POST' });
};

export const setScenario = async (baseUrl: string, mode: MockScenario) => {
  await fetch(`${baseUrl}/__test/scenario`, {
    body: JSON.stringify({ mode }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
};

export const readMockState = async (baseUrl: string): Promise<IMockState> => {
  const response = await fetch(`${baseUrl}/__test/state`);
  const state = (await response.json()) as IMockState;

  return state;
};
