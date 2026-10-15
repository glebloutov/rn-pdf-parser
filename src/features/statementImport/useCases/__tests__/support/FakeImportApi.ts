import type {
  ICreateImportRequest,
  IImportApi,
  ImportApiError,
} from '@features/statementImport/ports';
import type { IJobSnapshot } from '@features/statementImport/domain/statementImport';
import type { Result } from '@shared/result/Result';

type Responder<TValue> = () => Result<TValue, ImportApiError>;

/** Scripted API. Each call records what was persisted at the moment of the call. */
export class FakeImportApi implements IImportApi {
  readonly calls: Array<{
    method: string;
    observedPersistedPhase: string | null;
  }> = [];

  createResponses: Array<Responder<IJobSnapshot>> = [];

  byKeyResponses: Array<Responder<IJobSnapshot | null>> = [];

  getResponses: Array<Responder<IJobSnapshot>> = [];

  deleteResponses: Array<Responder<IJobSnapshot>> = [];

  lastCreateRequest: ICreateImportRequest | null = null;

  lastDeleteKey: string | null = null;

  constructor(private readonly observePersistedPhase: () => string | null) {}

  async createImport(request: ICreateImportRequest) {
    this.record('createImport');
    this.lastCreateRequest = request;

    return this.take(this.createResponses);
  }

  async findImportByKey() {
    this.record('findImportByKey');

    return this.take(this.byKeyResponses);
  }

  async getImport() {
    this.record('getImport');

    return this.take(this.getResponses);
  }

  async deleteImport(_jobId: string, deleteKey: string) {
    this.record('deleteImport');
    this.lastDeleteKey = deleteKey;

    return this.take(this.deleteResponses);
  }

  callsOf(method: string) {
    const matchingCalls = this.calls.filter(call => call.method === method);

    return matchingCalls.length;
  }

  private record(method: string) {
    this.calls.push({
      method,
      observedPersistedPhase: this.observePersistedPhase(),
    });
  }

  private take<TValue>(responders: Array<Responder<TValue>>) {
    const responder = responders.shift();

    if (responder === undefined) {
      throw new Error('FakeImportApi: unexpected call');
    }

    return responder();
  }
}
