import type {
  IImportStore,
  StoreListener,
} from '@features/statementImport/ports';
import type { IStatementImport } from '@features/statementImport/domain/statementImport';

/** Plays the role of the device's persistent files: survives a simulated relaunch. */
export class InMemoryImportStore implements IImportStore {
  readonly history: Array<IStatementImport | null> = [];

  private current: IStatementImport | null = null;

  private readonly listeners = new Set<StoreListener>();

  clear() {
    this.current = null;
    this.history.push(null);
    this.notify();
  }

  get() {
    return this.current;
  }

  save(statementImport: IStatementImport) {
    this.current = statementImport;
    this.history.push(statementImport);
    this.notify();
  }

  subscribe(listener: StoreListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}
