const path = require('path');
const { createLogger, format, transports } = require('winston');

const {
  combine, colorize, printf,
} = format;

const myFormat = printf(({ level, message }) => `[${level}] ${message}`);

/**
 * general purpose logger, errors are separated into error.log
 * but also written into combined.log
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL,
  transports: [
    new transports.Console({ format: combine(colorize(), myFormat) }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      format: myFormat,
    }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      level: 'silly',
      format: myFormat,
    }),
  ],
});

/**
 * logger for HTTP calls, calls are separated into http.log
 * but also written into combined.log
 */
const httpLogger = createLogger({
  level: process.env.LOG_LEVEL,
  transports: [
    new transports.Console({ format: combine(colorize(), myFormat) }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'http.log'),
      level: 'silly',
      format: myFormat,
    }),
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      level: 'silly',
      format: myFormat,
    }),
  ],
});

// pipe morgan http log stream into silly level of httpLogger
httpLogger.stream = {
  write(message) {
    httpLogger.silly(message.trim());
  },
};

module.exports = { logger, httpLogger };
