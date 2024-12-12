import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import errorMiddleware from './middleware/errorMiddleware';
import getRedisClient from './redis/client';
import authRoutes from './routes/authRoutes';
//import './config/passport';

dotenv.config();

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
//app.use(passport.initialize());
app.use('/api/auth', authRoutes);

//errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

getRedisClient()
  .connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch(error => console.error('Error connecting to Redis: ', error));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
