import mongoose from 'mongoose';


export const userAProps = {
  email: 'test@example.com',
  password: 'password123',
  deviceId: 'device1',
  ip: '127.0.0.1',
  userAgent: 'Mozilla',
};

export const mockUserA = {
  ...userAProps,
  password: 'hashedPassword',
  _id: new mongoose.Types.ObjectId(),
  confirmedDevices: [],
  active: false,
  blockReason: 'UNCONFIRMED_EMAIL',
  save: jest.fn(),
  activationToken: undefined,
};
