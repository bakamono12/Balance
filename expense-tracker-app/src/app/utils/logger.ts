// Logger utility for debugging and error tracking
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogEntry['level'], message: string, data?: any, stack?: string) {
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      stack,
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console for debugging
    const consoleMsg = `[${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMsg, data || '', stack || '');
        break;
      case 'warn':
        console.warn(consoleMsg, data || '');
        break;
      case 'debug':
        console.debug(consoleMsg, data || '');
        break;
      default:
        console.log(consoleMsg, data || '');
    }
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, error?: any) {
    const stack = error?.stack || new Error().stack;
    this.addLog('error', message, error?.message || error, stack);
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs as string
  exportLogs(): string {
    return this.logs
      .map(log => {
        let output = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
        if (log.data) {
          output += `\nData: ${JSON.stringify(log.data, null, 2)}`;
        }
        if (log.stack) {
          output += `\nStack: ${log.stack}`;
        }
        return output;
      })
      .join('\n\n');
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to safely log data with NaN/undefined checks
export const logSafeData = (label: string, data: any) => {
  const sanitized = JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'number') {
        if (isNaN(value)) return 'NaN';
        if (!isFinite(value)) return 'Infinity';
      }
      if (value === undefined) return 'undefined';
      return value;
    })
  );
  logger.debug(label, sanitized);
  return sanitized;
};

