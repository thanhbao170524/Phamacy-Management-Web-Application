type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { error };
    
    console.error(this.formatMessage('error', message, { ...context, ...errorDetails }));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Request logger
  request(method: string, path: string, userId?: string, duration?: number) {
    this.info(`HTTP ${method} ${path}`, {
      method,
      path,
      userId,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

export const logger = new Logger();

