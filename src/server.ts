import dotenv from 'dotenv';
dotenv.config();
import { initLogger} from './logger';
initLogger();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';

import { connectMongo } from './database/mongo/client';
import { connectRedis } from './database/redis/client';
import { createTaggedLogger } from './logger';
import { LoggerTags } from './logger/constants';
import errorMiddleware from './middleware/errorHandler';
import {requestLogger} from './middleware/requestLogger';
import  { rootRouter, activationRoutes } from './routes';
import {Routes} from './routes/constants';
//import './config/passport';

const logger = createTaggedLogger([LoggerTags.DB]);

const app = express();
app.use(requestLogger);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
//app.use(passport.initialize());
app.use(activationRoutes);
app.use(Routes.ROOT, rootRouter);

//404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

//errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

connectMongo()
  .then(connectRedis)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('Error starting app server', { error: err });
  });
