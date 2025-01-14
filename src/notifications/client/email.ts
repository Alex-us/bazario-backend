import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { LoggerTags } from '../../constants';
import { createTaggedLogger } from '../../logger';
import { EmailProps } from '../../types';

const MODULE_NAME = 'email_service';
const logger = createTaggedLogger([LoggerTags.EMAIL, MODULE_NAME]);

let emailClient: Transporter<
  SMTPTransport.SentMessageInfo,
  SMTPTransport.Options
> | null = null;

export const getEmailClient = () => {
  try {
    if (!emailClient) {
      logger.info('Initializing email client');
      emailClient = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PWD,
        },
      });
    }
    return emailClient;
  } catch (err) {
    logger.error('Error initializing email client', { error: err });
  }
};

export const resetEmailClient = () => {
  emailClient = null;
};

export const sendEmail = async (props: EmailProps): Promise<void> => {
  const client = getEmailClient();
  if (!client) {
    throw new Error('Email client is not initialized');
  }
  await client.sendMail(props);
};
