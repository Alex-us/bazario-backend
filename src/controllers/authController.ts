import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User, {IUser} from '../models/User';

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.create({ username, email, password });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('AuthController_register', err);
    res.status(400).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: 'Error logging in' });
  }
};

export const googleCallback = (req: Request, res: Response) => {
  const token = jwt.sign({ id: (req.user as IUser)?._id  }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  res.redirect(`/?token=${token}`);
};

export const facebookCallback = (req: Request, res: Response) => {
  const token = jwt.sign({ id: (req.user as IUser)?._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  res.redirect(`/?token=${token}`);
};
