const path = require('path');
const {
  createLogger, format, transports, addColors,
} = require('winston');

const {
  combine, colorize, printf, timestamp,
} = format;

// eslint-disable-next-line no-shadow
const loggerFormat = printf(({ timestamp, level, message }) => `[${timestamp}][${level}] ${message}`);
const httpLoggerFormat = printf(({ level, message }) => `[${level}] ${message}`);

/**
 * general purpose logger, errors are separated into error.log
 * but also written into combined.log
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL,
  transports: [
    new transports.Console({ format: combine(colorize(), timestamp(), loggerFormat) }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      format: combine(timestamp(), loggerFormat),
    }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      level: 'silly',
      format: combine(timestamp(), loggerFormat),
    }),
  ],
});

/**
 * logger for HTTP calls, calls are separated into http.log
 * but also written into combined.log
 */
addColors({ http: 'blue' });
const httpLogger = createLogger({
  levels: { http: 0 },
  transports: [
    new transports.Console({ level: 'http', format: combine(colorize(), httpLoggerFormat) }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'http.log'),
      level: 'http',
      format: httpLoggerFormat,
    }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      level: 'http',
      format: httpLoggerFormat,
    }),
  ],
});

// pipe morgan http log stream into silly level of httpLogger
httpLogger.stream = {
  write(message) {
    httpLogger.http(message.trim());
  },
};

module.exports = { logger, httpLogger };
