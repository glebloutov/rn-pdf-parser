import type { ILogFields, ILogger } from '@shared/logger/ILogger';
import type { LogEvent } from '@shared/logger/LogEvent';

type LogLevel = 'error' | 'info' | 'warn';

const SERVICE_NAME = 'rn-pdf-parser';

const formatEntry = (level: LogLevel, event: LogEvent, fields?: ILogFields) => {
  const entry = {
    event,
    level,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  return JSON.stringify(entry);
};

/** Structured JSON logs, dev builds only. Fields are allow-listed by ILogFields. */
export class ConsoleLogger implements ILogger {
  constructor(private readonly isEnabled: boolean) {}

  error(event: LogEvent, fields?: ILogFields) {
    this.write('error', event, fields);
  }

  info(event: LogEvent, fields?: ILogFields) {
    this.write('info', event, fields);
  }

  warn(event: LogEvent, fields?: ILogFields) {
    this.write('warn', event, fields);
  }

  private write(level: LogLevel, event: LogEvent, fields?: ILogFields) {
    if (!this.isEnabled) {
      return;
    }

    console.log(formatEntry(level, event, fields));
  }
}
