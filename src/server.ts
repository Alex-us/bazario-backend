import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';

import { Routes } from './constants/routes';
import { connectMongo } from './database/mongoClient';
import { connectRedis } from './database/redisClient';
import errorMiddleware from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import rootRouters, { activationRoutes } from './routes';
//import './config/passport';

const app = express();
app.use(requestLogger);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
//app.use(passport.initialize());
app.use(activationRoutes);
app.use(Routes.ROOT, rootRouters);

//errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

connectMongo()
  .then(connectRedis)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
