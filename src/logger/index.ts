import isEmpty from 'lodash/isEmpty';
import { createLogger, format, transports, Logger } from 'winston';
import { Loggly } from 'winston-loggly-bulk';

const { combine, timestamp, errors, json, printf, colorize } = format;

let logger: Logger;

export const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(info => {
    const { tags, timestamp, level, message, stack, ...rest } = info;
    const tagsStr = tags
      ? (tags as string[]).map((tag: string) => `[#${tag}]`).join(' ')
      : '';
    const data = isEmpty(rest) ? '' : `\n${JSON.stringify(rest)}`;
    const logMessage = `${timestamp} [${level}] ${tagsStr}: ${message} ${data}`;
    return stack ? `${logMessage}\n${stack}` : logMessage;
  })
);

export const logglyFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

export const initLogger = (force?: boolean) => {
  if (force || !logger) {
    logger = createLogger({
      level: 'info',
      transports: [new transports.Console({ format: consoleFormat })],
    });

    if (process.env.NODE_ENV === 'production') {
      logger.add(
        new Loggly({
          token: String(process.env.LOGGLY_TOKEN),
          subdomain: String(process.env.LOGGLY_SUBDOMAIN),
          tags: ['Backend'],
          json: true,
          format: logglyFormat,
        })
      );
    }
  }
}

export const createTaggedLogger = (tags: string[]): Logger => {
  if (!logger) {
    initLogger();
  }

  return logger.child({
    tags,
  });
};

export {logger};
