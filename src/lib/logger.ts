/**
 * Centralized logging utility for the application
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Failed to fetch data', error);
 *   logger.warn('Deprecated API used');
 *   logger.info('User logged in');
 *   logger.debug('Debug info', { data });
 *
 * In production, you can integrate with services like Sentry, LogRocket, etc.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: unknown;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
    // In production, send to monitoring service
    this.sendToMonitoring('info', message, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
    // In production, send to monitoring service
    this.sendToMonitoring('warn', message, data);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, data !== undefined ? data : '');
    }
    // In production, send to error tracking service
    this.sendToMonitoring('error', message, data, error as Error);
  }

  /**
   * Send logs to monitoring service (placeholder for future integration)
   * Integrate with Sentry, LogRocket, Datadog, etc.
   */
  private sendToMonitoring(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    // Production logging would go here
    // Example: Sentry.captureException(error) or Sentry.captureMessage(message)

    if (!this.isDevelopment && level === 'error') {
      // TODO: Integrate with error tracking service
      // Example:
      // if (typeof window !== 'undefined' && window.Sentry) {
      //   window.Sentry.captureException(error || new Error(message), {
      //     extra: { data }
      //   });
      // }
    }
  }

  /**
   * Create a structured log entry for API routes
   */
  createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      data,
      error,
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for cleaner imports
export const logError = (message: string, error?: Error | unknown, data?: unknown) =>
  logger.error(message, error, data);

export const logWarn = (message: string, data?: unknown) =>
  logger.warn(message, data);

export const logInfo = (message: string, data?: unknown) =>
  logger.info(message, data);

export const logDebug = (message: string, data?: unknown) =>
  logger.debug(message, data);
