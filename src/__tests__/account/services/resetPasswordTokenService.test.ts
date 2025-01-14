import {
  generateResetPasswordToken,
  findResetPasswordTokenOrThrow,
  deleteResetPasswordToken,
} from '../../../account/services/resetPasswordTokenService';
import {
  deleteResetPasswordTokenFromDB,
  getResetPasswordToken,
  saveResetPasswordToken,
} from '../../../database/redis/resetPasswordToken';

jest.mock('../../../database/redis/resetPasswordToken');

describe('generateResetPasswordToken', () => {
  it('generates a token and saves it', async () => {
    const email = 'test@example.com';
    (saveResetPasswordToken as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await generateResetPasswordToken(email);

    expect(result).toEqual(expect.any(String));
    expect(saveResetPasswordToken).toHaveBeenCalledWith(email, result);
  });
});

describe('findResetPasswordTokenOrThrow', () => {
  it('returns the token if it matches', async () => {
    const email = 'test@example.com';
    const token = 'valid-token';
    (getResetPasswordToken as jest.Mock).mockResolvedValueOnce(token);

    const result = await findResetPasswordTokenOrThrow(email, token);

    expect(result).toBe(token);
  });

  it('throws an error if the token does not match', async () => {
    const email = 'test@example.com';
    const token = 'invalid-token';
    (getResetPasswordToken as jest.Mock).mockResolvedValueOnce('valid-token');

    await expect(findResetPasswordTokenOrThrow(email, token)).rejects.toThrow(
      'Invalid token'
    );
  });

  it('throws an error if no token is provided', async () => {
    const email = 'test@example.com';
    (getResetPasswordToken as jest.Mock).mockResolvedValueOnce('valid-token');

    await expect(findResetPasswordTokenOrThrow(email, '')).rejects.toThrow(
      'Invalid token'
    );
  });
});

describe('deleteResetPasswordToken', () => {
  it('deletes the token', async () => {
    const email = 'test@example.com';
    (deleteResetPasswordTokenFromDB as jest.Mock).mockResolvedValueOnce(undefined);

    await deleteResetPasswordToken(email);

    expect(deleteResetPasswordTokenFromDB).toHaveBeenCalledWith(email);
  });
});
