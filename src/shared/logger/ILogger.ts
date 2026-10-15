import type { LogEvent } from '@shared/logger/LogEvent';

/**
 * Allow-listed log fields only. Free text, file names, URIs, bytes and
 * statement content can't be logged by construction.
 */
export interface ILogFields {
  code?: string;
  jobId?: string;
  phase?: string;
  revision?: number;
  status?: string;
}

export interface ILogger {
  error(event: LogEvent, fields?: ILogFields): void;
  info(event: LogEvent, fields?: ILogFields): void;
  warn(event: LogEvent, fields?: ILogFields): void;
}
