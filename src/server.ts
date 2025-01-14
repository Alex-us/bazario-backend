import dotenv from 'dotenv';
dotenv.config();
import { initLogger, createTaggedLogger } from './logger';
initLogger();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';

import { ROOT_ROUTE, LoggerTags } from './constants';
import { connectMongo } from './database/mongo/client';
import { connectRedis } from './database/redis/client';
import { initTranslations } from './lang/i18n';
import {
  loggerMiddleware,
  errorMiddleware,
  validationResultMiddleware,
  notFoundMiddleware,
} from './middleware';
import { rootRouter } from './routes';
//import './config/passport';

const logger = createTaggedLogger([LoggerTags.DB]);

const app = express();
app.use(loggerMiddleware);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
//app.use(passport.initialize());
app.use(ROOT_ROUTE, rootRouter);

//404
app.use(notFoundMiddleware);

app.use(validationResultMiddleware);

//errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

initTranslations()
  .then(connectMongo)
  .then(connectRedis)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('Error starting app server', { error: err });
  });
