type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class ClientLogger {
  private async sendLog(level: LogLevel, message: string, context: string, data?: LogData) {
    // Only log in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          context,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Fallback to console if API fails
      console.error('Failed to send log to API:', error);
      console.log(`[CLIENT] [${level.toUpperCase()}] [${context}] ${message}`, data);
    }
  }

  debug(message: string, data?: LogData, context = 'client') {
    this.sendLog('debug', message, context, data);
  }

  info(message: string, data?: LogData, context = 'client') {
    this.sendLog('info', message, context, data);
  }

  warn(message: string, data?: LogData, context = 'client') {
    this.sendLog('warn', message, context, data);
  }

  error(message: string, data?: LogData, context = 'client') {
    this.sendLog('error', message, context, data);
  }
}

export const clientLogger = new ClientLogger();