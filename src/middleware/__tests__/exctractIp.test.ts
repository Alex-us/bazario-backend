import { Request, Response, NextFunction } from 'express';

import extractIpMiddleware from '../extractIp';

describe('extractIpMiddleware', () => {
  const mockRequest = (
    headers: Record<string, string>,
    remoteAddress?: string
  ): Partial<Request> => ({
    headers,
    socket: { remoteAddress } as any,
    ip: '127.0.0.1',
    body: {},
  });

  const mockResponse = (): Partial<Response> => ({});
  const mockNext = jest.fn() as NextFunction;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should extract IP from x-forwarded-for header', () => {
    const req = mockRequest(
      { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      '10.0.0.2'
    ) as Request;
    const res = mockResponse() as Response;

    extractIpMiddleware(req, res, mockNext);

    expect(req.body.ip).toBe('192.168.1.1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should fall back to req.socket.remoteAddress if x-forwarded-for is not set', () => {
    const req = mockRequest({}, '10.0.0.2') as Request;
    const res = mockResponse() as Response;

    extractIpMiddleware(req, res, mockNext);

    expect(req.body.ip).toBe('10.0.0.2');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should fall back to req.ip if neither x-forwarded-for nor remoteAddress is set', () => {
    const req = mockRequest({}, undefined) as Request;
    const res = mockResponse() as Response;

    extractIpMiddleware(req, res, mockNext);

    expect(req.body.ip).toBe('127.0.0.1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle cases where no IP data is available gracefully', () => {
    const req = { headers: {}, socket: {}, body: {} } as Partial<Request> as Request;
    const res = mockResponse() as Response;

    extractIpMiddleware(req, res, mockNext);

    expect(req.body.ip).toBe(undefined);
    expect(mockNext).toHaveBeenCalled();
  });
});
