import isEmpty from 'lodash/isEmpty';
import { createLogger, format, transports, Logger } from 'winston';
import { Loggly } from 'winston-loggly-bulk';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
    format.colorize(),
    format.printf(info => {
      const { tags, timestamp, level, message, stack, ...rest } = info;
      const tagsStr = tags
        ? (tags as string[]).map((tag: string) => `[#${tag}]`).join(' ')
        : '';
      const data = isEmpty(rest) ? '' : `\n${JSON.stringify(rest)}`;
      const logMessage = `${timestamp} [${level}] ${tagsStr}: ${message} ${data}`;
      return stack ? `${logMessage}\n${stack}` : logMessage;
    })
  ),
  transports: [new transports.Console()],
});

if (process.env.LOGGLY_TOKEN && process.env.LOGGLY_SUBDOMAIN) {
  logger.add(
    new Loggly({
      token: process.env.LOGGLY_TOKEN,
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      tags: ['Backend'],
      json: true,
    })
  );
}

export const createTaggedLogger = (tags: string[]): Logger => {
  return logger.child({
    tags,
  });
};

export default logger;
