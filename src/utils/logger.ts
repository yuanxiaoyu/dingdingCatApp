// Logging Utility for Development and Debugging
import { ENV_CONFIG } from '../config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.getLogLevelFromConfig();
  }

  private getLogLevelFromConfig(): LogLevel {
    switch (ENV_CONFIG.LOG_LEVEL) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, tag: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${tag}] ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  debug(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', tag, message, data));
    }
  }

  info(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', tag, message, data));
    }
  }

  warn(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', tag, message, data));
    }
  }

  error(tag: string, message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', tag, message, error));
    }
  }

  // Network request logging
  logRequest(method: string, url: string, data?: any): void {
    this.debug('API_REQUEST', `${method} ${url}`, data);
  }

  logResponse(method: string, url: string, status: number, data?: any): void {
    this.debug('API_RESPONSE', `${method} ${url} - ${status}`, data);
  }

  // Ad event logging
  logAdEvent(event: string, adType: string, adId?: string, data?: any): void {
    this.info('AD_EVENT', `${event} - ${adType}${adId ? ` (${adId})` : ''}`, data);
  }

  // Auth event logging
  logAuthEvent(event: string, data?: any): void {
    this.info('AUTH_EVENT', event, data);
  }

  // Risk control logging
  logRiskEvent(event: string, data?: any): void {
    this.warn('RISK_CONTROL', event, data);
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;