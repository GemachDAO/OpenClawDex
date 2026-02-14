/**
 * Centralized Logger Utility
 * 
 * Provides consistent logging across the application.
 * Can be easily extended to integrate with external logging services.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Log info message
 */
export function info(message: string, context?: LogContext): void {
  console.log(formatLogMessage('info', message, context));
}

/**
 * Log warning message
 */
export function warn(message: string, context?: LogContext): void {
  console.warn(formatLogMessage('warn', message, context));
}

/**
 * Log error message
 */
export function error(message: string, err?: Error | unknown, context?: LogContext): void {
  const errorContext = err instanceof Error 
    ? { ...context, error: err.message, stack: err.stack }
    : { ...context, error: String(err) };
  
  console.error(formatLogMessage('error', message, errorContext));
}

/**
 * Log debug message (only in development)
 */
export function debug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLogMessage('debug', message, context));
  }
}

/**
 * Default export with all log methods
 */
export default {
  info,
  warn,
  error,
  debug,
};
