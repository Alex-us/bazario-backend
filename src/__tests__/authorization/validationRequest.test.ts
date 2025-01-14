import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { BadRequestError } from '../../errors';
import { validationResultMiddleware } from '../../middleware';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('validationResultMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next without errors if validation passes', () => {
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
    });

    validationResultMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with BadRequestError if validation fails', () => {
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ msg: 'Validation error message' }]),
    });

    validationResultMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(mockNext).toHaveBeenCalledWith(
      new BadRequestError('Validation error message')
    );
  });

  it('should handle multiple validation errors and pass the first message', () => {
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest
        .fn()
        .mockReturnValue([
          { msg: 'First validation error' },
          { msg: 'Second validation error' },
        ]),
    });

    validationResultMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('First validation error'));
  });
});
