import type {
  IMockControlPort,
  IMockState,
  MockControlError,
  MockScenario,
} from '@features/diagnostics/ports';
import { mockStateSchema } from '@features/diagnostics/adapters/mockStateSchema';
import { REQUEST_TIMEOUT_MS } from '@shared/config/apiConfig';
import { fetchWithTimeout } from '@shared/net/fetchWithTimeout';
import { err, ok } from '@shared/result/Result';
import type { Result } from '@shared/result/Result';

const UNREACHABLE: MockControlError = { code: 'MOCK_UNREACHABLE' };

export class HttpMockControlClient implements IMockControlPort {
  constructor(private readonly baseUrl: string) {}

  async getState(): Promise<Result<IMockState, MockControlError>> {
    try {
      const response = await fetchWithTimeout(
        this.url('/__test/state'),
        { method: 'GET' },
        REQUEST_TIMEOUT_MS,
      );
      const state = mockStateSchema.safeParse(await response.json());

      return response.ok && state.success ? ok(state.data) : err(UNREACHABLE);
    } catch {
      return err(UNREACHABLE);
    }
  }

  reset() {
    return this.post('/__test/reset', undefined);
  }

  setScenario(scenario: MockScenario) {
    return this.post('/__test/scenario', JSON.stringify({ mode: scenario }));
  }

  private async post(
    path: string,
    body: string | undefined,
  ): Promise<Result<null, MockControlError>> {
    try {
      const init = {
        body,
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      };
      const response = await fetchWithTimeout(
        this.url(path),
        init,
        REQUEST_TIMEOUT_MS,
      );

      return response.ok ? ok(null) : err(UNREACHABLE);
    } catch {
      return err(UNREACHABLE);
    }
  }

  private url(path: string) {
    return `${this.baseUrl}${path}`;
  }
}
