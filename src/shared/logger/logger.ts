import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log directory
const logDirectory = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

/**
 * Winston logger configuration with file rotation
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default: info (shows info, warn, error)
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const ts = typeof timestamp === 'string' ? timestamp : String(timestamp);
      const lvl = typeof level === 'string' ? level : String(level);
      const msg = typeof message === 'string' ? message : String(message);
      const stk = typeof stack === 'string' ? stack : '';
      return `${ts} [${lvl.toUpperCase()}] ${stk || msg}`;
    })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => {
          info.level = info.level.toUpperCase();
          return info;
        })(),
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          const dimGray = '\x1b[90m'; // ANSI code for bright black (gray)
          const reset = '\x1b[0m';
          const ts = typeof timestamp === 'string' ? timestamp : String(timestamp);
          const lvl = typeof level === 'string' ? level : String(level);
          const msg = typeof message === 'string' ? message : String(message);
          const stk = typeof stack === 'string' ? stack : '';
          return `[${lvl}] ${dimGray}${ts}${reset} ${stk || msg}`;
        })
      ),
    }),
    
    // File transport for all logs
    new DailyRotateFile({
      filename: path.join(logDirectory, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m', // Rotate when file size exceeds 20MB
      maxFiles: process.env.LOG_MAX_FILES || '14d', // Keep logs for 14 days, then delete
      zippedArchive: true, // Compress old log files
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json() // Store logs in JSON format for easier parsing
      ),
    }),
    
    // Separate file for error logs only
    new DailyRotateFile({
      filename: path.join(logDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error', // Only log errors
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES_ERROR || '30d', // Keep error logs for 30 days
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ],
});

export { logger };

