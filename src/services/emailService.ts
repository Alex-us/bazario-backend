import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { LoggerTags } from '../constants/logger';
import { Routes } from '../constants/routes';
import { createTaggedLogger } from '../logger';
import { UserBlockReasons } from '../types/models/user';
import { MailProps } from '../types/services/email';
import { getIpLocation } from '../utils/geoLocation';
import { getUserAgentInfo } from '../utils/uaInfo';

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

export const sendActivationMail = async (to: string, token: string) => {
  const activationUrl = `${process.env.API_URL}${Routes.ACTIVATE.replace(':token', token)}`;
  const client = emailClient ?? getEmailClient();
  if (!client) {
    throw new Error('Email client is not initialized');
  }
  await client.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Actions required to finish registration',
    text: '',
    html: `
          <div>
          <h1>To activate you account please follow yrl below</h1>
          <a href="${activationUrl}" > ${activationUrl} </a>
          </div>
      `,
  });
};

export const sendLoginFromNewDeviceMail = async (
  to: string,
  token: string,
  ip: string = 'unknown',
  userAgent: string = ''
) => {
  const location = getIpLocation(ip);
  const { os, browser } = getUserAgentInfo(userAgent);
  const activationUrl = `${process.env.API_URL}${Routes.ACTIVATE.replace(':token', token)}`;
  const client = emailClient ?? getEmailClient();
  if (!client) {
    throw new Error('Email client is not initialized');
  }
  await client.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Login from new device',
    text: '',
    html: `
          <div>
          <h1>Someone just logged in to your account from a new device</h1>
          <ul>
            <li><strong>OS:</strong> ${os}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>IP Address:</strong> ${ip}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <a href="${activationUrl}" > ${activationUrl} </a>
          </div>
      `,
  });
};

export const sendEmail = async (props: MailProps) => {
  try {
    switch (props.type) {
      case UserBlockReasons.NEW_DEVICE_LOGIN:
        await sendLoginFromNewDeviceMail(
          props.to,
          props.token,
          props.ip,
          props.userAgent
        );
        break;
      case UserBlockReasons.UNCONFIRMED_EMAIL:
        await sendActivationMail(props.to, props.token);
        break;
      default:
        return;
    }
  } catch (err) {
    logger.error('Error sending email', { error: err });
  }
};
