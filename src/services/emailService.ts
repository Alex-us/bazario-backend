import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';

const activationBaseUrl = `${process.env.API_URL}/activate:`;

const MODULE_NAME = 'email_service';
const logger = createTaggedLogger([LoggerTags.EMAIL, MODULE_NAME]);

let emailClient: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;

export const getEmailClient = () => {
  try {
    if (!emailClient) {
      logger.info('Initializing email transporter');
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

export const sendActivationMail = async (to: string, path: string) => {
  await emailClient?.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Actions required to finish registration',
    text: '',
    html: `
          <div>
          <h1>To activate you account please follow yrl below</h1>
          <a href="${activationBaseUrl}${path}" > ${activationBaseUrl}${path} </a>
          </div>
      `,
  });
};
