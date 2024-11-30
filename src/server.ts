import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
//import './config/passport';

dotenv.config();

const app = express();
app.use(express.json());
//app.use(passport.initialize());
app.use('/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
