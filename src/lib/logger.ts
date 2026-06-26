/**
 * Centralized logging service for CityScope
 * Replaces console.log/error/warn with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval: number | null = null;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
    this.startPeriodicFlush();
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      return `${prefix} ${message} | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      return `${prefix} ${message} | Error: ${error.message} | Stack: ${error.stack}`;
    }
    
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user from auth context
      const authData = localStorage.getItem('sb-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }
  }

  private startPeriodicFlush(): void {
    // Flush logs every 30 seconds in production
    if (!this.isDevelopment) {
      this.flushInterval = window.setInterval(() => {
        this.flushLogs();
      }, 30000);
    }
  }

  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    // In a real app, send logs to your logging service (Sentry, LogRocket, etc.)
    // For now, we'll just clear the buffer after logging
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Send to external service if configured
    if (import.meta.env.VITE_LOG_ENDPOINT) {
      fetch(import.meta.env.VITE_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToFlush }),
      }).catch(() => {
        // Silently fail - don't break the app if logging fails
      });
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.createLogEntry('warn', message, context, error);
    this.addToBuffer(entry);
    
    console.warn(this.formatMessage('warn', message, context, error));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.addToBuffer(entry);
    
    console.error(this.formatMessage('error', message, context, error));
    
    // Send critical errors to error tracking service
    if (!this.isDevelopment && error) {
      this.reportError(error, context);
    }
  }

  private reportError(error: Error, context?: Record<string, unknown>): void {
    // Integration with error tracking service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }
  }

  // Log performance metrics
  performance(metric: string, duration: number, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', `Performance: ${metric}`, {
      ...context,
      duration,
      metric,
    });
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(`⚡ Performance: ${metric} took ${duration}ms`, context);
    }
  }

  // Get recent logs (for debugging)
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  clear(): void {
    this.logBuffer = [];
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushLogs();
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>, error?: Error) => 
    logger.warn(message, context, error),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => 
    logger.error(message, error, context),
  performance: (metric: string, duration: number, context?: Record<string, unknown>) => 
    logger.performance(metric, duration, context),
};

