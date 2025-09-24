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
        if (!this.isDevelopment) {
          this.sendToErrorMonitoring(message, sanitizedData, options?.metadata);
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

  // Error monitoring integration methods
  private async sendToErrorMonitoring(
    message: string,
    data?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Check if error monitoring service is configured
      const sentryDsn = process.env.SENTRY_DSN;
      const rollbarToken = process.env.ROLLBAR_ACCESS_TOKEN;
      const bugsnagApiKey = process.env.BUGSNAG_API_KEY;

      if (sentryDsn) {
        await this.sendToSentry(message, data, metadata);
      } else if (rollbarToken) {
        await this.sendToRollbar(message, data, metadata);
      } else if (bugsnagApiKey) {
        await this.sendToBugsnag(message, data, metadata);
      } else {
        // Fallback to database logging
        await this.sendToDatabase(message, data, metadata);
      }
    } catch (error) {
      // Don't let error monitoring failures break the application
      console.error('Error monitoring service failed:', error);
    }
  }

  private async sendToSentry(
    message: string,
    data?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Placeholder for Sentry integration
    // In a real implementation, you would use @sentry/nextjs
    console.log('[SENTRY] Would send error:', { message, data, metadata });
  }

  private async sendToRollbar(
    message: string,
    data?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Placeholder for Rollbar integration
    console.log('[ROLLBAR] Would send error:', { message, data, metadata });
  }

  private async sendToBugsnag(
    message: string,
    data?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Placeholder for Bugsnag integration
    console.log('[BUGSNAG] Would send error:', { message, data, metadata });
  }

  private async sendToDatabase(
    message: string,
    data?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Only attempt database logging on server side
      if (!this.isServer) return;

      // Import dynamically to avoid issues with client-side rendering
      const { logApplicationError } = await import('@/app/actions/application-errors');

      await logApplicationError({
        errorMessage: message,
        errorStack: data?.stack || undefined,
        errorDigest: data?.digest || undefined,
        pathname: metadata?.pathname || undefined,
        metadata: { ...metadata, loggerSource: true },
      });
    } catch (error) {
      console.error('Database error logging failed:', error);
    }
  }

  // Utility method to capture and log unhandled errors
  captureException(error: Error, context?: Record<string, any>): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  // Method to add breadcrumbs for error context
  addBreadcrumb(message: string, category?: string, level?: 'debug' | 'info' | 'warning' | 'error'): void {
    if (typeof window !== 'undefined') {
      try {
        const breadcrumbs = JSON.parse(
          window.sessionStorage.getItem('errorBreadcrumbs') || '[]'
        );

        breadcrumbs.push({
          message,
          category: category || 'general',
          level: level || 'info',
          timestamp: new Date().toISOString(),
        });

        // Keep only last 50 breadcrumbs
        if (breadcrumbs.length > 50) {
          breadcrumbs.shift();
        }

        window.sessionStorage.setItem('errorBreadcrumbs', JSON.stringify(breadcrumbs));
      } catch (error) {
        // Silently fail if sessionStorage is not available
      }
    }
  }

  // Method to set user context for error reporting
  setUserContext(userId: string, userInfo?: Record<string, any>): void {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('errorUserContext', JSON.stringify({
          userId,
          ...userInfo,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        // Silently fail if sessionStorage is not available
      }
    }
  }

  // Performance monitoring
  measurePerformance(label: string, fn: () => Promise<any>): Promise<any>;
  measurePerformance(label: string, fn: () => any): any;
  measurePerformance(label: string, fn: () => any): any {
    const start = performance.now();

    try {
      const result = fn();

      if (result && typeof result.then === 'function') {
        // Handle async function
        return result.finally(() => {
          const duration = performance.now() - start;
          this.debug(`[PERFORMANCE] ${label}: ${duration.toFixed(2)}ms`);
        });
      } else {
        // Handle sync function
        const duration = performance.now() - start;
        this.debug(`[PERFORMANCE] ${label}: ${duration.toFixed(2)}ms`);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`[PERFORMANCE] ${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type definitions
export type { LogLevel, LogOptions };