import type { ILogger } from '@shared/logger/ILogger';

export class NoopLogger implements ILogger {
  error() {}

  info() {}

  warn() {}
}
