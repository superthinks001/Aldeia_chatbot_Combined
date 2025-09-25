export type LogMethod = (...messages: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
}

const isDebugEnabled = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

export const logger: Logger = {
  info: (...messages) => console.log('[INFO]', ...messages),
  warn: (...messages) => console.warn('[WARN]', ...messages),
  error: (...messages) => console.error('[ERROR]', ...messages),
  debug: (...messages) => {
    if (isDebugEnabled) console.debug('[DEBUG]', ...messages);
  }
};

export default logger;


