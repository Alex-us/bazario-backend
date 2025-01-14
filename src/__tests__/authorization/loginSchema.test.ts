import { Request } from 'express';
import { validationResult, checkSchema } from 'express-validator';

import { loginSchema } from '../../authorization/validators/schema';
import { ERROR_MESSAGE } from '../../constants';

describe('Login Schema Validation', () => {
  const validate = async (data: Record<string, unknown>) => {
    const req = {
      body: data,
    } as Request;

    await Promise.all(checkSchema(loginSchema).map(validation => validation.run(req)));

    return validationResult(req);
  };

  it('should validate correctly for valid input', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'password123',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('should fail if email is empty', async () => {
    const result = await validate({
      email: '',
      password: 'password123',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: ERROR_MESSAGE.EMPTY_EMAIL,
        }),
      ])
    );
  });

  it('should fail if email is invalid', async () => {
    const result = await validate({
      email: 'invalid-email',
      password: 'password123',
      deviceId: 'device1',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: ERROR_MESSAGE.INVALID_EMAIL,
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
          msg: ERROR_MESSAGE.EMPTY_PASS,
        }),
      ])
    );
  });

  it('should fail if deviceId is empty', async () => {
    const result = await validate({
      email: 'test@example.com',
      password: 'password123',
      deviceId: '',
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: ERROR_MESSAGE.EMPTY_DEVICE_ID,
        }),
      ])
    );
  });
});
