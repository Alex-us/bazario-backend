import mongoose from 'mongoose';

import { createTaggedLogger } from '../../logger';
import * as mongoClient from '../mongoClient';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

jest.mock('../../logger', () => ({
  createTaggedLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockMongoURI = 'mongodb://localhost:27017/testdb';

describe('mongoClient', () => {
  const logger = createTaggedLogger(['some', 'mongo']);
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGO_URI = mockMongoURI;
  });

  it('should connect to MongoDB successfully', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

    await mongoClient.connectMongo();

    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoURI);
    expect(logger.info).toHaveBeenCalledWith('Mongo connected successfully');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log an error if connection to MongoDB fails', async () => {
    const mockError = new Error('Connection failed');
    (mongoose.connect as jest.Mock).mockRejectedValueOnce(mockError);

    await expect(mongoClient.connectMongo()).rejects.toThrow(mockError);

    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoURI);
    expect(logger.error).toHaveBeenCalledWith('Error connecting to MongoDB', {
      error: mockError,
    });
    expect(logger.info).not.toHaveBeenCalled();
  });
});
