/**
 * Centralized logging utility for the Matchbook application
 * Only logs in development mode and provides different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  // Sanitize function to remove sensitive data
  sanitize?: (data: any) => any;
  // Whether to log in production (default: false)
  forceProduction?: boolean;
  // Custom metadata to include with the log
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment: boolean;
  private isServer: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isServer = typeof window === 'undefined';
  }

  private shouldLog(options?: LogOptions): boolean {
    return this.isDevelopment || options?.forceProduction === true;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Convert to string and check for sensitive patterns
    const stringified = JSON.stringify(data);
    
    // Patterns to detect sensitive data
    const sensitivePatterns = [
      /password["\s:=]+"[^"]+"/gi,
      /token["\s:=]+"[^"]+"/gi,
      /api[_-]?key["\s:=]+"[^"]+"/gi,
      /secret["\s:=]+"[^"]+"/gi,
      /bearer\s+[a-zA-Z0-9\-_]+/gi,
      /authorization["\s:=]+"[^"]+"/gi,
    ];
    
    let sanitized = stringified;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split(/[":=]/);
        if (parts.length > 1) {
          return `${parts[0]}:"[REDACTED]"`;
        }
        return '[REDACTED]';
      });
    }
    
    try {
      return JSON.parse(sanitized);
    } catch {
      return data;
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const environment = this.isServer ? 'server' : 'client';
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] [${environment}] ${message}`;
    
    if (options?.metadata) {
      formatted += ` | metadata: ${JSON.stringify(options.metadata)}`;
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, data?: any, options?: LogOptions): void {
    if (!this.shouldLog(options)) return;
    
    const formattedMessage = this.formatMessage(level, message, data, options);
    const sanitizedData = options?.sanitize ? options.sanitize(data) : this.sanitizeData(data);
    
    switch (level) {
      case 'debug':
        if (data !== undefined) {
          console.log(formattedMessage, sanitizedData);
        } else {
          console.log(formattedMessage);
        }
        break;
      case 'info':
        if (data !== undefined) {
          console.info(formattedMessage, sanitizedData);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (data !== undefined) {
          console.warn(formattedMessage, sanitizedData);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (data !== undefined) {
          console.error(formattedMessage, sanitizedData);
        } else {
          console.error(formattedMessage);
        }
        
        // In production, send errors to monitoring service
        if (!this.isDevelopment && this.isServer) {
          // TODO: Integrate with error monitoring service (e.g., Sentry)
          // this.sendToErrorMonitoring(message, sanitizedData, options?.metadata);
        }
        break;
    }
  }

  debug(message: string, data?: any, options?: LogOptions): void {
    this.log('debug', message, data, options);
  }

  info(message: string, data?: any, options?: LogOptions): void {
    this.log('info', message, data, options);
  }

  warn(message: string, data?: any, options?: LogOptions): void {
    this.log('warn', message, data, options);
  }

  error(message: string, data?: any, options?: LogOptions): void {
    this.log('error', message, data, { ...options, forceProduction: true });
  }

  // Utility method for performance logging
  time(label: string): void {
    if (!this.shouldLog()) return;
    console.time(label);
  }

  timeEnd(label: string): void {
    if (!this.shouldLog()) return;
    console.timeEnd(label);
  }

  // Utility method for table logging (development only)
  table(data: any): void {
    if (!this.shouldLog()) return;
    console.table(data);
  }

  // WebSocket-specific logging method
  ws(event: string, data?: any, options?: LogOptions): void {
    this.debug(`[WebSocket] ${event}`, data, options);
  }

  // Group logging methods
  group(label: string): void {
    if (!this.shouldLog()) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.shouldLog()) return;
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type definitions
export type { LogLevel, LogOptions };