import { ACCOUNT_ROUTES } from '../../../constants';
import { EmailPayload } from '../../../types';

export const getConfirmEmailTemplate = (payload: EmailPayload) => {
  const { token } = payload;
  const activationUrl = `${process.env.API_URL}${ACCOUNT_ROUTES.ACTIVATE.replace(':token', token)}`;
  return `
    <div>
          <h1>To confirm your email and activate account please follow url below</h1>
          <a href="${activationUrl}" > ${activationUrl} </a>
          </div>
  `;
};
