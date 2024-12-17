import mongoose from 'mongoose';

import { LoggerTags } from '../constants/logger';
import { createTaggedLogger } from '../logger';

const MODULE_NAME = 'mongo';
const logger = createTaggedLogger([LoggerTags.DB, MODULE_NAME]);

export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    logger.info('Mongo connected successfully');
  } catch (err) {
    logger.error('Error connecting to MongoDB', { error: err });
  }
};
