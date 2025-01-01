import { validationResult, checkSchema } from 'express-validator';

import { AUTH_ERROR_MESSAGE } from '../../errors/constants';
import registerSchema from '../registerSchema';

describe('Register Schema Validation', () => {
  const validate = async (data: Record<string, unknown>) => {
    const req = {
      body: data,
    } as any;

    await Promise.all(checkSchema(registerSchema).map(validation => validation.run(req)));

    return validationResult(req);
  };

  it('should validate correctly for valid input', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'Password1!',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('should fail if email is empty', async () => {
    const result = await validate({
      email: '',
      password: 'Password1!',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.EMPTY_EMAIL,
        }),
      ])
    );
  });

  it('should fail if email is invalid', async () => {
    const result = await validate({
      email: 'invalid-email',
      password: 'Password1!',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.INVALID_EMAIL,
        }),
      ])
    );
  });

  it('should fail if password is empty', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: '',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.EMPTY_PASS,
        }),
      ])
    );
  });

  it('should fail if password is too short', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'S',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.INVALID_PASS_LENGTH,
        }),
      ])
    );
  });

  it('should fail if password does not contain required characters', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'password123',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.INVALID_PASS,
        }),
      ])
    );
  });

  it('should fail if deviceId is empty', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'Password1!',
      deviceId: '',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: AUTH_ERROR_MESSAGE.EMPTY_DEVICE_ID,
        }),
      ])
    );
  });
});
