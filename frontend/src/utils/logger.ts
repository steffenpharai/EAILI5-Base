// Structured logging utility for EAILI5 frontend

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  component?: string;
  action?: string;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelName = levelNames[entry.level];
    
    let message = `[${entry.timestamp}] ${levelName}`;
    
    if (entry.component) {
      message += ` [${entry.component}]`;
    }
    
    if (entry.action) {
      message += ` [${entry.action}]`;
    }
    
    message += `: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    return message;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, component?: string, action?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      component,
      action,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In development, also log to localStorage for debugging
    if (this.isDevelopment) {
      this.logToStorage(entry);
    }
  }

  private logToStorage(entry: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem('eaili5_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('eaili5_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  debug(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log(LogLevel.DEBUG, message, context, component, action);
  }

  info(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log(LogLevel.INFO, message, context, component, action);
  }

  warn(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log(LogLevel.WARN, message, context, component, action);
  }

  error(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log(LogLevel.ERROR, message, context, component, action);
  }

  // WebSocket specific logging
  wsConnect(url: string, component?: string): void {
    this.info(`WebSocket connecting to ${url}`, { url }, component, 'WS_CONNECT');
  }

  wsConnected(url: string, component?: string): void {
    this.info(`WebSocket connected to ${url}`, { url }, component, 'WS_CONNECTED');
  }

  wsDisconnected(url: string, code?: number, reason?: string, component?: string): void {
    this.warn(`WebSocket disconnected from ${url}`, { url, code, reason }, component, 'WS_DISCONNECTED');
  }

  wsError(error: Event, url: string, component?: string): void {
    this.error(`WebSocket error on ${url}`, { url, error: error.type }, component, 'WS_ERROR');
  }

  wsMessageSent(message: any, url: string, component?: string): void {
    this.debug(`WebSocket message sent to ${url}`, { url, message }, component, 'WS_SEND');
  }

  wsMessageReceived(message: any, url: string, component?: string): void {
    this.debug(`WebSocket message received from ${url}`, { url, message }, component, 'WS_RECEIVE');
  }

  // API specific logging
  apiRequest(method: string, url: string, data?: any, component?: string): void {
    this.info(`API ${method} request to ${url}`, { method, url, data }, component, 'API_REQUEST');
  }

  apiResponse(method: string, url: string, status: number, data?: any, component?: string): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} response from ${url}`, { method, url, status, data }, component, 'API_RESPONSE');
  }

  apiError(method: string, url: string, error: any, component?: string): void {
    this.error(`API ${method} error for ${url}`, { method, url, error: error.message }, component, 'API_ERROR');
  }

  // User action logging
  userAction(action: string, data?: any, component?: string): void {
    this.info(`User action: ${action}`, { action, data }, component, 'USER_ACTION');
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any, component?: string): void {
    this.info(`Performance: ${operation} took ${duration}ms`, { operation, duration, data }, component, 'PERFORMANCE');
  }

  // Get stored logs for debugging
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('eaili5_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored logs
  clearStoredLogs(): void {
    localStorage.removeItem('eaili5_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
