import type { Result } from '@shared/result/Result';

export const MOCK_SCENARIOS = [
  'happy',
  'lost_ack',
  'stale_status',
  'delete_failure',
] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export interface IMockJobSummary {
  bytes: number;
  jobId: string;
  status: string;
}

export interface IMockState {
  jobs: IMockJobSummary[];
  mode: string;
  stats: Record<string, number>;
}

export type MockControlError = { code: 'MOCK_UNREACHABLE' };

/** Reviewer-only test-control routes of the mock (`/__test/*`). Not production architecture. */
export interface IMockControlPort {
  getState(): Promise<Result<IMockState, MockControlError>>;
  reset(): Promise<Result<null, MockControlError>>;
  setScenario(scenario: MockScenario): Promise<Result<null, MockControlError>>;
}
