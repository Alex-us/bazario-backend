import { ACCOUNT_ROUTES } from '../../../account/constants';
import { getIpLocation } from '../../../utils/geoLocation';
import { getUserAgentInfo } from '../../../utils/uaInfo';
import { NewDeviceLoginEmailPayload } from '../types';

export const getNewDeviceLoginEmailTemplate = (payload: NewDeviceLoginEmailPayload) => {
  const { token, ip = 'unknown', userAgent = '' } = payload;
  const location = getIpLocation(ip) ?? 'unknown';
  const { os, browser } = getUserAgentInfo(userAgent);
  const activationUrl = `${process.env.API_URL}${ACCOUNT_ROUTES.ACTIVATE.replace(':token', token)}`;

  return `
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
      `;
};
