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
      const ts = typeof timestamp === 'string' ? timestamp : String(timestamp);
      const lvl = typeof level === 'string' ? level : String(level);
      const msg = typeof message === 'string' ? message : String(message);
      const stk = typeof stack === 'string' ? stack : '';
      return `${ts} [${lvl.toUpperCase()}] ${stk || msg}`;
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
          const ts = typeof timestamp === 'string' ? timestamp : String(timestamp);
          const lvl = typeof level === 'string' ? level : String(level);
          const msg = typeof message === 'string' ? message : String(message);
          const stk = typeof stack === 'string' ? stack : '';
          return `[${lvl}] ${dimGray}${ts}${reset} ${stk || msg}`;
        })
      ),
    }),
  ],
});

export { logger };

