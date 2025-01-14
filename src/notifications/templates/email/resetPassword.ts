import { ACCOUNT_ROUTES } from '../../../constants';
import { EmailPayload } from '../../../types';

export const getResetPasswordTemplate = (payload: EmailPayload) => {
  const { token } = payload;
  const resetUrl = `${process.env.API_URL}${ACCOUNT_ROUTES.REQUEST_RESET_PASSWORD.replace(':token', token)}`;
  return `
          <div>
          <h1>To reset your password please follow the url below</h1>
          <a href="${resetUrl}" > ${resetUrl} </a>
          </div>
      `;
};
