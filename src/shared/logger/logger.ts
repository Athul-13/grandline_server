import winston from 'winston';

/**
 * Winston logger configuration
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default: info (shows info, warn, error)
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
    })
  ),
  transports: [
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
          return `[${level}] ${dimGray}${timestamp}${reset} ${stack || message}`;
        })
      ),
    }),
  ],
});

export { logger };

