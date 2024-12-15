import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';

import { connectMongo } from './database/mongoClient';
import { connectRedis } from './database/redisClient';
import errorMiddleware from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import authRoutes from './routes/authRoutes';
//import './config/passport';

dotenv.config();

const app = express();
app.use(requestLogger);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
//app.use(passport.initialize());
app.use('/api/auth', authRoutes);

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
